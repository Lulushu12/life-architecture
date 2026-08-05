import { useRef } from "react";
import { categories, getArticle } from "./content.js";
import { exportStore, mergeImport } from "./storage.js";

export default function Home({ store, setStore, onOpenCategory, onOpenArticle, onSearch, onNew }) {
  const fileRef = useRef();
  const local = store.localArticles;
  const favorites = store.favorites.map((id) => getArticle(id, local)).filter(Boolean);
  const recents = store.recents.map((id) => getArticle(id, local)).filter(Boolean);

  const onImport = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((t) => {
      try {
        setStore((s) => mergeImport(s, JSON.parse(t)));
        alert("Import complete.");
      } catch {
        alert("Not a valid backup file.");
      }
    });
    e.target.value = "";
  };

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

      <div className="backuprow">
        <button className="linkbtn" onClick={() => exportStore(store)}>
          Export backup
        </button>
        <button className="linkbtn" onClick={() => fileRef.current.click()}>
          Import backup
        </button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
      </div>

      <p className="hint small footernote">
        "+ New article" writes are stored on this device (back them up with Export).
        For the permanent shared library, edit the Markdown files in
        apps/ortho/src/content/ on GitHub — changes deploy automatically.
      </p>
    </div>
  );
}
