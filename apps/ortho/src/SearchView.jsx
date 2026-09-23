import { useEffect, useMemo, useRef, useState } from "react";
import { allArticles, formatDate } from "./content.js";
import { search, snippetFor } from "./search.js";
import { TopBar, RowButton } from "./ui.jsx";

const PAGE = 40;

function Result({ result, onOpen }) {
  const { article } = result;
  const snippet = useMemo(() => snippetFor(result), [result]);
  return (
    <RowButton className="articlerow searchresult" onClick={() => onOpen(article.id)}>
      <span className="articlerow-title">{article.title}</span>
      <span className="articlerow-tags">
        {article.categoryLabel}
        {article.updated ? ` · Updated ${formatDate(article.updated)}` : ""}
      </span>
      {(snippet.before || snippet.match || snippet.after) && (
        <span className="snippet">
          {snippet.before}
          {snippet.match && <mark>{snippet.match}</mark>}
          {snippet.after}
        </span>
      )}
    </RowButton>
  );
}

export default function SearchView({ local, initialQuery, onQuery, onOpenArticle, onBack }) {
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [limit, setLimit] = useState(PAGE);
  const onQueryRef = useRef(onQuery);
  onQueryRef.current = onQuery;

  useEffect(() => {
    if (query === debounced) return undefined;
    const t = setTimeout(() => {
      setDebounced(query);
      setLimit(PAGE);
      onQueryRef.current(query);
    }, 100);
    return () => clearTimeout(t);
  }, [query, debounced]);

  const articles = allArticles(local);
  const results = useMemo(() => search(articles, debounced), [articles, debounced]);
  const shown = results.slice(0, limit);

  return (
    <div className="page">
      <TopBar title="Search" onBack={onBack} />
      <input
        className="input"
        type="search"
        autoFocus={!initialQuery}
        aria-label="Search articles"
        placeholder="Search classifications, techniques…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {debounced.trim() !== "" && (
        <p className="hint small" aria-live="polite">
          {results.length === 0 ? `No matches for "${debounced}".` : `${results.length} result${results.length === 1 ? "" : "s"}`}
        </p>
      )}
      {shown.map((r) => (
        <Result key={r.article.id} result={r} onOpen={onOpenArticle} />
      ))}
      {results.length > limit && (
        <button type="button" className="bigbtn secondary" onClick={() => setLimit((l) => l + PAGE)}>
          Show more ({results.length - limit} left)
        </button>
      )}
      {query.trim() === "" && <p className="hint small">Start typing to search titles, tags, and article text.</p>}
    </div>
  );
}
