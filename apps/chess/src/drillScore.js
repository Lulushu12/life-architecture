// Opening drill scoring. Every wrong move costs a miss; a run with no misses
// counts as mastered.

// "Show move" gives the answer away, so it costs a miss too, unless a wrong
// move on this same step already did (bug 6: it used to cost nothing, so a
// run could be "mastered" by revealing every move).
export function missesAfterShow(misses, stepMiss) {
  return stepMiss === 0 ? misses + 1 : misses;
}

export const isMastered = (misses) => misses === 0;
