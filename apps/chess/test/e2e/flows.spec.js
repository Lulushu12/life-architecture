import { test, expect } from "@playwright/test";
import { seed, open, readStore, move, button } from "./helpers.js";
import { readFileSync } from "node:fs";
import { Chess } from "chess.js";

// Fool's mate, with you as White: two blunders for the review to find.
const FOOLS_MATE = ["f3", "e5", "g4", "Qh4#"];

// The Starter puzzle the trainer picks when Math.random() is 0 and your
// rating is the default 1200, and a legal wrong move.
function starterPick() {
  const db = JSON.parse(readFileSync(new URL("../../public/puzzles.json", import.meta.url), "utf8"));
  const list = db.puzzles.starter;
  // nextPuzzle's widening windows, first match (Math.random() is 0)
  let puzzle = null;
  for (const w of [150, 300, 600]) {
    puzzle = list.find((p) => Math.abs(p.r - 1200) <= w);
    if (puzzle) break;
  }
  const moves = puzzle.m.split(" ");
  const c = new Chess(puzzle.f);
  c.move({ from: moves[0].slice(0, 2), to: moves[0].slice(2, 4), promotion: moves[0][4] });
  const fen = c.fen();
  const wrong = c
    .moves({ verbose: true })
    .map((m) => m.from + m.to)
    .find((u) => u !== moves[1].slice(0, 4) && !new Chess(fen).move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: "q" }).san.includes("#"));
  return { puzzle, fen, wrong, moves };
}

