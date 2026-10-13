import { describe, it, expect, vi, afterEach } from "vitest";
import { Chess } from "chess.js";
import { findOpening, OPENINGS } from "../../src/openings.js";
import { allLines, nameFor, lineEval, sharpLines } from "../../src/openingdb.js";
import { detectEvents, pickLineWithEvent, recentMoves } from "../../src/chat.js";
import { personasByLang, getPersona, PERSONAS, LEVELS } from "../../src/personas.js";

afterEach(() => vi.restoreAllMocks());

describe("opening lookup", () => {
  it("returns the longest named line that the moves start with", () => {
    const op = findOpening(["e4", "e5", "Nf3", "Nc6", "Bb5"]);
    expect(op.name).toMatch(/^Ruy Lopez/);
    expect(op.plies).toBe(5);
    expect(findOpening(["e4", "e5", "Nf3", "Nc6", "Bb5", "h6"]).plies).toBe(5);
    expect(findOpening([])).toBeNull();
  });

  it("has 3,704 lines, every one of them legal", () => {
    expect(OPENINGS.length).toBe(3704);
    for (const [, , seq] of OPENINGS) {
      const c = new Chess();
      for (const san of seq.split(" ")) c.move(san);
    }
  });

  it("names a prefix through the explorer helper", () => {
    expect(nameFor(["e4", "c5"])).toBeTruthy();
  });

  // Audit bug 15 (fixed in plan item 3): lines used to share ECO|name keys,
  // so React keys collided and a sibling line's eval was shown.
  it("gives every explorer line a unique key", () => {
    const keys = allLines().map((l) => l.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("only trusts a stored eval for a line whose name key is its own", () => {
    const shared = allLines().find((l) => l.evalShared);
    const own = allLines().find((l) => !l.evalShared);
    const meta = { evals: { [shared.metaKey]: { cp: 50 }, [own.metaKey]: { cp: 20 } } };
    expect(lineEval(meta, shared)).toBeNull();
    expect(lineEval(meta, own)).toEqual({ cp: 20 });
    expect(allLines().filter((l) => l.evalShared).length).toBeGreaterThan(400);
  });
});

describe("sharp lines for engine matches", () => {
  it("recomputes once the metadata arrives instead of keeping an empty pool", () => {
    const before = sharpLines(null);
    const meta = { evals: Object.fromEntries(allLines().filter((l) => !l.evalShared).map((l) => [l.metaKey, { cp: 100 }])) };
    expect(sharpLines(meta).length).toBeGreaterThan(before.length);
  });
});

describe("bot roster", () => {
  it("has 150 bots, 3 per level from 800 to 3200 in each language", () => {
    expect(PERSONAS.length).toBe(150);
    expect(LEVELS[0]).toBe(800);
    expect(LEVELS[LEVELS.length - 1]).toBe(3200);
    for (const lang of ["ro", "en"]) {
      const roster = personasByLang(lang);
      expect(roster.length).toBe(75);
      for (const elo of LEVELS) expect(roster.filter((p) => p.elo === elo).length).toBe(3);
    }
    expect(getPersona("no-such-id")).toBe(PERSONAS[0]);
  });
});

describe("banter events", () => {
  const move = (san, color = "w", extra = {}) => ({ san, color, ...extra });

  it("detects castling, checks, captures and blunders", () => {
    expect(
      detectEvents({ move: move("O-O"), byBot: false, cpBefore: 0, cpAfter: 0, botColor: "b", thinkMs: 0, pieceCount: 32, prevPieceCount: 32 })
    ).toEqual(expect.arrayContaining(["castle", "equal"]));
    const ev = detectEvents({
      move: move("Qxd8+", "w", { captured: "q" }),
      byBot: true,
      cpBefore: 0,
      cpAfter: -600,
      botColor: "w",
      thinkMs: 0,
      pieceCount: 20,
      prevPieceCount: 21,
    });
    expect(ev).toEqual(expect.arrayContaining(["i_blunder", "i_capture", "i_check", "losing"]));
  });

  it("detects the endgame transition and slow moves", () => {
    const ev = detectEvents({ move: move("Kf2"), byBot: false, cpBefore: 0, cpAfter: 0, botColor: "b", thinkMs: 50000, pieceCount: 12, prevPieceCount: 13 });
    expect(ev).toEqual(expect.arrayContaining(["slow_move", "endgame"]));
  });

  it("respects priority and cooldowns", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const persona = { style: { chattiness: 1 }, lines: { castle: ["c1"], you_check: ["k1"] } };
    const cd = {};
    expect(pickLineWithEvent(persona, ["castle", "you_check"], 4, cd)).toEqual({ text: "k1", event: "you_check" });
    expect(pickLineWithEvent(persona, ["you_check"], 8, cd)).toBeNull();
    expect(pickLineWithEvent(persona, ["you_check"], 14, cd)?.event).toBe("you_check");
  });

  it("numbers the recent moves for the optional LLM prompt", () => {
    expect(recentMoves(["e4", "e5", "Nf3", "Nc6"], 3)).toBe("1... e5 2. Nf3 Nc6");
  });
});
