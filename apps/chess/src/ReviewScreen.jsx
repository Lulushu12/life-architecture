import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import Board from "./Board.jsx";
import { TopBar, MoveList, useArrowKeys } from "./ui.jsx";
import { getEngine, winPct } from "./engine.js";
import { reviewGame, extractPuzzles, CLASSIFICATIONS } from "./review.js";
import { PERSONAS, getPersona } from "./personas.js";
import { newId } from "./storage.js";

export default function ReviewScreen({ store, setStore, nav, view }) {
  if (view.importing) return <PgnImport store={store} setStore={setStore} nav={nav} />;
  const game = store.games.find((x) => x.id === view.gameId);
  if (!game)
    return (
      <div className="page">
        <TopBar title="Review" onBack={() => nav("home")} />
        <p className="hint">Game not found.</p>
      </div>
    );
  return <Review store={store} setStore={setStore} nav={nav} game={game} />;
}

function PgnImport({ store, setStore, nav }) {
  const [paste, setPaste] = useState("");
  const load = () => {
    try {
      const c = new Chess();
      c.loadPgn(paste.trim());
      const sans = c.history();
      if (sans.length < 2) throw new Error("too short");
      const header = c.header();
      const id = newId();
      setStore((s) => ({
        ...s,
        games: [
          {
            id,
            date: Date.now(),
            mode: "import",
            label: header.White && header.Black ? `${header.White} vs ${header.Black}` : "Imported game",
            sans,
            result: header.Result && header.Result !== "*" ? header.Result : null,
            review: null,
          },
          ...s.games,
        ].slice(0, 200),
      }));
      nav("review", { gameId: id });
    } catch {
      alert("Couldn't parse that PGN.");
    }
  };
  return (
    <div className="page">
      <TopBar title="Review a PGN" sub="Paste any game — e.g. exported from chess.com" onBack={() => nav("home")} />
      <textarea
        className="input"
        rows={10}
        placeholder={'[Event "..."]\n1. e4 e5 2. Nf3 ...'}
        value={paste}
        onChange={(e) => setPaste(e.target.value)}
      />
      <button className="bigbtn start" disabled={!paste.trim()} onClick={load}>
        Import & review
      </button>
    </div>
  );
}

