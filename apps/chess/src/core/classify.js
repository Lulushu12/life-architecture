// Move quality from the drop in the mover's win chance (0-100 scale).
// One table for Game Review and the analysis board's move verdicts.

export const DROP_BANDS = [
  [2, "excellent"],
  [5, "good"],
  [10, "inaccuracy"],
  [20, "mistake"],
];

export function classifyDrop(drop) {
  for (const [limit, cls] of DROP_BANDS) if (drop < limit) return cls;
  return "blunder";
}
