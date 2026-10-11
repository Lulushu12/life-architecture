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

// How far along an engine line to count material (plan item 16: up to 12
// plies), cut back to a calm point: the last move counted is neither a
// capture nor a check, and the next one in the line isn't a capture. So a
// capture is never counted before its recapture. A one-move line is kept.
const HORIZON = 12;
function span(fen, line) {
  const c = new Chess(fen);
  const moves = [];
  for (const san of (line || []).slice(0, HORIZON + 1)) {
    try {
      moves.push(c.move(san));
    } catch {
      break;
    }
  }
  if (moves.length <= 1) return moves.length;
  for (let k = Math.min(HORIZON, moves.length); k >= 1; k--) {
    const last = moves[k - 1];
    const next = moves[k];
    if (last.captured || last.san.includes("+") || next?.captured) continue;
    return k;
  }
  return 0;
}
// The most valuable piece of `color` captured along the moves played.
const biggestLoss = (played, color) =>
  played.filter((m) => m.captured && m.color !== color).sort((a, b) => VALUE[b.captured] - VALUE[a.captured])[0] || null;
const DECIDED = 300; // centipawns: a side this far ahead before and after the move
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
// Along the engine's line after your move (their capture first): do you mate,
// or win the material back at a calm point while still clearly better
// (`after`, your eval after the move, of at least SAC_STILL_BETTER)? Then
// giving the piece up was a sacrifice. Returns {mate, line} or null.
const SAC_STILL_BETTER = 200;
function sacrificeIn(fenAfter, reply, me, after) {
  const mateAt = reply.findIndex((san, k) => k % 2 === 1 && san.endsWith("#"));
  if (mateAt >= 0) return { mate: true, line: reply.slice(0, mateAt + 1) };
  if (after < SAC_STILL_BETTER) return null;
  const n = span(fenAfter, reply);
  if (n < 3) return null; // too short to show it wins anything back
  const swing = lineSwing(fenAfter, reply, me, n);
  return swing.change >= 0 ? { mate: false, gain: swing.change, line: swing.played.map((x) => x.san).slice(0, 8) } : null;
}

// The best move hits something: a check, or an attack on a piece worth more
// than the attacker or left undefended. Captures are left to the material facts.
function bestTempo(fen, bestSan, me) {
  const c = new Chess(fen);
  let mv;
  try {
    mv = c.move(bestSan);
  } catch {
    return null;
  }
  if (mv.captured || mv.promotion) return null;
  if (mv.san.includes("+")) return { type: "best_check" };
  const them = other(me);
  const target = targetsOf(c, mv.to, them)
    .map((sq) => ({ square: sq, type: c.get(sq).type }))
    .filter((t) => t.type !== "k")
    .filter((t) => VALUE[t.type] > VALUE[mv.piece] || (VALUE[t.type] >= 3 && c.attackers(t.square, them).length === 0))
    .sort((a, b) => VALUE[b.type] - VALUE[a.type])[0];
  return target ? { type: "best_tempo", piece: target.type, square: target.square, by: mv.piece } : null;
}

// Early in the game: the best move castled or developed a knight or bishop,
// and yours didn't.
function openingHint(fen, san, bestSan) {
  const c = new Chess(fen);
  let best;
  let played;
  try {
    best = new Chess(fen).move(bestSan);
    played = c.move(san);
  } catch {
    return null;
  }
  const develops = (mv) => (mv.piece === "n" || mv.piece === "b") && (mv.from[1] === "1" || mv.from[1] === "8");
  if (best.san.startsWith("O-O") && !played.san.startsWith("O-O")) return "castle_first";
  if (develops(best) && !develops(played) && !played.san.startsWith("O-O")) return "develop_first";
  return null;
}

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
    const caught = replyMove?.captured ? hanging.find((h) => h.square === replyMove.to) : null;
    // A sacrifice (plan item 17): the piece is en prise and they take it, but
    // the engine's line then mates them, or wins it back while you stay
    // clearly better. Morphy's 15.Bxd7+ in the Opera Game is the model.
    // Only ever replaces a "hanging piece" claim; plain exchanges stay as before.
    const sac = caught ? sacrificeIn(fenAfter, reply, me, after) : null;
    if (sac) facts.push({ type: "sacrifice", priority: 92, piece: replyMove.captured, ...sac });
    const takenNow = sac ? null : caught;
    const hang = sac ? null : takenNow || hanging.find((h) => h.gain >= 2);
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

    if (reply.length && !hang && !sac) {
      const swing = lineSwing(fenAfter, reply, me, span(fenAfter, reply));
      const line = swing.played.map((x) => x.san);
      const lost = biggestLoss(swing.played, me);
      const shown = line.length > 8 ? [...line.slice(0, 8)] : line;
      if (swing.change <= -2 && lost)
        facts.push({ type: "loses_material", priority: 75, piece: lost.captured, square: lost.to, amount: -swing.change, line: shown, deep: line.length > 6 });
      else if (swing.change <= -1 && lost) facts.push({ type: "loses_pawn", priority: 55, line: shown });
    }

    // What the move missed
    // Only when your move lets the mate go: another mating move isn't a miss.
    if (before >= MATE && after < MATE && !isBest && m.bestSan) facts.push({ type: "missed_mate", priority: 95, n: mateIn(before), best: m.bestSan });
    if (m.bestSan && !isBest && m.bestLine?.length) {
      const gain = lineSwing(m.fenBefore, m.bestLine, me, span(m.fenBefore, m.bestLine));
      if (gain.change >= 2 && gain.won)
        facts.push({ type: "missed_win", priority: 70, best: m.bestSan, piece: gain.won.captured, square: gain.won.to });
      else if (gain.change >= 1 && gain.won) facts.push({ type: "missed_pawn", priority: 50, best: m.bestSan });
    }
    if (m.cls === "miss") facts.push({ type: "missed_punish", priority: 65, best: m.bestSan });

    // What the best move would have done that yours didn't (plan item 16)
    if (before >= 200 && after <= 0)
      facts.push({ type: "lost_advantage", priority: 47, best: m.bestSan && !isBest ? m.bestSan : null });
    if (m.bestSan && !isBest && /=[QRBN]/.test(m.bestSan))
      facts.push({ type: "best_promotes", priority: 48, best: m.bestSan, piece: m.bestSan.match(/=([QRBN])/)[1].toLowerCase() });
    if (m.bestSan && !isBest) {
      const tempo = bestTempo(m.fenBefore, m.bestSan, me);
      if (tempo) facts.push({ ...tempo, priority: 45, best: m.bestSan });
      if (m.ply < 20) {
        const opening = openingHint(m.fenBefore, m.san, m.bestSan);
        if (opening) facts.push({ type: opening, priority: 35, best: m.bestSan });
      }
      if (Math.sign(before) === Math.sign(after) && Math.min(Math.abs(before), Math.abs(after)) >= DECIDED)
        facts.push({ type: before > 0 ? "decided_win" : "decided_loss", priority: 20, best: m.bestSan });
    }

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
