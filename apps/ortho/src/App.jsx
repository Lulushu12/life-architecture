import { useEffect, useState } from "react";
import { loadStore, saveStore, toggleFavorite, recordRecent } from "./storage.js";
import Home from "./Home.jsx";
import CategoryView from "./CategoryView.jsx";
import ArticleView from "./ArticleView.jsx";
import SearchView from "./SearchView.jsx";

export default function App() {
  const [store, setStore] = useState(loadStore);
  const [view, setView] = useState({ screen: "home" });

  // Write-through persistence: every state change hits localStorage
  // immediately, so closing or killing the app never loses favorites/recents.
  useEffect(() => {
    saveStore(store);
  }, [store]);

  const goHome = () => setView({ screen: "home" });
  const openCategory = (key) => setView({ screen: "category", key });
  const openArticle = (id, back) => setView({ screen: "article", id, back: back || { screen: "home" } });
  const openSearch = () => setView({ screen: "search" });

  const onToggleFavorite = (id) => setStore((s) => toggleFavorite(s, id));
  const onView = (id) => setStore((s) => recordRecent(s, id));

  if (view.screen === "category")
    return (
      <CategoryView
        categoryKey={view.key}
        onOpenArticle={(id) => openArticle(id, { screen: "category", key: view.key })}
        onHome={goHome}
      />
    );

  if (view.screen === "article")
    return (
      <ArticleView
        articleId={view.id}
        store={store}
        onToggleFavorite={onToggleFavorite}
        onView={onView}
        onBack={() => setView(view.back || { screen: "home" })}
      />
    );

  if (view.screen === "search")
    return <SearchView onOpenArticle={(id) => openArticle(id, { screen: "search" })} onHome={goHome} />;

  return (
    <Home
      store={store}
      onOpenCategory={openCategory}
      onOpenArticle={openArticle}
      onSearch={openSearch}
    />
  );
}
