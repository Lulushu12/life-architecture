import { useCallback, useEffect, useState } from "react";
import { usePersistentStore, newId } from "@shared/store.js";
import { useHistoryNav, useBackGuard } from "@shared/useHistoryNav.js";
import { useWakeLock } from "@shared/useWakeLock.js";
import { registerSw } from "@shared/swRegister.js";
import { useConfirm, useToast } from "@shared/ui.jsx";
import { KEY, storeDef, rememberPlayers } from "./storage.js";
import Home from "./Home.jsx";
import WhistSetup from "./WhistSetup.jsx";
import RentzSetup from "./RentzSetup.jsx";
import WhistGame from "./WhistGame.jsx";
import RentzGame from "./RentzGame.jsx";
import Stats from "./Stats.jsx";
import { colorIdx } from "./players.js";
import { computeRentz, computeWhist } from "./rules.js";

const VIEW_KEY = "whist:view";
const ACTIONS = { "new-whist": "whist-setup", "new-rentz": "rentz-setup" };

(function consumeLaunchAction() {
  try {
    const url = new URL(window.location.href);
    const screen = ACTIONS[url.searchParams.get("action")];
    if (!url.searchParams.has("action")) return;
    if (screen) localStorage.setItem(VIEW_KEY, JSON.stringify({ screen }));
    url.searchParams.delete("action");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  } catch {
    /* launch shortcuts are a convenience */
  }
})();

function inRound(game) {
  if (!game) return false;
  if (game.type === "rentz") return !!game.pending;
  const last = game.rounds[game.rounds.length - 1];
  if (!last) return false;
  const full = (a) => Array.isArray(a) && a.every((x) => x != null);
  return !(full(last.bids) && full(last.taken));
}

export function replayOf(game) {
  const n = game.players.length;
  const base = {
    id: newId(),
    type: game.type,
    players: [...game.players],
    colors: game.players.map((_, i) => colorIdx(game, i)),
    config: JSON.parse(JSON.stringify(game.config)),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return game.type === "whist"
    ? { ...base, firstDealer: (game.firstDealer + 1) % n, rounds: [] }
    : { ...base, firstChooser: (game.firstChooser + 1) % n, hands: [], pending: null };
}

export default function App() {
  const [store, setStore, status] = usePersistentStore(storeDef);
  const { view, nav, back, replace } = useHistoryNav({ screen: "home" }, { persistKey: VIEW_KEY });
  const toast = useToast();
  const [confirm, confirmSheet] = useConfirm();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    registerSw({
      onUpdate: (reload) => toast("Update available", { action: { label: "Reload", onClick: reload }, duration: 0 }),
    });
  }, [toast]);

  useEffect(() => {
    if (view.d) replace({ ...view, d: 0 });
  }, []);

  useEffect(() => setLeaving(false), [view]);

  const open = (v) => nav({ ...v, d: (view.d || 0) + 1 });
  const goHome = useCallback(() => {
    if (view.d > 0) back();
    else replace({ screen: "home" });
  }, [view, back, replace]);

  const game = view.screen === "game" ? store.games[view.id] : null;
  const guarded = !!game && inRound(game) && !leaving;
  useWakeLock(!!game);

  const leaveGame = () => {
    if (guarded) {
      window.addEventListener("popstate", goHome, { once: true });
      setLeaving(true);
    } else goHome();
  };

  useBackGuard(guarded, async () => {
    const yes = await confirm({
      title: "Leave this round?",
      message: "Everything entered so far is saved. You can pick up the round from Home.",
      confirmLabel: "Leave",
    });
    if (yes) leaveGame();
  });

  const updateGame = (id, fn) =>
    setStore((s) => {
      const g = s.games[id];
      if (!g) return s;
      const now = Date.now();
      const next = { ...fn(g), updatedAt: now };
      const done = (next.type === "whist" ? computeWhist(next) : computeRentz(next)).done;
      if (done && !next.finishedAt) next.finishedAt = now;
      if (!done) delete next.finishedAt;
      return { ...s, games: { ...s.games, [id]: next } };
    });

  const addGame = (g) => {
    setStore((s) => ({
      ...s,
      games: { ...s.games, [g.id]: g },
      recentPlayers: rememberPlayers(s.recentPlayers, g.players),
    }));
    replace({ screen: "game", id: g.id, d: view.d || 0 });
  };

  const deleteGame = (id) => {
    const removed = store.games[id];
    if (!removed) return;
    setStore((s) => {
      const games = { ...s.games };
      delete games[id];
      return { ...s, games };
    });
    toast.undo(`Deleted ${removed.type === "whist" ? "Whist" : "Rentz"} game`, () =>
      setStore((s) => ({ ...s, games: { ...s.games, [id]: removed } }))
    );
  };

  const recovered = store._recovered;
  const banner = (!status.ok || recovered) && (
    <div className="banner" role="alert">
      {!status.ok && <p className="warn">Storage full: changes are not being saved.</p>}
      {recovered && (
        <p className="warn">
          Saved data was unreadable and has been reset; the raw copy is under {KEY}.corrupt.{" "}
          <button
            type="button"
            className="linkbtn"
            onClick={() =>
              setStore((s) => {
                const { _recovered, ...rest } = s;
                return rest;
              })
            }
          >
            Dismiss
          </button>
        </p>
      )}
    </div>
  );

  let screen;
  if (view.screen === "whist-setup")
    screen = <WhistSetup recent={store.recentPlayers} onCancel={goHome} onCreate={addGame} />;
  else if (view.screen === "rentz-setup")
    screen = <RentzSetup recent={store.recentPlayers} onCancel={goHome} onCreate={addGame} />;
  else if (view.screen === "stats")
    screen = <Stats store={store} onBack={goHome} onOpen={(id) => open({ screen: "game", id })} />;
  else if (game) {
    const Comp = game.type === "whist" ? WhistGame : RentzGame;
    screen = (
      <Comp
        key={game.id}
        game={game}
        onChange={(fn) => updateGame(game.id, fn)}
        onHome={leaveGame}
        onPlayAgain={() => addGame(replayOf(game))}
      />
    );
  } else
    screen = (
      <Home
        store={store}
        setStore={setStore}
        onOpen={(id) => open({ screen: "game", id })}
        onNewWhist={() => open({ screen: "whist-setup" })}
        onNewRentz={() => open({ screen: "rentz-setup" })}
        onStats={() => open({ screen: "stats" })}
        onDelete={deleteGame}
      />
    );

  return (
    <>
      {banner}
      {screen}
      {confirmSheet}
    </>
  );
}
