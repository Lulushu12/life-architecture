import { useEffect, useState } from "react";
import {
  loadStore,
  saveStore,
  toggleFavorite,
  recordRecent,
  upsertLocalArticle,
  deleteLocalArticle,
} from "./storage.js";
import Home from "./Home.jsx";
import CategoryView from "./CategoryView.jsx";
import ArticleView from "./ArticleView.jsx";
import SearchView from "./SearchView.jsx";
import Editor from "./Editor.jsx";

export default function App() {
  const [store, setStore] = useState(loadStore);
  const [view, setView] = useState({ screen: "home" });
  const local = store.localArticles;

  // Write-through persistence: every state change hits localStorage
  // immediately, so closing or killing the app never loses anything.
  useEffect(() => {
    saveStore(store);
  }, [store]);

  const goHome = () => setView({ screen: "home" });
  const openCategory = (key) => setView({ screen: "category", key });
  const openArticle = (id, back) => setView({ screen: "article", id, back: back || { screen: "home" } });
  const openSearch = () => setView({ screen: "search" });
  const openEditor = (id, defaultCategory) =>
    setView({ screen: "edit", id, defaultCategory, back: view });

  const onToggleFavorite = (id) => setStore((s) => toggleFavorite(s, id));
  const onView = (id) => setStore((s) => recordRecent(s, id));

  if (view.screen === "category")
    return (
      <CategoryView
        categoryKey={view.key}
        local={local}
        onOpenArticle={(id) => openArticle(id, { screen: "category", key: view.key })}
        onNew={() => openEditor(null, view.key)}
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
        onEdit={() => openEditor(view.id)}
        onBack={() => setView(view.back || { screen: "home" })}
      />
    );

  if (view.screen === "search")
    return (
      <SearchView
        local={local}
        onOpenArticle={(id) => openArticle(id, { screen: "search" })}
        onHome={goHome}
      />
    );

  if (view.screen === "edit") {
    const article = view.id ? local.find((a) => a.id === view.id) : null;
    return (
      <Editor
        article={article}
        defaultCategory={view.defaultCategory}
        onSave={(a) => {
          setStore((s) => upsertLocalArticle(s, a));
          setView({ screen: "article", id: a.id, back: { screen: "category", key: a.category } });
        }}
        onDelete={(id) => {
          setStore((s) => deleteLocalArticle(s, id));
          goHome();
        }}
        onCancel={() => setView(view.back || { screen: "home" })}
      />
    );
  }

  return (
    <Home
      store={store}
      setStore={setStore}
      onOpenCategory={openCategory}
      onOpenArticle={openArticle}
      onSearch={openSearch}
      onNew={() => openEditor(null)}
    />
  );
}
