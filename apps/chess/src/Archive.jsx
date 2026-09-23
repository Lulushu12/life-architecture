import { useState } from "react";
import { TopBar } from "./ui.jsx";
import { getPersona } from "./personas.js";
import { useToast } from "@shared/ui.jsx";
import { GAME_CAP } from "./storage.js";
import { gamesPgn, pgnFilename } from "./pgn.js";
import ExportSheet from "./ExportSheet.jsx";

function gameTitle(game) {
  if (game.mode === "bot") return `${getPersona(game.personaId).avatar} vs ${getPersona(game.personaId).name}`;
  if (game.mode === "pass") return "🤝 Pass & play";
  if (game.mode === "engine") return `⚔️ ${game.names?.w} vs ${game.names?.b}`;
  return `📋 ${game.label || "Imported"}`;
}

export default function Archive({ store, setStore, nav }) {
  const games = store.games;
  const toast = useToast();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [exporting, setExporting] = useState(null);

  const favCount = games.filter((g) => g.favourite).length;
  const atCap = games.length >= GAME_CAP;

  const toggleFav = (id) =>
    setStore((s) => ({ ...s, games: s.games.map((g) => (g.id === id ? { ...g, favourite: !g.favourite } : g)) }));

  const toggleSel = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = games.length > 0 && games.every((g) => selected.has(g.id));

  const exportSelected = () => {
    const chosen = games.filter((g) => selected.has(g.id));
    if (!chosen.length) return;
    setExporting({
      title: `Export ${chosen.length} ${chosen.length === 1 ? "game" : "games"}`,
      text: gamesPgn(chosen),
      filename: pgnFilename(chosen.length === 1 ? "game" : `${chosen.length}-games`),
    });
  };

  const remove = (game) => {
    setStore((s) => ({ ...s, games: s.games.filter((x) => x.id !== game.id) }));
    toast.undo("Game deleted", () =>
      setStore((s) =>
        s.games.some((x) => x.id === game.id)
          ? s
          : { ...s, games: [...s.games, game].sort((a, b) => (b.date || 0) - (a.date || 0)) }
      )
    );
  };

  return (
    <div className="page">
      <TopBar
        title="Game archive"
        sub={`${games.length} of ${GAME_CAP} games${favCount ? ` · ${favCount} starred` : ""}`}
        onBack={() => nav("home")}
        right={
          games.length > 0 && (
            <button
              className="linkbtn"
              onClick={() => {
                setSelecting((v) => !v);
                setSelected(new Set());
              }}
            >
              {selecting ? "Done" : "Select"}
            </button>
          )
        }
      />
      {atCap && (
        <p className="warn storagebanner" role="status">
          The archive keeps {GAME_CAP} games. Each new game removes the oldest one that is not starred,
          reviewed games first. Star the games you want to keep, and export the rest as PGN.
        </p>
      )}
      {selecting && (
        <div className="btnrow selectbar">
          <button
            className="linkbtn"
            onClick={() => setSelected(allSelected ? new Set() : new Set(games.map((g) => g.id)))}
          >
            {allSelected ? "Select none" : "Select all"}
          </button>
          <span className="hint small selcount">{selected.size} selected</span>
          <button className="bigbtn" disabled={selected.size === 0} onClick={exportSelected}>
            Export selected
          </button>
        </div>
      )}
      {games.length === 0 && <p className="hint">Finished games land here, with their reviews.</p>}
      {games.map((game) => (
        <div
          key={game.id}
          className={"card gamecard" + (selecting && selected.has(game.id) ? " selected" : "")}
          onClick={() => (selecting ? toggleSel(game.id) : nav("review", { gameId: game.id }))}
        >
          {selecting && (
            <input
              type="checkbox"
              className="gamecheck"
              checked={selected.has(game.id)}
              onChange={() => toggleSel(game.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${gameTitle(game)}`}
            />
          )}
          <div className="gamecard-main">
            <div className="gamecard-title">
              {gameTitle(game)}
              {"  "}
              <span className="result">{game.result || ""}</span>
            </div>
            <div className="gamecard-sub">
              {new Date(game.date).toLocaleDateString()} · {game.sans.length} moves ·{" "}
              {game.review
                ? `reviewed (${game.review.accuracy.w}% / ${game.review.accuracy.b}%)`
                : "tap to review"}
            </div>
          </div>
          <button
            className={"iconbtn favbtn" + (game.favourite ? " on" : "")}
            aria-label={game.favourite ? "Unstar game" : "Star game"}
            aria-pressed={!!game.favourite}
            onClick={(e) => {
              e.stopPropagation();
              toggleFav(game.id);
            }}
          >
            {game.favourite ? "★" : "☆"}
          </button>
          {!selecting && (
            <button
              className="iconbtn"
              aria-label="Delete game"
              onClick={(e) => {
                e.stopPropagation();
                remove(game);
              }}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <ExportSheet
        open={!!exporting}
        title={exporting?.title}
        text={exporting?.text || ""}
        filename={exporting?.filename}
        onClose={() => setExporting(null)}
      />
    </div>
  );
}
