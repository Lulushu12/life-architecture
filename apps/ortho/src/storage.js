import { createStore, newId as sharedNewId } from "@shared/store.js";

export const STORE_KEY = "ortho-v1";
export const FONT_SIZES = ["S", "M", "L"];
const MAX_READING_POS = 100;

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const strArray = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);

function defaults() {
  return {
    favorites: [],
    recents: [],
    localArticles: [],
    concurs: { items: {}, sessions: [] },
    readingPos: {},
    drafts: {},
    settings: { fontSize: "M" },
  };
}

function normalizeArticle(a) {
  if (!isObj(a) || typeof a.id !== "string" || !a.id) return null;
  return {
    ...a,
    title: typeof a.title === "string" ? a.title : String(a.title ?? ""),
    body: typeof a.body === "string" ? a.body : "",
    category: typeof a.category === "string" && a.category ? a.category : "notes",
    tags: strArray(a.tags),
  };
}

function normalize(s) {
  const concurs = isObj(s.concurs) ? s.concurs : {};
  const readingPos = {};
  if (isObj(s.readingPos)) {
    for (const [id, p] of Object.entries(s.readingPos)) {
      if (isObj(p) && Number.isFinite(p.y)) readingPos[id] = p;
    }
  }
  const drafts = {};
  if (isObj(s.drafts)) {
    for (const [k, d] of Object.entries(s.drafts)) {
      if (isObj(d) && typeof d.body === "string") drafts[k] = d;
    }
  }
  const settings = isObj(s.settings) ? s.settings : {};
  return {
    ...s,
    favorites: strArray(s.favorites),
    recents: strArray(s.recents).slice(0, 10),
    localArticles: (Array.isArray(s.localArticles) ? s.localArticles : []).map(normalizeArticle).filter(Boolean),
    concurs: {
      ...concurs,
      items: isObj(concurs.items) ? concurs.items : {},
      sessions: Array.isArray(concurs.sessions) ? concurs.sessions.filter(isObj) : [],
    },
    readingPos: pruneReadingPos(readingPos),
    drafts,
    settings: { ...settings, fontSize: FONT_SIZES.includes(settings.fontSize) ? settings.fontSize : "M" },
  };
}

export const storeDef = createStore({ key: STORE_KEY, version: 1, defaults, normalize });

export const newId = sharedNewId;

function pruneReadingPos(map) {
  const entries = Object.entries(map);
  if (entries.length <= MAX_READING_POS) return map;
  entries.sort((a, b) => (b[1].at || 0) - (a[1].at || 0));
  return Object.fromEntries(entries.slice(0, MAX_READING_POS));
}

export function setReadingPos(store, id, pos) {
  const next = { ...store.readingPos, [id]: { ...pos, at: Date.now() } };
  return { ...store, readingPos: pruneReadingPos(next) };
}

export function setDraft(store, key, draft) {
  const drafts = { ...store.drafts };
  if (draft) drafts[key] = { ...draft, at: Date.now() };
  else delete drafts[key];
  return { ...store, drafts };
}

export function setFontSize(store, fontSize) {
  return { ...store, settings: { ...store.settings, fontSize } };
}

export function toggleFavorite(store, id) {
  const isFav = store.favorites.includes(id);
  return {
    ...store,
    favorites: isFav ? store.favorites.filter((x) => x !== id) : [...store.favorites, id],
  };
}

export function recordRecent(store, id) {
  if (store.recents[0] === id) return store;
  const recents = [id, ...store.recents.filter((x) => x !== id)].slice(0, 10);
  return { ...store, recents };
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

export function restoreLocalArticle(store, snapshot) {
  const { article, favorite, recentIndex } = snapshot;
  const localArticles = store.localArticles.some((a) => a.id === article.id)
    ? store.localArticles
    : [...store.localArticles, article];
  const favorites = favorite && !store.favorites.includes(article.id) ? [...store.favorites, article.id] : store.favorites;
  let recents = store.recents;
  if (recentIndex >= 0 && !recents.includes(article.id)) {
    recents = [...recents];
    recents.splice(recentIndex, 0, article.id);
    recents = recents.slice(0, 10);
  }
  return { ...store, localArticles, favorites, recents };
}

function mergeConcurs(a = { items: {}, sessions: [] }, b) {
  if (!b || typeof b !== "object") return a;
  const items = { ...a.items };
  for (const [key, st] of Object.entries(b.items || {})) {
    if (!items[key] || (st.at || 0) > (items[key].at || 0)) items[key] = st;
  }
  const seen = new Set(a.sessions.map((s) => `${s.topicId}:${s.at}`));
  const sessions = [...a.sessions];
  for (const s of b.sessions || []) {
    const k = `${s.topicId}:${s.at}`;
    if (!seen.has(k)) {
      seen.add(k);
      sessions.push(s);
    }
  }
  sessions.sort((x, y) => x.at - y.at);
  return { items, sessions };
}

export function mergeImport(store, imported) {
  if (!imported || typeof imported !== "object") return store;
  const byId = Object.fromEntries(store.localArticles.map((a) => [a.id, a]));
  for (const raw of imported.localArticles || []) {
    const a = normalizeArticle(raw);
    if (a && (!byId[a.id] || (a.updatedAt || 0) > (byId[a.id].updatedAt || 0))) byId[a.id] = a;
  }
  return normalize({
    ...store,
    favorites: [...new Set([...store.favorites, ...strArray(imported.favorites)])],
    recents: [...new Set([...store.recents, ...strArray(imported.recents)])].slice(0, 10),
    localArticles: Object.values(byId),
    concurs: mergeConcurs(store.concurs, imported.concurs),
    readingPos: { ...(isObj(imported.readingPos) ? imported.readingPos : {}), ...store.readingPos },
  });
}

export function validateBackup(d) {
  return Boolean(d && typeof d === "object" && (d.localArticles || d.favorites || d.recents));
}
