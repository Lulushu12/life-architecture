import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import Board from "./Board.jsx";
import { TopBar } from "./ui.jsx";
import { play as sfx, buzz } from "./audio.js";
import { loadPuzzleDb, TIERS, solvedSet, nextPuzzle, themesIn } from "./puzzledb.js";

// ── Hub ──────────────────────────────────────────────────────────────────────

export function PuzzleHome({ store, nav }) {
  const blunders = store.puzzles.filter((p) => !p.solved).length;
  const [db, setDb] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadPuzzleDb()
      .then((d) => !cancelled && setDb(d))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page">
      <TopBar title="Puzzles" onBack={() => nav("home")} />

      <button className="card lessonrow" onClick={() => nav("puzzles", { set: "blunders" })}>
        <div className="lr-main">
          <div className="lr-title">🧩 My blunders</div>
          <div className="lr-sum">
            {blunders > 0
              ? `${blunders} to retrain, from your own reviewed games`
              : "Mistakes from your reviewed games land here"}
          </div>
        </div>
      </button>

      <h2>Training sets</h2>
      {error && <p className="warn">Couldn't load the puzzle sets: {error}</p>}
      {!db && !error && <p className="hint">Loading…</p>}

      {db &&
        TIERS.map((t) => {
          const list = db.puzzles[t.key] || [];
          const done = solvedSet(store, t.key).size;
          const pct = list.length ? Math.round((done / list.length) * 100) : 0;
          return (
            <button
              key={t.key}
              className="card lessonrow"
              onClick={() => nav("puzzles", { set: t.key })}
            >
              <div className="lr-main">
                <div className="lr-title">
                  {t.label} <span className="lr-eco">{t.range}</span>
                </div>
                <div className="lr-sum">{t.blurb}</div>
                <div className="lessonbar">
                  <div className="lessonfill" style={{ width: pct + "%" }} />
                </div>
              </div>
              <div className="lr-side">
                {done}/{list.length}
              </div>
            </button>
          );
        })}

      {db && <p className="hint small">{db.source}</p>}
    </div>
  );
}

// ── Tier trainer ─────────────────────────────────────────────────────────────

