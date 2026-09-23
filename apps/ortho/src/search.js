import { fold, plainText } from "./content.js";

const RADIUS = 40;
const plainCache = new Map();

function plainOf(a) {
  let p = plainCache.get(a);
  if (p === undefined) {
    p = a._aligned ? plainText(a.body) : a._body;
    if (plainCache.size > 200) plainCache.clear();
    plainCache.set(a, p);
  }
  return p;
}

export function snippetFor(result) {
  const { article, idx, len } = result;
  const text = plainOf(article);
  if (idx === -1) return { before: "", match: "", after: text.slice(0, 100) + (text.length > 100 ? "…" : "") };
  const start = Math.max(0, idx - RADIUS);
  const end = Math.min(text.length, idx + len + RADIUS);
  let before = text.slice(start, idx);
  const match = text.slice(idx, idx + len);
  let after = text.slice(idx + len, end);
  if (start > 0) before = "…" + before;
  if (end < text.length) after = after + "…";
  return { before, match, after };
}

export function search(articles, query) {
  const q = fold(query.trim());
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const results = [];

  for (const a of articles) {
    let score = 0;
    let idx = -1;
    let len = 0;
    for (const term of terms) {
      if (a._title.includes(term)) score += 10;
      if (a._tags.includes(term)) score += 5;
      const bi = a._body.indexOf(term);
      if (bi !== -1) {
        score += 1;
        if (idx === -1) {
          idx = bi;
          len = term.length;
        }
      }
    }
    if (score > 0) results.push({ article: a, score, idx, len });
  }

  results.sort((x, y) => y.score - x.score || x.article.title.localeCompare(y.article.title));
  return results;
}
