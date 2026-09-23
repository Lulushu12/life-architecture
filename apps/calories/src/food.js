import { MEALS } from "./storage.js";

export function macrosForGrams(food, grams) {
  const f = (Number(grams) || 0) / 100;
  return {
    kcal: (food.kcal100 || 0) * f,
    protein: (food.protein100 || 0) * f,
    carbs: (food.carbs100 || 0) * f,
    fat: (food.fat100 || 0) * f,
  };
}

export function entryMacros(e) {
  return macrosForGrams(e, e.grams);
}

export function gramsForPieces(food, pieces) {
  return (Number(pieces) || 0) * (food.pieceWeight || 0);
}

export function piecesForGrams(food, grams) {
  const pw = food.pieceWeight || 0;
  return pw > 0 ? Math.round(((Number(grams) || 0) / pw) * 100) / 100 : 0;
}

export function dayTotals(dayLogs) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  if (!dayLogs) return t;
  for (const meal of MEALS) {
    for (const e of dayLogs[meal] || []) {
      const m = entryMacros(e);
      t.kcal += m.kcal;
      t.protein += m.protein;
      t.carbs += m.carbs;
      t.fat += m.fat;
    }
  }
  return t;
}

export function roundTotals(t) {
  const r = (v) => Math.round(v * 10) / 10;
  return { kcal: Math.round(t.kcal), protein: r(t.protein), carbs: r(t.carbs), fat: r(t.fat) };
}

const HALF_LIFE_DAYS = 14;

export function foodScore(f, now = Date.now()) {
  const last = f.lastUsedAt || f.updatedAt || 0;
  const ageDays = Math.max(0, (now - last) / 86400000);
  return (1 + (f.useCount || 0)) * Math.pow(0.5, ageDays / HALF_LIFE_DAYS) + (last ? 0 : -1);
}

export function matchesQuery(f, q) {
  if (!q) return true;
  const hay = `${f.name} ${f.brand || ""}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

export function entryLabel(e) {
  if (e.quick) return "Quick add";
  if (e.pieces) return `${e.pieces} pc · ${Math.round(e.grams)} g`;
  return `${Math.round(e.grams)} g`;
}
