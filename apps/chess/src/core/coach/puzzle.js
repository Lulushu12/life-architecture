// The coach after a wrong puzzle move (plan item 11): what was wrong with
// the move you tried, then a nudge from the puzzle's theme. Never names the
// solution.

import { Chess } from "chess.js";
import { pvToSans } from "../position.js";
import { moveFacts } from "./facts.js";
import { phrase } from "./phrases.js";

// In priority order: the most telling theme a puzzle has wins.
export const THEME_TIPS = [
  ["mateIn1", "There's a mate in one."],
  ["backRankMate", "Their king is stuck behind its own pawns."],
  ["smotheredMate", "Their king is boxed in by its own pieces."],
  ["mateIn2", "There's a forced mate. Look at every check."],
  ["mateIn3", "There's a forced mate. Look at every check."],
  ["fork", "Look for a move that attacks two things at once."],
  ["pin", "Can you pin a piece to something more valuable behind it?"],
  ["skewer", "Line up an attack on a big piece with another behind it."],
  ["discoveredAttack", "Moving one piece can open an attack by another."],
  ["doubleCheck", "Two pieces can give check at once."],
  ["hangingPiece", "Something of theirs is undefended."],
  ["trappedPiece", "One of their pieces has nowhere to go."],
  ["capturingDefender", "Take out the piece that does the defending."],
  ["deflection", "Pull a defender away from its job."],
  ["attraction", "Lure their king or queen onto a bad square."],
  ["clearance", "Get your own piece out of the way first."],
  ["interference", "Put a piece between two of theirs that protect each other."],
  ["xRayAttack", "Look through a piece to what's behind it."],
  ["intermezzo", "Before the obvious move, is there a stronger one in between?"],
  ["promotion", "A pawn is close to queening."],
  ["underPromotion", "Queening isn't always best."],
  ["sacrifice", "The best move gives something up."],
  ["quietMove", "The answer is neither a check nor a capture."],
  ["defensiveMove", "Deal with their threat first."],
  ["zugzwang", "Make a move that leaves them only bad ones."],
  ["advancedPawn", "That far-advanced pawn is the key."],
];

const ALLOWED = new Set(["allows_mate", "hangs_piece", "allows_fork", "allows_pin", "allows_skewer", "loses_material"]);

/** The theme nudge for a puzzle's themes (array or space-separated), or null. */
export function themeTip(themes) {
  const set = new Set(Array.isArray(themes) ? themes : String(themes || "").split(" "));
  return THEME_TIPS.find(([t]) => set.has(t))?.[1] || null;
}

/**
 * @param p.fen      the position you were solving
 * @param p.played   your move (UCI)
 * @param p.themes   the puzzle's themes
 * @param p.replyPv  the engine's answer to your move (UCI), if it looked
 * @param p.cpAfter  White-perspective eval after your move, if known
 */
export function puzzleTip({ fen, played, themes, replyPv = null, cpAfter = null }) {
  const c = new Chess(fen);
  const me = c.turn();
  let mv;
  try {
    mv = c.move({ from: played.slice(0, 2), to: played.slice(2, 4), promotion: played[4] });
  } catch {
    return themeTip(themes) || "Not that one.";
  }
  const reply = replyPv ? pvToSans(c.fen(), replyPv.slice(0, 6)) : [];
  const sign = me === "w" ? 1 : -1;
  const facts = moveFacts({
    fenBefore: fen,
    san: mv.san,
    color: me,
    cls: "mistake",
    bestSan: null,
    bestLine: [],
    reply,
    evalBefore: 500 * sign, // a puzzle is a winning position
    evalAfter: cpAfter ?? 0,
    ply: 40, // no opening advice inside a puzzle
  });
  const f = facts.find((x) => ALLOWED.has(x.type));
  const first = f ? phrase(f, fen) : reply[0] ? `${mv.san} lets them answer ${reply[0]}.` : `${mv.san} isn't it.`;
  const tip = themeTip(themes);
  return tip ? `${first} ${tip}` : first;
}
