import { useEffect, useState } from "react";
import { loadStore, saveStore } from "./storage.js";
import Home from "./Home.jsx";
import ChessSetup from "./ChessSetup.jsx";
import ChessClock from "./ChessClock.jsx";
import Sudoku, { SudokuSetup } from "./Sudoku.jsx";
import CryptogramList from "./CryptogramList.jsx";
import CryptogramPlay from "./CryptogramPlay.jsx";
import { PUZZLES } from "./cryptogramPuzzles.js";
import { randomDerangement } from "./cryptogram.js";

export default function App() {
  const [store, setStore] = useState(loadStore);
  const [view, setView] = useState({ screen: "home" });

  // Write-through persistence: every state change hits localStorage
  // immediately, so closing or killing the app never loses progress.
  useEffect(() => {
    saveStore(store);
  }, [store]);

  const updateChess = (fn) =>
    setStore((s) => (s.chess ? { ...s, chess: { ...fn(s.chess), updatedAt: Date.now() } } : s));
  const setChess = (game) => setStore((s) => ({ ...s, chess: game }));

  const updateSudoku = (fn) =>
    setStore((s) => (s.sudoku ? { ...s, sudoku: { ...fn(s.sudoku), updatedAt: Date.now() } } : s));
  const setSudoku = (game) => setStore((s) => ({ ...s, sudoku: game }));

  const openCryptoPuzzle = (id) => {
    setStore((s) => {
      if (s.crypto.progress[id]) return s;
      const now = Date.now();
      const entry = { perm: randomDerangement(), guesses: {}, solved: false, startedAt: now, solvedAt: null };
      return { ...s, crypto: { ...s.crypto, progress: { ...s.crypto.progress, [id]: entry } } };
    });
    setView({ screen: "crypto-play", id });
  };

  const updateCryptoProgress = (id, fn) =>
    setStore((s) => ({
      ...s,
      crypto: { ...s.crypto, progress: { ...s.crypto.progress, [id]: fn(s.crypto.progress[id]) } },
    }));

  if (view.screen === "chess") {
    if (!store.chess) return <ChessSetup onCancel={() => setView({ screen: "home" })} onStart={setChess} />;
    return (
      <ChessClock
        game={store.chess}
        onChange={updateChess}
        onNewClock={() => setChess(null)}
        onHome={() => setView({ screen: "home" })}
      />
    );
  }

  if (view.screen === "sudoku") {
    if (!store.sudoku)
      return <SudokuSetup onCancel={() => setView({ screen: "home" })} onCreate={setSudoku} />;
    return (
      <Sudoku
        game={store.sudoku}
        onChange={updateSudoku}
        onNewGame={setSudoku}
        onHome={() => setView({ screen: "home" })}
      />
    );
  }

  if (view.screen === "crypto-list") {
    return (
      <CryptogramList
        progress={store.crypto.progress}
        onOpen={openCryptoPuzzle}
        onHome={() => setView({ screen: "home" })}
      />
    );
  }

  if (view.screen === "crypto-play") {
    const puzzle = PUZZLES.find((p) => p.id === view.id);
    const progress = store.crypto.progress[view.id];
    if (puzzle && progress) {
      return (
        <CryptogramPlay
          puzzle={puzzle}
          progress={progress}
          onChange={(fn) => updateCryptoProgress(view.id, fn)}
          onHome={() => setView({ screen: "crypto-list" })}
        />
      );
    }
  }

  return (
    <Home
      store={store}
      onChess={() => setView({ screen: "chess" })}
      onSudoku={() => setView({ screen: "sudoku" })}
      onCrypto={() => setView({ screen: "crypto-list" })}
    />
  );
}
