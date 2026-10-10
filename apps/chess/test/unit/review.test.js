import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import {
  reviewGame,
  extractPuzzles,
  withReview,
  keyMoments,
  movePhase,
  phaseAccuracy,
  uciToSan,
  pvToSans,
  regradeReview,
  regradeStore,
  REVIEW_GRADE,
} from "../../src/review.js";
import { FakeEngine, line } from "../fixtures/fakeEngine.js";

// After 1.e4 e5 2.Nf3 Nc6, White to move. Used as a custom start so the
// opening book never applies and every move is judged on the evals alone.
const ITALIAN_FEN = "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";

// plan[i] describes position i (before move i): { cp: White's eval,
// best: engine move in UCI (defaults to the move actually played),
// second: White's eval of the engine's second line }.
function scriptedEngine(startFen, sans, plan) {
  const c = startFen ? new Chess(startFen) : new Chess();
  const fens = [c.fen()];
  const played = [];
  for (const s of sans) {
    const m = c.move(s);
    played.push(m.from + m.to + (m.promotion || ""));
    fens.push(c.fen());
  }
  const index = new Map(fens.map((f, i) => [f, i]));
  return new FakeEngine((fen) => {
    const i = index.get(fen);
    const p = plan[i] || {};
    const sign = fen.split(" ")[1] === "w" ? 1 : -1;
    const legal = new Chess(fen).moves({ verbose: true }).map((m) => m.from + m.to + (m.promotion || ""));
    const best = p.best || played[i] || legal[0];
    const lines = [line(best, (p.cp ?? 0) * sign, { pv: [best] })];
    if (p.second != null) {
      const alt = legal.find((u) => u !== best);
      lines.push(line(alt, p.second * sign, { pv: [alt] }));
    }
    return { lines };
  });
}

describe("reviewGame classification (characterization)", () => {
  const sans = ["Bc4", "Bc5", "c3", "Nf6", "d4", "exd4"];
  const plan = [
    { cp: 30 }, // White plays the engine move
    { cp: 30, best: "g8f6" }, // Black's Bc5 loses a little
    { cp: 50, best: "d2d4" }, // White's c3 is an inaccuracy
    { cp: -40, best: "d7d6" }, // Black's Nf6 blunders
    { cp: 200, best: "f3g5" }, // White misses the punishment
    { cp: 0 }, // Black plays the engine move
    { cp: 0 },
  ];

  it("labels each move from the drop in win chance", async () => {
    const r = await reviewGame(scriptedEngine(ITALIAN_FEN, sans, plan), sans, { startFen: ITALIAN_FEN });
    expect(r.moves.map((m) => m.class)).toEqual(["best", "excellent", "inaccuracy", "blunder", "miss", "best"]);
    expect(r.moves.map((m) => m.drop)).toEqual([0, 1.8, 8.3, 21.3, 17.6, 0]);
  });

  it("records the best move in SAN and the evals per position", async () => {
    const r = await reviewGame(scriptedEngine(ITALIAN_FEN, sans, plan), sans, { startFen: ITALIAN_FEN });
    expect(r.moves[2].bestSan).toBe("d4");
    expect(r.moves[3].bestSan).toBe("d6");
    expect(r.evals).toEqual([30, 30, 50, -40, 200, 0, 0]);
    expect(r.opening).toBeNull();
  });

  it("computes accuracy, counts and phases", async () => {
    const r = await reviewGame(scriptedEngine(ITALIAN_FEN, sans, plan), sans, { startFen: ITALIAN_FEN });
    expect(r.accuracy).toMatchInlineSnapshot(`
      {
        "b": 76.6,
        "w": 71.2,
      }
    `);
    expect(r.counts).toMatchInlineSnapshot(`
      {
        "b": {
          "best": 1,
          "blunder": 1,
          "excellent": 1,
        },
        "w": {
          "best": 1,
          "inaccuracy": 1,
          "miss": 1,
        },
      }
    `);
    expect(r.phases).toMatchInlineSnapshot(`
      {
        "b": {
          "endgame": null,
          "middlegame": null,
          "opening": 76.6,
        },
        "w": {
          "endgame": null,
          "middlegame": null,
          "opening": 71.2,
        },
      }
    `);
  });

  it("returns null when asked to stop", async () => {
    const r = await reviewGame(scriptedEngine(ITALIAN_FEN, sans, plan), sans, {
      startFen: ITALIAN_FEN,
      shouldStop: () => true,
    });
    expect(r).toBeNull();
  });

  it("marks a move with only one legal reply as forced and leaves it out of accuracy", async () => {
    // Black king in check from the queen with exactly one escape square.
    const fen = "7k/8/6Q1/8/8/8/8/K7 w - - 0 1";
    const moves = ["Qh6+", "Kg8"];
    const c = new Chess(fen);
    c.move("Qh6+");
    expect(c.moves()).toEqual(["Kg8"]);
    const r = await reviewGame(scriptedEngine(fen, moves, [{ cp: 900 }, { cp: 900 }, { cp: 900 }]), moves, {
      startFen: fen,
    });
    expect(r.moves[1].class).toBe("forced");
    expect(r.moves[1].forced).toBe(true);
    expect(r.accuracy.b).toBe(100);
  });

  it("labels a best move as great when the alternative is much worse", async () => {
    const moves = ["Bc4"];
    const r = await reviewGame(
      scriptedEngine(ITALIAN_FEN, moves, [{ cp: 30, second: -300 }, { cp: 30 }]),
      moves,
      { startFen: ITALIAN_FEN }
    );
    expect(r.moves[0].class).toBe("great");
  });

  it("scores a checkmate as the final eval without asking the engine", async () => {
    const moves = ["f3", "e5", "g4", "Qh4#"];
    const engine = scriptedEngine(null, moves, []);
    const r = await reviewGame(engine, moves);
    expect(r.evals[r.evals.length - 1]).toBe(-10000);
    // the mated position is never searched (other positions may be searched
    // twice since the verification pass, plan item 17)
    const c = new Chess();
    for (const s of moves) c.move(s);
    expect(engine.calls.some((x) => x.fen === c.fen())).toBe(false);
  });
});

