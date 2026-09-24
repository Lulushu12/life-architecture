import { useCallback, useEffect, useRef, useState } from "react";
import { IconButton, useToast } from "@shared/ui.jsx";
import { vibrate } from "@shared/haptics.js";
import { audio } from "@shared/audio.js";
import { CROSSED, EMPTY, FILLED, NONO_SIZE as N, isNonoSolved, lineDone } from "./nonogram.js";
import { elapsedOf, fmtElapsed, fmtSeconds, stopTimer, useActiveTimer, useTicker } from "./timing.js";
import { summarize } from "./stats.js";

const UNDO_CAP = 100;

export function freshNono({ solution, rows, cols }, daily = null) {
  const now = Date.now();
  return {
    daily,
    solution: solution.slice(),
    rows,
    cols,
    cells: new Array(N * N).fill(EMPTY),
    undo: [],
    mode: "fill",
    elapsedMs: 0,
    resumedAt: null,
    checks: 0,
    solved: false,
    solvedAt: null,
    recorded: false,
    createdAt: now,
    updatedAt: now,
  };
}

function finish(g) {
  if (g.solved || !isNonoSolved(g.cells, g.rows, g.cols)) return g;
  const now = Date.now();
  const cells = g.cells.map((v) => (v === FILLED ? FILLED : CROSSED));
  return { ...stopTimer(g, now), cells, solved: true, solvedAt: now };
}

function between(a, b) {
  const out = [];
  const [ra, ca] = [Math.floor(a / N), a % N];
  const [rb, cb] = [Math.floor(b / N), b % N];
  if (ra === rb) for (let c = Math.min(ca, cb); c <= Math.max(ca, cb); c++) out.push(ra * N + c);
  else for (let r = Math.min(ra, rb); r <= Math.max(ra, rb); r++) out.push(r * N + ca);
  return out;
}

const cellAt = (x, y) => {
  const el = document.elementFromPoint(x, y)?.closest?.("[data-idx]");
  return el ? Number(el.dataset.idx) : null;
};

