// Favorites and recently-viewed live in one localStorage key, written
// through on every change — killing the app never loses them.

const KEY = "ortho-v1";

export function loadStore() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === "object" && Array.isArray(s.favorites) && Array.isArray(s.recents))
      return s;
  } catch {
    /* corrupted store falls through to a fresh one */
  }
  return { favorites: [], recents: [] };
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
