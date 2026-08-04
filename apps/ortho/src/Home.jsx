import { CATEGORIES, getArticle } from "./content.js";

export default function Home({ store, onOpenCategory, onOpenArticle, onSearch }) {
  const favorites = store.favorites
    .map((id) => getArticle(id))
    .filter(Boolean);
  const recents = store.recents
    .map((id) => getArticle(id))
    .filter(Boolean);

  return (
    <div className="page">
      <h1 className="apptitle">
        Ortho <span>Reference</span>
      </h1>

      <button className="input searchbox" onClick={onSearch}>
        <span className="searchbox-icon">🔍</span>
        <span className="searchbox-placeholder">Search classifications, techniques…</span>
      </button>

      <h2>Categories</h2>
      {CATEGORIES.map((c) => (
        <div key={c.key} className="card catcard" onClick={() => onOpenCategory(c.key)}>
          <div className="catcard-main">
            <div className="catcard-title">{c.label}</div>
            <div className="catcard-sub">
              {c.count} article{c.count === 1 ? "" : "s"}
            </div>
          </div>
          <span className="catcard-arrow">›</span>
        </div>
      ))}

      {favorites.length > 0 && (
        <>
          <h2>Favorites</h2>
          {favorites.map((a) => (
            <div key={a.id} className="card articlerow" onClick={() => onOpenArticle(a.id)}>
              <div className="articlerow-title">
                <span className="star-inline">★</span> {a.title}
              </div>
              <div className="articlerow-tags">{a.categoryLabel}</div>
            </div>
          ))}
        </>
      )}

      {recents.length > 0 && (
        <>
          <h2>Recently viewed</h2>
          {recents.map((a) => (
            <div key={a.id} className="card articlerow" onClick={() => onOpenArticle(a.id)}>
              <div className="articlerow-title">{a.title}</div>
              <div className="articlerow-tags">{a.categoryLabel}</div>
            </div>
          ))}
        </>
      )}

      <p className="hint small footernote">
        Add or edit articles by editing files in apps/ortho/src/content/ — each
        becomes available offline after the next deploy.
      </p>
    </div>
  );
}
