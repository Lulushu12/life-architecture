import { describe, it, expect } from "vitest";
import { liveCoachNote, hintIdea } from "../../src/core/coach/live.js";

describe("coach during a game", () => {
  // 1.e4 e5 2.Nf3 Nc6, White to move: Ng5 leaves the knight to the queen.
  const FEN = "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";

  it("speaks up on a mistake, with the reason", () => {
    const n = liveCoachNote({ fenBefore: FEN, san: "Ng5", bestUci: "f1b5", bestPv: ["f1b5"], cpBefore: 40, cpAfter: -300, replyPv: ["d8g5"], ply: 4, lastPraise: -99 });
    expect(n).toMatchObject({ kind: "warn", cls: "blunder" });
    expect(n.text).toMatch(/knight/);
    expect(n.text).toMatch(/g5/);
  });

  it("praises the engine's move, but not every time", () => {
    const best = { fenBefore: FEN, san: "Bb5", bestUci: "f1b5", bestPv: ["f1b5"], cpBefore: 40, cpAfter: 40, replyPv: ["a7a6"], ply: 4 };
    expect(liveCoachNote({ ...best, lastPraise: -99 })).toMatchObject({ kind: "praise", cls: "best" });
    expect(liveCoachNote({ ...best, lastPraise: 2 })).toBeNull();
  });

  it("stays quiet on an ordinary good move", () => {
    expect(liveCoachNote({ fenBefore: FEN, san: "Bc4", bestUci: "f1b5", bestPv: ["f1b5"], cpBefore: 40, cpAfter: 35, replyPv: ["f8c5"], ply: 4, lastPraise: -99 })).toBeNull();
  });
});

describe("two-step hint, first step", () => {
  const FEN_ITALIAN = "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";
  it("names the idea without the move", () => {
    expect(hintIdea("6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1", ["a1a8"], 9999)).toMatch(/forced mate/);
    expect(hintIdea("4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1", ["d1d5"], 800)).toMatch(/win material/);
    expect(hintIdea("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", ["e2e4"], 20)).toMatch(/highlighted pawn has a better square/);
    expect(hintIdea(FEN_ITALIAN, ["f1b5"], 40)).toMatch(/highlighted bishop/);
    const text = hintIdea("4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1", ["d1d5"], 800);
    expect(text).not.toMatch(/Rxd5|d5/);
  });
});
