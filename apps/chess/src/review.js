// Game Review pipeline: evaluate every position, classify every move with
// the win-probability model, compute per-player accuracy, detect the
// opening, and collect blunders as future puzzles.

import { Chess } from "chess.js";
import { cpWhite, winPct } from "./engine.js";
import { findOpening } from "./openings.js";
import { classifyDrop } from "./core/classify.js";
import { pvToSans } from "./core/position.js";

export { pvToSans };

export const CLASSIFICATIONS = {
  brilliant: { label: "Brilliant", icon: "!!", color: "#b18cf2" },
  great: { label: "Great", icon: "!", color: "#4da3e0" },
  best: { label: "Best", icon: "★", color: "#5fae6e" },
  excellent: { label: "Excellent", icon: "✓", color: "#7fc08a" },
  good: { label: "Good", icon: "✓", color: "#9aab8f" },
  book: { label: "Book", icon: "📖", color: "#c9ae7c" },
  forced: { label: "Forced", icon: "□", color: "#9a948c" },
  inaccuracy: { label: "Inaccuracy", icon: "?!", color: "#f0c15c" },
  mistake: { label: "Mistake", icon: "?", color: "#e58f2a" },
  blunder: { label: "Blunder", icon: "??", color: "#e02828" },
  miss: { label: "Miss", icon: "✗", color: "#ee6b55" },
};

export const CLASS_ORDER = [
  "brilliant", "great", "best", "excellent", "good", "book", "forced", "inaccuracy", "mistake", "miss", "blunder",
];

const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

// A move in a named line is only "book" when it is also sound: the lichess
// list names traps, jokes and mates too (the Bongcloud, Fool's Mate).
const BOOK_MAX_DROP = 5; // win% a book move may give away (good or better)
const THEORY_ENDS_AT = 10; // the first mistake by either side ends the book
const BOOK_PLIES = 20;

// Reviews saved before grade 2 called named-but-bad moves book and every
// recapture great; regradeReview() fixes them from their stored evals.
export const REVIEW_GRADE = 2;

// Feed it each move in order; says which named line the game is in and
// whether this move counts as book.
function bookJudge(startFen) {
  const seq = [];
  let theory = true;
  return (san, drop) => {
    seq.push(san);
    const op = startFen ? null : findOpening(seq);
    const book =
      theory && seq.length <= BOOK_PLIES && op != null && op.plies === seq.length && drop < BOOK_MAX_DROP && !san.endsWith("#");
    if (drop >= THEORY_ENDS_AT) theory = false;
    return { op, book };
  };
}

// Taking back on the square just captured on: usually the only move, but
// obvious, so it doesn't earn "great".
const isRecapture = (prev, mv) => !!(prev?.captured && mv.captured && mv.to === prev.to);

/**
 * Reviews a game. sans: array of SAN moves from startFen (default startpos).
 * Returns { evals, moves, accuracy, opening, counts } where:
 *  evals[i] = white-perspective cp of position before move i (length n+1)
 *  moves[i] = { san, class, bestSan, bestUci, drop, fenBefore }
 */
