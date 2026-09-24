import { Suspense, lazy, useCallback, useEffect, useMemo, useRef } from "react";
import { usePersistentStore } from "@shared/store.js";
import { useHistoryNav } from "@shared/useHistoryNav.js";
import { registerSw } from "@shared/swRegister.js";
import { useToast } from "@shared/ui.jsx";
import { chessStore, capStore, STORAGE_KEY } from "./storage.js";
import Home from "./Home.jsx";
import PlayBot from "./PlayBot.jsx";
import PassPlay from "./PassPlay.jsx";
import Analysis from "./Analysis.jsx";
import ReviewScreen from "./ReviewScreen.jsx";
import Archive from "./Archive.jsx";
import BlunderTrainer from "./Puzzles.jsx";
import { PuzzleHome, TierTrainer, RushTrainer, DueReview } from "./PuzzleSets.jsx";

const Openings = lazy(() => import("./Openings.jsx"));
const PositionEditor = lazy(() => import("./PositionEditor.jsx"));
const EngineMatch = lazy(() => import("./EngineMatch.jsx"));
const GamesDB = lazy(() => import("./GamesDB.jsx"));
const Lessons = lazy(() => import("./Lessons.jsx"));
const Settings = lazy(() => import("./Settings.jsx"));
const Drill = lazy(() => import("./Drill.jsx"));
const Stats = lazy(() => import("./Stats.jsx"));

const QUOTA_CHARS = 5 * 1024 * 1024;
const NEAR_FULL = 0.85;
const ACTIONS = { play: { screen: "play", pick: true }, puzzles: { screen: "puzzles" }, analysis: { screen: "analysis" } };

function StorageBanner({ store, status }) {
  const used = useMemo(() => {
    try {
      return JSON.stringify(store.games).length + JSON.stringify(store.puzzles).length;
    } catch {
      return 0;
    }
  }, [store.games, store.puzzles]);
  let text = null;
  if (!status.ok) text = "Storage full: changes are not being saved. Export and delete old games in the Archive to free space.";
  else if (store._recovered)
    text = `Saved data was unreadable and has been reset; the raw copy is under ${STORAGE_KEY}.corrupt`;
  else if (used > QUOTA_CHARS * NEAR_FULL)
    text = `Storage nearly full: about ${(used / 1048576).toFixed(1)} of 5 MB used. Export and delete old games soon.`;
  if (!text) return null;
  return (
    <div className="page storagebanner-wrap">
      <p className="warn storagebanner" role="alert">
        {text}
      </p>
    </div>
  );
}

export default function App() {
  const [store, setRawStore, status] = usePersistentStore(chessStore);
  const { view, nav: go } = useHistoryNav({ screen: "home" }, { persistKey: "chess:view" });
  const toast = useToast();
  const viewRef = useRef(view);
  viewRef.current = view;

  const setStore = useCallback(
    (u) => setRawStore((s) => capStore(typeof u === "function" ? u(s) : u, [viewRef.current.gameId])),
    [setRawStore]
  );

  const nav = useCallback((screen, params = {}) => go({ screen, ...params }), [go]);

  useEffect(() => {
    registerSw({
      onUpdate: (reload) =>
        toast("Update available", { action: { label: "Reload", onClick: reload }, duration: 0 }),
    });
  }, [toast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = ACTIONS[params.get("action")];
    if (!params.has("action")) return;
    window.history.replaceState({ view: { screen: "home" } }, "", window.location.pathname);
    if (target) go(target);
  }, [go]);

  const capHits = store.capHits || 0;
  const lastCap = useRef(capHits);
  useEffect(() => {
    if (capHits > lastCap.current) {
      const n = capHits - lastCap.current;
      toast(`Archive full: ${n} old ${n === 1 ? "game was" : "games were"} removed. Star games to keep them.`, {
        duration: 7000,
      });
    }
    lastCap.current = capHits;
  }, [capHits, toast]);

  const props = { store, setStore, nav, view };
  return (
    <>
      <StorageBanner store={store} status={status} />
      <Suspense fallback={<div className="page"><p className="hint">Loading…</p></div>}>
        <Screen view={view} props={props} />
      </Suspense>
    </>
  );
}

function Screen({ view, props }) {
  switch (view.screen) {
    case "play":
      return <PlayBot {...props} />;
    case "passplay":
      return <PassPlay {...props} />;
    case "analysis":
      return <Analysis {...props} />;
    case "review":
      return <ReviewScreen {...props} />;
    case "archive":
      return <Archive {...props} />;
    case "openings":
      return <Openings {...props} />;
    case "games":
      return <GamesDB {...props} />;
    case "editor":
      return <PositionEditor {...props} />;
    case "enginematch":
      return <EngineMatch {...props} />;
    case "puzzles":
      if (view.set === "blunders") return <BlunderTrainer {...props} />;
      if (view.set === "rush" || view.set === "streak") return <RushTrainer key={view.set} {...props} mode={view.set} />;
      if (view.set === "due") return <DueReview {...props} />;
      if (view.set) return <TierTrainer {...props} tierKey={view.set} />;
      return <PuzzleHome {...props} />;
    case "lessons":
      return <Lessons {...props} />;
    case "settings":
      return <Settings {...props} />;
    case "drill":
      return <Drill {...props} />;
    case "stats":
      return <Stats {...props} />;
    default:
      return <Home {...props} />;
  }
}
