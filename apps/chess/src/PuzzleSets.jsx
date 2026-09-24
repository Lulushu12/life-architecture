import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import Board from "./Board.jsx";
import { TopBar } from "./ui.jsx";
import { play as sfx, buzz } from "./audio.js";
import { getEngine } from "./engine.js";
import {
  loadPuzzleDb,
  TIERS,
  solvedSet,
  nextPuzzle,
  themesIn,
  getRating,
  rateResult,
  allPuzzles,
  allSolved,
  srsNext,
  dueItems,
  moveIsGoodEnough,
} from "./puzzledb.js";

function boardLook(store) {
  return {
    theme: store.settings.theme,
    custom: store.settings.boardCustom,
    pieceSet: store.settings.pieces,
    animMs: store.settings.animMs,
    arrowColors: store.settings.arrowColors,
  };
}

function destsOf(chess) {
  const map = new Map();
  for (const m of chess.moves({ verbose: true })) {
    if (!map.has(m.from)) map.set(m.from, []);
    map.get(m.from).push(m.to);
  }
  return map;
}

function promoCheck(chess) {
  return (from, to) => {
    const piece = chess.get(from);
    return piece?.type === "p" && (to[1] === "8" || to[1] === "1");
  };
}

function useDb() {
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
  return [db, error];
}

function Delta({ d }) {
  return <span className={d >= 0 ? "delta up" : "delta down"}>{d >= 0 ? `+${d}` : d}</span>;
}

// ── Hub ──────────────────────────────────────────────────────────────────────