// `shouldStop` is polled between positions so a caller that navigates away
// mid-review can abandon it: a full-game pass is one engine search per ply,
// which otherwise keeps Stockfish at full CPU producing results nobody reads.
// Returns null when abandoned.
export async function reviewGame(
  engine,
  sans,
  { startFen = null, movetime = 400, onProgress = () => {}, shouldStop = () => false, tag = null } = {}
) {
  const chess = startFen ? new Chess(startFen) : new Chess();
  const positions = [{ fen: chess.fen(), turn: chess.turn(), legal: chess.moves().length }];
  const verbose = [];
  for (const san of sans) {
    const mv = chess.move(san);
    verbose.push(mv);
    positions.push({ fen: chess.fen(), turn: chess.turn(), legal: chess.moves().length });
  }
  const finalOver = chess.isGameOver();

  await engine.ready;
  const evals = [];
  const bests = [];
  for (let i = 0; i < positions.length; i++) {
    if (shouldStop()) return null;
    const isLast = i === positions.length - 1;
    if (isLast && finalOver) {
      evals.push(terminalCp(chess));
      bests.push(null);
    } else {
      // Two lines, so a "brilliant" can require the move to be clearly better
      // than the alternative rather than merely first in a noisy search.
      const r = await engine.analyze(positions[i].fen, { movetime, multipv: 2, tag });
      if (r.cancelled || shouldStop()) return null;
      const info = r.lines[0];
      const second = r.lines[1];
      evals.push(info ? cpWhite(info, positions[i].turn) : 0);
      bests.push(
        info
          ? {
              uci: info.move,
              pv: info.pv,
              margin: second ? lineScore(info) - lineScore(second) : Infinity,
              secondCp: second ? cpWhite(second, positions[i].turn) : null,
            }
          : null
      );
    }
    onProgress((i + 1) / positions.length);
  }

  // classify each move
  const judge = bookJudge(startFen);
  const moves = [];
  let opening = null;
  const accDrops = { w: [], b: [] };
  for (let i = 0; i < sans.length; i++) {
    const mv = verbose[i];
    const sign = mv.color === "w" ? 1 : -1;
    const before = winPct(evals[i] * sign);
    const after = winPct(evals[i + 1] * sign);
    const drop = Math.max(0, before - after);
    const forced = positions[i].legal === 1;
    if (!forced) accDrops[mv.color].push(drop);

    const { op, book: inBook } = judge(mv.san, drop);
    if (op) opening = op;
    const recapture = isRecapture(verbose[i - 1], mv);

    const bestUci = bests[i]?.uci || null;
    const playedUci = mv.from + mv.to + (mv.promotion || "");
    const isBest = bestUci === playedUci;

    const secondWin = bests[i]?.secondCp != null ? winPct(bests[i].secondCp * sign) : null;
    const prevBlunder = i > 0 && moves[i - 1].class === "blunder";

    let cls;
    if (inBook) cls = "book";
    else if (forced) cls = "forced";
    else if (
      isBest &&
      (bests[i]?.margin ?? 0) >= 50 && // clearly better than the alternative, not search noise
      isSacrifice(mv, positions[i].fen) &&
      after > 42 &&
      before < 92
    )
      cls = "brilliant";
    else if (isBest && !recapture && secondWin != null && before - secondWin >= 10) cls = "great";
    else if (isBest) cls = "best";
    else if (prevBlunder && drop >= 10) cls = "miss";
    else cls = classifyDrop(drop);

    moves.push({
      san: mv.san,
      color: mv.color,
      class: cls,
      drop: Math.round(drop * 10) / 10,
      bestUci,
      bestSan: bestUci ? uciToSan(positions[i].fen, bestUci) : null,
      fenBefore: positions[i].fen,
      ...(forced ? { forced: true } : {}),
    });
  }

  const accuracy = {
    w: playerAccuracy(accDrops.w),
    b: playerAccuracy(accDrops.b),
  };
  const counts = { w: countClasses(moves, "w"), b: countClasses(moves, "b") };
  const phases = phaseAccuracy(moves);
  // Best line per position (SAN, up to 12 plies), so the review browser can
  // show the engine's idea at any move without re-searching, and the coach
  // can see material won or lost a few moves on (plan item 16).
  const pvs = positions.map((p, i) => (bests[i] ? pvToSans(p.fen, bests[i].pv.slice(0, 12)) : null));
  return { evals, moves, accuracy, opening, counts, pvs, phases, grade: REVIEW_GRADE };
}

/**
 * Brings a review saved under older grading rules up to date, from what it
 * stored (no engine needed). Moves no longer book get the grade their drop
 * earns ("best" when they were the engine's move); recaptures lose "great".
 * Great and brilliant can't be newly awarded: the second line wasn't stored.
 */
export function regradeReview(review, sans, startFen = null) {
  if ((review.grade || 1) >= REVIEW_GRADE) return review;
  const c = startFen ? new Chess(startFen) : new Chess();
  const judge = bookJudge(startFen);
  const moves = [];
  let prev = null;
  for (let i = 0; i < review.moves.length; i++) {
    const m = review.moves[i];
    let mv;
    try {
      mv = c.move(sans[i]);
    } catch {
      return { ...review, grade: REVIEW_GRADE }; // moves don't match: leave the grades alone
    }
    const drop = m.drop || 0;
    const { book } = judge(mv.san, drop);
    const isBest = m.bestUci === mv.from + mv.to + (mv.promotion || "");
    const prevBlunder = i > 0 && moves[i - 1].class === "blunder";
    const byDrop = prevBlunder && drop >= 10 ? "miss" : classifyDrop(drop);
    let cls = m.class;
    if (cls === "book" && !book) cls = m.forced ? "forced" : isBest ? "best" : byDrop;
    else if (cls === "great" && isRecapture(prev, mv)) cls = "best";
    // a move after a newly exposed blunder can become a miss (and back);
    // otherwise keep the stored grade, which used the unrounded drop
    else if (cls === "miss" && !prevBlunder) cls = classifyDrop(drop);
    else if (prevBlunder && drop >= 10 && ["inaccuracy", "mistake", "blunder"].includes(cls)) cls = "miss";
    moves.push(cls === m.class ? m : { ...m, class: cls });
    prev = mv;
  }
  return {
    ...review,
    moves,
    counts: { w: countClasses(moves, "w"), b: countClasses(moves, "b") },
    grade: REVIEW_GRADE,
  };
}

/** Regrades every saved review that needs it; new puzzles come with it. */
export function regradeStore(s, makeId) {
  let out = s;
  for (const g of s.games)
    if (g.review && (g.review.grade || 1) < REVIEW_GRADE)
      out = withReview(out, g.id, regradeReview(g.review, g.sans, g.startFen), makeId);
  return out;
}

// UCI-perspective score of a parsed info line, mates folded to big numbers.
function lineScore(info) {
  if (info.mate != null) return info.mate > 0 ? 10000 - info.mate : -10000 - info.mate;
  return info.cp;
}

