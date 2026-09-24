import { BackupPanel } from "@shared/BackupPanel.jsx";
import { categories, getArticle, recentlyUpdated, formatDate } from "./content.js";
import { mergeImport, validateBackup, STORE_KEY } from "./storage.js";
import { ArticleRow, RowButton } from "./ui.jsx";

export default function Home({ store, setStore, onOpenCategory, onOpenArticle, onSearch, onNew }) {
  const local = store.localArticles;
  const favorites = store.favorites.map((id) => getArticle(id, local)).filter(Boolean);
  const recents = store.recents.map((id) => getArticle(id, local)).filter(Boolean);
  const updated = recentlyUpdated(local);

  return (
    <div className="page">
      <h1 className="apptitle">
        Ortho <span>Reference</span>
      </h1>

      <button type="button" className="input searchbox" onClick={onSearch}>
        <span className="searchbox-icon" aria-hidden="true">🔍</span>
        <span className="searchbox-placeholder">Search classifications, techniques…</span>
      </button>

      <button type="button" className="bigbtn newbtn" onClick={onNew}>
        + New article
      </button>

      {updated.length > 0 && (
        <>
          <h2>Recently updated</h2>
          <div className="updstrip">
            {updated.map((a) => (
              <button
                key={a.id}
                type="button"
                className="updcard"
                onClick={() => onOpenArticle(a.id)}
              >
                <span className="updcard-title">{a.title}</span>
                <span className="updcard-sub">
                  {a.categoryLabel} · {formatDate(a.updated)}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <h2>Categories</h2>
      {categories(local).map((c) => (
        <RowButton key={c.key} className="catcard" onClick={() => onOpenCategory(c.key)}>
          <span className="catcard-main">
            <span className="catcard-title">{c.label}</span>
            <span className="catcard-sub">
              {c.count} article{c.count === 1 ? "" : "s"}
            </span>
          </span>
          <span className="catcard-arrow" aria-hidden="true">›</span>
        </RowButton>
      ))}

      {favorites.length > 0 && (
        <>
          <h2>Favorites</h2>
          {favorites.map((a) => (
            <ArticleRow key={a.id} article={a} onOpen={onOpenArticle} meta={a.categoryLabel} star />
          ))}
        </>
      )}

      {recents.length > 0 && (
        <>
          <h2>Recently viewed</h2>
          {recents.map((a) => (
            <ArticleRow key={a.id} article={a} onOpen={onOpenArticle} meta={a.categoryLabel} />
          ))}
        </>
      )}

      <h2>Backup</h2>
      <BackupPanel
        data={store}
        onRestore={(d) => setStore((s) => mergeImport(s, d))}
        validate={validateBackup}
        prefix="ortho"
        storageKey={STORE_KEY}
        strip={["_recovered"]}
      />

      <p className="hint small footernote">
        "+ New article" writes are stored on this device (back them up with Export). For the permanent
        shared library, edit the Markdown files in apps/ortho/src/content/ on GitHub; changes deploy
        automatically.
      </p>
    </div>
  );
}
