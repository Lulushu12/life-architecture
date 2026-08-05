import { useEffect, useState } from "react";
import { loadStore, saveStore } from "./storage.js";
import Home from "./Home.jsx";
import PlayBot from "./PlayBot.jsx";
import PassPlay from "./PassPlay.jsx";
import Analysis from "./Analysis.jsx";
import ReviewScreen from "./ReviewScreen.jsx";
import Archive from "./Archive.jsx";
import Puzzles from "./Puzzles.jsx";
import Settings from "./Settings.jsx";

export default function App() {
  const [store, setStore] = useState(loadStore);
  const [view, setView] = useState({ screen: "home" });

  // Write-through persistence: every state change hits localStorage
  // immediately — killing the app never loses a game or a review.
  useEffect(() => {
    saveStore(store);
  }, [store]);

  const nav = (screen, params = {}) => setView({ screen, ...params });
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
    case "puzzles":
      return <Puzzles {...props} />;
    case "settings":
      return <Settings {...props} />;
    default:
      return <Home {...props} />;
  }
}
