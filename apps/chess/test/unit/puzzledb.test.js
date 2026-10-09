import { describe, it, expect, vi, afterEach } from "vitest";
import {
  rateResult,
  nextPuzzle,
  srsNext,
  dueItems,
  moveIsGoodEnough,
  themesIn,
  allPuzzles,
  allSolved,
  getRating,
  SRS_DAYS,
} from "../../src/puzzledb.js";
import { FakeEngine, line } from "../fixtures/fakeEngine.js";

const DAY = 86400000;
afterEach(() => vi.restoreAllMocks());

describe("puzzle rating (plain Elo)", () => {
  it("uses K=32 for the first 30 puzzles, then 16", () => {
    expect(rateResult({ r: 1200, n: 0 }, 1200, true).delta).toBe(16);
    expect(rateResult({ r: 1200, n: 30 }, 1200, true).delta).toBe(8);
    expect(rateResult({ r: 1200, n: 0 }, 1200, false).delta).toBe(-16);
  });

  it("starts at 1200 and keeps the last 60 ratings", () => {
    expect(getRating({})).toEqual({ r: 1200, n: 0 });
    const history = Array.from({ length: 60 }, (_, i) => i);
    const { next } = rateResult({ r: 1000, n: 5, history }, 1000, true);
    expect(next.history.length).toBe(60);
    expect(next.history[59]).toBe(1016);
    expect(next.n).toBe(6);
  });
});

describe("next puzzle choice", () => {
  const list = [
    { i: "a", r: 800, t: ["fork"] },
    { i: "b", r: 1150, t: ["pin"] },
    { i: "c", r: 1250, t: ["fork"] },
    { i: "d", r: 2000, t: ["fork"] },
  ];

  it("picks within 150 of the target first", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(nextPuzzle(list, new Set(), null, 1200).i).toBe("b");
    expect(nextPuzzle(list, new Set(["b"]), null, 1200).i).toBe("c");
  });

  it("filters by theme and skips excluded ids", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(nextPuzzle(list, new Set(["c"]), "fork", 1200).i).toBe("a");
    expect(nextPuzzle(list, new Set(["a", "b", "c", "d"]), null, 1200)).toBeNull();
  });

  it("falls back to the 20 closest when nothing is within 600", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(nextPuzzle([{ i: "x", r: 3000, t: [] }], new Set(), null, 1200).i).toBe("x");
  });
});

describe("spaced review", () => {
  it("schedules 1, 3, 7, 21 days and drops after the last step", () => {
    const now = 1_000_000;
    expect(SRS_DAYS).toEqual([1, 3, 7, 21]);
    expect(srsNext(null, false, now)).toEqual({ step: 0, due: now + DAY });
    expect(srsNext(null, true, now)).toBeNull();
    expect(srsNext({ step: 0 }, true, now)).toEqual({ step: 1, due: now + 3 * DAY });
    expect(srsNext({ step: 2 }, true, now)).toEqual({ step: 3, due: now + 21 * DAY });
    expect(srsNext({ step: 3 }, true, now)).toBeNull();
    expect(srsNext({ step: 2 }, false, now)).toEqual({ step: 0, due: now + DAY });
  });

  it("lists due tier and blunder items, oldest first", () => {
    const store = {
      puzzleSrs: { "starter:a": { tier: "starter", id: "a", step: 0, due: 50 }, "easy:b": { due: 500 } },
      puzzles: [{ id: "p1", srs: { due: 10 } }, { id: "p2" }],
    };
    expect(dueItems(store, 100).map((d) => d.key)).toEqual(["b:p1", "starter:a"]);
  });
});

describe("engine check for alternative answers", () => {
  it("accepts a move within 30 cp of the best", async () => {
    const engine = new FakeEngine(() => ({ lines: [line("e2e4", 100), line("d2d4", 80), line("a2a3", 0)] }));
    expect(await moveIsGoodEnough(engine, "fen", "d2d4")).toBe(true);
    expect(await moveIsGoodEnough(engine, "fen", "a2a3")).toBe(false);
    expect(await moveIsGoodEnough(engine, "fen", "h2h4")).toBe(false);
  });

  // Audit bug 14: a busy engine makes a correct answer count as wrong.
  it.fails("does not reject a correct move just because the engine was busy", async () => {
    vi.useFakeTimers();
    const engine = new FakeEngine(() => new Promise(() => {}));
    const pending = moveIsGoodEnough(engine, "fen", "e2e4");
    vi.advanceTimersByTime(4001);
    const result = await pending;
    vi.useRealTimers();
    expect(result).not.toBe(false);
  });
});

describe("db helpers", () => {
  it("offers a theme chip only with at least 8 puzzles", () => {
    const list = [...Array(8)].map((_, i) => ({ i: `f${i}`, t: ["fork"] })).concat([{ i: "p", t: ["pin"] }]);
    expect(themesIn(list).map((t) => t.key)).toEqual(["fork"]);
  });

  it("flattens tiers once and collects solved ids across tiers", () => {
    const db = { puzzles: { starter: [{ i: "a" }], easy: [{ i: "b" }] } };
    const flat = allPuzzles(db);
    expect(flat.map((p) => [p.i, p.k])).toEqual([["a", "starter"], ["b", "easy"]]);
    expect(allPuzzles(db)).toBe(flat);
    expect([...allSolved({ puzzleProgress: { starter: ["a"], easy: ["b"] } })]).toEqual(["a", "b"]);
  });
});
