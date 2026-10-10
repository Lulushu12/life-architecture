// The coach during a bot game: decides whether a move is worth a comment
// and words it, from the same facts as Game Review. It speaks up on every
// inaccuracy or worse, on great and brilliant moves, and only now and then
// on a merely good one, so it doesn't nag.

import { Chess } from "chess.js";
import { winPct, cpWhite } from "../../engine.js";
import { classifyDrop } from "../classify.js";
import { pvToSans } from "../position.js";
import { moveFacts } from "./facts.js";
import { phrase } from "./phrases.js";
import { material, other, playLine, NAME } from "./board.js";

const PRAISE_GAP = 6; // plies between two "good move" comments

/**
 * @param p.fenBefore  position before your move
 * @param p.san        your move
 * @param p.bestUci    the engine's move in that position, if known
 * @param p.bestPv     the engine's line from that position (UCI), if known
 * @param p.cpBefore   White-perspective eval before the move
 * @param p.cpAfter    White-perspective eval after it
 * @param p.replyPv    the engine's line after your move (UCI)
 * @param p.ply        0-based ply of the move
 * @param p.lastPraise ply of the last praise comment, or -99
 * @returns {{ text, kind: "warn"|"praise", cls, ply } | null}
 */
export function liveCoachNote(p) {
  const c = new Chess(p.fenBefore);
  let mv;
  try {
    mv = c.move(p.san);
  } catch {
    return null;
  }
  const me = mv.color;
  const sign = me === "w" ? 1 : -1;
  const uci = mv.from + mv.to + (mv.promotion || "");
  const isBest = p.bestUci ? p.bestUci.slice(0, 4) === uci.slice(0, 4) : false;
  const drop = p.cpBefore == null || p.cpAfter == null ? 0 : Math.max(0, winPct(p.cpBefore * sign) - winPct(p.cpAfter * sign));
  const cls = isBest ? "best" : classifyDrop(drop);
  const bestSan = p.bestPv?.length ? pvToSans(p.fenBefore, p.bestPv.slice(0, 1))[0] || null : null;

  const facts = moveFacts({
    fenBefore: p.fenBefore,
    san: p.san,
    color: me,
    cls,
    bestSan,
    bestLine: p.bestPv ? pvToSans(p.fenBefore, p.bestPv.slice(0, 6)) : [],
    reply: p.replyPv ? pvToSans(c.fen(), p.replyPv.slice(0, 6)) : [],
    evalBefore: p.cpBefore,
    evalAfter: p.cpAfter,
    ply: p.ply,
  });
  const top = facts[0];
  if (!top) return null;
  const bad = ["inaccuracy", "mistake", "blunder"].includes(cls);
  if (bad) return { text: phrase(top, p.fenBefore), kind: "warn", cls, ply: p.ply };
  if (top.type === "checkmate") return { text: phrase(top), kind: "praise", cls, ply: p.ply };
  const standout = top.type === "wins_material" || top.type === "praise_great" || top.type === "praise_brilliant";
  if (standout || (cls === "best" && p.ply - (p.lastPraise ?? -99) >= PRAISE_GAP))
    return { text: phrase(top, p.fenBefore), kind: "praise", cls, ply: p.ply };
  return null;
}

// What the engine's line from here is about, for the side to move:
// "mate", "material" (wins at least two points net), or null.
// `prevFen` is the position before the opponent's last move, so taking back
// what they just took doesn't count as winning material.
export function tacticKind(fen, pv, cp, prevFen = null) {
  if (!pv?.length) return null;
  const c = new Chess(fen);
  const me = c.turn();
  if ((cp ?? 0) * (me === "w" ? 1 : -1) >= 9000) return "mate";
  const base = new Chess(prevFen || fen);
  const before = material(base, me) - material(base, other(me));
  // an even number of plies, so the line ends after their answer
  const { chess: end } = playLine(fen, pvToSans(fen, pv.slice(0, 4)), 4);
  const gain = material(end, me) - material(end, other(me)) - before;
  return gain >= 2 ? "material" : null;
}

