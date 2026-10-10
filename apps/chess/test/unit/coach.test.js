import { describe, it, expect } from "vitest";
import { moveFacts, phrase, explainReviewMove, summarizeGame } from "../../src/core/coach/index.js";
import { hangingPieces, lineTactics, swapOff } from "../../src/core/coach/board.js";
import { Chess } from "chess.js";

const top = (m) => moveFacts(m)[0];
const START = new Chess().fen();

describe("board helpers", () => {
  it("finds a piece that can be taken for free, and one that is only short of defenders", () => {
    // White knight on e5 attacked by the d6 pawn; Black to move.
    expect(hangingPieces("4k3/8/3p4/4N3/8/8/8/4K3 b - - 0 1", "w")).toEqual([
      { square: "e5", type: "n", gain: 3, from: "d6" },
    ]);
    // Defended knight attacked by a pawn: still loses a knight for a pawn.
    const h = hangingPieces("4k3/8/3p4/4N3/3P4/8/8/4K3 b - - 0 1", "w");
    expect(h[0]).toMatchObject({ square: "e5", gain: 2 });
  });

  it("does not call a defended piece attacked by a bigger piece hanging", () => {
    expect(hangingPieces("4k3/8/8/3q4/4N3/5P2/8/4K3 b - - 0 1", "w")).toEqual([]);
  });

  it("sees pins and skewers along a line", () => {
    const pin = new Chess("4k3/8/8/8/1b6/2N5/8/4K3 w - - 0 1");
    expect(lineTactics(pin, "b4", "w")).toEqual([{ kind: "pin", front: { square: "c3", type: "n" }, back: { square: "e1", type: "k" } }]);
    const skewer = new Chess("4k3/8/8/8/8/8/8/r2K3Q w - - 0 1");
    expect(lineTactics(skewer, "a1", "w")).toEqual([{ kind: "skewer", front: { square: "d1", type: "k" }, back: { square: "h1", type: "q" } }]);
    // a lone piece on the line is neither
    expect(lineTactics(new Chess("4k3/8/8/8/8/8/8/r2K4 w - - 0 1"), "a1", "w")).toEqual([]);
  });

  it("nets material on a square by static exchange", () => {
    const c = new Chess("4k3/8/3p4/4N3/8/8/8/4K3 b - - 0 1");
    expect(swapOff(c, "e5")).toBe(3);
  });
});

