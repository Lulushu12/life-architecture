// Results against each bot (plan item 10), split by whether you had help.
// A game is clean when it was played start to finish on "On my own" with no
// hint and no takeback; anything else is assisted. Records from before the
// split only have the totals, so clean + assisted can be less than the total.

const ZERO = { w: 0, d: 0, l: 0 };

/** outcome: "w" | "d" | "l" from your side; assist: null for a clean game. */
export function addResult(rec, outcome, assist) {
  const r = { ...ZERO, ...(rec || {}) };
  const side = assist ? "assisted" : "clean";
  const part = { ...ZERO, ...(r[side] || {}) };
  return { ...r, [outcome]: r[outcome] + 1, [side]: { ...part, [outcome]: part[outcome] + 1 } };
}

export const wdl = (r) => `${r?.w || 0}-${r?.d || 0}-${r?.l || 0}`;
export const cleanWins = (rec) => rec?.clean?.w || 0;

/** Why a game counts as assisted, in words, or null when it's clean. */
export function assistLabel(assist) {
  return (
    {
      help: "help was on",
      hint: "you took a hint",
      takeback: "you took a move back",
      branch: "you replayed from an earlier move",
    }[assist] || (assist ? "you had help" : null)
  );
}
