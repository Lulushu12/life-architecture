// Favorites, recently-viewed and in-app-authored articles live in one
// localStorage key, written through on every change — killing the app
// never loses them.

const KEY = "ortho-v1";

export function loadStore() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === "object" && Array.isArray(s.favorites) && Array.isArray(s.recents))
      return { localArticles: [], ...s };
  } catch {
    /* corrupted store falls through to a fresh one */
  }
  return { favorites: [], recents: [], localArticles: [] };
}

export function saveStore(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* quota errors: nothing sensible to do, data stays in memory */
  }
}

export function toggleFavorite(store, id) {
  const isFav = store.favorites.includes(id);
  return {
    ...store,
    favorites: isFav ? store.favorites.filter((x) => x !== id) : [...store.favorites, id],
  };
}

// Most-recent-first, deduped, capped at 10.
export function recordRecent(store, id) {
  const recents = [id, ...store.recents.filter((x) => x !== id)].slice(0, 10);
  return { ...store, recents };
}

export function newId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function upsertLocalArticle(store, article) {
  const exists = store.localArticles.some((a) => a.id === article.id);
  const stamped = { ...article, updatedAt: Date.now() };
  return {
    ...store,
    localArticles: exists
      ? store.localArticles.map((a) => (a.id === article.id ? stamped : a))
      : [...store.localArticles, stamped],
  };
}

export function deleteLocalArticle(store, id) {
  return {
    ...store,
    localArticles: store.localArticles.filter((a) => a.id !== id),
    favorites: store.favorites.filter((x) => x !== id),
    recents: store.recents.filter((x) => x !== id),
  };
}

export function exportStore(store) {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `ortho-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Imported articles win only when newer; favorites/recents are unioned.
export function mergeImport(store, imported) {
  if (!imported || typeof imported !== "object") return store;
  const byId = Object.fromEntries(store.localArticles.map((a) => [a.id, a]));
  for (const a of imported.localArticles || []) {
    if (a && a.id && (!byId[a.id] || (a.updatedAt || 0) > (byId[a.id].updatedAt || 0)))
      byId[a.id] = a;
  }
  return {
    favorites: [...new Set([...store.favorites, ...(imported.favorites || [])])],
    recents: [...new Set([...store.recents, ...(imported.recents || [])])].slice(0, 10),
    localArticles: Object.values(byId),
  };
}
