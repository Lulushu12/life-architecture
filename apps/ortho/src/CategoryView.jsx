import { articlesInCategory, CATEGORIES } from "./content.js";
import { TopBar, ArticleRow } from "./ui.jsx";

export default function CategoryView({ categoryKey, onOpenArticle, onHome }) {
  const meta = CATEGORIES.find((c) => c.key === categoryKey);
  const articles = articlesInCategory(categoryKey);

  return (
    <div className="page">
      <TopBar
        title={meta ? meta.label : categoryKey}
        subtitle={`${articles.length} article${articles.length === 1 ? "" : "s"}`}
        onBack={onHome}
      />
      {articles.length === 0 && <p className="hint">No articles in this category yet.</p>}
      {articles.map((a) => (
        <ArticleRow key={a.id} article={a} onOpen={onOpenArticle} />
      ))}
    </div>
  );
}