export default function Nonogram({ game, settings, visible, stats, onChange, onNew, onHome, confirm }) {
  const toast = useToast();
  const [wrong, setWrong] = useState(() => new Set());
  const drag = useRef(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const haptics = settings?.haptics !== false;

  const running = !game.solved && visible;
  useActiveTimer(onChange, running, game.resumedAt == null);
  useTicker(running, 1000);

  useEffect(() => {
    if (!wrong.size) return undefined;
    const t = setTimeout(() => setWrong(new Set()), 2500);
    return () => clearTimeout(t);
  }, [wrong]);

  const wasSolved = useRef(game.solved);
  useEffect(() => {
    if (game.solved && !wasSolved.current) {
      audio.play("success", { enabled: settings?.sound !== false });
      vibrate("success", { enabled: haptics });
    }
    wasSolved.current = game.solved;
  }, [game.solved]); // eslint-disable-line react-hooks/exhaustive-deps

  const paint = useCallback(
    (targets, value, from, pushUndo) => {
      onChange((g) => {
        if (g.solved) return g;
        let cells = null;
        for (const i of targets) {
          if (g.cells[i] !== from || g.cells[i] === value) continue;
          if (!cells) cells = g.cells.slice();
          cells[i] = value;
        }
        if (!cells) return g;
        const undo = pushUndo ? [...g.undo, g.cells].slice(-UNDO_CAP) : g.undo;
        return finish({ ...g, cells, undo });
      });
    },
    [onChange]
  );

  const start = (i, mode) => {
    const g = gameRef.current;
    if (g.solved) return;
    const from = g.cells[i];
    const value = mode === "cross" ? (from === CROSSED ? EMPTY : CROSSED) : from === FILLED ? EMPTY : FILLED;
    drag.current = { start: i, last: i, from, value, axis: null };
    setWrong(new Set());
    vibrate("tap", { enabled: haptics });
    paint([i], value, from, true);
  };

  const onPointerDown = (e) => {
    const el = e.target.closest?.("[data-idx]");
    if (!el) return;
    if (e.pointerType === "mouse" && e.button !== 0 && e.button !== 2) return;
    e.preventDefault();
    audio.ensure();
    start(Number(el.dataset.idx), e.button === 2 ? "cross" : gameRef.current.mode);
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    if (e.pointerType === "mouse" && !e.buttons) {
      drag.current = null;
      return;
    }
    const i = cellAt(e.clientX, e.clientY);
    if (i == null || i === d.last) return;
    const [r0, c0] = [Math.floor(d.start / N), d.start % N];
    const [r, c] = [Math.floor(i / N), i % N];
    if (!d.axis) {
      if (r === r0 && c !== c0) d.axis = "row";
      else if (c === c0 && r !== r0) d.axis = "col";
      else return;
    }
    const end = d.axis === "row" ? r0 * N + c : r * N + c0;
    if (end === d.last) return;
    d.last = end;
    paint(between(d.start, end), d.value, d.from, false);
  };

  useEffect(() => {
    const stop = () => {
      drag.current = null;
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);

  const undo = useCallback(() => {
    onChange((g) => (g.solved || !g.undo.length ? g : { ...g, cells: g.undo[g.undo.length - 1], undo: g.undo.slice(0, -1) }));
  }, [onChange]);

  const setMode = (mode) => onChange((g) => (g.mode === mode ? g : { ...g, mode }));

  const check = () => {
    const bad = new Set();
    game.cells.forEach((v, i) => {
      if ((v === FILLED && game.solution[i] !== 1) || (v === CROSSED && game.solution[i] === 1)) bad.add(i);
    });
    setWrong(bad);
    onChange((g) => ({ ...g, checks: (g.checks || 0) + 1 }));
    vibrate(bad.size ? "warn" : "success", { enabled: haptics });
    toast(bad.size ? `${bad.size} ${bad.size === 1 ? "cell is" : "cells are"} wrong` : "No mistakes so far", {
      duration: 2000,
    });
  };

  const newPuzzle = async () => {
    const g = gameRef.current;
    if (!g.solved && g.undo.length && confirm) {
      const ok = await confirm({
        title: "Start a new puzzle?",
        message: "Your progress on this one will be lost.",
        confirmLabel: "New puzzle",
        danger: true,
      });
      if (!ok) return;
    }
    onNew();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (document.querySelector(".sheet-backdrop")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === "x" || e.key === "X")) {
        setMode(gameRef.current.mode === "fill" ? "cross" : "fill");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]); // eslint-disable-line react-hooks/exhaustive-deps

  const elapsed = elapsedOf(game);
  const filled = game.cells.filter((v) => v === FILLED).length;
  const target = game.solution.filter(Boolean).length;
  const practiceStats = summarize((stats || []).filter((r) => !r.daily), () => "all").all;

  return (
    <div className="page nono-page">
      <div className="topbar">
        <IconButton label="Back" onClick={onHome}>
          ←
        </IconButton>
        <div>
          <div className="tb-title">{game.daily ? "Daily Nonogram" : "Nonogram"}</div>
          <div className="tb-sub">
            {game.daily || "Practice"} · <span className="mono">{fmtElapsed(elapsed)}</span> · {filled}/{target} filled
          </div>
        </div>
        {!game.daily && (
          <IconButton label="New puzzle" onClick={newPuzzle}>
            ↻
          </IconButton>
        )}
      </div>

      <div
        className={`nono-grid${game.solved ? " solved" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onContextMenu={(e) => e.preventDefault()}
        role="grid"
        aria-label="Nonogram grid"
      >
        <span className="nono-corner" />
        {game.cols.map((clue, c) => (
          <span key={`c${c}`} className={`nono-cclue${lineDone(game.cells, clue, "col", c) ? " done" : ""}`}>
            {clue.map((n, k) => (
              <span key={k}>{n}</span>
            ))}
          </span>
        ))}
        {game.rows.map((clue, r) => [
          <span key={`r${r}`} className={`nono-rclue${lineDone(game.cells, clue, "row", r) ? " done" : ""}`}>
            {clue.map((n, k) => (
              <span key={k}>{n}</span>
            ))}
          </span>,
          ...Array.from({ length: N }, (_, c) => {
            const i = r * N + c;
            const v = game.cells[i];
            const cls = ["nono-cell"];
            if (v === FILLED) cls.push("filled");
            if (v === CROSSED) cls.push("crossed");
            if (c % 5 === 0) cls.push("bl");
            if (r % 5 === 0) cls.push("bt");
            if (wrong.has(i)) cls.push("wrong");
            return (
              <button
                type="button"
                key={i}
                data-idx={i}
                className={cls.join(" ")}
                disabled={game.solved}
                onClick={(e) => {
                  if (e.detail !== 0) return;
                  start(i, game.mode);
                  drag.current = null;
                }}
                aria-label={`Row ${r + 1} column ${c + 1}, ${v === FILLED ? "filled" : v === CROSSED ? "crossed" : "empty"}`}
              />
            );
          }),
        ])}
      </div>

      {game.solved ? (
        <div className="card center-card solved-card">
          <div className="solved-mark" aria-hidden="true">
            ✓
          </div>
          <h3>{game.daily ? "Daily nonogram solved" : "Solved!"}</h3>
          <p className="hint">
            {fmtElapsed(elapsed)} · {game.checks || 0} {game.checks === 1 ? "check" : "checks"}
            {!game.daily && practiceStats
              ? ` · best ${fmtSeconds(practiceStats.best)} over ${practiceStats.count}`
              : ""}
          </p>
          <div className="newrow">
            <button type="button" className="bigbtn" onClick={onNew}>
              {game.daily ? "Practice puzzle" : "New puzzle"}
            </button>
            <button type="button" className="bigbtn secondary" onClick={onHome}>
              Home
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="sudoku-toolbar">
            <button
              type="button"
              className={`toolbtn${game.mode === "fill" ? " on" : ""}`}
              onClick={() => setMode("fill")}
              aria-pressed={game.mode === "fill"}
            >
              ■ Fill
            </button>
            <button
              type="button"
              className={`toolbtn${game.mode === "cross" ? " on" : ""}`}
              onClick={() => setMode("cross")}
              aria-pressed={game.mode === "cross"}
            >
              ✕ Cross
            </button>
            <button type="button" className="toolbtn" onClick={undo} disabled={!game.undo.length}>
              ↶ Undo
            </button>
            <button type="button" className="toolbtn" onClick={check}>
              Check
            </button>
          </div>
          <p className="hint small center">
            Drag to paint a line. Numbers are the runs of filled cells in each row and column, in order.
          </p>
        </>
      )}
    </div>
  );
}
