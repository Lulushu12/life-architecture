import { describe, it, expect } from "vitest";
import { checkWeeks, weekStart } from "../../src/checkStats.js";

describe("blunder check record by week", () => {
  const now = new Date(2026, 9, 9, 15).getTime(); // a Friday
  const day = 24 * 3600 * 1000;

  it("weeks start on Monday", () => {
    expect(new Date(weekStart(now)).getDay()).toBe(1);
    expect(new Date(weekStart(now)).getDate()).toBe(5);
  });

  it("counts saves and played-anyway per week, oldest first", () => {
    const checks = [
      { t: now, saved: true },
      { t: now - day, saved: true },
      { t: now - 2 * day, saved: false },
      { t: now - 7 * day, saved: true }, // last week
      { t: now - 70 * day, saved: true }, // too old
    ];
    const w = checkWeeks(checks, now, 8);
    expect(w).toHaveLength(8);
    expect(w[7]).toMatchObject({ saved: 2, anyway: 1 });
    expect(w[6]).toMatchObject({ saved: 1, anyway: 0 });
    expect(w.slice(0, 6).every((x) => x.saved === 0 && x.anyway === 0)).toBe(true);
  });

  it("copes with no record", () => {
    expect(checkWeeks(undefined, now, 2).map((x) => x.saved)).toEqual([0, 0]);
  });
});