describe("opening book", () => {
  it("labels moves that exactly match a named line as book", async () => {
    const moves = ["e4", "e5", "Nf3", "Nc6", "Bb5"];
    const r = await reviewGame(scriptedEngine(null, moves, []), moves);
    expect(r.opening?.name).toMatch(/Ruy Lopez/);
    expect(r.moves.map((m) => m.class)).toMatchInlineSnapshot(`
      [
        "book",
        "book",
        "book",
        "book",
        "book",
      ]
    `);
  });
});

// Plan item 8b: a named line is a name, not a seal of approval. The lichess
// list includes the Bongcloud, Fool's Mate and trap lines that end in mate.
describe("opening book only for sound moves", () => {
  it("grades a named but bad move on its merits", async () => {
    // 1.e4 e5 2.Ke2, the Bongcloud: a named line, and a real mistake.
    const moves = ["e4", "e5", "Ke2"];
    const r = await reviewGame(scriptedEngine(null, moves, [{ cp: 30 }, { cp: 30 }, { cp: 30, best: "g1f3" }, { cp: -120 }]), moves);
    expect(r.moves.map((m) => m.class)).toEqual(["book", "book", "mistake"]);
  });

  it("never calls a mating move book", async () => {
    const moves = ["f3", "e5", "g4", "Qh4#"];
    const r = await reviewGame(scriptedEngine(null, moves, [{ cp: 20 }, { cp: -10 }, { cp: -10, best: "b1c3" }, { cp: -10000 }]), moves);
    expect(r.moves[2].class).toBe("blunder");
    expect(r.moves[3].class).not.toBe("book");
  });

  it("ends theory at the first mistake by either side", async () => {
    // 1.e4 e5 2.Nf3 Nc6 3.Bb5 are all named lines; here Nc6 is scored a mistake,
    // so Bb5 after it is graded, not called book.
    const moves = ["e4", "e5", "Nf3", "Nc6", "Bb5"];
    const plan = [{ cp: 30 }, { cp: 30 }, { cp: 30 }, { cp: 30, best: "g8f6" }, { cp: 250 }, { cp: 250 }];
    const r = await reviewGame(scriptedEngine(null, moves, plan), moves);
    expect(r.moves.map((m) => m.class)).toEqual(["book", "book", "book", "mistake", "best"]);
    expect(r.opening?.name).toMatch(/Ruy Lopez/); // the name is still shown
  });
});

