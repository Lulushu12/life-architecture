import { categories, getArticle } from "./content.js";
import { mergeImport } from "./storage.js";
import BackupPanel from "./BackupPanel.jsx";

export default function Home({ store, setStore, onOpenCategory, onOpenArticle, onSearch, onNew }) {
  const local = store.localArticles;
  const favorites = store.favorites.map((id) => getArticle(id, local)).filter(Boolean);
  const recents = store.recents.map((id) => getArticle(id, local)).filter(Boolean);

  return (
    <div className="page">
      <h1 className="apptitle">
        Ortho <span>Reference</span>
      </h1>

      <button className="input searchbox" onClick={onSearch}>
        <span className="searchbox-icon">🔍</span>
        <span className="searchbox-placeholder">Search classifications, techniques…</span>
      </button>

      <button className="bigbtn newbtn" onClick={onNew}>
        + New article
      </button>

      <h2>Categories</h2>
      {categories(local).map((c) => (
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

      <BackupPanel
        data={store}
        onRestore={(d) => setStore((s) => mergeImport(s, d))}
        validate={(d) => Boolean(d && (d.localArticles || d.favorites || d.recents))}
        prefix="ortho"
      />

      <p className="hint small footernote">
        "+ New article" writes are stored on this device (back them up with Export).
        For the permanent shared library, edit the Markdown files in
        apps/ortho/src/content/ on GitHub — changes deploy automatically.
      </p>
    </div>
  );
}
