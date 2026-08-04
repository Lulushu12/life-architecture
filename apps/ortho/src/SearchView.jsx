import { useState } from "react";
import { ARTICLES } from "./content.js";
import { search } from "./search.js";
import { TopBar } from "./ui.jsx";

export default function SearchView({ onOpenArticle, onHome }) {
  const [query, setQuery] = useState("");
  const results = search(ARTICLES, query);

  return (
    <div className="page">
      <TopBar title="Search" onBack={onHome} />
      <input
        className="input"
        autoFocus
        placeholder="Search classifications, techniques…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query.trim() !== "" && results.length === 0 && (
        <p className="hint">No matches for "{query}".</p>
      )}
      {results.map(({ article, snippet }) => (
        <div key={article.id} className="card searchresult" onClick={() => onOpenArticle(article.id)}>
          <div className="articlerow-title">{article.title}</div>
          <div className="articlerow-tags">{article.categoryLabel}</div>
          {(snippet.before || snippet.match || snippet.after) && (
            <div className="snippet">
              {snippet.before}
              {snippet.match && <mark>{snippet.match}</mark>}
              {snippet.after}
            </div>
          )}
        </div>
      ))}
      {query.trim() === "" && (
        <p className="hint small">Start typing to search titles, tags, and article text.</p>
      )}
    </div>
  );
}