describe("great moves", () => {
  it("does not call an obvious recapture great", async () => {
    // From the Italian start: 3.Bb5 Nd4 4.Nxd4 exd4, the pawn takes back.
    const moves = ["Bb5", "Nd4", "Nxd4", "exd4"];
    const plan = [{ cp: 30 }, { cp: 30 }, { cp: 30 }, { cp: 30, second: 900 }, { cp: 30 }];
    const r = await reviewGame(scriptedEngine(ITALIAN_FEN, moves, plan), moves, { startFen: ITALIAN_FEN });
    expect(r.moves[3].class).toBe("best");
  });
});

describe("reviews saved under the old rules", () => {
  const BONG = ["e4", "e5", "Ke2"];
  const bongPlan = [{ cp: 30 }, { cp: 30 }, { cp: 30, best: "g1f3" }, { cp: -120 }];
  // What the old rules saved: Ke2 called book, no grade.
  const old = async () => {
    const r = await reviewGame(scriptedEngine(null, BONG, bongPlan), BONG);
    const moves = r.moves.map((m) => ({ ...m, class: "book" }));
    const { grade, ...rest } = r;
    return { ...rest, moves, counts: { w: { book: 2 }, b: { book: 1 } } };
  };

  it("are regraded from their stored evals, without the engine", async () => {
    const fixed = regradeReview(await old(), BONG);
    expect(fixed.moves.map((m) => m.class)).toEqual(["book", "book", "mistake"]);
    expect(fixed.counts.w).toEqual({ book: 1, mistake: 1 });
    expect(fixed.grade).toBe(REVIEW_GRADE);
  });

  it("lose great on a recapture and keep everything else", async () => {
    const moves = ["Bb5", "Nd4", "Nxd4", "exd4"];
    const plan = [{ cp: 30 }, { cp: 30 }, { cp: 30 }, { cp: 30, second: 900 }, { cp: 30 }];
    const r = await reviewGame(scriptedEngine(ITALIAN_FEN, moves, plan), moves, { startFen: ITALIAN_FEN });
    const stale = { ...r, grade: undefined, moves: r.moves.map((m, i) => (i === 3 ? { ...m, class: "great" } : m)) };
    const fixed = regradeReview(stale, moves, ITALIAN_FEN);
    expect(fixed.moves.map((m) => m.class)).toEqual(r.moves.map((m) => m.class));
  });

  it("leaves a current review untouched", async () => {
    const r = await reviewGame(scriptedEngine(null, BONG, bongPlan), BONG);
    expect(regradeReview(r, BONG)).toBe(r);
  });

  it("regrades the whole store and adds the newly found mistakes as puzzles", async () => {
    let n = 0;
    const s = {
      puzzles: [],
      games: [{ id: "g", mode: "bot", playerColor: "w", sans: BONG, startFen: null, review: await old() }],
    };
    const out = regradeStore(s, () => "p" + n++);
    expect(out.games[0].review.moves[2].class).toBe("mistake");
    expect(out.puzzles.map((p) => p.bestUci)).toEqual(["g1f3"]);
    expect(regradeStore(out, () => "x")).toBe(out);
  });
});

// Plan item 17: one quick search can miss a tactic (it called Morphy's
// 15.Bxd7+ in the Opera Game a blunder once in three runs), so a move first
// graded a mistake or worse is checked again with a three times longer search.
describe("verification pass", () => {
  // From the Italian start: White plays Bc4 when the engine prefers Bb5.
  const moves = ["Bc4"];
  const after = (() => {
    const c = new Chess(ITALIAN_FEN);
    c.move("Bc4");
    return c.fen();
  })();
  const engineFor = (deepCp) =>
    new FakeEngine((fen, opts) => {
      if (fen === ITALIAN_FEN) return { lines: [line("f1b5", 30, { pv: ["f1b5"] })] };
      // the quick search misjudges the position after Bc4; a longer one doesn't
      const cp = opts.movetime > 400 ? deepCp : 300; // Black to move: +300 = Black better
      return { lines: [line("g8f6", cp, { pv: ["g8f6"] })] };
    });

  it("re-checks a suspected blunder with a longer search and keeps the deeper verdict", async () => {
    const engine = engineFor(-25);
    const r = await reviewGame(engine, moves, { startFen: ITALIAN_FEN, movetime: 400 });
    expect(r.moves[0].class).not.toMatch(/blunder|mistake/);
    const deep = engine.calls.filter((c) => c.movetime === 1200).map((c) => c.fen);
    expect(deep).toEqual(expect.arrayContaining([ITALIAN_FEN, after]));
    expect(r.evals[1]).toBe(25);
  });

  it("keeps the grade when the longer search agrees", async () => {
    const r = await reviewGame(engineFor(300), moves, { startFen: ITALIAN_FEN, movetime: 400 });
    expect(r.moves[0].class).toBe("blunder");
  });

  it("leaves good moves alone (no extra searches)", async () => {
    const engine = engineFor(-25);
    const quiet = new FakeEngine((fen) => ({ lines: [line(fen === ITALIAN_FEN ? "f1c4" : "g8f6", fen === ITALIAN_FEN ? 30 : -30)] }));
    await reviewGame(quiet, moves, { startFen: ITALIAN_FEN, movetime: 400 });
    expect(quiet.calls.every((c) => c.movetime === 400)).toBe(true);
    expect(engine).toBeTruthy();
  });
});

