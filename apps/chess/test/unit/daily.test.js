import { describe, it, expect } from "vitest";
import { pickDaily, dailyStreak, bestStreak, monthGrid, HEARTS } from "../../src/daily.js";

const db = {
  puzzles: {
    starter: Array.from({ length: 40 }, (_, i) => ({ i: `s${i}`, r: 700 + i * 10, f: "", m: "", t: "" })),
    easy: Array.from({ length: 40 }, (_, i) => ({ i: `e${i}`, r: 1050 + i * 10, f: "", m: "", t: "" })),
  },
};

describe("daily puzzle (plan item 11)", () => {
  it("gives the same puzzle for the same date, a different one another day", () => {
    const a = pickDaily(db, "2026-10-09", 950);
    expect(pickDaily(db, "2026-10-09", 950)).toEqual(a);
    const days = new Set(["2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13"].map((d) => pickDaily(db, d, 950).id));
    expect(days.size).toBeGreaterThan(1);
  });

  it("picks a little above your rating and never repeats an old daily", () => {
    const p = pickDaily(db, "2026-10-09", 950);
    expect(p.r).toBeGreaterThanOrEqual(800);
    expect(p.r).toBeLessThanOrEqual(1200);
    const again = pickDaily(db, "2026-10-09", 950, { "2026-10-01": { id: p.id, result: "solved" } });
    expect(again.id).not.toBe(p.id);
  });

  it("counts the streak back from today, or from yesterday while today is open", () => {
    const log = {
      "2026-10-06": { result: "solved" },
      "2026-10-07": { result: "solved" },
      "2026-10-08": { result: "solved" },
    };
    expect(dailyStreak(log, "2026-10-09")).toBe(3); // today still open
    expect(dailyStreak({ ...log, "2026-10-09": { result: "solved" } }, "2026-10-09")).toBe(4);
    expect(dailyStreak({ ...log, "2026-10-09": { result: "failed" } }, "2026-10-09")).toBe(3);
    expect(dailyStreak(log, "2026-10-10")).toBe(0); // a day missed
    expect(bestStreak({ ...log, "2026-10-01": { result: "solved" } })).toBe(3);
  });

  it("lays a month out Monday first", () => {
    const w = monthGrid(2026, 9); // October 2026 starts on a Thursday
    expect(w[0]).toEqual([null, null, null, "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    expect(w.flat().filter(Boolean)).toHaveLength(31);
    expect(HEARTS).toBe(5);
  });
});
