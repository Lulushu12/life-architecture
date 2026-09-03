// Game Review pipeline: evaluate every position, classify every move with
// the win-probability model, compute per-player accuracy, detect the
// opening, and collect blunders as future puzzles.

import { Chess } from "chess.js";
import { cpWhite, winPct } from "./engine.js";
import { findOpening } from "./openings.js";

export const CLASSIFICATIONS = {
  brilliant: { label: "Brilliant", icon: "!!", color: "#26c2a3" },
  best: { label: "Best", icon: "★", color: "#81b64c" },
  excellent: { label: "Excellent", icon: "✓", color: "#81b64c" },
  good: { label: "Good", icon: "✓", color: "#95b776" },
  book: { label: "Book", icon: "📖", color: "#a88865" },
  inaccuracy: { label: "Inaccuracy", icon: "?!", color: "#f0c15c" },
  mistake: { label: "Mistake", icon: "?", color: "#e58f2a" },
  blunder: { label: "Blunder", icon: "??", color: "#e02828" },
};

const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

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
  { startFen = null, movetime = 400, onProgress = () => {}, shouldStop = () => false } = {}
) {
  const chess = startFen ? new Chess(startFen) : new Chess();
  const positions = [{ fen: chess.fen(), turn: chess.turn() }];
  const verbose = [];
  for (const san of sans) {
    const mv = chess.move(san);
    verbose.push(mv);
    positions.push({ fen: chess.fen(), turn: chess.turn() });
  }
  const finalOver = chess.isGameOver();

  await engine.ready;
  const evals = [];
  const bests = [];
  for (let i = 0; i < positions.length; i++) {
    if (shouldStop()) {
      engine.stopCurrent();
      return null;
    }
    const isLast = i === positions.length - 1;
    if (isLast && finalOver) {
      evals.push(terminalCp(chess));
      bests.push(null);
    } else {
      // Two lines, so a "brilliant" can require the move to be clearly better
      // than the alternative rather than merely first in a noisy search.
      const r = await engine.analyze(positions[i].fen, { movetime, multipv: 2 });
      const info = r.lines[0];
      const second = r.lines[1];
      evals.push(info ? cpWhite(info, positions[i].turn) : 0);
      bests.push(
        info
          ? { uci: info.move, pv: info.pv, margin: second ? lineScore(info) - lineScore(second) : Infinity }
          : null
      );
    }
    onProgress((i + 1) / positions.length);
  }

  // classify each move
  const sanSeq = [];
  const moves = [];
  const openingSoFar = [];
  let opening = null;
  const accDrops = { w: [], b: [] };
  for (let i = 0; i < sans.length; i++) {
    const mv = verbose[i];
    const sign = mv.color === "w" ? 1 : -1;
    const before = winPct(evals[i] * sign);
    const after = winPct(evals[i + 1] * sign);
    const drop = Math.max(0, before - after);
    accDrops[mv.color].push(drop);

    sanSeq.push(mv.san);
    const op = findOpening(sanSeq);
    if (op) opening = op;
    const inBook = op != null;
    openingSoFar.push(inBook);

    const bestUci = bests[i]?.uci || null;
    const playedUci = mv.from + mv.to + (mv.promotion || "");
    const isBest = bestUci === playedUci;

    let cls;
    if (inBook && i < 20) cls = "book";
    else if (
      isBest &&
      (bests[i]?.margin ?? 0) >= 50 && // clearly better than the alternative, not search noise
      isSacrifice(mv, positions[i].fen) &&
      after > 42 &&
      before < 92
    )
      cls = "brilliant";
    else if (isBest) cls = "best";
    else if (drop < 2) cls = "excellent";
    else if (drop < 5) cls = "good";
    else if (drop < 10) cls = "inaccuracy";
    else if (drop < 20) cls = "mistake";
    else cls = "blunder";

    moves.push({
      san: mv.san,
      color: mv.color,
      class: cls,
      drop: Math.round(drop * 10) / 10,
      bestUci,
      bestSan: bestUci ? uciToSan(positions[i].fen, bestUci) : null,
      fenBefore: positions[i].fen,
    });
  }

  const accuracy = {
    w: playerAccuracy(accDrops.w),
    b: playerAccuracy(accDrops.b),
  };
  const counts = { w: countClasses(moves, "w"), b: countClasses(moves, "b") };
  // Best line per position (SAN, truncated), so the review browser can show
  // the engine's idea at any move without re-searching.
  const pvs = positions.map((p, i) => (bests[i] ? pvToSans(p.fen, bests[i].pv.slice(0, 6)) : null));
  return { evals, moves, accuracy, opening, counts, pvs };
}

// UCI-perspective score of a parsed info line, mates folded to big numbers.
function lineScore(info) {
  if (info.mate != null) return info.mate > 0 ? 10000 - info.mate : -10000 - info.mate;
  return info.cp;
}

export function pvToSans(fen, pv) {
  const out = [];
  try {
    const c = new Chess(fen);
    for (const uci of pv) {
      const mv = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
      if (!mv) break;
      out.push(mv.san);
    }
  } catch {
    /* truncated pv is fine */
  }
  return out;
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
    .filter((m) => m.color === playerColor && (m.class === "blunder" || m.class === "mistake") && m.bestSan)
    .map((m) => ({
      fen: m.fenBefore,
      bestSan: m.bestSan,
      bestUci: m.bestUci,
      playedSan: m.san,
      ply: m.ply,
      severity: m.class,
    }));
}
