// Positions and moves: the small chess.js helpers every screen needs.

import { Chess } from "chess.js";

/** A chess.js game at `plies` moves into `sans` (all of them by default). */
export function replay(startFen, sans, plies = sans.length) {
  const c = startFen ? new Chess(startFen) : new Chess();
  for (let i = 0; i < plies; i++) c.move(sans[i]);
  return c;
}

/** FEN after `plies` moves; plies 0 is the start position. */
export function fenAt(startFen, sans, plies = sans.length) {
  return replay(startFen, sans, plies).fen();
}

/** Legal destinations per origin square, the shape Board's `dests` takes. */
export function legalDests(chess) {
  const map = new Map();
  for (const m of chess.moves({ verbose: true })) {
    if (!map.has(m.from)) map.set(m.from, []);
    map.get(m.from).push(m.to);
  }
  return map;
}

/** Board's `needsPromotion` callback for a position. */
export function promotionCheck(chess) {
  return (from, to) => {
    const piece = chess.get(from);
    return piece?.type === "p" && (to[1] === "8" || to[1] === "1");
  };
}

/** UCI string of a chess.js verbose move. */
export function uciOf(move) {
  return move.from + move.to + (move.promotion || "");
}

/** chess.js move object from a UCI string, or null when it is illegal. */
export function moveFromUci(fen, uci) {
  try {
    return new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  } catch {
    return null;
  }
}

/** The last move played, as [from, to], or null. */
export function lastMovePair(chess) {
  const h = chess.history({ verbose: true });
  const m = h[h.length - 1];
  return m ? [m.from, m.to] : null;
}

/** Square of the side-to-move's king when it is in check, else null. */
export function checkedKingSquare(chess) {
  if (!chess.inCheck()) return null;
  for (const row of chess.board())
    for (const sq of row) if (sq && sq.type === "k" && sq.color === chess.turn()) return sq.square;
  return null;
}

/** Plies played before a FEN's position (0 for the normal start). */
export function startPly(fen) {
  if (!fen) return 0;
  const parts = fen.split(" ");
  return (Math.max(1, parseInt(parts[5], 10) || 1) - 1) * 2 + (parts[1] === "b" ? 1 : 0);
}

/** UCI moves to SAN from `fen`, stopping at the first illegal one. */
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

const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
/** White's material minus Black's, in pawns. */
export function materialBalance(fen) {
  let sum = 0;
  for (const ch of String(fen).split(" ")[0]) {
    const v = PIECE_VALUE[ch.toLowerCase()];
    if (v) sum += ch === ch.toUpperCase() ? v : -v;
  }
  return sum;
}

