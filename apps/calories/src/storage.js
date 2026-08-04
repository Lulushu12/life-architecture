// All data lives in one localStorage key, written through on every state
// change — killing the app or rebooting the phone never loses anything.

const KEY = "calories-v1";

const MEALS = ["breakfast", "lunch", "dinner", "snacks"];

function emptyStore() {
  return {
    foods: {},
    exercises: {},
    logs: {}, // date -> { breakfast: [entry], lunch: [...], dinner: [...], snacks: [...] }
    training: {}, // date -> { entries: [entry], updatedAt }
    weights: {}, // date -> { kg, updatedAt }
    settings: { targets: { kcal: 0, protein: 0, carbs: 0, fat: 0 }, updatedAt: 0 },
  };
}

export function loadStore() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === "object") {
      const base = emptyStore();
      return {
        ...base,
        ...s,
        logs: s.logs || {},
        training: s.training || {},
        weights: s.weights || {},
        foods: s.foods || {},
        exercises: s.exercises || {},
        settings: { ...base.settings, ...(s.settings || {}) },
      };
    }
  } catch {
    /* corrupted store falls through to a fresh one */
  }
  return emptyStore();
}

export function saveStore(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* quota errors: nothing sensible to do, data stays in memory */
  }
}

export function newId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function emptyDayLogs() {
  return { breakfast: [], lunch: [], dinner: [], snacks: [] };
}

export function exportStore(store) {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `calories-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Imported records win only when newer than the local copy of the same key,
// applied per top-level id/date-keyed collection.
function mergeById(local, imported) {
  const out = { ...local };
  for (const [id, rec] of Object.entries(imported || {})) {
    if (!out[id] || (rec.updatedAt || 0) > (out[id].updatedAt || 0)) out[id] = rec;
  }
  return out;
}

export function mergeImport(store, imported) {
  if (!imported || typeof imported !== "object") return store;
  const next = { ...store };
  next.foods = mergeById(store.foods, imported.foods);
  next.exercises = mergeById(store.exercises, imported.exercises);
  next.training = mergeById(store.training, imported.training);
  next.weights = mergeById(store.weights, imported.weights);
  // logs is date -> per-meal arrays; treat each date bucket as one record.
  const logs = { ...store.logs };
  for (const [date, dayLogs] of Object.entries(imported.logs || {})) {
    const localUpdated = MEALS.flatMap((m) => (logs[date]?.[m] || [])).reduce(
      (max, e) => Math.max(max, e.updatedAt || 0),
      0
    );
    const importedUpdated = MEALS.flatMap((m) => (dayLogs?.[m] || [])).reduce(
      (max, e) => Math.max(max, e.updatedAt || 0),
      0
    );
    if (!logs[date] || importedUpdated > localUpdated) logs[date] = { ...emptyDayLogs(), ...dayLogs };
  }
  next.logs = logs;
  if (imported.settings && (imported.settings.updatedAt || 0) > (store.settings.updatedAt || 0)) {
    next.settings = imported.settings;
  }
  return next;
}

export { MEALS };
