import { useEffect, useMemo, useRef, useState } from "react";
import { allArticles, formatDate, isFulltextLoaded, loadFulltext } from "./content.js";
import { search, snippetFor } from "./search.js";
import { TopBar, RowButton } from "./ui.jsx";

const PAGE = 40;
const FULL_MIN = 3;

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

function SearchInside({ loading, error, onClick }) {
  if (loading) return <p className="hint small" aria-live="polite">Loading article text…</p>;
  return (
    <>
      {error && <p className="warn">Could not load article text. Check your connection and try again.</p>}
      <button type="button" className="bigbtn secondary" onClick={onClick}>
        Search inside articles
      </button>
    </>
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

  const [full, setFull] = useState(isFulltextLoaded);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const searchInside = () => {
    setLoading(true);
    setLoadError(false);
    loadFulltext().then(
      () => {
        if (!alive.current) return;
        setLoading(false);
        setFull(true);
      },
      () => {
        if (!alive.current) return;
        setLoading(false);
        setLoadError(true);
      }
    );
  };

  const articles = allArticles(local);
  const results = useMemo(() => search(articles, debounced, full), [articles, debounced, full]);
  const shown = results.slice(0, limit);
  const q = debounced.trim();
  const canSearchInside = !full && q.length >= FULL_MIN;

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
          {results.length === 0
            ? `No ${full ? "" : "title or tag "}matches for "${debounced}".`
            : `${results.length} result${results.length === 1 ? "" : "s"}${full ? "" : " in titles and tags"}`}
        </p>
      )}
      {canSearchInside && results.length === 0 && (
        <SearchInside loading={loading} error={loadError} onClick={searchInside} />
      )}
      {shown.map((r) => (
        <Result key={r.article.id} result={r} onOpen={onOpenArticle} />
      ))}
      {results.length > limit && (
        <button type="button" className="bigbtn secondary" onClick={() => setLimit((l) => l + PAGE)}>
          Show more ({results.length - limit} left)
        </button>
      )}
      {canSearchInside && results.length > 0 && (
        <SearchInside loading={loading} error={loadError} onClick={searchInside} />
      )}
      {query.trim() === "" && (
        <p className="hint small">
          {full ? "Start typing to search titles, tags, and article text." : "Start typing to search titles and tags."}
        </p>
      )}
    </div>
  );
}
