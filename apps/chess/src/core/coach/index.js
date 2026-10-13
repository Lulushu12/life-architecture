// The coach: facts from the board and the engine, worded by templates.
// Offline and deterministic. See facts.js for what it detects.

import { Chess } from "chess.js";
import { moveFacts } from "./facts.js";
import { phrase } from "./phrases.js";
import { keyMoments } from "../../review.js";

export { moveFacts } from "./facts.js";
export { phrase } from "./phrases.js";

function arrowsFor(fact, fenBefore, san, bestSan) {
  const uci = (fen, s) => {
    try {
      const m = new Chess(fen).move(s);
      return [m.from, m.to];
    } catch {
      return null;
    }
  };
  const fenAfter = (() => {
    try {
      const c = new Chess(fenBefore);
      c.move(san);
      return c.fen();
    } catch {
      return null;
    }
  })();
  const threat = (r) => (fenAfter && r ? uci(fenAfter, r) : null);
  switch (fact.type) {
    case "allows_mate":
    case "allows_fork":
    case "allows_pin":
    case "allows_skewer":
      return { threat: threat(fact.reply), squares: fact.targets?.map((t) => t.square) || (fact.front ? [fact.front.square, fact.back.square] : []) };
    case "hangs_piece":
      return { threat: threat(fact.reply), squares: [fact.square] };
    case "loses_material":
      return { threat: threat(fact.line?.[0]), squares: [fact.square] };
    case "missed_mate":
    case "missed_win":
    case "missed_punish":
      return { best: bestSan ? uci(fenBefore, bestSan) : null, squares: fact.square ? [fact.square] : [] };
    default:
      return { squares: [] };
  }
}

function prevTarget(m) {
  if (!m) return null;
  try {
    return new Chess(m.fenBefore).move(m.san).to;
  } catch {
    return null;
  }
}

/**
 * Explains move `i` of a finished review.
 * @returns {{ facts, text, threat: [from,to]|null, best: [from,to]|null, squares: string[] } | null}
 */
export function explainReviewMove(review, i) {
  const m = review?.moves?.[i];
  if (!m) return null;
  const facts = moveFacts({
    fenBefore: m.fenBefore,
    san: m.san,
    color: m.color,
    cls: m.class,
    bestSan: m.bestSan,
    bestLine: review.pvs?.[i] || (m.bestSan ? [m.bestSan] : []),
    reply: review.pvs?.[i + 1] || [],
    evalBefore: review.evals?.[i],
    evalAfter: review.evals?.[i + 1],
    ply: i,
    prevFenBefore: review.moves[i - 1]?.fenBefore || null,
    prevSan: review.moves[i - 1]?.san || null,
    prevTo: prevTarget(review.moves[i - 1]),
  });
  if (!facts.length) return { facts, text: "", threat: null, best: null, squares: [] };
  const top = facts[0];
  let text = phrase(top, m.fenBefore);
  // A missed punishment reads better with the concrete win attached.
  if (top.type === "missed_punish") {
    const win = facts.find((f) => f.type === "missed_win" || f.type === "missed_mate");
    if (win) text = `${phrase(top, m.fenBefore).split(".")[0]}. ${phrase(win, m.fenBefore)}`;
  }
  const geo = arrowsFor(top, m.fenBefore, m.san, m.bestSan);
  return { facts, text, threat: geo.threat || null, best: geo.best || null, squares: geo.squares || [] };
}

const BAD = new Set(["inaccuracy", "mistake", "blunder", "miss"]);

/** One or two sentences about the whole game, for the review summary. */
export function summarizeGame(review, playerColor = null) {
  if (!review?.moves?.length) return "";
  const moveNo = (i) => `${Math.floor(i / 2) + 1}${i % 2 ? "..." : "."}`;
  if (playerColor) {
    const acc = review.accuracy?.[playerColor];
    const mine = review.moves.map((m, i) => ({ ...m, i })).filter((m) => m.color === playerColor);
    const bad = mine.filter((m) => m.class === "blunder" || m.class === "mistake" || m.class === "miss");
    const worst = mine.filter((m) => BAD.has(m.class)).sort((a, b) => (b.drop || 0) - (a.drop || 0))[0];
    const last = review.moves[review.moves.length - 1];
    if (!worst || (worst.drop || 0) < 10) {
      return `A clean game: no mistakes or blunders${acc != null ? `, ${acc}% accuracy` : ""}.${last?.san?.includes("#") && last.color === playerColor ? " And you finished it with mate." : ""}`;
    }
    const why = explainReviewMove(review, worst.i)?.text || "";
    const first = why.split(/(?<=\.)\s/)[0];
    const count = bad.length > 1 ? ` It was one of ${bad.length} big errors.` : "";
    return `The turning point was ${moveNo(worst.i)} ${worst.san}: ${first.charAt(0).toLowerCase()}${first.slice(1)}${count}${acc != null ? ` Accuracy ${acc}%.` : ""}`;
  }
  const swing = keyMoments(review, 1)[0];
  const accs = review.accuracy ? `White ${review.accuracy.w}%, Black ${review.accuracy.b}%.` : "";
  return swing ? `${accs} The biggest swing came at ${moveNo(swing.ply)} ${swing.san}.`.trim() : accs;
}