describe("puzzles from a review", () => {
  const review = {
    moves: [
      { san: "e4", color: "w", class: "best", bestSan: "e4", bestUci: "e2e4", fenBefore: "f0" },
      { san: "f6", color: "b", class: "mistake", bestSan: "e5", bestUci: "e7e5", fenBefore: "f1" },
      { san: "Qh5+", color: "w", class: "blunder", bestSan: "d4", bestUci: "d2d4", fenBefore: "f2" },
      { san: "g6", color: "b", class: "miss", bestSan: "Kf7", bestUci: "e8f7", fenBefore: "f3" },
    ],
    evals: [0, 0, 100, -200, 300],
    accuracy: { w: 50, b: 50 },
    counts: {},
  };

  it("extracts only the player's mistakes, blunders and misses", () => {
    expect(extractPuzzles(review, "b").map((p) => p.playedSan)).toEqual(["f6", "g6"]);
    expect(extractPuzzles(review, "w").map((p) => p.severity)).toEqual(["blunder"]);
  });

  it("adds puzzles once per position and caps the list at 300", () => {
    let n = 0;
    const makeId = () => `p${n++}`;
    const old = Array.from({ length: 299 }, (_, i) => ({ id: `old${i}`, fen: `x${i}`, bestUci: "a1a2" }));
    const s = { puzzles: old, games: [{ id: "g1", mode: "bot", playerColor: "b", review: null }] };
    const once = withReview(s, "g1", review, makeId);
    expect(once.puzzles.length).toBe(300);
    expect(once.puzzles[0].id).toBe("old1");
    expect(once.games[0].review).toBe(review);
    const twice = withReview(once, "g1", review, makeId);
    expect(twice.puzzles.length).toBe(300);
  });

  it("leaves the store alone for an unknown game", () => {
    const s = { puzzles: [], games: [] };
    expect(withReview(s, "missing", review, () => "x")).toBe(s);
  });
});

describe("helpers", () => {
  it("splits phases by ply and material", () => {
    expect(movePhase(5, "anything")).toBe("opening");
    expect(movePhase(30, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")).toBe("middlegame");
    expect(movePhase(30, "8/8/4k3/8/8/3K4/8/7R w - - 0 1")).toBe("endgame");
  });

  it("ignores forced moves in phase accuracy", () => {
    const moves = [
      { color: "w", drop: 0, fenBefore: "" },
      { color: "b", drop: 50, forced: true, fenBefore: "" },
    ];
    expect(phaseAccuracy(moves).b.opening).toBeNull();
    expect(phaseAccuracy(moves).w.opening).toBe(100);
  });

  it("picks the biggest swings as key moments, in game order", () => {
    const review = {
      moves: [
        { san: "a", color: "w", class: "best" },
        { san: "b", color: "b", class: "blunder" },
        { san: "c", color: "w", class: "mistake" },
        { san: "d", color: "b", class: "good" },
      ],
      evals: [0, 0, 600, 300, 300],
    };
    expect(keyMoments(review).map((m) => m.ply)).toEqual([1, 2]);
  });

  it("converts UCI to SAN and stops a PV at the first illegal move", () => {
    const start = new Chess().fen();
    expect(uciToSan(start, "g1f3")).toBe("Nf3");
    expect(uciToSan(start, "e2e5")).toBeNull();
    expect(pvToSans(start, ["e2e4", "e7e5", "e1e3"])).toEqual(["e4", "e5"]);
  });
});
