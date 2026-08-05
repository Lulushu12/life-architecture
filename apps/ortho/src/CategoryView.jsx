import { articlesInCategory, categories } from "./content.js";
import { TopBar, ArticleRow } from "./ui.jsx";

export default function CategoryView({ categoryKey, local, onOpenArticle, onNew, onHome }) {
  const meta = categories(local).find((c) => c.key === categoryKey);
  const articles = articlesInCategory(categoryKey, local);

  return (
    <div className="page">
      <TopBar
        title={meta ? meta.label : categoryKey}
        subtitle={`${articles.length} article${articles.length === 1 ? "" : "s"}`}
        onBack={onHome}
        right={
          <button className="linkbtn" onClick={onNew}>
            + New
          </button>
        }
      />
      {articles.length === 0 && <p className="hint">No articles in this category yet.</p>}
      {articles.map((a) => (
        <ArticleRow key={a.id} article={a} onOpen={onOpenArticle} />
      ))}
    </div>
  );
}
