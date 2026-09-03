import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { loadStore, saveStore } from "./storage.js";
import Home from "./Home.jsx";
import PlayBot from "./PlayBot.jsx";
import PassPlay from "./PassPlay.jsx";
import Analysis from "./Analysis.jsx";
import ReviewScreen from "./ReviewScreen.jsx";
import Archive from "./Archive.jsx";
import BlunderTrainer from "./Puzzles.jsx";
import Openings from "./Openings.jsx";
import PositionEditor from "./PositionEditor.jsx";
import EngineMatch from "./EngineMatch.jsx";
import { PuzzleHome, TierTrainer } from "./PuzzleSets.jsx";
import GamesDB from "./GamesDB.jsx";
import Lessons from "./Lessons.jsx";
import Settings from "./Settings.jsx";

export default function App() {
  const [store, setStore] = useState(loadStore);
  const [view, setView] = useState({ screen: "home" });

  // Write-through persistence: every state change hits localStorage
  // immediately — killing the app never loses a game or a review.
  useEffect(() => {
    saveStore(store);
  }, [store]);

  // Every in-app navigation is mirrored into the browser history, so going
  // back pops screens instead of closing the app. Only at the home screen —
  // no history left — does back leave the app.
  useEffect(() => {
    window.history.replaceState({ view: { screen: "home" } }, "");
    const onPop = (e) => setView(e.state?.view || { screen: "home" });
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // The browser back button fires popstate on its own, but Android's hardware
  // back does NOT reach the WebView by default — Capacitor closes the activity
  // unless something listens for its backButton event. So in the APK: pop our
  // history while there is any, exit only from the home screen.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const sub = CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else CapacitorApp.exitApp();
    });
    return () => {
      Promise.resolve(sub).then((h) => h.remove());
    };
  }, []);

  const nav = (screen, params = {}) => {
    const v = { screen, ...params };
    setView(v);
    window.history.pushState({ view: v }, "");
  };
  const props = { store, setStore, nav, view };

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
      if (view.set) return <TierTrainer {...props} tierKey={view.set} />;
      return <PuzzleHome {...props} />;
    case "lessons":
      return <Lessons {...props} />;
    case "settings":
      return <Settings {...props} />;
    default:
      return <Home {...props} />;
  }
}