/**
 * The coach speaking up before your move (coach on): only when there is a
 * tactic for you, and without giving the move away.
 */
export function tacticPrompt(fen, pv, cp, prevFen = null) {
  const kind = tacticKind(fen, pv, cp, prevFen);
  if (kind === "mate") return "There's a forced mate here. Can you find it? Start with checks.";
  if (kind === "material") return "Their last move left something loose. Can you win material?";
  return null;
}

/**
 * First step of a hint: the idea behind the engine's move, without the move.
 * @param fen      position, your move
 * @param bestPv   the engine's line (UCI)
 * @param cp       White-perspective eval of the position
 * @param prevFen  position before the opponent's last move, if any
 */
export function hintIdea(fen, bestPv, cp, prevFen = null) {
  if (!bestPv?.length) return "Look for checks, captures and threats first.";
  const c = new Chess(fen);
  const first = pvToSans(fen, bestPv.slice(0, 1))[0] || "";
  const kind = tacticKind(fen, bestPv, cp, prevFen);
  if (kind === "mate") return "There's a forced mate here. Start with checks.";
  if (kind === "material") return "You can win material here. Look at what's loose.";
  if (first.includes("+")) return "A check is the key. Which one?";
  if (first.includes("x")) return "A capture is the best move here.";
  const piece = c.get(bestPv[0].slice(0, 2));
  if (!piece) return "Look for your most useful move.";
  return `The highlighted ${NAME[piece.type]} has a better square. Where does it do the most?`;
}

// Win% a move may give away before the blunder check steps in: a piece,
// not a pawn, at an even position.
export const BLUNDER_CHECK_DROP = 15;

/**
 * The blunder check: would this move give a lot away? Returns a nudge that
 * points where to look without naming the reply, or null.
 * @returns {{ text, squares: string[], drop } | null}
 */
export function blunderCheck({ fenBefore, san, cpBefore, cpAfter, replyPv, ply = 0 }) {
  if (cpBefore == null || cpAfter == null || san.endsWith("#")) return null;
  const c = new Chess(fenBefore);
  const me = c.turn();
  const sign = me === "w" ? 1 : -1;
  const drop = winPct(cpBefore * sign) - winPct(cpAfter * sign);
  if (drop < BLUNDER_CHECK_DROP) return null;
  try {
    c.move(san);
  } catch {
    return null;
  }
  const facts = moveFacts({
    fenBefore,
    san,
    color: me,
    cls: classifyDrop(drop),
    bestSan: null,
    bestLine: [],
    reply: replyPv ? pvToSans(c.fen(), replyPv.slice(0, 6)) : [],
    evalBefore: cpBefore,
    evalAfter: cpAfter,
    ply,
  });
  const f = facts.find((x) => !x.type.startsWith("generic_")) || null;
  const theirs = (t) => (t ? `their ${NAME[t]}` : "their pieces");
  let text;
  let squares = [];
  switch (f?.type) {
    case "allows_mate":
      text = "Look at every check they would have after this.";
      break;
    case "hangs_piece":
      text = `Is your ${NAME[f.piece]} on ${f.square} safe? Look at ${theirs(f.by)} first.`;
      squares = [f.square];
      break;
    case "allows_fork":
      text = `Look at where ${theirs(f.by)} could go next.`;
      break;
    case "allows_pin":
    case "allows_skewer":
      text = `Look along the lines ${theirs(f.by)} could use.`;
      break;
    case "loses_material":
      text = "Count the captures first: this loses material.";
      break;
    default:
      text = "Take another look: this gives a lot away.";
  }
  return { text, squares, drop: Math.round(drop * 10) / 10 };
}

/** White-perspective score of an engine line, for callers that hold raw lines. */
export const lineCp = (line, turn) => (line ? cpWhite(line, turn) : null);