function Review({ store, setStore, nav, game }) {
  const engine = getEngine();
  const [progress, setProgress] = useState(game.review ? 1 : 0);
  const [running, setRunning] = useState(false);
  const [viewIdx, setViewIdx] = useState(0); // 0..n positions
  const [showBest, setShowBest] = useState(false);
  const startedRef = useRef(false);
  const review = game.review;

  useArrowKeys(
    () => {
      setViewIdx((i) => Math.max(0, i - 1));
      setShowBest(false);
    },
    () => {
      setViewIdx((i) => Math.min(game.sans.length, i + 1));
      setShowBest(false);
    }
  );

  useEffect(() => {
    if (review || startedRef.current) return;
    startedRef.current = true;
    setRunning(true);
    // Leaving the screen abandons the review: it is one engine search per ply,
    // so an unwatched pass would otherwise hold the CPU for the rest of the game.
    let abandoned = false;
    reviewGame(engine, game.sans, {
      startFen: game.startFen || null,
      movetime: store.settings.reviewMovetime,
      onProgress: (p) => {
        if (!abandoned) setProgress(p);
      },
      shouldStop: () => abandoned,
    })
      .then((result) => {
        if (result === null) return; // abandoned; nothing to commit
        setStore((s) => {
          const puzzles = [...s.puzzles];
          const playerColor = game.mode === "bot" ? game.playerColor : null;
          if (playerColor) {
            for (const p of extractPuzzles(result, playerColor)) {
              if (!puzzles.some((x) => x.fen === p.fen && x.bestUci === p.bestUci))
                puzzles.push({ ...p, id: newId(), gameId: game.id, date: Date.now(), solved: false });
            }
          }
          return {
            ...s,
            puzzles: puzzles.slice(-300),
            games: s.games.map((x) => (x.id === game.id ? { ...x, review: result } : x)),
          };
        });
        setViewIdx(game.sans.length);
      })
      .catch((e) => {
        if (!abandoned) alert("Review failed: " + e.message);
      })
      .finally(() => {
        if (!abandoned) setRunning(false);
      });

    return () => {
      abandoned = true;
      startedRef.current = false; // let a re-entry restart the review
      engine.stopCurrent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review]);

  const positions = useMemo(() => {
    const c = game.startFen ? new Chess(game.startFen) : new Chess();
    const out = [c.fen()];
    for (const san of game.sans) {
      c.move(san);
      out.push(c.fen());
    }
    return out;
  }, [game.startFen, game.sans]);

  const lastMovePair = useMemo(() => {
    if (viewIdx === 0) return null;
    const c = game.startFen ? new Chess(game.startFen) : new Chess();
    let mv = null;
    for (let i = 0; i < viewIdx; i++) mv = c.move(game.sans[i]);
    return mv ? [mv.from, mv.to] : null;
  }, [viewIdx, game.startFen, game.sans]);

  const annotations = useMemo(() => {
    if (!review) return null;
    return review.moves.map((m) => CLASSIFICATIONS[m.class]);
  }, [review]);

  const moveAt = viewIdx > 0 && review ? review.moves[viewIdx - 1] : null;
  const badMove = moveAt && ["inaccuracy", "mistake", "blunder"].includes(moveAt.class);
  const orientation = game.mode === "bot" && game.playerColor === "b" ? "b" : "w";

  const retryFrom = (personaId) => {
    const fen = positions[viewIdx - 1];
    const color = moveAt.color;
    setStore((s) => ({
      ...s,
      current: {
        id: newId(),
        mode: "bot",
        personaId,
        playerColor: color,
        serious: false,
        startFen: fen,
        sans: [],
        chat: [],
        cps: [0],
        hints: 0,
        status: "playing",
        result: null,
        createdAt: Date.now(),
      },
    }));
    nav("play");
  };

  if (!review) {
    return (
      <div className="page">
        <TopBar title="Reviewing…" onBack={() => nav("home")} />
        <div className="card center reviewprog">
          <div className="progressbar">
            <div className="progressfill" style={{ width: Math.round(progress * 100) + "%" }} />
          </div>
          <p className="hint">
            {running
              ? `Analyzing position ${Math.ceil(progress * (game.sans.length + 1))} of ${game.sans.length + 1}…`
              : "Preparing engine…"}
          </p>
        </div>
      </div>
    );
  }

  const acc = review.accuracy;
  const who =
    game.mode === "bot"
      ? { w: game.playerColor === "w" ? "You" : botName(game), b: game.playerColor === "b" ? "You" : botName(game) }
      : { w: "White", b: "Black" };

  return (
    <div className="page gamepage">
      <TopBar
        title="Game review"
        sub={(review.opening ? review.opening.name + " · " : "") + (game.result || "")}
        onBack={() => nav(game.mode === "import" ? "home" : "archive")}
      />

      <div className="accrow">
        <div className="acccard">
          <div className="acc-name">{who.w} (White)</div>
          <div className="acc-val">{acc.w}%</div>
          <ClassCounts counts={review.counts.w} />
        </div>
        <div className="acccard">
          <div className="acc-name">{who.b} (Black)</div>
          <div className="acc-val">{acc.b}%</div>
          <ClassCounts counts={review.counts.b} />
        </div>
      </div>

      <EvalGraph evals={review.evals} viewIdx={viewIdx} onScrub={setViewIdx} />

      <Board
        fen={showBest && badMove ? positions[viewIdx - 1] : positions[viewIdx]}
        orientation={orientation}
        lastMove={showBest ? null : lastMovePair}
        arrow={
          showBest && badMove && moveAt.bestUci ? [moveAt.bestUci.slice(0, 2), moveAt.bestUci.slice(2, 4)] : null
        }
        dests={null}
        theme={store.settings.theme}
        pieceSet={store.settings.pieces}
        arrowColors={store.settings.arrowColors}
      />

      {moveAt && (
        <div className="moveverdict" style={{ borderColor: CLASSIFICATIONS[moveAt.class].color }}>
          <b style={{ color: CLASSIFICATIONS[moveAt.class].color }}>
            {moveAt.san} — {CLASSIFICATIONS[moveAt.class].label}
          </b>
          {badMove && moveAt.bestSan && (
            <span>
              {" "}
              · best was <b>{moveAt.bestSan}</b>{" "}
              <button className="linkbtn" onClick={() => setShowBest((s) => !s)}>
                {showBest ? "hide" : "show"}
              </button>
              <button className="linkbtn" onClick={() => retryFrom(pickRetryPersona(game))}>
                ⟳ Retry from here
              </button>
            </span>
          )}
        </div>
      )}

      <div className="btnrow toolrow">
        <button className="linkbtn" onClick={() => setViewIdx((i) => Math.max(0, i - 1))} disabled={viewIdx === 0}>
          ‹ Prev
        </button>
        <button
          className="linkbtn"
          onClick={() => setViewIdx((i) => Math.min(game.sans.length, i + 1))}
          disabled={viewIdx >= game.sans.length}
        >
          Next ›
        </button>
      </div>

      <MoveList
        sans={game.sans}
        annotations={annotations}
        activePly={viewIdx - 1}
        onTap={(p) => {
          setViewIdx(p + 1);
          setShowBest(false);
        }}
      />
    </div>
  );
}

function botName(game) {
  const p = getPersona(game.personaId);
  return `${p.avatar} ${p.name}`;
}

function pickRetryPersona(game) {
  return game.mode === "bot" ? game.personaId : PERSONAS[Math.floor(PERSONAS.length / 2)].id;
}

function ClassCounts({ counts }) {
  const order = ["brilliant", "best", "excellent", "good", "inaccuracy", "mistake", "blunder"];
  return (
    <div className="classcounts">
      {order
        .filter((k) => counts[k])
        .map((k) => (
          <span key={k} style={{ color: CLASSIFICATIONS[k].color }}>
            {counts[k]} {CLASSIFICATIONS[k].icon}
          </span>
        ))}
    </div>
  );
}

function EvalGraph({ evals, viewIdx, onScrub }) {
  const n = evals.length;
  const pts = evals.map((cp, i) => {
    const x = (i / Math.max(1, n - 1)) * 100;
    const y = 100 - winPct(cp);
    return `${x},${y}`;
  });
  const scrub = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onScrub(Math.round(frac * (n - 1)));
  };
  const x = (viewIdx / Math.max(1, n - 1)) * 100;
  return (
    <div className="evalgraph" onClick={scrub} onTouchMove={scrub}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect x="0" y="0" width="100" height="100" fill="#2a2926" />
        <polygon points={`0,100 ${pts.join(" ")} 100,100`} fill="#e8e6e3" opacity="0.9" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#888" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1={x} y1="0" x2={x} y2="100" stroke="#f0c15c" strokeWidth="0.8" />
      </svg>
    </div>
  );
}
