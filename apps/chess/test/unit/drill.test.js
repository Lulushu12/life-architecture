import { describe, it, expect } from "vitest";
import { missesAfterShow, isMastered } from "../../src/drillScore.js";

describe("opening drill scoring", () => {
  // Audit bug 6 (fixed in plan item 3).
  it("counts Show move as a miss", () => {
    expect(missesAfterShow(0, 0)).toBe(1);
    expect(isMastered(missesAfterShow(0, 0))).toBe(false);
  });

  it("does not double-count a step that already had a wrong move", () => {
    expect(missesAfterShow(1, 1)).toBe(1);
  });

  it("masters only a clean run", () => {
    expect(isMastered(0)).toBe(true);
    expect(isMastered(2)).toBe(false);
  });
});
