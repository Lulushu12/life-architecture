import { useEffect, useState } from "react";
import { loadStore, saveStore } from "./storage.js";
import Home from "./Home.jsx";
import WhistSetup from "./WhistSetup.jsx";
import RentzSetup from "./RentzSetup.jsx";
import WhistGame from "./WhistGame.jsx";
import RentzGame from "./RentzGame.jsx";

export default function App() {
  const [store, setStore] = useState(loadStore);
  const [view, setView] = useState({ screen: "home" });

  // Write-through persistence: every state change hits localStorage
  // immediately, so closing or killing the app never loses a game.
  useEffect(() => {
    saveStore(store);
  }, [store]);

  const updateGame = (id, fn) =>
    setStore((s) => {
      const g = s.games[id];
      if (!g) return s;
      return { ...s, games: { ...s.games, [id]: { ...fn(g), updatedAt: Date.now() } } };
    });

  const addGame = (game) => {
    setStore((s) => ({ ...s, games: { ...s.games, [game.id]: game } }));
    setView({ screen: "game", id: game.id });
  };

  const deleteGame = (id) =>
    setStore((s) => {
      const games = { ...s.games };
      delete games[id];
      return { ...s, games };
    });

  if (view.screen === "whist-setup")
    return <WhistSetup onCancel={() => setView({ screen: "home" })} onCreate={addGame} />;
  if (view.screen === "rentz-setup")
    return <RentzSetup onCancel={() => setView({ screen: "home" })} onCreate={addGame} />;
  if (view.screen === "game") {
    const game = store.games[view.id];
    if (game) {
      const Comp = game.type === "whist" ? WhistGame : RentzGame;
      return (
        <Comp
          game={game}
          onChange={(fn) => updateGame(game.id, fn)}
          onHome={() => setView({ screen: "home" })}
        />
      );
    }
  }
  return (
    <Home
      store={store}
      setStore={setStore}
      onOpen={(id) => setView({ screen: "game", id })}
      onNewWhist={() => setView({ screen: "whist-setup" })}
      onNewRentz={() => setView({ screen: "rentz-setup" })}
      onDelete={deleteGame}
    />
  );
}
