import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { TopBar } from "./ui.jsx";
import { getPersona } from "./personas.js";
import { useToast } from "@shared/ui.jsx";
import { GAME_CAP } from "./storage.js";
import { gamesPgn, pgnFilename } from "./pgn.js";
import ExportSheet from "./ExportSheet.jsx";
import MiniBoard from "./MiniBoard.jsx";
import { TABS, RESULTS, filterGames, outcomeOf, ANALYSIS_CAP } from "./archive.js";

function gameTitle(game) {
  if (game.mode === "bot") return `${getPersona(game.personaId).avatar} vs ${getPersona(game.personaId).name}`;
  if (game.mode === "pass") return "🤝 Pass & play";
  if (game.mode === "engine") return `⚔️ ${game.names?.w} vs ${game.names?.b}`;
  return `📋 ${game.label || "Imported"}`;
}

// The final position of a line, and its last move, for the mini boards.
function finalPosition(startFen, sans) {
  let c;
  try {
    c = startFen ? new Chess(startFen) : new Chess();
  } catch {
    c = new Chess();
  }
  let last = null;
  for (const san of sans || []) {
    try {
      last = c.move(san);
    } catch {
      break;
    }
  }
  return { fen: c.fen(), lastMove: last ? [last.from, last.to] : null };
}

const OUTCOME_LABEL = { w: "Won", d: "Drawn", l: "Lost" };

export default function Archive({ store, setStore, nav, view }) {
  const games = store.games;
  const analyses = store.analyses || [];
  const toast = useToast();
  const [tab, setTab] = useState(view?.tab || "all");
  const [result, setResult] = useState("any");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [exporting, setExporting] = useState(null);

  const shown = useMemo(() => (tab === "analyses" ? [] : filterGames(games, tab, result)), [games, tab, result]);
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

  const allSelected = shown.length > 0 && shown.every((g) => selected.has(g.id));

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

  const removeAnalysis = (a) => {
    setStore((s) => ({ ...s, analyses: (s.analyses || []).filter((x) => x.id !== a.id) }));
    toast.undo("Analysis deleted", () =>
      setStore((s) =>
        (s.analyses || []).some((x) => x.id === a.id)
          ? s
          : { ...s, analyses: [...(s.analyses || []), a].sort((x, y) => (y.date || 0) - (x.date || 0)) }
      )
    );
  };

  const switchTab = (id) => {
    setTab(id);
    setSelecting(false);
    setSelected(new Set());
  };

  return (
    <div className="page">
      <TopBar
        title="Game archive"
        sub={
          tab === "analyses"
            ? `${analyses.length} of ${ANALYSIS_CAP} saved analyses`
            : `${games.length} of ${GAME_CAP} games${favCount ? ` · ${favCount} starred` : ""}`
        }
        onBack={() => nav("home")}
        right={
          tab !== "analyses" &&
          shown.length > 0 && (
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

      <div className="chips archivetabs" role="tablist" aria-label="Archive">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={"chip atab" + (tab === t.id ? " sel" : "")}
            onClick={() => switchTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab !== "analyses" && (
        <div className="chips resultfilter" role="radiogroup" aria-label="Result">
          {RESULTS.map((r) => (
            <button
              key={r.id}
              role="radio"
              aria-checked={result === r.id}
              className={"chip small" + (result === r.id ? " sel" : "")}
              onClick={() => setResult(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      {atCap && tab !== "analyses" && (
        <p className="warn storagebanner" role="status">
          The archive keeps {GAME_CAP} games. Each new game removes the oldest one that is not starred,
          reviewed games first. Star the games you want to keep, and export the rest as PGN.
        </p>
      )}
      {selecting && (
        <div className="btnrow selectbar">
          <button
            className="linkbtn"
            onClick={() => setSelected(allSelected ? new Set() : new Set(shown.map((g) => g.id)))}
          >
            {allSelected ? "Select none" : "Select all"}
          </button>
          <span className="hint small selcount">{selected.size} selected</span>
          <button className="bigbtn" disabled={selected.size === 0} onClick={exportSelected}>
            Export selected
          </button>
        </div>
      )}

      {tab === "analyses" ? (
        <>
          {analyses.length === 0 && (
            <p className="hint">Analyses you save from the analysis board land here. They don't count toward the game limit.</p>
          )}
          {analyses.map((a) => (
            <AnalysisRow key={a.id} a={a} store={store} nav={nav} onDelete={() => removeAnalysis(a)} />
          ))}
        </>
      ) : (
        <>
          {games.length === 0 && <p className="hint">Finished games land here, with their reviews.</p>}
          {games.length > 0 && shown.length === 0 && <p className="hint">No games match this filter.</p>}
          {shown.map((game) => (
            <GameRow
              key={game.id}
              game={game}
              store={store}
              selecting={selecting}
              selected={selected.has(game.id)}
              onToggleSel={() => toggleSel(game.id)}
              onOpen={() => nav("review", { gameId: game.id })}
              onFav={() => toggleFav(game.id)}
              onDelete={() => remove(game)}
            />
          ))}
        </>
      )}
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

function GameRow({ game, store, selecting, selected, onToggleSel, onOpen, onFav, onDelete }) {
  const pos = useMemo(() => finalPosition(game.startFen, game.sans), [game.startFen, game.sans]);
  const out = outcomeOf(game);
  const acc = game.review && game.playerColor ? game.review.accuracy?.[game.playerColor] : null;
  return (
    <div className={"card gamecard" + (selecting && selected ? " selected" : "")} onClick={() => (selecting ? onToggleSel() : onOpen())}>
      {selecting && (
        <input
          type="checkbox"
          className="gamecheck"
          checked={selected}
          onChange={onToggleSel}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${gameTitle(game)}`}
        />
      )}
      <MiniBoard fen={pos.fen} orientation={game.playerColor || "w"} lastMove={pos.lastMove} settings={store.settings} size={56} label="Final position" />
      <div className="gamecard-main">
        <div className="gamecard-title">
          {gameTitle(game)}
          {"  "}
          {out ? <span className={"resultchip " + out}>{OUTCOME_LABEL[out]}</span> : <span className="result">{game.result || ""}</span>}
        </div>
        <div className="gamecard-sub">
          {new Date(game.date).toLocaleDateString()} · {game.sans.length} moves ·{" "}
          {game.review
            ? acc != null
              ? `accuracy ${acc}%`
              : `reviewed (${game.review.accuracy.w}% / ${game.review.accuracy.b}%)`
            : "tap to review"}
        </div>
      </div>
      <button
        className={"iconbtn favbtn" + (game.favourite ? " on" : "")}
        aria-label={game.favourite ? "Unstar game" : "Star game"}
        aria-pressed={!!game.favourite}
        onClick={(e) => {
          e.stopPropagation();
          onFav();
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
            onDelete();
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

function AnalysisRow({ a, store, nav, onDelete }) {
  const pos = useMemo(() => finalPosition(a.startFen, a.sans), [a.startFen, a.sans]);
  return (
    <div className="card gamecard" onClick={() => nav("analysis", { analysisId: a.id })}>
      <MiniBoard fen={pos.fen} orientation={a.orientation || "w"} lastMove={pos.lastMove} settings={store.settings} size={56} label="Saved position" />
      <div className="gamecard-main">
        <div className="gamecard-title">🔬 {a.name || "Analysis"}</div>
        <div className="gamecard-sub">
          {new Date(a.date).toLocaleDateString()} · {a.sans.length} moves · tap to open
        </div>
      </div>
      <button
        className="iconbtn"
        aria-label="Delete analysis"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        ✕
      </button>
    </div>
  );
}
