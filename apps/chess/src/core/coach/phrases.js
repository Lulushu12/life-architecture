// English wording for coach facts. Every template is original to this app.
// Each fact type has a few phrasings; which one is used depends on the
// position, so the same move always reads the same way but the coach doesn't
// repeat itself across a game. Romanian can be added later as a second table.

import { NAME } from "./board.js";

const n = (t) => NAME[t] || "piece";
const VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const cheaper = (f) => f.by && f.by !== "k" && VALUES[f.by] < VALUES[f.piece];
const list = (items) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

export const PHRASES = {
  checkmate: [() => "Checkmate. Well played."],
  allows_mate: [
    (f) => (f.n === 1 ? `This allows ${f.reply ? f.reply : "a mate"} at once.` : `This walks into a forced mate in ${f.n}${f.reply ? `, starting with ${f.reply}` : ""}.`),
    (f) => (f.n === 1 ? `After this, ${f.reply ? `${f.reply} is` : "there is"} checkmate.` : `This lets them force mate in ${f.n}.`),
  ],
  // free: nothing defends it. Otherwise either a cheaper piece takes it
  // (taking back doesn't cover the loss) or it has too few defenders.
  hangs_piece: [
    (f) =>
      f.free
        ? `This leaves your ${n(f.piece)} on ${f.square} unprotected${f.reply ? `, and ${f.reply} takes it for free` : ""}.`
        : cheaper(f)
          ? `Their ${n(f.by)} can take your ${n(f.piece)} on ${f.square}${f.reply ? ` (${f.reply})` : ""}, and taking back doesn't make up for it.`
          : `Your ${n(f.piece)} on ${f.square} is attacked more times than it is defended, so it can be won.`,
    (f) =>
      f.free
        ? `Nothing guards your ${n(f.piece)} on ${f.square} after this move${f.reply ? `. ${f.reply} wins it` : ""}.`
        : cheaper(f)
          ? `A ${n(f.piece)} for a ${n(f.by)}: ${f.reply || `their ${n(f.by)}`} takes it on ${f.square} and you can't win enough back.`
          : `Count attackers and defenders on ${f.square}: your ${n(f.piece)} there comes out short.`,
    (f) =>
      f.moved
        ? `The ${n(f.piece)} you just moved to ${f.square} can be taken${f.free ? " for nothing" : cheaper(f) ? ` by their ${n(f.by)}` : " at a profit"}.`
        : `Check what's attacking ${f.square}: your ${n(f.piece)} there can be won.`,
  ],
  allows_fork: [
    (f) => `This allows ${f.reply}: their ${n(f.by)} on ${f.square} attacks your ${list(f.targets.map((t) => n(t.type)))} at once.`,
    (f) => `Watch ${f.square}. After ${f.reply} their ${n(f.by)} forks your ${list(f.targets.map((t) => n(t.type)))}.`,
  ],
  allows_pin: [
    (f) => `This allows ${f.reply}, pinning your ${n(f.front.type)} on ${f.front.square} to your ${n(f.back.type)}.`,
    (f) => `After ${f.reply} your ${n(f.front.type)} is stuck: moving it would expose your ${n(f.back.type)}.`,
  ],
  allows_skewer: [
    (f) => `This allows ${f.reply}, a skewer: your ${n(f.front.type)} must move and the ${n(f.back.type)} behind it falls.`,
    (f) => `${f.reply} lines up on your ${n(f.front.type)} and ${n(f.back.type)}; when the first one moves, the second is lost.`,
  ],
  loses_material: [
    (f) => `Their best answer, ${f.line.join(" ")}, wins your ${n(f.piece)}.`,
    (f) => `This costs a ${n(f.piece)}: look at ${f.line.join(" ")}.`,
  ],
  missed_mate: [
    (f) => `You had mate in ${f.n}, starting with ${f.best}.`,
    (f) => `${f.best} was ${f.n === 1 ? "checkmate" : `the start of a forced mate in ${f.n}`}.`,
  ],
  missed_win: [
    (f) => `${f.best} would have won their ${n(f.piece)}.`,
    (f) => `There was a ${n(f.piece)} to win here: ${f.best}.`,
  ],
  missed_punish: [
    (f) => `Their last move was a mistake, and this lets them off the hook.${f.best ? ` ${f.best} was the way to punish it.` : ""}`,
    (f) => `They had just slipped.${f.best ? ` ${f.best} would have made them pay.` : ""}`,
  ],
  early_queen: [
    () => "Bringing the queen out this early lets them develop while chasing it. Knights and bishops first.",
    () => "The queen is out before your minor pieces. Develop them first and keep her safe.",
  ],
  king_walk: [
    () => "Moving the king gives up castling for good. Castling first keeps it safer.",
    () => "A king move this early means you can't castle any more.",
  ],
  generic_inaccuracy: [
    (f) => `Not the most accurate.${f.best ? ` ${f.best} kept more of your advantage.` : ""}`,
    (f) => `A small slip.${f.best ? ` ${f.best} was a little better.` : ""}`,
  ],
  generic_mistake: [
    (f) => `This gives away a good part of your position.${f.best ? ` ${f.best} was stronger.` : ""}`,
    (f) => `A real mistake.${f.best ? ` ${f.best} was the move to find.` : ""}`,
  ],
  generic_blunder: [
    (f) => `This throws the position away.${f.best ? ` ${f.best} was needed.` : ""}`,
    (f) => `A serious error.${f.best ? ` ${f.best} held things together.` : ""}`,
  ],
  praise_brilliant: [() => "A real sacrifice, and it works. Brilliant.", () => "You gave up material and the engine agrees it was right. Excellent vision."],
  praise_great: [() => "The only good move here, and you found it.", () => "Everything else was worse. Well spotted."],
  praise_best: [() => "That's the engine's top choice.", () => "Spot on: the best move.", () => "Exactly what the engine wanted."],
  praise_excellent: [() => "A strong move, almost as good as the best one.", () => "Very good: nearly the engine's choice."],
  praise_good: [(f) => `A decent move.${f.best ? ` ${f.best} was slightly better.` : ""}`],
  praise_book: [() => "Opening theory: a well-known move here.", () => "A book move."],
  praise_forced: [() => "The only legal move."],
  wins_material: [(f) => `This wins their ${n(f.piece)}.`, (f) => `Good capture: the ${n(f.piece)} is yours.`],
  takes_back: [(f) => `Taking back the ${n(f.piece)}.`, () => "The natural recapture."],
};

// Small deterministic hash so a position always picks the same phrasing.
function pick(key, count) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % count;
}

export function phrase(fact, key = "") {
  const variants = PHRASES[fact.type];
  if (!variants) return "";
  return variants[pick(`${key}|${fact.type}`, variants.length)](fact);
}
