import { describe, it, expect } from "vitest";
import { puzzleTip, themeTip } from "../../src/core/coach/puzzle.js";

describe("coach tip after a wrong puzzle move (plan item 11)", () => {
  it("picks the most telling theme", () => {
    expect(themeTip("fork middlegame short")).toBe("Look for a move that attacks two things at once.");
    expect(themeTip(["sacrifice", "mateIn2"])).toMatch(/forced mate/);
    expect(themeTip("endgame long")).toBeNull();
  });

  it("says what the tried move gives away, then nudges, without the answer", () => {
    // White to move; the fork Nc7+ wins the rook. Nf6+ instead just loses
    // the knight to the e7 pawn.
    const fen = "r3k3/4p3/8/3N4/8/8/8/4K3 w - - 0 1";
    const tip = puzzleTip({ fen, played: "d5f6", themes: "fork", replyPv: ["e7f6"], cpAfter: -200 });
    expect(tip).toMatch(/knight/);
    expect(tip).toMatch(/f6/);
    expect(tip).toMatch(/attacks two things at once/);
    expect(tip).not.toMatch(/Nc7/);
  });

  it("falls back to the reply, then to the theme", () => {
    const fen = "r3k3/4p3/8/3N4/8/8/8/4K3 w - - 0 1";
    // Kd2 walks into a pin on the d-file: the coach names it
    expect(puzzleTip({ fen, played: "e1d2", themes: "", replyPv: ["a8d8"], cpAfter: 0 })).toMatch(/pinning your knight/);
    // nothing to say about Kf2 itself: the reply, then the theme
    expect(puzzleTip({ fen, played: "e1f2", themes: "fork", replyPv: ["a8a7"], cpAfter: 0 })).toBe(
      "Kf2 lets them answer Ra7. Look for a move that attacks two things at once."
    );
    expect(puzzleTip({ fen, played: "e1f2", themes: "" })).toBe("Kf2 isn't it.");
  });
});
