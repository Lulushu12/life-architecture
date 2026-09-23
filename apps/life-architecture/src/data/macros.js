import { getMealLogSync } from "./logs.js";
import { caloriesStoreTotals } from "./bridge.js";

export function macroTotals(entries) {
  return (entries || []).reduce(
    (t, e) => ({ kcal: t.kcal + (+e.kcal || 0), protein: t.protein + (+e.protein || 0), fat: t.fat + (+e.fat || 0), carbs: t.carbs + (+e.carbs || 0) }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );
}

export function effectiveMacros(data, day, entries) {
  const bridged = data?.bridgeMacros?.[day];
  if (bridged) return { totals: bridged, source: "calories" };
  const la = macroTotals(entries ?? getMealLogSync(day));
  const direct = caloriesStoreTotals(day);
  if (direct && (direct.entries > 0 || la.kcal === 0)) return { totals: direct, source: "calories" };
  return { totals: la, source: la.kcal > 0 ? "la" : null };
}
