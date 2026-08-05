/** Pure macro arithmetic — kept Firebase-free so it's testable and reusable. */

export function macroTotals(entries) {
  return (entries || []).reduce(
    (t, e) => ({ kcal: t.kcal + (+e.kcal || 0), protein: t.protein + (+e.protein || 0), fat: t.fat + (+e.fat || 0), carbs: t.carbs + (+e.carbs || 0) }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );
}
