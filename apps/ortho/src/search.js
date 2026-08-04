// Live client-side full-text search across title (boosted), tags, and body.
// Returns results sorted by score, each carrying a highlighted snippet.

function normalizeBody(body) {
  // Strip the most disruptive markdown punctuation so snippets read as
  // plain text, then collapse whitespace/newlines to single spaces.
  return body
    .replace(/```/g, " ")
    .replace(/[#>*`|_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSnippet(norm, idx, len) {
  const RADIUS = 40;
  if (idx === -1) {
    return { before: "", match: "", after: norm.slice(0, 100) };
  }
  const start = Math.max(0, idx - RADIUS);
  const end = Math.min(norm.length, idx + len + RADIUS);
  let before = norm.slice(start, idx);
  const match = norm.slice(idx, idx + len);
  let after = norm.slice(idx + len, end);
  if (start > 0) before = "…" + before;
  if (end < norm.length) after = after + "…";
  return { before, match, after };
}

export function search(articles, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const results = [];

  for (const a of articles) {
    const titleLower = a.title.toLowerCase();
    const tagsLower = a.tags.join(" ").toLowerCase();
    const norm = normalizeBody(a.body);
    const normLower = norm.toLowerCase();

    let score = 0;
    let bestIdx = -1;
    let bestLen = 0;
    for (const term of terms) {
      if (titleLower.includes(term)) score += 10;
      if (tagsLower.includes(term)) score += 5;
      const bi = normLower.indexOf(term);
      if (bi !== -1) {
        score += 1;
        if (bestIdx === -1) {
          bestIdx = bi;
          bestLen = term.length;
        }
      }
    }
    if (score <= 0) continue;
    results.push({ article: a, score, snippet: buildSnippet(norm, bestIdx, bestLen) });
  }

  results.sort((x, y) => y.score - x.score);
  return results;
}
