import { useEffect, useRef } from "react";
import { getArticle } from "./content.js";
import { Markdown } from "./markdown.jsx";
import { TopBar, StarButton, Chips } from "./ui.jsx";

export default function ArticleView({ articleId, store, onToggleFavorite, onView, onBack }) {
  const article = getArticle(articleId);
  const recorded = useRef(null);

  useEffect(() => {
    if (article && recorded.current !== article.id) {
      recorded.current = article.id;
      onView(article.id);
    }
  }, [article, onView]);

  if (!article) {
    return (
      <div className="page">
        <TopBar title="Not found" onBack={onBack} />
        <p className="hint">This article no longer exists.</p>
      </div>
    );
  }

  const isFav = store.favorites.includes(article.id);

  return (
    <div className="page">
      <TopBar
        title={article.title}
        subtitle={article.categoryLabel}
        onBack={onBack}
        right={
          <StarButton active={isFav} onToggle={() => onToggleFavorite(article.id)} />
        }
      />
      <Chips tags={article.tags} />
      <div className="card articlebody">
        <Markdown text={article.body} />
      </div>
    </div>
  );
}