export function TierTrainer({ store, setStore, nav, tierKey }) {
  const tier = TIERS.find((t) => t.key === tierKey);
  const [db, setDb] = useState(null);
  const [theme, setTheme] = useState(null);
  const [showThemes, setShowThemes] = useState(false);
  // ply = index into the solution line; even entries are the opponent's.
  const [ply, setPly] = useState(1);
  const [state, setState] = useState("try"); // try | wrong | solved | revealed
  const [puzzleId, setPuzzleId] = useState(null);
  // Skipped puzzles stay unsolved but shouldn't be handed straight back; the
  // set is per-visit, so they return next time the tier is opened.
  const [skipped, setSkipped] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    loadPuzzleDb().then((d) => !cancelled && setDb(d));
    return () => {
      cancelled = true;
    };
  }, []);

  const list = db?.puzzles[tierKey] || [];
  const solved = useMemo(() => solvedSet(store, tierKey), [store.puzzleProgress, tierKey]);

  // Hold onto the current puzzle by id so solving it doesn't immediately swap
  // the board out from under the "solved" message.
  const puzzle = useMemo(() => {
    if (!list.length) return null;
    const held = puzzleId && list.find((p) => p.i === puzzleId);
    if (held) return held;
    const excluded = new Set([...solved, ...skipped]);
    return nextPuzzle(list, excluded, theme);
  }, [list, solved, skipped, theme, puzzleId]);

  useEffect(() => {
    if (puzzle && puzzle.i !== puzzleId) {
      setPuzzleId(puzzle.i);
      setPly(1);
      setState("try");
    }
  }, [puzzle, puzzleId]);

  const moves = useMemo(() => (puzzle ? puzzle.m.split(" ") : []), [puzzle]);

  // Replay the opponent's setup move plus every solved pair so far.
  const chess = useMemo(() => {
    if (!puzzle) return null;
    const c = new Chess(puzzle.f);
    for (let i = 0; i < ply && i < moves.length; i++) applyUci(c, moves[i]);
    return c;
  }, [puzzle, moves, ply]);

  const dests = useMemo(() => {
    if (!chess || state === "solved" || state === "revealed") return null;
    const map = new Map();
    for (const m of chess.moves({ verbose: true })) {
      if (!map.has(m.from)) map.set(m.from, []);
      map.get(m.from).push(m.to);
    }
    return map;
  }, [chess, state]);

  // Scans every puzzle in the tier, so it must not run on each render.
  const themes = useMemo(() => themesIn(list), [list]);

  if (!db) {
    return (
      <div className="page">
        <TopBar title={tier?.label || "Puzzles"} onBack={() => nav("puzzles")} />
        <p className="hint">Loading…</p>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="page">
        <TopBar title={tier.label} onBack={() => nav("puzzles")} />
        <p className="hint">
          {theme
            ? "Every puzzle with this theme is solved — clear the filter for more."
            : `All ${list.length} solved. 🎉`}
        </p>
        {theme && (
          <button className="bigbtn" onClick={() => setTheme(null)}>
            Clear filter
          </button>
        )}
        <button className="linkbtn" onClick={() => resetTier(setStore, tierKey)}>
          Reset this set's progress
        </button>
      </div>
    );
  }

  const solverColor = chess.turn();
  const expected = moves[ply];

  const markSolved = () => {
    setState("solved");
    sfx(store, "gameEnd");
    buzz(store, [30, 40, 30]);
    setStore((s) => {
      const prev = s.puzzleProgress?.[tierKey] || [];
      if (prev.includes(puzzle.i)) return s;
      return { ...s, puzzleProgress: { ...(s.puzzleProgress || {}), [tierKey]: [...prev, puzzle.i] } };
    });
  };

  const tryMove = (from, to, promotion) => {
    const played = from + to + (promotion || "");
    const want = expected;
    // A promotion the user didn't specify defaults to a queen upstream; compare
    // on the first four characters when the expected move has no promotion.
    const ok = want.length === 5 ? played === want : played.slice(0, 4) === want.slice(0, 4);
    if (!ok) {
      sfx(store, "lose");
      buzz(store, 60);
      setState("wrong");
      return;
    }
    const nextPly = ply + 2; // our move, then the opponent's reply
    if (ply + 1 >= moves.length) {
      setPly(ply + 1);
      markSolved();
    } else {
      setState("try");
      setPly(nextPly);
      if (nextPly >= moves.length) markSolved();
    }
  };

  const advance = (skip) => {
    if (skip && puzzle) setSkipped((prev) => new Set(prev).add(puzzle.i));
    setPuzzleId(null); // release the hold so the next one is picked
    setState("try");
    setPly(1);
  };

  const done = solved.size;

  return (
    <div className="page gamepage">
      <TopBar
        title={tier.label}
        sub={`${done}/${list.length} · rating ${puzzle.r} · ${solverColor === "w" ? "White" : "Black"} to move`}
        onBack={() => nav("puzzles")}
      />

      {showThemes && (
        <div className="chapterlist card">
          <button className={"chip" + (!theme ? " sel" : "")} onClick={() => { setTheme(null); setPuzzleId(null); }}>
            All
          </button>
          {themes.map((t) => (
            <button
              key={t.key}
              className={"chip" + (theme === t.key ? " sel" : "")}
              onClick={() => { setTheme(t.key); setPuzzleId(null); setState("try"); setPly(1); }}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      )}

      <Board
        fen={chess.fen()}
        orientation="w"
        dests={dests}
        onMove={tryMove}
        arrow={state === "revealed" ? [expected.slice(0, 2), expected.slice(2, 4)] : null}
        theme={store.settings.theme}
        pieceSet={store.settings.pieces}
        animMs={store.settings.animMs}
        arrowColors={store.settings.arrowColors}
        needsPromotion={(from, to) => {
          const piece = chess.get(from);
          return piece?.type === "p" && (to[1] === "8" || to[1] === "1");
        }}
      />

      {state === "wrong" && <p className="warn center">Not that one — try again.</p>}
      {state === "revealed" && <p className="hint center">The move is {expected}.</p>}
      {state === "solved" && <p className="okmsg center">✓ Solved</p>}
      {state === "try" && ply > 1 && <p className="hint center small">Keep going — the line continues.</p>}

      <div className="btnrow toolrow">
        <button className="linkbtn" onClick={() => setShowThemes((s) => !s)}>
          ⚑ {theme ? themes.find((t) => t.key === theme)?.label || "Theme" : "Theme"}
        </button>
        {state !== "solved" && (
          <button className="linkbtn" onClick={() => setState("revealed")}>
            Reveal
          </button>
        )}
        {state === "revealed" && (
          <button
            className="linkbtn"
            onClick={() => {
              const nextPly = ply + 2;
              if (nextPly >= moves.length) {
                setPly(moves.length);
                markSolved();
              } else {
                setPly(nextPly);
                setState("try"); // the line continues — give the board back
              }
            }}
          >
            Play it
          </button>
        )}
        {state === "solved" && (
          <button className="bigbtn" onClick={() => advance(false)}>
            Next puzzle
          </button>
        )}
        <button className="linkbtn" onClick={() => advance(true)}>
          Skip
        </button>
      </div>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

function applyUci(chess, uci) {
  return chess.move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length === 5 ? uci[4] : undefined,
  });
}

function resetTier(setStore, tierKey) {
  setStore((s) => ({ ...s, puzzleProgress: { ...(s.puzzleProgress || {}), [tierKey]: [] } }));
}
