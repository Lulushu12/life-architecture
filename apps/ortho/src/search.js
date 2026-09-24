import { fold } from "./content.js";

const RADIUS = 40;

export function snippetFor(result) {
  const { article, idx, len, full } = result;
  const text = article._plain;
  if (!full || text === undefined) return { before: "", match: "", after: "" };
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

export function search(articles, query, full = false) {
  const q = fold(query.trim());
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const results = [];

  for (const a of articles) {
    let score = 0;
    let idx = -1;
    let len = 0;
    const body = full ? a._body : undefined;
    for (const term of terms) {
      if (a._title.includes(term)) score += 10;
      if (a._tags.includes(term)) score += 5;
      if (body === undefined) continue;
      const bi = body.indexOf(term);
      if (bi !== -1) {
        score += 1;
        if (idx === -1) {
          idx = bi;
          len = term.length;
        }
      }
    }
    if (score > 0) results.push({ article: a, score, idx, len, full });
  }

  results.sort((x, y) => y.score - x.score || x.article.title.localeCompare(y.article.title));
  return results;
}
