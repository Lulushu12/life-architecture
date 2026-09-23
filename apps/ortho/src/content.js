import { dayKey } from "@shared/store.js";

const rawModules = import.meta.glob("./content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

export function parseFrontMatter(raw) {
  const meta = { title: "", tags: [], region: "", specialty: "", updated: "", lang: "" };
  let body = raw;
  const trimmed = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  body = trimmed;
  if (trimmed.startsWith("---")) {
    const end = trimmed.indexOf("\n---", 3);
    if (end !== -1) {
      const block = trimmed.slice(3, end).trim();
      body = trimmed.slice(end + 4).replace(/^\n/, "");
      for (const line of block.split("\n")) {
        const i = line.indexOf(":");
        if (i === -1) continue;
        const key = line.slice(0, i).trim().toLowerCase();
        const value = line.slice(i + 1).trim();
        if (key === "tags")
          meta.tags = value
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        else if (key in meta) meta[key] = value;
      }
    }
  }
  return { meta, body };
}

function titleCase(slug) {
  return slug
    .replace(/^_/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const CATEGORY_LABELS = {
  classifications: "Classifications",
  techniques: "Techniques",
  checklists: "Checklists",
  notes: "Notes",
  diagnoses: "Diagnoses",
};

export const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS);

export function fold(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function plainText(body) {
  return body
    .normalize("NFC")
    .replace(/!\[([^\]]*)\]\((?:[^()\s]|\([^()\s]*\))+\)/g, "$1")
    .replace(/\[([^\]]+)\]\((?:[^()\s]|\([^()\s]*\))+\)/g, "$1")
    .replace(/```/g, " ")
    .replace(/[#>*`|_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function indexFields(a) {
  const plain = plainText(a.body);
  const bodyFold = fold(plain);
  a._title = fold(a.title);
  a._tags = fold(a.tags.join(" "));
  a._body = bodyFold;
  a._aligned = bodyFold.length === plain.length;
  return a;
}

const TRAILER_RE = /\*Full context: "([^"]+)" in the Diagnoses section\.\*/;

const TEMPLATES = {};

function stripTemplateIntro(body) {
  const idx = body.search(/^#{1,6}\s/m);
  return (idx > 0 ? body.slice(idx) : body).trim() + "\n";
}

function buildArticles() {
  const articles = [];
  for (const [path, raw] of Object.entries(rawModules)) {
    const m = path.match(/^\.\/content\/([^/]+)\/([^/]+)\.md$/);
    if (!m) continue;
    const [, category, slug] = m;
    if (category === "concurs") continue;
    const { meta, body } = parseFrontMatter(raw);
    if (slug.startsWith("_")) {
      if (!TEMPLATES[category]) TEMPLATES[category] = stripTemplateIntro(body);
      continue;
    }
    articles.push({
      id: `${category}/${slug}`,
      category,
      categoryLabel: CATEGORY_LABELS[category] || titleCase(category),
      slug,
      title: meta.title || titleCase(slug),
      tags: meta.tags,
      region: meta.region,
      specialty: meta.specialty,
      updated: /^\d{4}-\d{2}-\d{2}$/.test(meta.updated) ? meta.updated : "",
      lang: meta.lang,
      body,
    });
  }

  const diagnosisByTitle = new Map(
    articles.filter((a) => a.category === "diagnoses").map((a) => [a.title.trim().toLowerCase(), a.id])
  );
  const backlinks = {};
  for (const a of articles) {
    const t = a.body.match(TRAILER_RE);
    if (!t) continue;
    const target = diagnosisByTitle.get(t[1].trim().toLowerCase());
    if (!target || target === a.id) continue;
    a.fullContext = target;
    a.body = a.body.replace(TRAILER_RE, `*Full context: [${t[1]}](${target}) in the Diagnoses section.*`);
    (backlinks[target] ||= []).push(a.id);
  }
  for (const a of articles) {
    a.referencedBy = backlinks[a.id] || [];
    indexFields(a);
  }
  articles.sort((a, b) => a.title.localeCompare(b.title));
  return articles;
}

export const ARTICLES = buildArticles();

export function templateFor(category) {
  return TEMPLATES[category] || "";
}

function normalizeLocal(localArticles) {
  return localArticles.map((a) =>
    indexFields({
      ...a,
      categoryLabel: CATEGORY_LABELS[a.category] || titleCase(a.category || "notes"),
      slug: a.id,
      tags: a.tags || [],
      region: a.region || "",
      specialty: a.specialty || "",
      updated: a.updatedAt ? dayKey(new Date(a.updatedAt)) : "",
      referencedBy: [],
      local: true,
    })
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
