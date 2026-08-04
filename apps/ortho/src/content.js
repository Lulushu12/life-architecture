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

export const CATEGORIES = Object.keys(CATEGORY_LABELS).map((key) => ({
  key,
  label: CATEGORY_LABELS[key],
  count: ARTICLES.filter((a) => a.category === key).length,
}));

export function getArticle(id) {
  return ARTICLES.find((a) => a.id === id);
}

export function articlesInCategory(key) {
  return ARTICLES.filter((a) => a.category === key);
}
