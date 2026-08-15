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
      const r = await engine.analyze(positions[i].fen, { movetime });
      const info = r.lines[0];
      evals.push(info ? cpWhite(info, positions[i].turn) : 0);
      bests.push(info ? { uci: info.move, pv: info.pv } : null);
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
    else if (isBest && isSacrifice(mv, positions[i].fen) && after > 42 && before < 92) cls = "brilliant";
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
  return { evals, moves, accuracy, opening, counts };
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

// Approximate sacrifice check: the move offers material the opponent can
// take profitably next move (or gives up more than it captures).
function isSacrifice(mv, fenBefore) {
  const gave = PIECE_VALUE[mv.piece] || 0;
  const got = mv.captured ? PIECE_VALUE[mv.captured] : 0;
  if (got >= gave || gave < 3) return false;
  // is the moved piece capturable on its destination square?
  const chess = new Chess(fenBefore);
  chess.move({ from: mv.from, to: mv.to, promotion: mv.promotion });
  return chess.moves({ verbose: true }).some((m) => m.to === mv.to && m.captured);
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
