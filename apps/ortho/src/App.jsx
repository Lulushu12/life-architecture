import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { usePersistentStore } from "@shared/store.js";
import { useHistoryNav } from "@shared/useHistoryNav.js";
import { registerSw } from "@shared/swRegister.js";
import { useToast } from "@shared/ui.jsx";
import {
  storeDef,
  STORE_KEY,
  toggleFavorite,
  recordRecent,
  upsertLocalArticle,
  deleteLocalArticle,
  restoreLocalArticle,
  setDraft,
  newId,
} from "./storage.js";
import Home from "./Home.jsx";
import CategoryView from "./CategoryView.jsx";
import ArticleView from "./ArticleView.jsx";
import SearchView from "./SearchView.jsx";
import Editor, { draftKey } from "./Editor.jsx";
import ConcursHome from "./ConcursHome.jsx";
import ConcursProbe from "./ConcursProbe.jsx";
import ConcursTopic from "./ConcursTopic.jsx";

const HOME = { screen: "home" };
const VIEW_KEY = "ortho:view";
let booted = false;

const withKey = (v) => ({ ...v, k: newId().slice(0, 8) });

function stackFor(v) {
  if (!v || !v.screen || v.screen === "home") return [HOME];
  switch (v.screen) {
    case "edit":
      return v.id ? [HOME, { screen: "article", id: v.id }, v] : [HOME, v];
    case "concurs-probe":
    case "concurs-topic":
      return [HOME, { screen: "concurs" }, v];
    default:
      return [HOME, v];
  }
}

export default function App() {
  const [store, setStore, status] = usePersistentStore(storeDef);
  const { view, nav: pushView, back, replace } = useHistoryNav(HOME, { persistKey: VIEW_KEY });
  const toast = useToast();
  const scrollMemo = useRef(new Map());
  const viewRef = useRef(view);
  viewRef.current = view;
  const local = store.localArticles;

  useEffect(() => {
    registerSw({
      onUpdate: (reload) =>
        toast("Update available", { action: { label: "Reload", onClick: reload }, duration: 0 }),
    });
  }, [toast]);

  useEffect(() => {
    if (booted) return;
    booted = true;
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    if (action) {
      params.delete("action");
      const qs = params.toString();
      window.history.replaceState(window.history.state, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);
    }
    const chain = action === "search" ? [HOME, { screen: "search" }] : stackFor(viewRef.current);
    replace(withKey(chain[0]));
    for (const v of chain.slice(1)) pushView(withKey(v));
  }, [replace, pushView]);

  const nav = useCallback(
    (v) => {
      const cur = viewRef.current;
      if (cur.k) scrollMemo.current.set(cur.k, window.scrollY);
      pushView(withKey(v));
    },
    [pushView]
  );

  const patchView = useCallback((patch) => replace({ ...viewRef.current, ...patch }), [replace]);

  useLayoutEffect(() => {
    if (view.screen === "article") return;
    const y = view.k ? scrollMemo.current.get(view.k) : undefined;
    window.scrollTo(0, y || 0);
  }, [view.k, view.screen]);

  const openArticle = useCallback((id) => nav({ screen: "article", id }), [nav]);
  const onToggleFavorite = useCallback((id) => setStore((s) => toggleFavorite(s, id)), [setStore]);
  const onView = useCallback((id) => setStore((s) => recordRecent(s, id)), [setStore]);

  const banner = (!status.ok || store._recovered) && (
    <div className="page bannerpage">
      {!status.ok && <p className="warn banner">Storage full: changes are not being saved.</p>}
      {store._recovered && (
        <p className="warn banner">
          Saved data was unreadable and has been reset; the raw copy is under {STORE_KEY}.corrupt
        </p>
      )}
    </div>
  );

  let screen;
  if (view.screen === "concurs") {
    screen = <ConcursHome store={store} onOpenProbe={(key) => nav({ screen: "concurs-probe", key })} onBack={back} />;
  } else if (view.screen === "concurs-probe") {
    screen = (
      <ConcursProbe
        probeKey={view.key}
        store={store}
        setStore={setStore}
        onOpenTopic={(id) => nav({ screen: "concurs-topic", id })}
        onBack={back}
      />
    );
  } else if (view.screen === "concurs-topic") {
    screen = (
      <ConcursTopic
        topicId={view.id}
        store={store}
        setStore={setStore}
        initialMode={view.mode}
        onOpenArticle={openArticle}
        onBack={back}
      />
    );
  } else if (view.screen === "category") {
    screen = (
      <CategoryView
        categoryKey={view.key}
        local={local}
        region={view.region || ""}
        specialty={view.specialty || ""}
        onFilter={patchView}
        onOpenArticle={openArticle}
        onNew={() => nav({ screen: "edit", defaultCategory: view.key })}
        onBack={back}
      />
    );
  } else if (view.screen === "article") {
    screen = (
      <ArticleView
        key={view.id}
        articleId={view.id}
        store={store}
        setStore={setStore}
        onToggleFavorite={onToggleFavorite}
        onView={onView}
        onOpenArticle={openArticle}
        onEdit={() => nav({ screen: "edit", id: view.id })}
        onBack={back}
      />
    );
  } else if (view.screen === "search") {
    screen = (
      <SearchView
        local={local}
        initialQuery={view.q || ""}
        onQuery={(q) => patchView({ q })}
        onOpenArticle={openArticle}
        onBack={back}
      />
    );
  } else if (view.screen === "edit") {
    const article = view.id ? local.find((a) => a.id === view.id) : null;
    screen = (
      <Editor
        key={view.id || "new"}
        article={article}
        defaultCategory={view.defaultCategory}
        draft={store.drafts[draftKey(article)]}
        setStore={setStore}
        onSave={(a) => setStore((s) => setDraft(upsertLocalArticle(s, a), draftKey(article), null))}
        onDelete={(a) => {
          const snapshot = {
            article: local.find((x) => x.id === a.id) || a,
            favorite: store.favorites.includes(a.id),
            recentIndex: store.recents.indexOf(a.id),
          };
          setStore((s) => setDraft(deleteLocalArticle(s, a.id), draftKey(a), null));
          toast.undo("Article deleted", () => setStore((s) => restoreLocalArticle(s, snapshot)));
        }}
        onExit={(action, saved) => {
          if (action === "saved" && !article && saved) replace(withKey({ screen: "article", id: saved.id }));
          else if (action === "deleted") window.history.go(-2);
          else back();
        }}
      />
    );
  } else {
    screen = (
      <Home
        store={store}
        setStore={setStore}
        onOpenCategory={(key) => nav({ screen: "category", key })}
        onOpenArticle={openArticle}
        onSearch={() => nav({ screen: "search" })}
        onNew={() => nav({ screen: "edit" })}
        onConcurs={() => nav({ screen: "concurs" })}
      />
    );
  }

  return (
    <>
      {banner}
      {screen}
    </>
  );
}