export function PuzzleHome({ store, nav }) {
  const blunders = store.puzzles.filter((p) => !p.solved).length;
  const [db, error] = useDb();
  const rating = getRating(store);
  const due = useMemo(() => dueItems(store).length, [store.puzzleSrs, store.puzzles]);
  const bests = store.puzzleBests || {};

  return (
    <div className="page">
      <TopBar title="Puzzles" sub={`Your puzzle rating: ${rating.r}${rating.n < 10 ? " (provisional)" : ""}`} onBack={() => nav("home")} />

      <button className={"card lessonrow duerow" + (due ? " hot" : "")} disabled={!due} onClick={() => nav("puzzles", { set: "due" })}>
        <div className="lr-main">
          <div className="lr-title">🔁 Due today: {due}</div>
          <div className="lr-sum">{due ? "Puzzles you missed, back for another try" : "Missed puzzles come back here on a schedule"}</div>
        </div>
      </button>

      <button className="card lessonrow" onClick={() => nav("puzzles", { set: "mix" })}>
        <div className="lr-main">
          <div className="lr-title">🎯 Rated puzzles</div>
          <div className="lr-sum">Picked near your rating from every set</div>
        </div>
        <div className="lr-side">{rating.r}</div>
      </button>

      <div className="moderow">
        <button className="card lessonrow" onClick={() => nav("puzzles", { set: "rush" })}>
          <div className="lr-main">
            <div className="lr-title">⏱️ Puzzle Rush</div>
            <div className="lr-sum">3 minutes, 3 strikes · best {bests.rush || 0}</div>
          </div>
        </button>
        <button className="card lessonrow" onClick={() => nav("puzzles", { set: "streak" })}>
          <div className="lr-main">
            <div className="lr-title">🔥 Streak</div>
            <div className="lr-sum">Until the first miss · best {bests.streak || 0}</div>
          </div>
        </button>
      </div>

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
  const isMix = tierKey === "mix";
  const tier = isMix ? { key: "mix", label: "Rated puzzles" } : TIERS.find((t) => t.key === tierKey);
  const [db] = useDb();
  const [outcome, setOutcome] = useState(null);
  const ratingRef = useRef(getRating(store).r);
  ratingRef.current = getRating(store).r;
  const [theme, setTheme] = useState(null);
  const [showThemes, setShowThemes] = useState(false);
  // ply = index into the solution line; even entries are the opponent's.
  const [ply, setPly] = useState(1);
  const [state, setState] = useState("try"); // try | wrong | solved | revealed
  // Progressive help for the current step: 1 shows which piece must move,
  // 2 shows the full move. Resets after each correct move.
  const [hint, setHint] = useState(0);
  const [puzzleId, setPuzzleId] = useState(null);
  // Skipped puzzles stay unsolved but shouldn't be handed straight back; the
  // set is per-visit, so they return next time the tier is opened.
  const [skipped, setSkipped] = useState(() => new Set());

  const list = useMemo(() => (!db ? [] : isMix ? allPuzzles(db) : db.puzzles[tierKey] || []), [db, isMix, tierKey]);
  const solved = useMemo(
    () => (isMix ? allSolved(store) : solvedSet(store, tierKey)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.puzzleProgress, tierKey, isMix]
  );

  // Hold onto the current puzzle by id so solving it doesn't immediately swap
  // the board out from under the "solved" message.
  const puzzle = useMemo(() => {
    if (!list.length) return null;
    const held = puzzleId && list.find((p) => p.i === puzzleId);
    if (held) return held;
    const excluded = new Set([...solved, ...skipped]);
    return nextPuzzle(list, excluded, theme, ratingRef.current);
  }, [list, solved, skipped, theme, puzzleId]);

  useEffect(() => {
    if (puzzle && puzzle.i !== puzzleId) {
      setPuzzleId(puzzle.i);
      setPly(1);
      setState("try");
      setHint(0);
      setOutcome(null);
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

  // The solver's color, fixed for the whole puzzle from the position right
  // after the opponent's setup move (ply 1) — unlike `chess.turn()` above,
  // this must NOT be read at the live ply: the final correct move only
  // advances ply by 1 (no opponent reply left to append), so at that instant
  // chess.turn() flips to the opponent's color and would flip the board out
  // from under the player on the very move that solves the puzzle.
  const solverColor = useMemo(() => {
    if (!puzzle) return "w";
    const c = new Chess(puzzle.f);
    if (moves.length) applyUci(c, moves[0]);
    return c.turn();
  }, [puzzle, moves]);

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
            ? "Every puzzle with this theme is solved, clear the filter for more."
            : `All ${list.length} solved. 🎉`}
        </p>
        {theme && (
          <button className="bigbtn" onClick={() => setTheme(null)}>
            Clear filter
          </button>
        )}
        {!isMix && (
          <button className="linkbtn" onClick={() => resetTier(setStore, tierKey)}>
            Reset this set's progress
          </button>
        )}
      </div>
    );
  }

  const expected = moves[ply];
  const setKey = puzzle.k || tierKey;

  const record = (ok) => {
    if (outcome) return;
    const { next, delta } = rateResult(store.puzzleRating, puzzle.r, ok);
    setOutcome({ ok, delta, r: next.r });
    setStore((s) => {
      const out = { ...s, puzzleRating: rateResult(s.puzzleRating, puzzle.r, ok).next };
      if (!ok) {
        const key = `${setKey}:${puzzle.i}`;
        out.puzzleSrs = { ...(s.puzzleSrs || {}), [key]: { tier: setKey, id: puzzle.i, ...srsNext(null, false) } };
      }
      return out;
    });
  };

  const markSolved = () => {
    setState("solved");
    sfx(store, "gameEnd");
    buzz(store, [30, 40, 30]);
    record(true);
    setStore((s) => {
      const prev = s.puzzleProgress?.[setKey] || [];
      if (prev.includes(puzzle.i)) return s;
      return { ...s, puzzleProgress: { ...(s.puzzleProgress || {}), [setKey]: [...prev, puzzle.i] } };
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
      record(false);
      return;
    }
    setHint(0); // help was for this step only; the next one starts unaided
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
        sub={`${isMix ? "" : `${done}/${list.length} · `}you ${getRating(store).r} · puzzle ${puzzle.r} · ${solverColor === "w" ? "White" : "Black"} to move`}
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
        orientation={solverColor}
        dests={dests}
        onMove={tryMove}
        arrow={
          state === "revealed" || (hint >= 2 && state !== "solved")
            ? [expected.slice(0, 2), expected.slice(2, 4)]
            : null
        }
        highlightSquares={hint === 1 && state !== "solved" && state !== "revealed" ? [expected.slice(0, 2)] : null}
        theme={store.settings.theme}
        custom={store.settings.boardCustom}
        pieceSet={store.settings.pieces}
        animMs={store.settings.animMs}
        arrowColors={store.settings.arrowColors}
        needsPromotion={(from, to) => {
          const piece = chess.get(from);
          return piece?.type === "p" && (to[1] === "8" || to[1] === "1");
        }}
      />

      {outcome && (
        <p className="hint center ratingline">
          Rating {outcome.r} <Delta d={outcome.delta} />
        </p>
      )}
      {state === "wrong" && <p className="warn center">Not that one, try again.</p>}
      {state === "revealed" && <p className="hint center">The move is {expected}.</p>}
      {state === "solved" && <p className="okmsg center">✓ Solved</p>}
      {state === "try" && ply > 1 && <p className="hint center small">Keep going, the line continues.</p>}

      <div className="btnrow toolrow">
        <button className="linkbtn" onClick={() => setShowThemes((s) => !s)}>
          ⚑ {theme ? themes.find((t) => t.key === theme)?.label || "Theme" : "Theme"}
        </button>
        {state !== "solved" && state !== "revealed" && (
          <button
            className="linkbtn"
            disabled={hint >= 2}
            onClick={() => {
              record(false);
              setHint((h) => Math.min(h + 1, 2));
            }}
          >
            {hint === 0 ? "💡 Hint" : "Move"}
          </button>
        )}
        {state !== "solved" && (
          <button
            className="linkbtn"
            onClick={() => {
              record(false);
              setState("revealed");
            }}
          >
            Reveal
          </button>
        )}
        {state === "revealed" && (
          <button
            className="linkbtn"
            onClick={() => {
              setHint(0);
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
          <>
            <button
              className="linkbtn"
              onClick={() => {
                // Hand the analysis board the decision point (right after the
                // opponent's setup move) so other ideas can be explored.
                const c = new Chess(puzzle.f);
                if (moves.length) applyUci(c, moves[0]);
                nav("analysis", { fen: c.fen(), back: { screen: "puzzles", set: tierKey } });
              }}
            >
              🔬 Analysis
            </button>
            <button className="bigbtn" onClick={() => advance(false)}>
              Next puzzle
            </button>
          </>
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

function LineSolver({ store, item, onResult, accept }) {
  const [ply, setPly] = useState(item.setup ? 1 : 0);
  const [extra, setExtra] = useState(null);
  const [status, setStatus] = useState("try");
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    []
  );

  const chess = useMemo(() => {
    const c = new Chess(item.fen);
    for (let i = 0; i < ply && i < item.moves.length; i++) applyUci(c, item.moves[i]);
    if (extra) applyUci(c, extra);
    return c;
  }, [item, ply, extra]);

  const solverColor = useMemo(() => {
    const c = new Chess(item.fen);
    if (item.setup && item.moves.length) applyUci(c, item.moves[0]);
    return c.turn();
  }, [item]);

  const expected = item.moves[ply];

  const finish = (ok) => {
    setStatus(ok ? "solved" : "failed");
    if (ok) {
      sfx(store, "gameEnd");
      buzz(store, [30, 40, 30]);
    } else {
      sfx(store, "lose");
      buzz(store, 60);
    }
    onResult(ok);
  };

  const tryMove = async (from, to, promotion) => {
    if (status !== "try" || !expected) return;
    const test = new Chess(chess.fen());
    let mv;
    try {
      mv = test.move({ from, to, promotion: promotion || "q" });
    } catch {
      return;
    }
    if (!mv) return;
    const played = mv.from + mv.to + (mv.promotion || "");
    const exact = expected.length === 5 ? played === expected : played.slice(0, 4) === expected.slice(0, 4);
    let ok = exact || test.isCheckmate();
    if (!ok && accept) {
      setStatus("checking");
      ok = await accept(chess.fen(), played);
      if (!alive.current) return;
      setStatus("try");
    }
    if (!ok) {
      finish(false);
      return;
    }
    if (!exact) {
      setExtra(played);
      finish(true);
      return;
    }
    if (ply + 2 >= item.moves.length) {
      setPly(Math.min(ply + 2, item.moves.length));
      finish(true);
      return;
    }
    setPly(ply + 2);
  };

  return (
    <>
      <Board
        fen={chess.fen()}
        orientation={solverColor}
        dests={status === "try" ? destsOf(chess) : null}
        onMove={tryMove}
        arrow={status === "failed" && expected ? [expected.slice(0, 2), expected.slice(2, 4)] : null}
        needsPromotion={promoCheck(chess)}
        {...boardLook(store)}
      />
      <p className={"center small " + (status === "failed" ? "warn" : status === "solved" ? "okmsg" : "hint")}>
        {status === "checking"
          ? "Checking your move..."
          : status === "failed"
            ? "Missed: the arrow shows the move."
            : status === "solved"
              ? "✓ Solved"
              : `${solverColor === "w" ? "White" : "Black"} to move${item.r ? ` · puzzle ${item.r}` : ""}`}
      </p>
    </>
  );
}

const RUSH_MS = 180000;

export function RushTrainer({ store, setStore, nav, mode }) {
  const isRush = mode === "rush";
  const [db] = useDb();
  const [phase, setPhase] = useState("ready");
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [item, setItem] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [endAt, setEndAt] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const seen = useRef(new Set());
  const scoreRef = useRef(0);
  const strikesRef = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const bestRef = useRef(0);
  bestRef.current = store.puzzleBests?.[mode] || 0;
  const best = bestRef.current;
  const startRating = useRef(getRating(store).r);

  const pick = useCallback(() => {
    const n = scoreRef.current;
    const target = isRush ? 700 + n * 55 : Math.max(700, startRating.current - 250) + n * 35;
    const p = nextPuzzle(allPuzzles(db), seen.current, null, target);
    if (!p) return null;
    seen.current.add(p.i);
    return { key: p.i, fen: p.f, moves: p.m.split(" "), setup: true, r: p.r };
  }, [db, isRush]);

  const end = useCallback(() => {
    if (phaseRef.current !== "run") return;
    phaseRef.current = "over";
    setPhase("over");
    const final = scoreRef.current;
    setNewBest(final > bestRef.current);
    setStore((s) => {
      const prev = s.puzzleBests || {};
      if ((prev[mode] || 0) >= final) return s;
      return { ...s, puzzleBests: { ...prev, [mode]: final } };
    });
  }, [mode, setStore]);

  const start = () => {
    seen.current = new Set();
    scoreRef.current = 0;
    strikesRef.current = 0;
    setScore(0);
    setStrikes(0);
    setNewBest(false);
    const t = Date.now();
    setNow(t);
    setEndAt(t + RUSH_MS);
    phaseRef.current = "run";
    setPhase("run");
    setItem(pick());
  };

  useEffect(() => {
    if (phase !== "run" || !isRush) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= endAt) end();
    }, 250);
    return () => clearInterval(id);
  }, [phase, isRush, endAt, end]);

  const onResult = (ok) => {
    let over = false;
    if (ok) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    } else if (isRush) {
      strikesRef.current += 1;
      setStrikes(strikesRef.current);
      over = strikesRef.current >= 3;
    } else over = true;
    setTimeout(
      () => {
        if (phaseRef.current !== "run") return;
        if (over) end();
        else {
          const next = pick();
          if (next) setItem(next);
          else end();
        }
      },
      ok ? 350 : 1100
    );
  };

  const title = isRush ? "Puzzle Rush" : "Streak";
  const left = Math.max(0, endAt - now);
  const clock = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}`;

  if (!db)
    return (
      <div className="page">
        <TopBar title={title} onBack={() => nav("puzzles")} />
        <p className="hint">Loading…</p>
      </div>
    );

  if (phase !== "run")
    return (
      <div className="page">
        <TopBar title={title} onBack={() => nav("puzzles")} />
        <div className="card center rushcard">
          {phase === "over" ? (
            <>
              <div className="rush-score">{score}</div>
              <p className="hint">{newBest ? "New personal best!" : `Best: ${Math.max(best, score)}`}</p>
            </>
          ) : (
            <p className="hint">
              {isRush
                ? "Solve as many as you can in 3 minutes. Three wrong moves end the run. Puzzles get harder as you go."
                : "One puzzle after another, each a little harder. The first wrong move ends the streak."}
              <br />
              Best: {best}
            </p>
          )}
          <button className="bigbtn start" onClick={start}>
            {phase === "over" ? "Play again" : "Start"}
          </button>
        </div>
        <p className="hint small center">Rush and Streak don't change your puzzle rating.</p>
      </div>
    );

  return (
    <div className="page gamepage">
      <TopBar
        title={title}
        sub={isRush ? `${clock} left · strikes ${"✗".repeat(strikes) || "none"}` : `Streak ${score}`}
        right={<span className="rush-count">{score}</span>}
        onBack={() => nav("puzzles")}
      />
      {item && <LineSolver key={item.key} store={store} item={item} onResult={onResult} />}
      <div className="btnrow endrow">
        <button className="linkbtn danger" onClick={end}>
          End run
        </button>
      </div>
    </div>
  );
}

export function DueReview({ store, setStore, nav }) {
  const [db] = useDb();
  const [queue] = useState(() => dueItems(store));
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [right, setRight] = useState(0);
  const engine = useMemo(() => getEngine(), []);

  useEffect(() => () => engine.cancel("puzzle-check"), [engine]);

  const items = useMemo(() => {
    if (!db) return null;
    const out = [];
    for (const q of queue) {
      if (q.kind === "tier") {
        const p = (db.puzzles[q.tier] || []).find((x) => x.i === q.id);
        if (p) out.push({ ...q, fen: p.f, moves: p.m.split(" "), setup: true, r: p.r });
      } else {
        const p = store.puzzles.find((x) => x.id === q.id);
        if (p?.bestUci) out.push({ ...q, fen: p.fen, moves: [p.bestUci], setup: false, playedSan: p.playedSan });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, queue]);

  const accept = useCallback((fen, played) => moveIsGoodEnough(engine, fen, played), [engine]);

  if (!items)
    return (
      <div className="page">
        <TopBar title="Due today" onBack={() => nav("puzzles")} />
        <p className="hint">Loading…</p>
      </div>
    );

  const item = items[idx];

  const onResult = (ok) => {
    setResult(ok);
    if (ok) setRight((n) => n + 1);
    setStore((s) => {
      if (item.kind === "tier") {
        const srs = { ...(s.puzzleSrs || {}) };
        const e = srs[item.key];
        const n = srsNext(e, ok);
        if (n) srs[item.key] = { ...(e || { tier: item.tier, id: item.id }), ...n };
        else delete srs[item.key];
        return { ...s, puzzleSrs: srs };
      }
      return {
        ...s,
        puzzles: s.puzzles.map((p) => {
          if (p.id !== item.id) return p;
          const n = srsNext(p.srs, ok);
          const rest = { ...p, solved: true };
          delete rest.srs;
          return n ? { ...rest, srs: n } : rest;
        }),
      };
    });
  };

  if (!item)
    return (
      <div className="page">
        <TopBar title="Due today" onBack={() => nav("puzzles")} />
        <div className="card center">
          <p className="okmsg">{items.length ? `Done: ${right} of ${items.length} right.` : "Nothing due right now."}</p>
          <p className="hint small">Correct answers come back after 3, 7 and 21 days; misses return tomorrow.</p>
          <button className="bigbtn start" onClick={() => nav("puzzles")}>
            Back to puzzles
          </button>
        </div>
      </div>
    );

  return (
    <div className="page gamepage">
      <TopBar title="Due today" sub={`${idx + 1} of ${items.length}`} onBack={() => nav("puzzles")} />
      {item.kind === "blunder" && (
        <p className="hint small puzzleprompt">
          From your game: you played <b>{item.playedSan}</b>. Find a better move.
        </p>
      )}
      <LineSolver
        key={item.key}
        store={store}
        item={item}
        onResult={onResult}
        accept={item.kind === "blunder" ? accept : undefined}
      />
      {result != null && (
        <div className="btnrow endrow">
          <span className="hint small">{result ? "Next review pushed back." : "Back tomorrow."}</span>
          <button
            className="bigbtn"
            onClick={() => {
              setResult(null);
              setIdx((i) => i + 1);
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