function terminalCp(chess) {
  if (chess.isCheckmate()) return chess.turn() === "w" ? -10000 : 10000;
  return 0; // stalemate/draw
}

// lichess's published accuracy curve, averaged over the player's moves.
function playerAccuracy(drops) {
  if (!drops.length) return 100;
  const per = drops.map((d) => Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * d) - 3.1669)));
  return Math.round((per.reduce((a, b) => a + b, 0) / per.length) * 10) / 10;
}

export const PHASES = [
  ["opening", "Opening"],
  ["middlegame", "Middlegame"],
  ["endgame", "Endgame"],
];

export function movePhase(ply, fenBefore) {
  if (ply < 20) return "opening";
  const pieces = String(fenBefore || "").split(" ")[0].replace(/[^a-zA-Z]/g, "").length;
  return pieces > 12 ? "middlegame" : "endgame";
}

export function phaseAccuracy(moves) {
  const drops = { w: {}, b: {} };
  moves.forEach((m, i) => {
    if (m.forced || m.class === "forced") return;
    const ph = movePhase(i, m.fenBefore);
    (drops[m.color][ph] ||= []).push(m.drop || 0);
  });
  const out = { w: {}, b: {} };
  for (const c of ["w", "b"])
    for (const [ph] of PHASES) out[c][ph] = drops[c][ph]?.length ? playerAccuracy(drops[c][ph]) : null;
  return out;
}

export function keyMoments(review, n = 3) {
  const out = review.moves.map((m, i) => {
    const sign = m.color === "w" ? 1 : -1;
    const swing = winPct(review.evals[i] * sign) - winPct(review.evals[i + 1] * sign);
    return { ply: i, san: m.san, color: m.color, cls: m.class, swing };
  });
  return out
    .filter((m) => m.swing >= 5)
    .sort((a, b) => b.swing - a.swing)
    .slice(0, n)
    .sort((a, b) => a.ply - b.ply);
}

function countClasses(moves, color) {
  const out = {};
  for (const m of moves) if (m.color === color) out[m.class] = (out[m.class] || 0) + 1;
  return out;
}

// Genuine sacrifice check: the move must offer at least an exchange's worth
// of material (rules out pawn nudges and even trades), and the opponent must
// be able to actually WIN material by taking — settled by a swap-off on the
// destination square, not by "some capture exists" (which crowned routine
// captures of defended pieces as sacrifices).
function isSacrifice(mv, fenBefore) {
  const gave = PIECE_VALUE[mv.piece] || 0;
  const got = mv.captured ? PIECE_VALUE[mv.captured] : 0;
  if (gave - got < 2) return false;
  const chess = new Chess(fenBefore);
  chess.move({ from: mv.from, to: mv.to, promotion: mv.promotion });
  return swapOff(chess, mv.to, 0) > 0;
}

// Static exchange on `sq`, side to move first, via legal moves (so pins are
// respected). Returns the best material the side to move can net there —
// each side may decline, so the result is never negative. Captures on one
// square are naturally bounded, but cap the depth defensively.
function swapOff(chess, sq, depth) {
  if (depth > 10) return 0;
  const caps = chess.moves({ verbose: true }).filter((m) => m.to === sq && m.captured);
  if (caps.length === 0) return 0;
  // capture with the cheapest attacker first, the standard swap-off order
  const m = caps.reduce((a, b) => (PIECE_VALUE[a.piece] <= PIECE_VALUE[b.piece] ? a : b));
  chess.move(m);
  const gain = PIECE_VALUE[m.captured] - swapOff(chess, sq, depth + 1);
  chess.undo();
  return Math.max(0, gain);
}

export function uciToSan(fen, uci) {
  try {
    const chess = new Chess(fen);
    const mv = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    return mv.san;
  } catch {
    return null;
  }
}

// Blunder-puzzle extraction from a finished review, for the player's color.
export function extractPuzzles(review, playerColor) {
  return review.moves
    .map((m, i) => ({ ...m, ply: i }))
    .filter((m) => m.color === playerColor && (m.class === "blunder" || m.class === "mistake" || m.class === "miss") && m.bestSan)
    .map((m) => ({
      fen: m.fenBefore,
      bestSan: m.bestSan,
      bestUci: m.bestUci,
      playedSan: m.san,
      ply: m.ply,
      severity: m.class,
    }));
}

export function withReview(s, gameId, result, makeId) {
  const game = s.games.find((g) => g.id === gameId);
  if (!game) return s;
  const puzzles = [...s.puzzles];
  const playerColor = game.mode === "bot" || game.mode === "import" ? game.playerColor : null;
  if (playerColor) {
    for (const p of extractPuzzles(result, playerColor)) {
      if (!puzzles.some((x) => x.fen === p.fen && x.bestUci === p.bestUci))
        puzzles.push({ ...p, id: makeId(), gameId, date: Date.now(), solved: false });
    }
  }
  return {
    ...s,
    puzzles: puzzles.slice(-300),
    games: s.games.map((x) => (x.id === gameId ? { ...x, review: result } : x)),
  };
}
