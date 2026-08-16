// Loads every Markdown file under src/content/<category>/<slug>.md at build
// time (Vite inlines them — no network fetch needed offline) and parses the
// simple front-matter block each file starts with:
//
//   ---
//   title: Article title
//   tags: comma, separated, tags
//   ---
//   body...
//
// No markdown/yaml dependency: front matter is just `key: value` lines
// between two `---` fences, split by hand.

const rawModules = import.meta.glob("./content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function parseFrontMatter(raw) {
  const meta = { title: "", tags: [] };
  let body = raw;
  const trimmed = raw.replace(/^﻿/, "");
  if (trimmed.startsWith("---")) {
    const end = trimmed.indexOf("\n---", 3);
    if (end !== -1) {
      const block = trimmed.slice(3, end).trim();
      body = trimmed.slice(end + 4).replace(/^\r?\n/, "");
      for (const line of block.split("\n")) {
        const i = line.indexOf(":");
        if (i === -1) continue;
        const key = line.slice(0, i).trim().toLowerCase();
        const value = line.slice(i + 1).trim();
        if (key === "title") meta.title = value;
        else if (key === "tags")
          meta.tags = value
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
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
  trauma: "Trauma & Fractures",
  arthroplasty: "Arthroplasty & Degenerative",
  sports: "Sports & Arthroscopy",
  spine: "Spine",
  "hand-wrist": "Hand & Wrist",
  "foot-ankle": "Foot & Ankle",
  peds: "Pediatrics",
  "onco-metabolic": "Tumors, Infection & Metabolic",
  principles: "Principles & Procedures",
  classifications: "Classifications",
  techniques: "Techniques",
  checklists: "Checklists",
  notes: "Notes",
};

function buildArticles() {
  const articles = [];
  for (const [path, raw] of Object.entries(rawModules)) {
    // path looks like "./content/classifications/_template-classification.md"
    const m = path.match(/^\.\/content\/([^/]+)\/([^/]+)\.md$/);
    if (!m) continue;
    const [, category, slug] = m;
    const { meta, body } = parseFrontMatter(raw);
    articles.push({
      id: `${category}/${slug}`,
      category,
      categoryLabel: CATEGORY_LABELS[category] || titleCase(category),
      slug,
      title: meta.title || titleCase(slug),
      tags: meta.tags,
      body,
    });
  }
  articles.sort((a, b) => a.title.localeCompare(b.title));
  return articles;
}

export const ARTICLES = buildArticles();

// Articles written in-app (stored on-device) get normalized to the same
// shape as bundled ones and merged everywhere below.
export function normalizeLocal(localArticles = []) {
  return localArticles.map((a) => ({
    ...a,
    categoryLabel: CATEGORY_LABELS[a.category] || titleCase(a.category),
    slug: a.id,
    tags: a.tags || [],
    local: true,
  }));
}

export function allArticles(local = []) {
  const merged = [...ARTICLES, ...normalizeLocal(local)];
  merged.sort((a, b) => a.title.localeCompare(b.title));
  return merged;
}

export function categories(local = []) {
  const all = allArticles(local);
  return Object.keys(CATEGORY_LABELS).map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    count: all.filter((a) => a.category === key).length,
  }));
}

export const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS);

export function getArticle(id, local = []) {
  return allArticles(local).find((a) => a.id === id);
}

export function articlesInCategory(key, local = []) {
  return allArticles(local).filter((a) => a.category === key);
}
