// Board arithmetic the coach needs: material, static exchange on a square,
// who attacks what, and lines through a square for pins and skewers.

import { Chess } from "chess.js";

export const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
export const NAME = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };
const FILES = "abcdefgh";

export const other = (c) => (c === "w" ? "b" : "w");

/** Material of one side, in pawns. */
export function material(chess, color) {
  let sum = 0;
  for (const row of chess.board()) for (const p of row) if (p && p.color === color) sum += VALUE[p.type];
  return sum;
}

/** Every piece of `color` as {square, type, color}. */
export function piecesOf(chess, color) {
  const out = [];
  for (const row of chess.board()) for (const p of row) if (p && p.color === color) out.push(p);
  return out;
}

/**
 * Static exchange on `sq` for the side to move: the material it can net by
 * capturing there first, each side free to stop. Legal moves only, so pins
 * are respected. Never negative.
 */
export function swapOff(chess, sq, depth = 0) {
  if (depth > 10) return 0;
  const caps = chess.moves({ verbose: true }).filter((m) => m.to === sq && m.captured);
  if (!caps.length) return 0;
  const m = caps.reduce((a, b) => (VALUE[a.piece] <= VALUE[b.piece] ? a : b));
  chess.move(m);
  const gain = VALUE[m.captured] - swapOff(chess, sq, depth + 1);
  chess.undo();
  return Math.max(0, gain);
}

/**
 * Pieces of `color` the side to move can win outright in `fen` (the other
 * side must be to move), biggest gain first.
 */
export function hangingPieces(fen, color) {
  const c = new Chess(fen);
  if (c.turn() === color) return [];
  const out = [];
  for (const p of piecesOf(c, color)) {
    if (p.type === "k") continue;
    const gain = swapOff(c, p.square);
    if (gain > 0) {
      const takers = c.attackers(p.square, other(color));
      out.push({ square: p.square, type: p.type, gain, from: cheapest(c, takers) });
    }
  }
  return out.sort((a, b) => b.gain - a.gain || VALUE[b.type] - VALUE[a.type]);
}

function cheapest(chess, squares) {
  let best = null;
  for (const s of squares) {
    const p = chess.get(s);
    if (p && (!best || VALUE[p.type] < VALUE[chess.get(best).type])) best = s;
  }
  return best;
}

/** Squares holding `color`'s pieces that the piece on `from` attacks. */
export function targetsOf(chess, from, color) {
  const attacker = chess.get(from);
  if (!attacker) return [];
  return piecesOf(chess, color)
    .filter((p) => chess.attackers(p.square, attacker.color).includes(from))
    .map((p) => p.square);
}

const RAYS = {
  r: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  b: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
};
RAYS.q = [...RAYS.r, ...RAYS.b];

/**
 * Pins and skewers by the slider on `from` against `color`: along each line,
 * the first piece hit and the one behind it, both `color`'s. A pin when the
 * one behind is worth more (or is the king), a skewer when the front one is.
 */
export function lineTactics(chess, from, color) {
  const slider = chess.get(from);
  if (!slider || !RAYS[slider.type]) return [];
  const out = [];
  const f0 = FILES.indexOf(from[0]);
  const r0 = Number(from[1]);
  for (const [df, dr] of RAYS[slider.type]) {
    const hit = [];
    let f = f0 + df;
    let r = r0 + dr;
    while (f >= 0 && f < 8 && r >= 1 && r <= 8 && hit.length < 2) {
      const sq = FILES[f] + r;
      const p = chess.get(sq);
      if (p) {
        if (p.color !== color) break;
        hit.push({ square: sq, type: p.type });
      }
      f += df;
      r += dr;
    }
    if (hit.length < 2) continue;
    const [front, back] = hit;
    const worth = (t) => (t === "k" ? 100 : VALUE[t]);
    if (worth(back.type) > worth(front.type) && worth(front.type) >= 3) out.push({ kind: "pin", front, back });
    else if (worth(front.type) > worth(back.type) && worth(back.type) >= 3) out.push({ kind: "skewer", front, back });
  }
  return out;
}

/** Plays SAN moves from `fen`, stopping at the first that fails. */
export function playLine(fen, sans, max = sans.length) {
  const c = new Chess(fen);
  const played = [];
  for (const san of sans.slice(0, max)) {
    try {
      played.push(c.move(san));
    } catch {
      break;
    }
  }
  return { chess: c, played };
}
