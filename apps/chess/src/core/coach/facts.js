// Facts about one move: what it allowed, what it missed, what it got right.
// Every fact is plain data (squares, pieces, moves), so the same facts can be
// worded by the templates in phrases.js or, later, by an optional language
// model that is never asked to judge the position itself.

import { Chess } from "chess.js";
import { VALUE, other, material, hangingPieces, targetsOf, lineTactics, playLine } from "./board.js";

const MATE = 9000;
const BAD = new Set(["inaccuracy", "mistake", "blunder", "miss"]);

// Material swing for `color` along a SAN line from `fen`, and the first of
// `color`'s pieces captured on the way.
function lineSwing(fen, sans, color, max = 6) {
  const start = new Chess(fen);
  const before = material(start, color) - material(start, other(color));
  const { chess, played } = playLine(fen, sans, max);
  const after = material(chess, color) - material(chess, other(color));
  const lost = played.find((m) => m.captured && m.color !== color);
  const won = played.find((m) => m.captured && m.color === color);
  return { change: after - before, lost, won, played };
}

const sign = (color) => (color === "w" ? 1 : -1);
const mateIn = (cp) => 10000 - Math.abs(cp);

/**
 * @param m.fenBefore  position before the move
 * @param m.san        the move played
 * @param m.color      the side that played it
 * @param m.cls        its classification from Game Review
 * @param m.bestSan    the engine's move in the position before
 * @param m.bestLine   the engine's line from the position before (SAN)
 * @param m.reply      the engine's line after the move, the opponent's best answer first (SAN)
 * @param m.evalBefore White-perspective eval before the move
 * @param m.evalAfter  White-perspective eval after it
 * @param m.ply        0-based ply of the move in the game
 * @param m.prevFenBefore position before the opponent's previous move, when
 *                     known; a capture is only "winning" if it comes out
 *                     ahead of where things stood before that move
 */
export function moveFacts(m) {
  const facts = [];
  const c = new Chess(m.fenBefore);
  let mv;
  try {
    mv = c.move(m.san);
  } catch {
    return facts;
  }
  const fenAfter = c.fen();
  const me = m.color || mv.color;
  const before = (m.evalBefore ?? 0) * sign(me);
  const after = (m.evalAfter ?? 0) * sign(me);
  const reply = m.reply || [];
  const isBest = m.bestSan ? m.bestSan === m.san : false;

  if (c.isCheckmate()) return [{ type: "checkmate", priority: 200 }];

  if (BAD.has(m.cls)) {
    // What the move allowed
    if (after <= -MATE) facts.push({ type: "allows_mate", priority: 100, n: mateIn(after), reply: reply[0] || null });

    const hanging = hangingPieces(fenAfter, me);
    let replyMove = null;
    try {
      replyMove = reply[0] ? new Chess(fenAfter).move(reply[0]) : null;
    } catch {
      replyMove = null;
    }
    const takenNow = replyMove?.captured ? hanging.find((h) => h.square === replyMove.to) : null;
    const hang = takenNow || hanging.find((h) => h.gain >= 2);
    if (hang) {
      facts.push({
        type: "hangs_piece",
        priority: 90,
        piece: hang.type,
        square: hang.square,
        gain: hang.gain,
        free: hang.gain >= VALUE[hang.type],
        moved: hang.square === mv.to,
        by: takenNow ? replyMove.piece : hang.from ? new Chess(fenAfter).get(hang.from)?.type || null : null,
        reply: takenNow ? reply[0] : null,
      });
    }

    if (replyMove) {
      const afterReply = new Chess(fenAfter);
      afterReply.move(reply[0]);
      const targets = targetsOf(afterReply, replyMove.to, me)
        .map((sq) => ({ square: sq, type: afterReply.get(sq).type }))
        .filter((t) => t.type === "k" || VALUE[t.type] >= 3);
      if (targets.length >= 2)
        facts.push({ type: "allows_fork", priority: 85, by: replyMove.piece, square: replyMove.to, targets, reply: reply[0] });
      const tactic = lineTactics(afterReply, replyMove.to, me)[0];
      if (tactic) facts.push({ type: `allows_${tactic.kind}`, priority: 80, by: replyMove.piece, front: tactic.front, back: tactic.back, reply: reply[0] });
    }

    if (reply.length && !hang) {
      const swing = lineSwing(fenAfter, reply, me);
      if (swing.change <= -2 && swing.lost)
        facts.push({ type: "loses_material", priority: 75, piece: swing.lost.captured, square: swing.lost.to, line: swing.played.map((x) => x.san).slice(0, 4) });
    }

    // What the move missed
    if (before >= MATE && !isBest && m.bestSan) facts.push({ type: "missed_mate", priority: 95, n: mateIn(before), best: m.bestSan });
    if (m.bestSan && !isBest && m.bestLine?.length) {
      const gain = lineSwing(m.fenBefore, m.bestLine, me, 5);
      if (gain.change >= 2 && gain.won)
        facts.push({ type: "missed_win", priority: 70, best: m.bestSan, piece: gain.won.captured, square: gain.won.to });
    }
    if (m.cls === "miss") facts.push({ type: "missed_punish", priority: 65, best: m.bestSan });

    // Opening habits, only early and only when the move cost something
    if (m.ply < 12 && mv.piece === "q") {
      const home = me === "w" ? ["b1", "g1", "c1", "f1"] : ["b8", "g8", "c8", "f8"];
      const undeveloped = home.filter((sq) => {
        const p = new Chess(m.fenBefore).get(sq);
        return p && p.color === me && (p.type === "n" || p.type === "b");
      }).length;
      if (undeveloped >= 2) facts.push({ type: "early_queen", priority: 40 });
    }
    const rights = m.fenBefore.split(" ")[2] || "";
    const hadCastling = me === "w" ? /[KQ]/.test(rights) : /[kq]/.test(rights);
    if (mv.piece === "k" && !mv.san.startsWith("O-O") && hadCastling && m.ply < 30) facts.push({ type: "king_walk", priority: 45 });

    if (!facts.length) facts.push({ type: `generic_${m.cls === "miss" ? "mistake" : m.cls}`, priority: 1, best: m.bestSan });
    return facts.sort((a, b) => b.priority - a.priority);
  }

  // Good moves
  const praise = { brilliant: 30, great: 25, best: 20, excellent: 15, good: 12, book: 10, forced: 5 }[m.cls];
  if (praise) facts.push({ type: `praise_${m.cls}`, priority: praise, best: m.bestSan });
  if (mv.captured && m.cls !== "book") {
    // Measure from before the opponent's last move, so taking back a piece
    // they just took reads as a recapture, not a win.
    const after = lineSwing(m.fenBefore, [m.san, ...reply], me, 4);
    let gained = after.change;
    if (m.prevFenBefore) {
      const prev = new Chess(m.prevFenBefore);
      const now = new Chess(m.fenBefore);
      gained += material(now, me) - material(now, other(me)) - (material(prev, me) - material(prev, other(me)));
    }
    if (gained >= 2) facts.push({ type: "wins_material", priority: praise + 1, piece: mv.captured });
    else if (m.prevSan && m.prevSan.includes("x") && m.prevTo === mv.to)
      facts.push({ type: "takes_back", priority: praise + 1, piece: mv.captured });
  }
  return facts.sort((a, b) => b.priority - a.priority);
}