test.describe("current behaviour", () => {
  test("home lists every section", async ({ page }) => {
    await seed(page, null);
    await open(page);
    for (const name of [
      "Play bots", "Pass & play", "Lessons", "Openings", "Pro games", "Analysis",
      "Engine match", "Custom position", "Import games", "Puzzles", "Game archive", "Stats",
    ]) {
      await expect(button(page, new RegExp(name))).toBeVisible();
    }
  });

  test("a bot game is playable and survives a reload", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Play bots/).click();
    await page.locator(".botmini").first().click(); // an 800 bot, you play White
    await move(page, "e2", "e4");
    // the bot answers: two plies in the move list
    await expect(page.locator(".movelist .mlmove").nth(1)).toBeVisible({ timeout: 60_000 });
    const before = await readStore(page);
    expect(before.current.sans.length).toBeGreaterThanOrEqual(2);
    expect(before.current.sans[0]).toBe("e4");

    await page.reload({ waitUntil: "domcontentloaded" });
    // the app reopens on the game itself, with the moves intact
    await expect(page.locator(".movelist .mlmove").first()).toHaveText("e4");
    await page.locator(".topbar button").first().click();
    await expect(page.getByText(/Resume game/)).toBeVisible();
  });

  test("help levels: chosen before the game, changed mid-game, Resign in the Help sheet", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Play bots/).click();
    await page.getByRole("radio", { name: "On my own" }).click();
    await page.locator(".botmini").first().click();
    await expect(page.locator(".plate-chip")).toHaveText("On my own");
    await expect(page.locator(".evalbar")).toHaveCount(0);
    expect((await readStore(page)).current.help).toEqual({ evalBar: false, threats: false, check: false, suggest: false, coach: false });

    await page.locator(".plate-chip").click();
    await page.getByRole("dialog").getByRole("radio", { name: "Full help" }).click();
    await expect(page.locator(".evalbar")).toHaveCount(1);
    await page.getByRole("dialog").getByRole("button", { name: "Done" }).click();
    await expect(page.locator(".plate-chip")).toHaveText("Full help");

    await page.getByRole("button", { name: /Coach on/ }).click();
    await expect(page.getByRole("button", { name: /Coach off/ })).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(".plate-chip")).toHaveText("Custom");

    await page.getByRole("button", { name: /^Help$/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Resign" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Resign" }).click();
    await expect.poll(async () => (await readStore(page)).current?.status).toBe("over");
    // the picker remembers the level for next time
    expect((await readStore(page)).settings.helpPreset).toBe("own");
  });

  test("threat arrows show during a game when the help level has them", async ({ page }) => {
    // You are Black after 1.e4 e5 2.Bc4 Nc6 3.Qh5: White threatens Qxf7 mate.
    await seed(page, {
      current: {
        id: "t1", mode: "bot", personaId: "x", playerColor: "b", serious: false, startFen: null,
        sans: ["e4", "e5", "Bc4", "Nc6", "Qh5"], chat: [], cps: [0, 0, 0, 0, 0], status: "playing", result: null,
        createdAt: 1, muted: true, help: { evalBar: true, threats: true, suggest: false, coach: false },
      },
    });
    await open(page);
    await page.getByText(/Resume game/).click();
    await expect(page.locator('g[stroke="#d02a2a"]').first()).toBeVisible({ timeout: 60_000 });
  });

  // Plan item 8: the coach in bot games.
  const ITALIAN_START = {
    id: "c1", mode: "bot", personaId: "x", playerColor: "w", serious: false, startFen: null,
    sans: ["e4", "e5", "Nf3", "Nc6"], chat: [], cps: [0, 30, 20, 40, 30], status: "playing", result: null,
    createdAt: 1, muted: true, help: { evalBar: true, threats: false, suggest: false, coach: true },
  };

  test("the coach explains a blunder right after you play it", async ({ page }) => {
    await seed(page, { current: ITALIAN_START });
    await open(page);
    await page.getByText(/Resume game/).click();
    await expect(page.locator(".coachstrip.quiet")).toBeVisible();
    await move(page, "f3", "g5"); // the queen takes it
    const note = page.locator(".coachstrip.cs-warn");
    await expect(note).toContainText(/knight/i, { timeout: 60_000 });
    await expect(note).toContainText("g5");
    // and the move can be taken straight back
    await note.getByRole("button", { name: "Take it back" }).click();
    await expect.poll(async () => (await readStore(page)).current.sans.length).toBe(4);
    await expect(page.locator(".coachstrip.cs-warn")).toHaveCount(0);
    // switching the coach off hides it
    await page.getByRole("button", { name: /Coach on/ }).click();
    await expect(page.locator(".coachstrip")).toHaveCount(0);
  });

  test("a hint gives the idea first, then the move", async ({ page }) => {
    await seed(page, { current: { ...ITALIAN_START, help: { ...ITALIAN_START.help, coach: false } } });
    await open(page);
    await page.getByText(/Resume game/).click();
    await expect.poll(async () => (await readStore(page)).current.cps.length).toBe(5);
    await button(page, /^Hint$/).click();
    const strip = page.locator(".coachstrip");
    await expect(strip).toContainText("Hint", { timeout: 60_000 });
    await expect(page.locator(".usercircle.guide")).toHaveCount(1);
    await expect(page.locator('g[stroke="#15803d"]')).toHaveCount(0);
    await button(page, /Show move/).click();
    await expect(page.locator('g[stroke="#15803d"]')).toHaveCount(1);
    await expect(page.locator(".usercircle.guide")).toHaveCount(0);
  });

  // Plan item 9: the blunder check, aimed at rushing.
  test("the blunder check stops a hanging move until you choose", async ({ page }) => {
    await seed(page, { current: { ...ITALIAN_START, help: { evalBar: true, threats: false, check: true, suggest: false, coach: false } } });
    await open(page);
    await page.getByText(/Resume game/).click();
    await move(page, "f3", "g5");
    const check = page.locator(".coachstrip.cs-check");
    await expect(check).toContainText("Is your knight on g5 safe? Look at their queen first.", { timeout: 60_000 });
    expect((await readStore(page)).current.sans).toHaveLength(4);
    await check.getByRole("button", { name: "Pick another move" }).click();
    await expect(check).toHaveCount(0);
    expect((await readStore(page)).blunderChecks.map((c) => c.saved)).toEqual([true]);

    await move(page, "f3", "g5");
    await expect(check).toBeVisible({ timeout: 60_000 });
    await check.getByRole("button", { name: "Play it anyway" }).click();
    await expect.poll(async () => (await readStore(page)).current.sans[4]).toBe("Ng5");
    expect((await readStore(page)).blunderChecks.map((c) => c.saved)).toEqual([true, false]);

    // and Stats counts it
    await page.getByRole("button", { name: "Back", exact: true }).first().click();
    await button(page, /Stats/).click();
    await expect(page.locator(".card", { hasText: "Blunder checks that saved you" })).toContainText("this week");
  });

  test("the blunder check lets an ordinary move through", async ({ page }) => {
    await seed(page, { current: { ...ITALIAN_START, help: { evalBar: true, threats: false, check: true, suggest: false, coach: false } } });
    await open(page);
    await page.getByText(/Resume game/).click();
    await move(page, "f1", "c4");
    await expect.poll(async () => (await readStore(page)).current.sans[4], { timeout: 60_000 }).toBe("Bc4");
    await expect(page.locator(".coachstrip.cs-check")).toHaveCount(0);
  });

  test("the coach points out a tactic before you move", async ({ page }) => {
    // Black has just played ...Qd5??, next to White's rook on d1.
    await seed(page, {
      current: {
        id: "tp", mode: "bot", personaId: "x", playerColor: "w", serious: false, startFen: "4k3/8/3q4/8/8/8/8/3RK3 b - - 0 1",
        sans: ["Qd5"], chat: [], cps: [0], status: "playing", result: null,
        createdAt: 1, muted: true, help: { evalBar: true, threats: false, check: false, suggest: false, coach: true },
      },
    });
    await open(page);
    await page.getByText(/Resume game/).click();
    await expect(page.locator(".coachstrip.cs-prompt")).toContainText("Can you win material?", { timeout: 60_000 });
  });

  // Plan item 10: game end, records and home.
  // White to play Qxf7#, on "On my own" (a clean game so far).
  const MATE_IN_ONE = {
    id: "m1", mode: "bot", personaId: "x", playerColor: "w", serious: true,
    startFen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    sans: [], chat: [], cps: [0], status: "playing", result: null, createdAt: 1, muted: true,
    help: { evalBar: false, threats: false, check: false, suggest: false, coach: false }, assist: null,
  };

  test("a clean win counts as clean, and Rematch swaps colours", async ({ page }) => {
    await seed(page, { current: MATE_IN_ONE });
    await open(page);
    await page.getByText(/Resume game/).click();
    await move(page, "h5", "f7");
    await expect(page.locator(".endnote")).toHaveText("Counted as a clean game: no help, hints or takebacks.");
    let s = await readStore(page);
    const rec = Object.values(s.botRecords)[0];
    expect(rec).toMatchObject({ w: 1, clean: { w: 1 } });
    expect(s.games[0]).toMatchObject({ id: "m1", assist: null, result: "1-0" });

    await button(page, /Rematch/).click();
    await expect.poll(async () => (await readStore(page)).current?.id).not.toBe("m1");
    s = await readStore(page);
    expect(s.current).toMatchObject({ playerColor: "b", status: "playing", sans: [], assist: null });
    expect(s.current.startFen).toBe(MATE_IN_ONE.startFen);
    await expect(page.locator(".endnote")).toHaveCount(0);
  });

  test("a hint makes the game assisted", async ({ page }) => {
    await seed(page, { current: MATE_IN_ONE });
    await open(page);
    await page.getByText(/Resume game/).click();
    await button(page, /^Hint$/).click();
    await expect(page.locator(".coachstrip")).toContainText("Hint", { timeout: 60_000 });
    await move(page, "h5", "f7");
    await expect(page.locator(".endnote")).toHaveText("Counted as assisted: you took a hint.");
    expect(Object.values((await readStore(page)).botRecords)[0]).toMatchObject({ w: 1, assisted: { w: 1 } });
  });

  test("home shows your game on a mini board, or offers to play the last bot again", async ({ page }) => {
    await seed(page, {
      current: { ...ITALIAN_START },
      games: [{ id: "g0", date: 5, mode: "bot", personaId: "x", playerColor: "b", sans: ["e4", "e5"], result: "1-0", review: null }],
    });
    await open(page);
    const hero = page.locator(".hero");
    await expect(hero).toContainText("Your move");
    await expect(hero.locator(".miniboard .msq")).toHaveCount(64);
    await expect(hero.locator(".msq.last")).toHaveCount(2);

    // without a game in progress: play the last bot again
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("chess-v1"));
      s.current = null;
      localStorage.setItem("chess-v1", JSON.stringify(s));
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(hero).toContainText("Last game: lost");
    await expect(hero).toContainText("Play again vs");
    await hero.getByRole("button", { name: /Play again/ }).click();
    await expect(page.locator(".boardrow")).toBeVisible();
    const cur = (await readStore(page)).current;
    expect(cur).toMatchObject({ mode: "bot", playerColor: "b", sans: [] });
  });

  test("stats with no games shows one way in", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Stats/).click();
    await expect(page.locator(".statsempty")).toContainText("Play a game and your stats start here");
    await expect(page.getByText("Performance rating")).toHaveCount(0);
    await button(page, /Play a bot/).click();
    await expect(page.locator(".botmini").first()).toBeVisible();
  });

  // Plan item 11 (characterization first): a wrong move in a training set.
  test("a wrong move in a training set is marked and rated", async ({ page }) => {
    const { puzzle, wrong, fen, moves } = starterPick();
    await page.addInitScript(() => {
      Math.random = () => 0;
    });
    await seed(page, null);
    await open(page);
    await button(page, /Puzzles/).click();
    await button(page, /Starter/).click();
    await expect(page.locator(".topbar")).toContainText(`puzzle ${puzzle.r}`, { timeout: 30_000 });
    await move(page, wrong.slice(0, 2), wrong.slice(2, 4));
    await expect(page.getByText("Not that one, try again.")).toBeVisible();
    expect((await readStore(page)).puzzleRating.n).toBe(1);
    // the board is still yours to try again
    await expect(page.locator(".okmsg")).toHaveCount(0);
    // and the coach says why, without the answer (plan item 11)
    const tip = page.locator(".cs-tip");
    await expect(tip).toBeVisible();
    const answer = new Chess(fen).move({ from: moves[1].slice(0, 2), to: moves[1].slice(2, 4), promotion: moves[1][4] }).san;
    expect(await tip.innerText()).not.toContain(answer);
  });

  test("training sets filter by rating range", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Puzzles/).click();
    await button(page, /Medium/).click(); // 1300 to 1600
    await expect(page.locator(".topbar")).toContainText("puzzle", { timeout: 30_000 });
    await button(page, /Filter/).click();
    await page.getByRole("button", { name: "Harder" }).click(); // 1300 to 1600 around your 1200
    await expect(button(page, /⚑ Harder/)).toBeVisible();
    const r = Number((await page.locator(".topbar").innerText()).match(/puzzle (\d+)/)[1]);
    expect(r).toBeGreaterThanOrEqual(1300);
    expect(r).toBeLessThanOrEqual(1600);
    await page.getByRole("button", { name: "Easier" }).click(); // nothing under 1100 in Medium
    await expect(page.getByText("No unsolved puzzles match this filter.")).toBeVisible();
    await button(page, /Clear filter/).click();
    await expect(page.locator(".topbar")).toContainText("puzzle");
  });

  // Plan item 11: the daily puzzle.
  const todayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  test("the daily puzzle: a wrong move costs a heart, solving it starts a streak", async ({ page }) => {
    const { puzzle, wrong, moves } = starterPick();
    const today = todayLocal();
    await seed(page, { daily: { date: today, key: "starter", id: puzzle.i, r: puzzle.r, hearts: 5, result: null } });
    await open(page);
    await page.getByRole("button", { name: /Daily puzzle/ }).first().click();
    await expect(page.locator(".hearts .full")).toHaveCount(5, { timeout: 30_000 });
    await move(page, wrong.slice(0, 2), wrong.slice(2, 4));
    await expect(page.locator(".hearts .full")).toHaveCount(4);
    await expect(page.locator(".cs-tip")).toBeVisible();
    for (let i = 1; i < moves.length; i += 2) await move(page, moves[i].slice(0, 2), moves[i].slice(2, 4));
    await expect(page.locator(".okmsg")).toHaveText("✓ Solved with 4 hearts left");
    await expect(page.locator(".dailystreak")).toContainText("1 day");
    await expect(page.locator(`.cal-day.solved.today`)).toHaveCount(1);
    const s = await readStore(page);
    expect(s.dailyLog[today]).toEqual({ id: puzzle.i, result: "solved", hearts: 4 });
    // the Life Architecture ledger got the event
    const events = await page.evaluate(() => JSON.parse(localStorage.getItem("la_events_v1") || "[]"));
    expect(events.find((e) => e.type === "chess.daily")?.value).toEqual({ result: "solved", hearts: 4, streak: 1 });
  });

  test("the daily puzzle fails at zero hearts and shows the answer", async ({ page }) => {
    const { puzzle, fen } = starterPick();
    const today = todayLocal();
    const c = new Chess(fen);
    const expected = puzzle.m.split(" ")[1].slice(0, 4);
    const wrongs = c.moves({ verbose: true }).map((m) => m.from + m.to).filter((u) => u !== expected && !new Chess(fen).move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: "q" }).san.includes("#"));
    await seed(page, { daily: { date: today, key: "starter", id: puzzle.i, r: puzzle.r, hearts: 2, result: null } });
    await open(page);
    await page.getByRole("button", { name: /Daily puzzle/ }).first().click();
    await expect(page.locator(".hearts .full")).toHaveCount(2, { timeout: 30_000 });
    await move(page, wrongs[0].slice(0, 2), wrongs[0].slice(2, 4));
    await move(page, wrongs[0].slice(0, 2), wrongs[0].slice(2, 4));
    await expect(page.getByText("Out of hearts. The streak starts again tomorrow.")).toBeVisible();
    await expect(page.locator('g[stroke="#15803d"]')).toHaveCount(1); // the answer, drawn
    expect((await readStore(page)).dailyLog[today].result).toBe("failed");
    await expect(page.locator(".cal-day.failed.today")).toHaveCount(1);
  });

  test("today's daily is picked once and shown on Home", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await expect(page.locator(".hometile", { hasText: "Daily puzzle" })).toContainText("New today · 5 hearts");
    await page.locator(".hometile", { hasText: "Daily puzzle" }).click();
    await expect(page.locator(".hearts .full")).toHaveCount(5, { timeout: 30_000 });
    const d = (await readStore(page)).daily;
    expect(d).toMatchObject({ date: todayLocal(), hearts: 5, result: null });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".hearts .full")).toHaveCount(5, { timeout: 30_000 });
    expect((await readStore(page)).daily.id).toBe(d.id);
  });

  // Plan item 12 (characterization first): the archive's star, delete and export.
  const THREE_GAMES = [
    { id: "a1", date: 3, mode: "bot", personaId: "x", playerColor: "w", sans: ["e4", "e5"], result: "1-0", review: null },
    { id: "a2", date: 2, mode: "import", label: "Club game", playerColor: "b", sans: ["d4", "d5"], result: "1-0", review: null },
    { id: "a3", date: 1, mode: "pass", sans: ["c4"], result: "1/2-1/2", review: null },
  ];

  test("the archive stars, deletes with undo, and exports a selection", async ({ page }) => {
    await seed(page, { games: THREE_GAMES });
    await open(page);
    await button(page, /Game archive/).click();
    await expect(page.locator(".gamecard")).toHaveCount(3);
    await page.locator(".gamecard").first().getByRole("button", { name: "Star game" }).click();
    expect((await readStore(page)).games.find((g) => g.id === "a1").favourite).toBe(true);
    await page.locator(".gamecard").nth(2).getByRole("button", { name: "Delete game" }).click();
    await expect(page.locator(".gamecard")).toHaveCount(2);
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.locator(".gamecard")).toHaveCount(3);
    await page.getByRole("button", { name: "Select", exact: true }).click();
    await page.locator(".gamecard").nth(1).click();
    await button(page, /Export selected/).click();
    await expect(page.getByRole("dialog")).toContainText("Export 1 game");
  });

  test("archive tabs and the result filter", async ({ page }) => {
    await seed(page, { games: THREE_GAMES });
    await open(page);
    await button(page, /Game archive/).click();
    await expect(page.locator(".gamecard .miniboard")).toHaveCount(3);
    await expect(page.locator(".resultchip")).toHaveText(["Won", "Lost"]); // the pass & play game has no "you"
    await page.getByRole("tab", { name: "Bots" }).click();
    await expect(page.locator(".gamecard")).toHaveCount(1);
    await page.getByRole("tab", { name: "Imported" }).click();
    await expect(page.locator(".gamecard")).toContainText("Club game");
    await page.getByRole("tab", { name: "All" }).click();
    await page.getByRole("radio", { name: "Lost" }).click();
    await expect(page.locator(".gamecard")).toHaveCount(1);
    await expect(page.locator(".gamecard")).toContainText("Club game");
    await page.getByRole("tab", { name: "Starred" }).click();
    await expect(page.getByText("No games match this filter.")).toBeVisible();
  });

  test("an analysis can be saved, reopened from the archive and updated", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Analysis/).click();
    await move(page, "e2", "e4");
    await move(page, "e7", "e5");
    await button(page, /Save/).click();
    await expect.poll(async () => (await readStore(page)).analyses?.length).toBe(1);
    expect((await readStore(page)).analyses[0]).toMatchObject({ name: "King's Pawn Game", sans: ["e4", "e5"], startFen: null });

    await page.locator(".topbar button").first().click();
    await button(page, /Game archive/).click();
    await page.getByRole("tab", { name: "Analyses" }).click();
    await page.locator(".gamecard", { hasText: "King's Pawn Game" }).click();
    await expect(page.locator(".movelist .mlmove")).toHaveText(["e4", "e5"]);
    await move(page, "g1", "f3");
    await button(page, /Update/).click();
    await expect.poll(async () => (await readStore(page)).analyses[0].sans).toEqual(["e4", "e5", "Nf3"]);
    expect((await readStore(page)).analyses).toHaveLength(1);
  });

  test("play a bot from the analysis board's position", async ({ page }) => {
    const fen = "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 0 1";
    await seed(page, null);
    await open(page);
    await button(page, /Analysis/).click();
    await button(page, /Paste FEN\/PGN/).click();
    await page.locator("textarea").first().fill(fen);
    await button(page, /^Load$/).click();
    await button(page, /Play from here/).click();
    await expect(page.locator(".topbar")).toContainText("From: your analysis");
    await expect(page.getByRole("button", { name: "Black", exact: true })).toHaveClass(/sel/);
    await page.locator(".botmini").first().click();
    await expect.poll(async () => (await readStore(page)).current?.startFen).toBe(fen);
    expect((await readStore(page)).current.playerColor).toBe("b");
  });

  // Plan item 13: the path, and completion that needs the quizzes.
  async function forksLesson() {
    const { LESSONS: L } = await import("../../src/lessons/concepts-tactics.js");
    const lesson = L.find((l) => l.id === "forks-double-attacks");
    // the from/to squares of each quiz answer, by step index
    const c = lesson.startFen ? new Chess(lesson.startFen) : new Chess();
    const answers = {};
    lesson.steps.forEach((st, i) => {
      for (const san of st.play || []) c.move(san);
      if (st.quiz) {
        const m = c.move(st.quiz.answer);
        answers[i] = [m.from, m.to];
      }
    });
    return { lesson, answers };
  }

  async function walkLesson(page, lesson, answers, solve) {
    for (let i = 0; i < lesson.steps.length; i++) {
      if (lesson.steps[i].quiz) {
        if (solve) await move(page, ...answers[i]);
        else {
          await button(page, /Show me/).click();
          await button(page, /Continue anyway/).click();
        }
        await expect(page.locator(".lessonquiz.solved")).toBeVisible();
      }
      if (i < lesson.steps.length - 1) await button(page, /^Next ›$/).click();
    }
    await button(page, /Finish lesson/).click();
  }

  test("a lesson with quizzes shown, not solved, stays open", async ({ page }) => {
    const { lesson, answers } = await forksLesson();
    await seed(page, null);
    await open(page);
    await button(page, /Lessons/).click();
    await page.getByText(/^Concepts/).first().click();
    await page.getByText(/Forks and Double Attacks/).first().click();
    await walkLesson(page, lesson, answers, false);
    const quizCount = lesson.steps.filter((x) => x.quiz).length;
    await expect(page.locator(".lessonend")).toContainText(quizCount === 1 ? "One quiz still to solve" : `${quizCount} quizzes still to solve`);
    expect((await readStore(page)).lessonProgress["forks-double-attacks"].completed).toBeFalsy();
    const first = Number(Object.keys(answers)[0]);
    await button(page, new RegExp(`Go to quiz ${first + 1}`)).click();
    await expect.poll(async () => (await readStore(page)).lessonProgress["forks-double-attacks"].step).toBe(first);
  });

  test("solving every quiz completes the lesson and offers the next one", async ({ page }) => {
    const { lesson, answers } = await forksLesson();
    await seed(page, null);
    await open(page);
    await button(page, /Lessons/).click();
    await page.getByText(/^Concepts/).first().click();
    await page.getByText(/Forks and Double Attacks/).first().click();
    await walkLesson(page, lesson, answers, true);
    await expect(page.locator(".lessonend.done")).toContainText("Lesson complete");
    const prog = (await readStore(page)).lessonProgress["forks-double-attacks"];
    expect(prog.completed).toBe(true);
    expect(prog.passed).toEqual(Object.keys(answers).map(Number));
    await button(page, /Next lesson ›/).click();
    await expect(page.locator(".topbar")).not.toContainText(lesson.title);
    await expect(page.locator(".stepstrip")).toBeVisible();
  });

  test("the lessons hub leads with the next lesson and shows the whole path", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Lessons/).click();
    const card = page.locator(".nextlesson");
    await expect(card).toContainText("Next lesson · 1 of 72");
    await expect(card).toContainText("Beginner");
    await expect(card.locator(".miniboard")).toBeVisible();
    await button(page, /See the whole path/).click();
    await expect(page.locator(".pathrow")).toHaveCount(72);
    await expect(page.locator(".pathrow.current")).toHaveCount(1);
    await expect(page.locator(".pathrow").first()).toHaveClass(/current/);
  });

  // Plan item 14: the box backup is Android-only, and its token never leaves.
  test("the box backup explains itself on the web, and exports keep its token out", async ({ page }) => {
    await seed(page, {
      settings: { box: { enabled: true, url: "https://box.example.ts.net", token: "SECRET-BOX-TOKEN" }, ai: { baseUrl: "", apiKey: "SECRET-AI", model: "" } },
      boxStatus: { lastOk: 5 },
    });
    await open(page);
    await button(page, /Settings/).click();
    await page.getByText("Backup to your box").click();
    await expect(page.getByText(/only in the Android app for now/)).toBeVisible();
    await expect(page.getByLabel("Box token")).toHaveCount(0);
    await page.getByText("Backup and restore").click();
    await button(page, /Export backup/).click();
    const text = await page.locator("textarea.backuptext[readonly]").inputValue();
    expect(text).not.toContain("SECRET-BOX-TOKEN");
    expect(text).not.toContain("SECRET-AI");
    expect(text).not.toContain("boxStatus");
  });

  // Found while building plan item 8: moving before the engine had judged the
  // position left the evals one short, and they never caught up again, so the
  // eval bar, threats and coach went quiet for the rest of the game.
  test("evals catch up after you move before the engine has judged the position", async ({ page }) => {
    await seed(page, {
      current: {
        id: "r1", mode: "bot", personaId: "x", playerColor: "w", serious: false, startFen: null,
        sans: ["e4", "e5", "Nf3"], chat: [], cps: [0, 20], status: "playing", result: null,
        createdAt: 1, muted: true, help: { evalBar: true, threats: false, suggest: false, coach: false },
      },
    });
    await open(page);
    await page.getByText(/Resume game/).click();
    await expect.poll(async () => {
      const c = (await readStore(page)).current;
      return c.sans.length >= 4 && c.cps.length === c.sans.length + 1;
    }, { timeout: 60_000 }).toBe(true);
  });

  // Plan item 8b: reviews saved before the fix called the Bongcloud book.
  test("old reviews are regraded: a named but bad move is no longer book", async ({ page }) => {
    const fens = [
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    ];
    const mv = (san, color, i, extra) => ({ san, color, class: "book", drop: 0, bestUci: null, bestSan: null, fenBefore: fens[i], ...extra });
    const review = {
      evals: [30, 30, 30, -120],
      moves: [mv("e4", "w", 0, { bestUci: "e2e4" }), mv("e5", "b", 1, { bestUci: "e7e5" }), mv("Ke2", "w", 2, { drop: 14.2, bestUci: "g1f3", bestSan: "Nf3" })],
      accuracy: { w: 80, b: 100 },
      counts: { w: { book: 2 }, b: { book: 1 } },
      opening: { eco: "C20", name: "Bongcloud Attack", plies: 3 },
      pvs: [["e4"], ["e5"], ["Nf3"], null],
    };
    await seed(page, {
      games: [{ id: "old1", date: 1, mode: "bot", personaId: "x", playerColor: "w", sans: ["e4", "e5", "Ke2"], result: "0-1", review }],
    });
    await open(page);
    await expect.poll(async () => (await readStore(page)).games[0].review.moves[2].class).toBe("mistake");
    const s = await readStore(page);
    expect(s.games[0].review.grade).toBe(2);
    expect(s.puzzles.map((p) => p.bestUci)).toEqual(["g1f3"]);
  });

  test("reviewing a game labels the moves and turns your blunders into puzzles", async ({ page }) => {
    await seed(page, {
      settings: { reviewMovetime: 100 },
      games: [{ id: "g1", date: 1, mode: "bot", personaId: "x", playerColor: "w", sans: FOOLS_MATE, result: "0-1", review: null }],
    });
    await open(page);
    await button(page, /Game archive/).click();
    await page.getByText(/tap to review/).first().click();
    await expect(page.locator(".acc-val").first()).toBeVisible({ timeout: 90_000 });
    const s = await readStore(page);
    const review = s.games[0].review;
    expect(review.moves.map((m) => m.san)).toEqual(FOOLS_MATE);
    expect(review.moves[3].class).not.toBe("blunder"); // the mating move is Black's best
    expect(s.puzzles.length).toBeGreaterThanOrEqual(1);
    expect(s.puzzles.every((p) => p.gameId === "g1" && p.solved === false)).toBe(true);

    // The coach (plan item 5): a game summary, and the reason for 2.g4??
    await expect(page.locator(".coachcard")).toContainText("The turning point was 2. g4");
    // Summary first, then move by move (plan item 6)
    await expect(page.locator(".movelist")).toHaveCount(0);
    await button(page, /Start review/).click();
    await page.locator(".movelist .mlmove").nth(2).click();
    await expect(page.locator(".coachline")).toContainText("Qh4#");
    await button(page, /Show the reply/).click();
    await expect(page.locator(".previewbar")).toContainText("Qh4#");
  });

  // Audit bug 2 (fixed in plan item 3): "Retry from here" used to replace a
  // game in progress without asking.
  test("retrying from a review asks before replacing a game in progress", async ({ page }) => {
    const current = {
      id: "cur", mode: "bot", personaId: "x", playerColor: "w", serious: false, startFen: null,
      sans: ["e4", "e5"], chat: [], cps: [0, 0, 0], status: "playing", result: null, createdAt: 1,
    };
    await seed(page, {
      settings: { reviewMovetime: 100 },
      current,
      games: [{ id: "g1", date: 1, mode: "bot", personaId: "x", playerColor: "w", sans: FOOLS_MATE, result: "0-1", review: null }],
    });
    await open(page);
    await button(page, /Game archive/).click();
    await page.getByText(/tap to review/).first().click();
    await expect(page.locator(".acc-val").first()).toBeVisible({ timeout: 90_000 });
    await button(page, /Start review/).click();
    await page.locator(".movelist .mlmove").nth(2).click(); // 2.g4??, allowing mate
    await button(page, /Play it out vs a bot/).click();
    await expect(page.getByText(/Replace your game in progress/)).toBeVisible();
    await button(page, /^Cancel$/).click();
    expect((await readStore(page)).current.id).toBe("cur");

    await button(page, /Play it out vs a bot/).click();
    await button(page, /Start new game/).click();
    await expect.poll(async () => (await readStore(page)).current?.id).not.toBe("cur");
  });

  test("a mistake can be retried in place, with feedback, until the better move is found", async ({ page }) => {
    await seed(page, {
      settings: { reviewMovetime: 100 },
      games: [{ id: "g1", date: 1, mode: "bot", personaId: "x", playerColor: "w", sans: FOOLS_MATE, result: "0-1", review: null }],
    });
    await open(page);
    await button(page, /Game archive/).click();
    await page.getByText(/tap to review/).first().click();
    await expect(page.locator(".acc-val").first()).toBeVisible({ timeout: 90_000 });
    await button(page, /Start review/).click();
    await page.locator(".movelist .mlmove").nth(2).click(); // 2.g4??
    await button(page, /^Retry$/).click();
    await expect(page.locator(".retrycard")).toContainText("find a better move than g4");

    // the same blunder again: the coach explains what it allows
    await move(page, "g2", "g4");
    await expect(page.locator(".retrycard")).toContainText("Not quite", { timeout: 30_000 });
    await expect(page.locator(".retrycard")).toContainText("Qh4#");

    // then the engine's move
    await button(page, /Try again/).click();
    const best = (await readStore(page)).games[0].review.moves[2].bestUci;
    await move(page, best.slice(0, 2), best.slice(2, 4));
    await expect(page.locator(".retrycard")).toContainText("✓", { timeout: 30_000 });
  });

  test("key moments step through the review", async ({ page }) => {
    await seed(page, {
      settings: { reviewMovetime: 100 },
      games: [{ id: "g1", date: 1, mode: "bot", personaId: "x", playerColor: "w", sans: FOOLS_MATE, result: "0-1", review: null }],
    });
    await open(page);
    await button(page, /Game archive/).click();
    await page.getByText(/tap to review/).first().click();
    await expect(page.locator(".acc-val").first()).toBeVisible({ timeout: 90_000 });
    await button(page, /Start review/).click();
    const seen = [];
    for (let k = 0; k < 4; k++) {
      seen.push((await page.locator(".moveverdict b").first().innerText()).split(":")[0]);
      const next = button(page, /Next key moment/);
      if (await next.isDisabled()) break;
      await next.click();
    }
    expect(seen).toContain("g4");
    await button(page, /^Summary$/).click();
    await expect(page.locator(".coachcard")).toBeVisible();
  });

  test("a blunder puzzle is solved by playing the best move", async ({ page }) => {
    await seed(page, {
      puzzles: [
        {
          id: "p1",
          // White to move; Qxf7# is mate
          fen: "r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
          bestSan: "Qxf7#",
          bestUci: "h5f7",
          playedSan: "Nf3",
          date: 1,
          solved: false,
        },
      ],
    });
    await open(page);
    await button(page, /Puzzles/).click();
    await page.getByText(/My blunders/).first().click();
    await move(page, "h5", "f7");
    await expect.poll(async () => (await readStore(page)).puzzles[0].solved, { timeout: 30_000 }).toBe(true);
  });

  test("a tier puzzle can be revealed and played through", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Puzzles/).click();
    await page.getByText(/Starter/).first().click();
    await button(page, /^Reveal$/).click();
    await expect(page.getByText(/The move is/)).toBeVisible();
    // shown in normal notation, not as raw squares (bug 12, fixed in plan item 3)
    await expect(page.getByText(/The move is [a-h][1-8][a-h][1-8]/)).toHaveCount(0);
    await button(page, /Play it/).click();
    // revealing counts as a miss for the rating
    await expect.poll(async () => (await readStore(page)).puzzleRating.n).toBeGreaterThanOrEqual(1);
  });

  test("a lesson steps forward and a quiz can be shown", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Lessons/).click();
    await page.getByText(/^Concepts/).first().click();
    await page.getByText(/Forks and Double Attacks/).first().click();
    await button(page, /Next/).click();
    await button(page, /Show me/).click();
    await expect(page.getByText(/The move is Nxc7\+/)).toBeVisible();
    await expect.poll(async () => (await readStore(page)).lessonProgress?.["forks-double-attacks"]?.step).toBe(1);
  });

  test("a pasted PGN is imported and reviewed", async ({ page }) => {
    await seed(page, { settings: { reviewMovetime: 100 } });
    await open(page);
    await button(page, /Import games/).click();
    await page.locator("textarea").first().fill(`[White "A"]\n[Black "B"]\n\n1. e4 e5 2. Nf3 Nc6 *`);
    await button(page, /Import & review/).click();
    await expect(page.locator(".acc-val").first()).toBeVisible({ timeout: 90_000 });
    const s = await readStore(page);
    expect(s.games[0].sans).toEqual(["e4", "e5", "Nf3", "Nc6"]);
  });

  test("analysis accepts a plain PGN", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Analysis/).click();
    await button(page, /Paste FEN\/PGN/).click();
    await page.locator("textarea").first().fill("1. d4 d5 2. c4 *");
    await button(page, /^Load$/).click();
    await expect(page.locator(".movelist .mlmove")).toHaveText(["d4", "d5", "c4"]);
    await expect(page.getByText(/hit an error|Something went wrong/i)).toHaveCount(0);
  });

  // Audit bug 1 (fixed in plan item 3): a PGN with a [FEN] header used to
  // crash the whole app.
  test("analysis accepts a PGN that starts from a FEN", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Analysis/).click();
    await button(page, /Paste FEN\/PGN/).click();
    await page
      .locator("textarea")
      .first()
      .fill(`[SetUp "1"]\n[FEN "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1"]\n\n1. e4 Kd7 *`);
    await button(page, /^Load$/).click();
    await expect(page.locator(".board, [data-sq]").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/hit an error|Something went wrong/i)).toHaveCount(0, { timeout: 5_000 });
    await expect(page.locator(".movelist .mlmove")).toHaveText(["e4", "Kd7"], { timeout: 5_000 });
  });

  // Audit bug 4 (fixed in plan item 2): Analysis used to keep the previous
  // position's engine lines for most of a second after a move.
  test("analysis never shows the previous position's engine lines", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Analysis/).click();
    const lines = page.locator(".engineline");
    await expect(lines.first()).toBeVisible({ timeout: 60_000 });
    const before = await lines.allTextContents();
    await move(page, "g1", "f3");
    const right = await lines.allTextContents();
    expect(right.filter((t) => before.includes(t))).toEqual([]);
  });

  // Audit bug 13 (fixed in plan item 2): the threat arrows used to show the
  // opponent's best idea even when it threatened nothing.
  test("analysis draws threat arrows only for real threats", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Analysis/).click();
    const threat = page.locator('g[stroke="#d02a2a"]');
    await expect(page.locator(".engineline").first()).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(1500); // the probe runs after the position's own eval
    await expect(threat).toHaveCount(0);

    // Black to move after 1.e4 e5 2.Bc4 Nc6 3.Qh5: White threatens Qxf7 mate.
    await button(page, /Paste FEN\/PGN/).click();
    await page.locator("textarea").first().fill("r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3");
    await button(page, /^Load$/).click();
    await expect(threat.first()).toBeVisible({ timeout: 15_000 });
  });

  test("board theme and piece set persist across a reload", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await page.getByText(/Settings & themes/).click();
    await page.locator(".themeswatch").nth(1).click();
    await page.locator(".pieceswatch").nth(1).click();
    await expect.poll(async () => (await readStore(page)).settings.theme).not.toBe("brown");
    const chosen = (await readStore(page)).settings.theme;
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect.poll(async () => (await readStore(page)).settings.theme).toBe(chosen);
    expect((await readStore(page)).settings.pieces).not.toBe("cburnett");
  });

  test("the app colour applies at once and survives a reload", async ({ page }) => {
    await seed(page, null);
    await open(page);
    const accent = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim());
    expect(await accent()).toBe("#3fb3a4"); // Teal by default
    await page.getByText(/Settings & themes/).click();
    await page.getByRole("radio", { name: /Plum/ }).click();
    expect(await accent()).toBe("#a58be0");
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect.poll(accent).toBe("#a58be0");
    expect((await readStore(page)).settings.accent).toBe("plum");
  });

  test("a font file can be added, used, kept across reloads and removed", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await page.getByText(/Settings & themes/).click();
    await page.getByTestId("font-file").setInputFiles("node_modules/@fontsource/sora/files/sora-latin-800-normal.woff2");
    const added = page.getByRole("radio", { name: /sora latin 800 normal/i });
    await expect(added).toBeVisible();
    await expect(added).toHaveAttribute("aria-checked", "true");
    expect((await readStore(page)).settings.displayFont).toMatch(/^custom:/);
    const display = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--display"));
    expect(await display()).toContain("chess-user-font-");

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("radio", { name: /sora latin 800 normal/i })).toBeVisible();
    await expect.poll(display).toContain("chess-user-font-");

    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByRole("radio", { name: /sora latin 800 normal/i })).toHaveCount(0);
    expect((await readStore(page)).settings.displayFont).toBe("sora");
  });

  test("a file that is not a font is refused with a reason", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await page.getByText(/Settings & themes/).click();
    await page.getByTestId("font-file").setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await expect(page.getByText(/Use a .woff2, .woff, .ttf or .otf font file/)).toBeVisible();
  });

  test("a backup can be restored from pasted text", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await page.getByText(/Settings & themes/).click();
    await page.getByText("Backup and restore").click(); // the section starts closed
    const backup = { version: 1, settings: { theme: "walnut" }, games: [{ id: "r1", sans: ["d4"], date: 1 }] };
    await page.getByPlaceholder(/paste a backup/i).fill(JSON.stringify(backup));
    await button(page, /Restore from pasted text/).click();
    await expect(page.locator(".okmsg", { hasText: "Backup restored" })).toBeVisible();
    const s = await readStore(page);
    expect(s.settings.theme).toBe("walnut");
    expect(s.games.map((g) => g.id)).toEqual(["r1"]);
  });

  test("pass and play alternates sides and saves the game", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Pass & play/).click();
    await button(page, /Start game/).click();
    await move(page, "e2", "e4");
    await move(page, "e7", "e5");
    await expect.poll(async () => (await readStore(page)).current?.sans).toEqual(["e4", "e5"]);
    expect((await readStore(page)).current.mode).toBe("pass");
  });

  test("the opening explorer walks a line and hands it to the drill", async ({ page }) => {
    await seed(page, null);
    await open(page);
    await button(page, /Openings/).click();
    await page.locator(".openrow", { has: page.locator(".or-move", { hasText: /^e4$/ }) }).first().click();
    await page.locator(".openrow", { has: page.locator(".or-move", { hasText: /^e5$/ }) }).first().click();
    await expect(page.locator(".pathmove")).toHaveCount(2);
    await button(page, /Drill this line/).click();
    // you play White: play 1.e4, the drill answers 1...e5 from the line
    await move(page, "e2", "e4");
    await expect(page.locator(".movepath .pathmove")).toHaveText(["1.e4", "e5"], { timeout: 15_000 });
  });

  test("the app opens offline after the first visit", async ({ page, context }) => {
    await seed(page, null);
    await open(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload({ waitUntil: "domcontentloaded" }); // let the worker control the page
    await page.evaluate(() => navigator.serviceWorker.ready);
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("h1.apptitle")).toBeVisible();
    await context.setOffline(false);
  });
});
