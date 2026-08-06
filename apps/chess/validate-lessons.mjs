// Validates lesson content: structure, legality of every move, and
// (with --engine) engine sanity-checking of every quiz answer.
//
//   node validate-lessons.mjs            # structure + legality
//   node validate-lessons.mjs --engine   # + Stockfish check of quiz answers
//
// The engine pass runs the same WASM build the app ships, driven through a
// headless browser, so verdicts match what the app itself would compute.

import { Chess } from "chess.js";
import { readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const LESSON_DIR = path.join(import.meta.dirname, "src", "lessons");
const useEngine = process.argv.includes("--engine");

const errors = [];
const warnings = [];
const quizPositions = []; // {lesson, fen, answer, uci, strict}

// index.js is the app-side aggregator (Vite's import.meta.glob) — skip it.
const files = readdirSync(LESSON_DIR).filter((f) => f.endsWith(".js") && f !== "index.js");
const seenIds = new Set();
let lessonCount = 0;
let stepCount = 0;

for (const file of files) {
  const mod = await import(pathToFileURL(path.join(LESSON_DIR, file)).href);
  const lessons = mod.LESSONS || mod.default;
  if (!Array.isArray(lessons)) {
    errors.push(`${file}: does not export a LESSONS array`);
    continue;
  }
  for (const l of lessons) {
    lessonCount++;
    const tag = `${file}:${l.id || "<no id>"}`;
    for (const field of ["id", "title", "category", "summary", "steps"]) {
      if (!l[field]) errors.push(`${tag}: missing "${field}"`);
    }
    if (!["openings", "concepts", "endgames"].includes(l.category))
      errors.push(`${tag}: bad category "${l.category}"`);
    if (seenIds.has(l.id)) errors.push(`${tag}: duplicate id`);
    seenIds.add(l.id);
    if (!Array.isArray(l.steps) || l.steps.length === 0) {
      errors.push(`${tag}: no steps`);
      continue;
    }

    let chess;
    try {
      chess = l.startFen ? new Chess(l.startFen) : new Chess();
    } catch {
      errors.push(`${tag}: invalid startFen`);
      continue;
    }

    l.steps.forEach((step, si) => {
      stepCount++;
      const where = `${tag} step ${si + 1}`;
      for (const san of step.play || []) {
        try {
          const mv = chess.move(san);
          if (!mv) throw new Error("illegal");
        } catch {
          errors.push(`${where}: illegal move "${san}" in ${chess.fen()}`);
          return;
        }
      }
      if (step.text && step.text.length > 320)
        warnings.push(`${where}: text is ${step.text.length} chars (keep under ~280)`);
      for (const sq of step.circles || [])
        if (!/^[a-h][1-8]$/.test(sq)) errors.push(`${where}: bad circle square "${sq}"`);
      for (const a of step.arrows || [])
        if (!Array.isArray(a) || a.length !== 2 || !/^[a-h][1-8]$/.test(a[0]) || !/^[a-h][1-8]$/.test(a[1]))
          errors.push(`${where}: bad arrow ${JSON.stringify(a)}`);

      if (step.quiz) {
        const q = step.quiz;
        if (!q.answer) errors.push(`${where}: quiz without answer`);
        if (!q.prompt) warnings.push(`${where}: quiz without prompt`);
        const fenBefore = chess.fen();
        // every accepted answer must be legal here
        for (const san of [q.answer, ...(q.also || [])]) {
          const probe = new Chess(fenBefore);
          let mv = null;
          try {
            mv = probe.move(san);
          } catch {
            /* reported below */
          }
          if (!mv) {
            errors.push(`${where}: quiz answer "${san}" is illegal in ${fenBefore}`);
          } else if (san === q.answer) {
            quizPositions.push({
              tag: where,
              fen: fenBefore,
              answer: san,
              uci: mv.from + mv.to + (mv.promotion || ""),
              strict: Boolean(q.strict),
              speculative: Boolean(q.speculative),
            });
          }
        }
        try {
          chess.move(q.answer);
        } catch {
          /* already reported */
        }
      }
      if (!step.text && !step.quiz && !(step.play || []).length)
        warnings.push(`${where}: empty step`);
    });
  }
}

console.log(`lessons: ${lessonCount}, steps: ${stepCount}, quizzes: ${quizPositions.length}`);

if (useEngine && quizPositions.length && errors.length === 0) {
  console.log("engine-checking quiz answers…");
  const { chromium } = await import(
    "/tmp/claude-0/-home-user-life-architecture/2def4110-47b4-5118-9ade-3fe3baf69e23/scratchpad/node_modules/playwright-core/index.mjs"
  );
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  });
  const page = await browser.newPage();
  await page.goto(process.env.ENGINE_BASE || "http://localhost:4187/life-architecture/chess/", {
    waitUntil: "networkidle",
  });
  await page.evaluate(async () => {
    window.__e = new Worker("/life-architecture/chess/engine/stockfish-nnue-16-single.js");
    window.__lines = [];
    window.__e.onmessage = (ev) => window.__lines.push(String(ev.data));
    const send = (c) => window.__e.postMessage(c);
    send("uci");
    send("setoption name Use NNUE value true");
    send("setoption name EvalFile value nn-5af11540bbfe.nnue");
    send("isready");
    await new Promise((r) => {
      const t = setInterval(() => {
        if (window.__lines.some((l) => l === "readyok")) {
          clearInterval(t);
          r();
        }
      }, 100);
    });
  });

  let checked = 0;
  for (const q of quizPositions) {
    const res = await page.evaluate(async (fen) => {
      window.__lines = [];
      const send = (c) => window.__e.postMessage(c);
      send("setoption name MultiPV value 3");
      send("position fen " + fen);
      send("go depth 13");
      await new Promise((r) => {
            // Cap wall-clock time: ask the engine to stop, then take the
            // deepest result it reached. A single hard position must never
            // hang the whole run.
            const t0 = Date.now();
            let stopped = false;
            const t = setInterval(() => {
              if (window.__lines.some((l) => l.startsWith("bestmove")) || Date.now() - t0 > 20000) {
                clearInterval(t);
                r();
              } else if (!stopped && Date.now() - t0 > 12000) {
                stopped = true;
                send("stop");
              }
            }, 100);
          });
      const infos = window.__lines.filter((l) => l.startsWith("info ") && l.includes(" pv "));
      const byPv = {};
      for (const line of infos) {
        const t = line.split(" ");
        const mpv = parseInt(t[t.indexOf("multipv") + 1], 10) || 1;
        const cpIdx = t.indexOf("cp");
        const mateIdx = t.indexOf("mate");
        const score = mateIdx > -1 ? (parseInt(t[mateIdx + 1], 10) > 0 ? 9000 : -9000) : parseInt(t[cpIdx + 1], 10);
        byPv[mpv] = { move: t[t.indexOf("pv") + 1], score };
      }
      return { best: byPv[1], all: Object.values(byPv) };
    }, q.fen);

    checked++;
    if (!res.best) {
      warnings.push(`${q.tag}: engine returned nothing for ${q.fen}`);
      continue;
    }
    let match = res.all.find((l) => l.move === q.uci);
    if (!match) {
      // outside the top lines — search this move specifically so the loss
      // is measured rather than guessed
      match = await page.evaluate(
        async ([fen, uci]) => {
          window.__lines = [];
          const send = (c) => window.__e.postMessage(c);
          send("setoption name MultiPV value 1");
          send("position fen " + fen);
          send("go depth 13 searchmoves " + uci);
          await new Promise((r) => {
            // Cap wall-clock time: ask the engine to stop, then take the
            // deepest result it reached. A single hard position must never
            // hang the whole run.
            const t0 = Date.now();
            let stopped = false;
            const t = setInterval(() => {
              if (window.__lines.some((l) => l.startsWith("bestmove")) || Date.now() - t0 > 20000) {
                clearInterval(t);
                r();
              } else if (!stopped && Date.now() - t0 > 12000) {
                stopped = true;
                send("stop");
              }
            }, 100);
          });
          const infos = window.__lines.filter((l) => l.startsWith("info ") && l.includes(" pv "));
          const last = infos[infos.length - 1];
          if (!last) return null;
          const t = last.split(" ");
          const cpIdx = t.indexOf("cp");
          const mateIdx = t.indexOf("mate");
          const score =
            mateIdx > -1 ? (parseInt(t[mateIdx + 1], 10) > 0 ? 9000 : -9000) : parseInt(t[cpIdx + 1], 10);
          return { move: uci, score };
        },
        [q.fen, q.uci]
      );
    }
    const loss = match ? res.best.score - match.score : null;
    const limit = q.speculative ? 250 : 100;
    // A fixed-depth search is deterministic, but near-equal moves can still
    // swap places; allow a small tolerance before calling a strict answer wrong.
    if (q.strict && res.best.move !== q.uci && (loss == null || loss > 25)) {
      errors.push(
        `${q.tag}: STRICT answer ${q.answer} (${q.uci}) is not the engine's best (${res.best.move})` +
          (loss != null ? `, loses ${loss}cp` : "")
      );
    } else if (loss == null) {
      warnings.push(`${q.tag}: could not evaluate answer ${q.answer}`);
    } else if (loss > limit) {
      errors.push(
        `${q.tag}: answer ${q.answer} loses ${loss}cp vs best ${res.best.move}` +
          (q.speculative ? " (even allowing for a speculative line)" : "")
      );
    } else if (loss > 60) {
      warnings.push(
        `${q.tag}: answer ${q.answer} loses ${loss}cp vs best ${res.best.move}` +
          (q.speculative ? " — flagged speculative, make sure the text says so" : "")
      );
    }
    if (checked % 20 === 0) console.log(`  …${checked}/${quizPositions.length}`);
  }
  await browser.close();
  console.log(`engine-checked ${checked} quiz answers`);
}

for (const w of warnings) console.log("WARN  " + w);
for (const e of errors) console.log("ERROR " + e);
console.log(errors.length ? `\nFAILED: ${errors.length} errors, ${warnings.length} warnings` : `\nOK (${warnings.length} warnings)`);
process.exit(errors.length ? 1 : 0);
