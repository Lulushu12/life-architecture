import { describe, it, expect } from "vitest";
import { addResult, wdl, cleanWins, assistLabel } from "../../src/records.js";

describe("bot records, clean and assisted", () => {
  it("counts a result in the total and in its side", () => {
    let r = addResult(undefined, "w", null);
    r = addResult(r, "l", "hint");
    r = addResult(r, "w", "help");
    expect(r).toMatchObject({ w: 2, d: 0, l: 1, clean: { w: 1, d: 0, l: 0 }, assisted: { w: 1, d: 0, l: 1 } });
    expect(wdl(r)).toBe("2-0-1");
    expect(cleanWins(r)).toBe(1);
  });

  it("keeps records from before the split", () => {
    const r = addResult({ w: 3, d: 1, l: 2 }, "d", null);
    expect(r).toMatchObject({ w: 3, d: 2, l: 2, clean: { w: 0, d: 1, l: 0 } });
    expect(r.assisted).toBeUndefined();
    expect(cleanWins({ w: 3, d: 1, l: 2 })).toBe(0);
  });

  it("says why a game was assisted", () => {
    expect(assistLabel(null)).toBeNull();
    expect(assistLabel("hint")).toBe("you took a hint");
  });
});
