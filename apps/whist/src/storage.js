// All games live in one localStorage key, written through on every state
// change — killing the app or rebooting the phone never loses anything.

const KEY = "whist-rentz-v1";

export function loadStore() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === "object" && s.games) return s;
  } catch {
    /* corrupted store falls through to a fresh one */
  }
  return { games: {} };
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

export function exportStore(store) {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `whist-rentz-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Imported games win only when newer than the local copy of the same id.
export function mergeImport(store, imported) {
  if (!imported || typeof imported !== "object" || !imported.games) return store;
  const games = { ...store.games };
  for (const [id, g] of Object.entries(imported.games)) {
    if (!games[id] || (g.updatedAt || 0) > (games[id].updatedAt || 0)) games[id] = g;
  }
  return { ...store, games };
}
