import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import {
  replay,
  fenAt,
  legalDests,
  promotionCheck,
  uciOf,
  moveFromUci,
  lastMovePair,
  checkedKingSquare,
  startPly,
  pvToSans,
} from "../../src/core/position.js";
import { classifyDrop } from "../../src/core/classify.js";
import { threatsFromProbe } from "../../src/core/threats.js";
import { findOpening, OPENINGS } from "../../src/openings.js";
import { line } from "../fixtures/fakeEngine.js";

describe("position helpers", () => {
  it("replays moves from the start or a FEN", () => {
    expect(replay(null, ["e4", "e5"]).fen()).toBe(new Chess("rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2").fen());
    expect(fenAt(null, ["e4", "e5", "Nf3"], 1)).toMatch(/^rnbqkbnr\/pppppppp\/8\/8\/4P3/);
    const fen = "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1";
    expect(replay(fen, ["e4"]).turn()).toBe("b");
  });

  it("maps legal destinations by origin square", () => {
    const d = legalDests(new Chess());
    expect(d.get("e2")).toEqual(["e3", "e4"]);
    expect(d.get("g1").sort()).toEqual(["f3", "h3"]);
    expect(d.has("e1")).toBe(false);
  });

  it("detects promotions and converts moves", () => {
    const c = new Chess("8/4P3/8/8/8/8/8/k6K w - - 0 1");
    expect(promotionCheck(c)("e7", "e8")).toBe(true);
    expect(promotionCheck(c)("h1", "h2")).toBe(false);
    const m = c.move({ from: "e7", to: "e8", promotion: "n" });
    expect(uciOf(m)).toBe("e7e8n");
    expect(moveFromUci(new Chess().fen(), "e2e4").san).toBe("e4");
    expect(moveFromUci(new Chess().fen(), "e2e5")).toBeNull();
  });

  it("finds the last move, the checked king and the starting ply", () => {
    const c = replay(null, ["f3", "e5", "g4", "Qh4#"]);
    expect(lastMovePair(c)).toEqual(["d8", "h4"]);
    expect(checkedKingSquare(c)).toBe("e1");
    expect(checkedKingSquare(new Chess())).toBeNull();
    expect(lastMovePair(new Chess())).toBeNull();
    expect(startPly(null)).toBe(0);
    expect(startPly("4k3/8/8/8/8/8/4P3/4K3 b - - 0 12")).toBe(23);
    expect(pvToSans(new Chess().fen(), ["d2d4", "d7d5", "a1a5"])).toEqual(["d4", "d5"]);
  });
});

describe("move quality bands", () => {
  it("keeps the thresholds Game Review has always used", () => {
    expect([0, 1.99, 2, 4.99, 5, 9.99, 10, 19.99, 20, 80].map(classifyDrop)).toEqual([
      "excellent", "excellent", "good", "good", "inaccuracy", "inaccuracy", "mistake", "mistake", "blunder", "blunder",
    ]);
  });
});

describe("threat probe", () => {
  // Real position: White to move, eval +0.30. The probe hands the move to Black.
  const nullTurn = "b";

  it("reports a line that would cost the side to move real winning chances", () => {
    // Black's free move would swing the eval to -3.00 for White
    const lines = [line("d8h4", 300), line("f8c5", 260)];
    expect(threatsFromProbe(lines, nullTurn, 30)).toEqual([["d8", "h4"], ["f8", "c5"]]);
  });

  it("ignores harmless ideas, which the old filter always showed", () => {
    // Black's best free move only nudges the eval from +0.30 to +0.10
    const lines = [line("a7a6", -10), line("h7h6", -20)];
    expect(threatsFromProbe(lines, nullTurn, 30)).toEqual([]);
  });

  it("keeps only lines close to the opponent's best idea", () => {
    const lines = [line("d8h4", 600), line("f8c5", 300)];
    expect(threatsFromProbe(lines, nullTurn, 0)).toEqual([["d8", "h4"]]);
  });

  it("shows nothing until the current evaluation is known", () => {
    expect(threatsFromProbe([line("d8h4", 600)], nullTurn, null)).toEqual([]);
  });

  it("works for Black to move as well", () => {
    // Real position: Black to move at -0.20 (White-perspective); White's free move wins a piece
    expect(threatsFromProbe([line("c4f7", 350)], "w", -20)).toEqual([["c4", "f7"]]);
  });
});

// The linear scan findOpening used before it was indexed, kept as the reference.
function referenceFindOpening(sans) {
  let best = null;
  for (const [eco, name, seq] of OPENINGS) {
    const toks = seq.split(" ");
    if (toks.length > sans.length) continue;
    let ok = true;
    for (let i = 0; i < toks.length; i++) if (toks[i] !== sans[i]) { ok = false; break; }
    if (ok && (!best || toks.length > best.plies)) best = { eco, name, plies: toks.length };
  }
  return best;
}

describe("opening lookup index", () => {
  it("returns exactly what the linear scan returned, for every 9th line and its extensions", () => {
    for (const [, , seq] of OPENINGS.filter((_, i) => i % 9 === 0)) {
      const toks = seq.split(" ");
      for (const sans of [toks, toks.slice(0, -1), [...toks, "a6"], toks.slice(0, 1)]) {
        expect(findOpening(sans)).toEqual(referenceFindOpening(sans));
      }
    }
    expect(findOpening(["a3", "h6", "a4"])).toEqual(referenceFindOpening(["a3", "h6", "a4"]));
  });
});
