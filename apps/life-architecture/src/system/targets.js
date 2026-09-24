import { MACROS } from "./constants.js";

export const TARGET_FIELDS = [
  { key: "kcal", label: "Calories", unit: "kcal", min: 800, max: 6000, step: 25 },
  { key: "protein", label: "Protein", unit: "g", min: 30, max: 400, step: 5 },
  { key: "fat", label: "Fat", unit: "g", min: 10, max: 300, step: 5 },
  { key: "carbs", label: "Carbs", unit: "g", min: 0, max: 800, step: 5 },
  { key: "kcalFloor", label: "Budget window floor", unit: "kcal", min: 500, max: 6000, step: 25 },
  { key: "kcalCeil", label: "Budget window ceiling", unit: "kcal", min: 800, max: 7000, step: 25 },
];

export function cleanTargets(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const f of TARGET_FIELDS) {
    const v = +raw[f.key];
    if (Number.isFinite(v) && v >= f.min && v <= f.max) out[f.key] = Math.round(v);
  }
  return out;
}

export function resolveTargets(data) {
  const t = { ...MACROS, ...cleanTargets(data?.targets) };
  if (t.kcalFloor > t.kcalCeil) t.kcalFloor = t.kcalCeil;
  return t;
}

export function autoQuestTitle(q, t) {
  if (q.id === "hf_protein") return `Hit protein target (${t.protein}g)`;
  if (q.id === "hf_kcal") return `Within caloric budget (${t.kcalFloor.toLocaleString()} to ${t.kcalCeil.toLocaleString()})`;
  return q.title;
}

export const proteinHit = (totals, t) => (totals?.protein || 0) >= t.protein;
export const kcalInWindow = (totals, t) => (totals?.kcal || 0) >= t.kcalFloor && (totals?.kcal || 0) <= t.kcalCeil;
