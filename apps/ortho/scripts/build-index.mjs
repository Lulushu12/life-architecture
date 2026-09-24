import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  TRAILER_RE,
  parseFrontMatter,
  titleCase,
  plainText,
  stripTemplateIntro,
  linkTrailer,
} from "../src/mdmeta.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const CONTENT = path.join(SRC, "content");
export const INDEX_FILE = path.join(SRC, "content-index.json");
export const FULLTEXT_FILE = path.join(SRC, "content-fulltext.json");
const SKIP = new Set(["concurs"]);

function readContent() {
  const files = [];
  for (const category of fs.readdirSync(CONTENT).sort()) {
    const dir = path.join(CONTENT, category);
    if (SKIP.has(category) || !fs.statSync(dir).isDirectory()) continue;
    for (const name of fs.readdirSync(dir).sort()) {
      if (!name.endsWith(".md") || !fs.statSync(path.join(dir, name)).isFile()) continue;
      files.push({ category, slug: name.slice(0, -3), raw: fs.readFileSync(path.join(dir, name), "utf8") });
    }
  }
  return files;
}

export function buildIndex() {
  const templates = {};
  const articles = [];
  for (const { category, slug, raw } of readContent()) {
    const { meta, body } = parseFrontMatter(raw);
    if (slug.startsWith("_")) {
      if (!templates[category]) templates[category] = stripTemplateIntro(body);
      continue;
    }
    articles.push({
      id: `${category}/${slug}`,
      category,
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
    (backlinks[target] ||= []).push(a.id);
  }

  const fulltext = {};
  const index = [];
  for (const a of articles) {
    fulltext[a.id] = plainText(a.fullContext ? linkTrailer(a.body, a.fullContext) : a.body);
    const entry = { id: a.id, title: a.title, tags: a.tags };
    for (const k of ["region", "specialty", "updated", "lang", "fullContext"]) if (a[k]) entry[k] = a[k];
    if (backlinks[a.id]) entry.referencedBy = backlinks[a.id];
    index.push(entry);
  }
  return { index: { articles: index, templates }, fulltext };
}

function writeIfChanged(file, data) {
  const text = JSON.stringify(data) + "\n";
  let old = null;
  try {
    old = fs.readFileSync(file, "utf8");
  } catch {}
  if (old === text) return false;
  fs.writeFileSync(file, text);
  return true;
}

export function writeIndex() {
  const { index, fulltext } = buildIndex();
  const a = writeIfChanged(INDEX_FILE, index);
  const b = writeIfChanged(FULLTEXT_FILE, fulltext);
  return { articles: index.articles.length, changed: a || b };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { articles, changed } = writeIndex();
  console.log(`content index: ${articles} articles${changed ? " (updated)" : ""}`);
}
