import { dayKey } from "@shared/store.js";
import INDEX from "./content-index.json";
import { CATEGORY_LABELS, parseFrontMatter, titleCase, fold, plainText, linkTrailer } from "./mdmeta.js";

export { parseFrontMatter, fold, plainText };

const loaders = import.meta.glob("./content/**/*.md", { query: "?raw", import: "default" });

export const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS);

function metaFields(a) {
  a._title = fold(a.title);
  a._tags = fold(a.tags.join(" "));
  return a;
}

function bodyFields(a, plain) {
  const bodyFold = fold(plain);
  a._body = bodyFold;
  a._aligned = bodyFold.length === plain.length;
  a._plain = a._aligned ? plain : bodyFold;
  return a;
}

function buildArticles() {
  const articles = INDEX.articles.map((e) => {
    const i = e.id.indexOf("/");
    const category = e.id.slice(0, i);
    return metaFields({
      id: e.id,
      category,
      categoryLabel: CATEGORY_LABELS[category] || titleCase(category),
      slug: e.id.slice(i + 1),
      title: e.title,
      tags: e.tags || [],
      region: e.region || "",
      specialty: e.specialty || "",
      updated: e.updated || "",
      lang: e.lang || "",
      fullContext: e.fullContext,
      referencedBy: e.referencedBy || [],
    });
  });
  articles.sort((a, b) => a.title.localeCompare(b.title));
  return articles;
}

export const ARTICLES = buildArticles();

export function templateFor(category) {
  return INDEX.templates[category] || "";
}

const BODY_CACHE_MAX = 30;
const bodyCache = new Map();

export function peekBody(article) {
  if (!article) return null;
  if (article.local) return article.body;
  const body = bodyCache.get(article.id);
  return body === undefined ? null : body;
}

export async function loadBody(article) {
  const hit = peekBody(article);
  if (hit !== null) return hit;
  const load = loaders[`./content/${article.id}.md`];
  if (!load) throw new Error(`Missing content: ${article.id}`);
  const { body } = parseFrontMatter(await load());
  const out = article.fullContext ? linkTrailer(body, article.fullContext) : body;
  if (bodyCache.size >= BODY_CACHE_MAX) bodyCache.delete(bodyCache.keys().next().value);
  bodyCache.set(article.id, out);
  return out;
}

let fulltextReady = false;
let fulltextPromise = null;

export function isFulltextLoaded() {
  return fulltextReady;
}

export function loadFulltext() {
  if (!fulltextPromise) {
    fulltextPromise = import("./content-fulltext.json").then(
      (mod) => {
        const text = mod.default;
        for (const a of ARTICLES) bodyFields(a, text[a.id] || "");
        fulltextReady = true;
      },
      (err) => {
        fulltextPromise = null;
        throw err;
      }
    );
  }
  return fulltextPromise;
}

function normalizeLocal(localArticles) {
  return localArticles.map((a) =>
    bodyFields(
      metaFields({
        ...a,
        categoryLabel: CATEGORY_LABELS[a.category] || titleCase(a.category || "notes"),
        slug: a.id,
        tags: a.tags || [],
        region: a.region || "",
        specialty: a.specialty || "",
        updated: a.updatedAt ? dayKey(new Date(a.updatedAt)) : "",
        referencedBy: [],
        local: true,
      }),
      plainText(a.body)
    )
  );
}

const EMPTY = [];
let cache = null;

function merged(local) {
  const key = local && local.length ? local : EMPTY;
  if (cache && cache.local === key) return cache;
  const list = key.length ? [...ARTICLES, ...normalizeLocal(key)] : ARTICLES.slice();
  if (key.length) list.sort((a, b) => a.title.localeCompare(b.title));
  const byId = new Map(list.map((a) => [a.id, a]));
  const counts = {};
  for (const a of list) counts[a.category] = (counts[a.category] || 0) + 1;
  const cats = CATEGORY_KEYS.map((k) => ({ key: k, label: CATEGORY_LABELS[k], count: counts[k] || 0 }));
  const recentlyUpdated = list
    .filter((a) => a.updated)
    .sort((a, b) => (a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : a.title.localeCompare(b.title)))
    .slice(0, 10);
  const byCategory = {};
  for (const a of list) (byCategory[a.category] ||= []).push(a);
  cache = { local: key, list, byId, cats, recentlyUpdated, byCategory };
  return cache;
}

export function allArticles(local) {
  return merged(local).list;
}

export function categories(local) {
  return merged(local).cats;
}

export function getArticle(id, local) {
  return merged(local).byId.get(id);
}

export function articlesInCategory(key, local) {
  return merged(local).byCategory[key] || EMPTY;
}

export function recentlyUpdated(local) {
  return merged(local).recentlyUpdated;
}

export function formatDate(key) {
  if (!key) return "";
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  if (isNaN(date)) return key;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