describe("what a bad move allowed", () => {
  it("names a piece left hanging, with the capture", () => {
    const f = top({ fenBefore: "4k3/8/3p4/8/8/5N2/8/4K3 w - - 0 1", san: "Ne5", cls: "blunder", reply: ["dxe5"], evalBefore: 300, evalAfter: 0, ply: 20 });
    expect(f).toMatchObject({ type: "hangs_piece", piece: "n", square: "e5", free: true, moved: true, reply: "dxe5" });
    expect(phrase(f, "x")).toMatch(/knight/);
    expect(phrase(f, "x")).toMatch(/e5/);
  });

  it("names an allowed checkmate", () => {
    const f = top({ fenBefore: "rnbqkbnr/pppp1ppp/8/4p3/8/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 2", san: "g4", cls: "blunder", reply: ["Qh4#"], evalBefore: -50, evalAfter: -9999, ply: 2 });
    expect(f).toMatchObject({ type: "allows_mate", n: 1, reply: "Qh4#" });
    expect(phrase(f)).toMatch(/Qh4#/);
  });

  it("names an allowed fork", () => {
    const f = top({ fenBefore: "4k3/8/8/8/1n6/8/7P/R3K3 w - - 0 1", san: "h3", cls: "blunder", reply: ["Nc2+", "Kd2", "Nxa1"], evalBefore: 300, evalAfter: -100, ply: 30 });
    expect(f.type).toBe("allows_fork");
    expect(f.targets.map((t) => t.type).sort()).toEqual(["k", "r"]);
    expect(phrase(f)).toMatch(/Nc2\+/);
  });

  it("names an allowed pin", () => {
    const f = top({ fenBefore: "4k3/8/8/2b5/8/2N5/7P/4K3 w - - 0 1", san: "h3", cls: "inaccuracy", reply: ["Bb4"], evalBefore: 0, evalAfter: -60, ply: 30 });
    expect(f).toMatchObject({ type: "allows_pin", front: { type: "n" }, back: { type: "k" } });
  });

  it("names a missed mate and a missed win", () => {
    const mate = top({ fenBefore: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1", san: "h3", cls: "blunder", bestSan: "Ra8#", bestLine: ["Ra8#"], reply: ["h6"], evalBefore: 9999, evalAfter: 500, ply: 40 });
    expect(mate).toMatchObject({ type: "missed_mate", n: 1, best: "Ra8#" });
    // Ke2 keeps the rook defended, so the only story is the queen left on the board.
    const win = top({ fenBefore: "4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1", san: "Ke2", cls: "blunder", bestSan: "Rxd5", bestLine: ["Rxd5"], reply: ["Qe6+"], evalBefore: 600, evalAfter: -100, ply: 40 });
    expect(win).toMatchObject({ type: "missed_win", piece: "q", best: "Rxd5" });
    expect(phrase(win)).toMatch(/queen/);
  });

  it("warns about an early queen in the opening", () => {
    const f = top({ fenBefore: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", san: "Qh5", cls: "inaccuracy", reply: ["Nc6"], evalBefore: 30, evalAfter: -10, ply: 2 });
    expect(f.type).toBe("early_queen");
  });

  it("falls back to a plain sentence with the better move", () => {
    const f = top({ fenBefore: START, san: "a3", cls: "inaccuracy", bestSan: "e4", reply: ["e5"], evalBefore: 30, evalAfter: -20, ply: 0 });
    expect(f).toMatchObject({ type: "generic_inaccuracy", best: "e4" });
    expect(phrase(f)).toMatch(/e4/);
  });
});

// Plan item 17: Morphy's Opera Game. 15.Bxd7+ gives the bishop away on
// purpose: 15...Nxd7 16.Qb8+! Nxb8 17.Rd8#. Not a hanging piece.
describe("a sacrifice is not a hanging piece", () => {
  const opera = "e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6".split(" ");
  const c = new Chess();
  for (const s of opera) c.move(s);
  const fen = c.fen();

  it("names the mate the sacrifice leads to", () => {
    const facts = moveFacts({ fenBefore: fen, san: "Bxd7+", cls: "inaccuracy", bestSan: "Bxf6", reply: ["Nxd7", "Qb8+", "Nxb8", "Rd8#"], evalBefore: 9998, evalAfter: 9996, ply: 28 });
    expect(facts.map((f) => f.type)).not.toContain("hangs_piece");
    expect(facts[0]).toMatchObject({ type: "sacrifice", piece: "b", mate: true });
    expect(phrase(facts[0], fen)).toMatch(/Qb8\+/);
  });

  it("doesn't call another mating move a missed mate", () => {
    const f = moveFacts({ fenBefore: fen, san: "Bxd7+", cls: "inaccuracy", bestSan: "Bxf6", reply: ["Nxd7", "Qb8+", "Nxb8", "Rd8#"], evalBefore: 9998, evalAfter: 9996, ply: 28 });
    expect(f.map((x) => x.type)).not.toContain("missed_mate");
  });

  it("still calls a real hanging piece hanging", () => {
    const f = top({ fenBefore: "4k3/8/3p4/8/8/5N2/8/4K3 w - - 0 1", san: "Ne5", cls: "blunder", reply: ["dxe5"], evalBefore: 300, evalAfter: 0, ply: 20 });
    expect(f.type).toBe("hangs_piece");
  });
});

describe("good moves", () => {
  it("praises by classification and spots checkmate", () => {
    expect(top({ fenBefore: START, san: "e4", cls: "best", bestSan: "e4", ply: 0 }).type).toBe("praise_best");
    expect(top({ fenBefore: "rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2", san: "Qh4#", cls: "best", ply: 3 }).type).toBe("checkmate");
  });

  it("says when a capture wins material", () => {
    const f = top({ fenBefore: "4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1", san: "Rxd5", cls: "best", bestSan: "Rxd5", reply: ["Ke7"], ply: 40 });
    expect(f).toMatchObject({ type: "wins_material", piece: "q" });
  });

  it("calls a recapture a recapture, not a win", () => {
    // 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.Be3 Bxe3: White takes back on e3.
    const prev = "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/4BN2/PPPP1PPP/RN1QK2R b KQkq - 5 4";
    const before = "r1bqk1nr/pppp1ppp/2n5/4p3/2B1P3/4bN2/PPPP1PPP/RN1QK2R w KQkq - 0 5";
    const f = top({ fenBefore: before, san: "fxe3", cls: "best", bestSan: "fxe3", reply: ["Nf6"], prevFenBefore: prev, prevSan: "Bxe3", prevTo: "e3", ply: 8 });
    expect(f).toMatchObject({ type: "takes_back", piece: "b" });
  });

  it("explains losing the queen to a cheaper piece correctly", () => {
    // Qxf7+?? Rxf7: the queen is defended, but a rook takes it.
    const fen = "r4rk1/ppp2pp1/2np3p/3Bp1q1/4P3/3PPQ1P/PPP3P1/R4R1K w - - 1 13";
    const f = top({ fenBefore: fen, san: "Qxf7+", cls: "blunder", bestSan: "Bxf7+", reply: ["Rxf7", "Rxf7"], evalBefore: 300, evalAfter: -500, ply: 24 });
    expect(f).toMatchObject({ type: "hangs_piece", piece: "q", square: "f7", by: "r", free: false });
    expect(phrase(f, "a")).not.toMatch(/more times than it is defended/);
    expect(phrase(f, "a")).toMatch(/rook/);
  });

  it("words the same move the same way every time", () => {
    const m = { fenBefore: START, san: "e4", cls: "best", bestSan: "e4", ply: 0 };
    expect(phrase(top(m), START)).toBe(phrase(top(m), START));
  });
});

describe("explaining a review", () => {
  // Fool's mate with you as White.
  const sans = ["f3", "e5", "g4", "Qh4#"];
  const c = new Chess();
  const fens = [c.fen()];
  for (const s of sans) {
    c.move(s);
    fens.push(c.fen());
  }
  const review = {
    moves: [
      { san: "f3", color: "w", class: "mistake", drop: 12, bestSan: "e4", fenBefore: fens[0] },
      { san: "e5", color: "b", class: "best", drop: 0, bestSan: "e5", fenBefore: fens[1] },
      { san: "g4", color: "w", class: "blunder", drop: 45, bestSan: "Nc3", fenBefore: fens[2] },
      { san: "Qh4#", color: "b", class: "best", drop: 0, bestSan: "Qh4#", fenBefore: fens[3] },
    ],
    evals: [30, -60, -50, -9999, -10000],
    pvs: [["e4"], ["e5"], ["Nc3"], ["Qh4#"], null],
    accuracy: { w: 31.2, b: 100 },
    counts: {},
  };

  it("explains the losing move with the mating reply and an arrow", () => {
    const e = explainReviewMove(review, 2);
    expect(e.facts[0].type).toBe("allows_mate");
    expect(e.text).toMatch(/Qh4#/);
    expect(e.threat).toEqual(["d8", "h4"]);
  });

  it("summarises the game around its turning point", () => {
    const s = summarizeGame(review, "w");
    expect(s).toMatch(/^The turning point was 2\. g4: /);
    expect(s).toMatch(/Qh4#/);
    expect(s).toMatch(/Accuracy 31.2%/);
    expect(summarizeGame(review, "b")).toMatch(/^A clean game/);
    expect(summarizeGame(review, null)).toMatch(/White 31.2%, Black 100%/);
  });
});
