import { createStore } from "@shared/store.js";
import { seedTemplates } from "./templates.js";

export const STORAGE_KEY = "calories-v1";

export const MEALS = ["breakfast", "lunch", "dinner", "snacks"];
export const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snacks: "Snacks" };

export function defaults() {
  return {
    foods: {},
    exercises: {},
    logs: {},
    training: {},
    weights: {},
    templates: {},
    templatesSeeded: false,
    settings: { targets: { kcal: 0, protein: 0, carbs: 0, fat: 0 }, country: "ro", updatedAt: 0 },
  };
}

export function emptyDayLogs() {
  return { breakfast: [], lunch: [], dinner: [], snacks: [] };
}

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

function lastTouched(f) {
  return Math.max(num(f.lastUsedAt), num(f.updatedAt));
}

export function dedupeFoods(foods) {
  const byCode = new Map();
  const remap = {};
  for (const f of Object.values(foods)) {
    if (!f.code) continue;
    const keep = byCode.get(f.code);
    if (!keep) {
      byCode.set(f.code, f);
      continue;
    }
    const [winner, loser] = lastTouched(f) > lastTouched(keep) ? [f, keep] : [keep, f];
    byCode.set(f.code, {
      ...winner,
      useCount: num(winner.useCount) + num(loser.useCount),
      favorite: !!(winner.favorite || loser.favorite),
    });
    remap[loser.id] = winner.id;
  }
  if (!Object.keys(remap).length) return { foods, remap };
  const out = {};
  for (const f of Object.values(foods)) {
    if (remap[f.id]) continue;
    out[f.id] = f.code ? byCode.get(f.code) : f;
  }
  for (const [from, to] of Object.entries(remap)) {
    let target = to;
    while (remap[target]) target = remap[target];
    remap[from] = target;
  }
  return { foods: out, remap };
}

function normalizeEntry(e) {
  if (!isObj(e)) return null;
  return {
    ...e,
    id: e.id || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: typeof e.name === "string" && e.name ? e.name : "Unnamed food",
    grams: num(e.grams),
    kcal100: num(e.kcal100),
    protein100: num(e.protein100),
    carbs100: num(e.carbs100),
    fat100: num(e.fat100),
  };
}

export function normalize(store) {
  const foods = {};
  for (const [id, f] of Object.entries(isObj(store.foods) ? store.foods : {})) {
    if (!isObj(f)) continue;
    foods[id] = {
      ...f,
      id,
      name: typeof f.name === "string" && f.name ? f.name : "Unnamed food",
      kcal100: num(f.kcal100),
      protein100: num(f.protein100),
      carbs100: num(f.carbs100),
      fat100: num(f.fat100),
    };
  }
  const { foods: deduped, remap } = dedupeFoods(foods);
  const fixId = (e) => (e.foodId && remap[e.foodId] ? { ...e, foodId: remap[e.foodId] } : e);

  const logs = {};
  for (const [date, day] of Object.entries(isObj(store.logs) ? store.logs : {})) {
    if (!isObj(day)) continue;
    const next = { ...day };
    for (const m of MEALS) {
      next[m] = (Array.isArray(day[m]) ? day[m] : []).map(normalizeEntry).filter(Boolean).map(fixId);
    }
    logs[date] = next;
  }

  const templates = {};
  for (const [id, t] of Object.entries(isObj(store.templates) ? store.templates : {})) {
    if (!isObj(t) || !Array.isArray(t.items)) continue;
    templates[id] = {
      ...t,
      id,
      name: t.name || "Template",
      meal: MEALS.includes(t.meal) ? t.meal : "snacks",
      items: t.items.map(normalizeEntry).filter(Boolean).map(fixId),
    };
  }

  const exercises = {};
  for (const [id, ex] of Object.entries(isObj(store.exercises) ? store.exercises : {})) {
    if (!isObj(ex)) continue;
    exercises[id] = { ...ex, id, name: ex.name || "Exercise", type: ex.type === "cardio" ? "cardio" : "strength" };
  }

  const training = {};
  for (const [date, day] of Object.entries(isObj(store.training) ? store.training : {})) {
    if (!isObj(day)) continue;
    training[date] = { ...day, entries: (Array.isArray(day.entries) ? day.entries : []).filter(isObj) };
  }

  const weights = {};
  for (const [date, w] of Object.entries(isObj(store.weights) ? store.weights : {})) {
    if (isObj(w) && Number.isFinite(Number(w.kg)) && Number(w.kg) > 0) weights[date] = { ...w, kg: Number(w.kg) };
  }

  const base = defaults().settings;
  const s = isObj(store.settings) ? store.settings : {};
  const t = isObj(s.targets) ? s.targets : {};
  const settings = {
    ...base,
    ...s,
    targets: { kcal: num(t.kcal), protein: num(t.protein), carbs: num(t.carbs), fat: num(t.fat) },
    country: typeof s.country === "string" ? s.country : "ro",
  };

  return { ...store, foods: deduped, logs, templates, exercises, training, weights, settings };
}

function withSeed(store) {
  if (store.templatesSeeded) return store;
  return { ...store, templates: { ...seedTemplates(), ...(store.templates || {}) }, templatesSeeded: true };
}

const base = createStore({ key: STORAGE_KEY, version: 1, defaults, normalize });

export const storeDef = { key: base.key, save: base.save, load: () => withSeed(base.load()) };

function mergeById(local, imported) {
  const out = { ...(local || {}) };
  for (const [id, rec] of Object.entries(isObj(imported) ? imported : {})) {
    if (!isObj(rec)) continue;
    if (!out[id] || num(rec.updatedAt) > num(out[id].updatedAt)) out[id] = rec;
  }
  return out;
}

export function dayStamp(day) {
  if (!isObj(day)) return 0;
  let max = Math.max(num(day.updatedAt), num(day.deletedAt));
  for (const m of MEALS) for (const e of Array.isArray(day[m]) ? day[m] : []) max = Math.max(max, num(e?.updatedAt));
  return max;
}

export function mergeImport(store, imported) {
  if (!isObj(imported)) return store;
  const next = { ...store };
  next.foods = mergeById(store.foods, imported.foods);
  next.exercises = mergeById(store.exercises, imported.exercises);
  next.training = mergeById(store.training, imported.training);
  next.weights = mergeById(store.weights, imported.weights);
  next.templates = mergeById(store.templates, imported.templates);
  const logs = { ...store.logs };
  for (const [date, dayLogs] of Object.entries(isObj(imported.logs) ? imported.logs : {})) {
    if (!isObj(dayLogs)) continue;
    if (!logs[date] || dayStamp(dayLogs) > dayStamp(logs[date])) logs[date] = { ...emptyDayLogs(), ...dayLogs };
  }
  next.logs = logs;
  if (isObj(imported.settings) && num(imported.settings.updatedAt) > num(store.settings.updatedAt)) {
    next.settings = { ...store.settings, ...imported.settings };
  }
  return normalize(next);
}

export function validateBackup(d) {
  return Boolean(isObj(d) && (d.logs || d.foods || d.training || d.weights));
}
