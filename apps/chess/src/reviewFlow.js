// Which moves a review stops at when you step through it with "Next key
// moment": the last book move (where your own play starts), then every
// mistake and every standout move. For a game with a known player, only
// that player's moves; otherwise both sides'.

const STOP = new Set(["inaccuracy", "mistake", "blunder", "miss", "great", "brilliant"]);
const MARK = new Set(["mistake", "blunder", "miss"]);

export function reviewStops(review, playerColor = null) {
  if (!review?.moves?.length) return [];
  const mine = (m) => !playerColor || m.color === playerColor;
  const stops = new Set();
  let lastBook = -1;
  review.moves.forEach((m, i) => {
    if (m.class === "book") lastBook = i;
  });
  if (lastBook >= 0) stops.add(lastBook);
  review.moves.forEach((m, i) => {
    if (mine(m) && STOP.has(m.class)) stops.add(i);
  });
  return [...stops].sort((a, b) => a - b);
}

/** Next stop after move index `i` (-1 = before the first move), or null. */
export function nextStop(stops, i) {
  return stops.find((s) => s > i) ?? null;
}

/** Previous stop before move index `i`, or null. */
export function prevStop(stops, i) {
  for (let k = stops.length - 1; k >= 0; k--) if (stops[k] < i) return stops[k];
  return null;
}

/** Points to mark on the eval graph: the player's mistakes, blunders and misses. */
export function graphMarks(review, playerColor = null) {
  if (!review?.moves) return [];
  return review.moves
    .map((m, i) => ({ i, cls: m.class, color: m.color }))
    .filter((m) => MARK.has(m.cls) && (!playerColor || m.color === playerColor));
}
