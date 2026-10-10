import { describe, it, expect } from "vitest";
import { liveCoachNote, hintIdea, blunderCheck, tacticPrompt } from "../../src/core/coach/live.js";
import { Chess } from "chess.js";

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

// Plan item 9
describe("blunder check before your move", () => {
  const FEN = "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";

  it("stops a move that hangs a piece, pointing at it without naming the reply", () => {
    const n = blunderCheck({ fenBefore: FEN, san: "Ng5", cpBefore: 40, cpAfter: -300, replyPv: ["d8g5"], ply: 4 });
    expect(n.text).toBe("Is your knight on g5 safe? Look at their queen first.");
    expect(n.squares).toEqual(["g5"]);
    expect(n.text).not.toMatch(/Qxg5/);
  });

  it("lets ordinary moves and small slips through", () => {
    expect(blunderCheck({ fenBefore: FEN, san: "Bc4", cpBefore: 40, cpAfter: 30, replyPv: ["f8c5"] })).toBeNull();
    // a pawn's worth at an even position is under the bar
    expect(blunderCheck({ fenBefore: FEN, san: "a3", cpBefore: 40, cpAfter: -60, replyPv: ["g8f6"] })).toBeNull();
    expect(blunderCheck({ fenBefore: FEN, san: "Ng5", cpBefore: null, cpAfter: -300 })).toBeNull();
  });

  it("warns about an allowed mate as checks to look at", () => {
    const fen = "rnbqkbnr/pppp1ppp/8/4p3/8/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 2";
    const n = blunderCheck({ fenBefore: fen, san: "g4", cpBefore: -50, cpAfter: -9999, replyPv: ["d8h4"] });
    expect(n.text).toMatch(/every check/);
  });
});

describe("the coach speaks up when there's a tactic", () => {
  it("prompts when the opponent left a piece loose", () => {
    // Black just played ...Qd5?? next to the rook on d1.
    const prev = "4k3/8/3q4/8/8/8/8/3RK3 b - - 0 1";
    const fen = "4k3/8/8/3q4/8/8/8/3RK3 w - - 1 2";
    expect(tacticPrompt(fen, ["d1d5", "e8e7"], 800, prev)).toMatch(/win material/);
  });

  it("does not call taking back what they just took a tactic", () => {
    // 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.Be3 Bxe3: White recaptures on e3.
    const prev = "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/4BN2/PPPP1PPP/RN1QK2R b KQkq - 5 4";
    const fen = "r1bqk1nr/pppp1ppp/2n5/4p3/2B1P3/4bN2/PPPP1PPP/RN1QK2R w KQkq - 0 5";
    expect(tacticPrompt(fen, ["f2e3", "g8f6", "e1g1", "e8g8"], 30, prev)).toBeNull();
    expect(hintIdea(fen, ["f2e3", "g8f6", "e1g1", "e8g8"], 30, prev)).not.toMatch(/win material/);
  });

  it("prompts on a forced mate and stays quiet in a quiet position", () => {
    expect(tacticPrompt("6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1", ["a1a8"], 9999)).toMatch(/forced mate/);
    expect(tacticPrompt(new Chess().fen(), ["e2e4", "e7e5"], 20)).toBeNull();
  });
});
