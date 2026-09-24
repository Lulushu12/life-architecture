import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import Board from "./Board.jsx";
import { TopBar } from "./ui.jsx";
import { play as sfx, buzz } from "./audio.js";
import { getEngine } from "./engine.js";
import { moveIsGoodEnough, srsNext } from "./puzzledb.js";

// "My blunders": every mistake/blunder from your reviewed games becomes a
// find-the-better-move puzzle.
export default function BlunderTrainer({ store, setStore, nav }) {
  const unsolved = store.puzzles.filter((p) => !p.solved);
  const [idx, setIdx] = useState(0);
  const [state, setState] = useState("try"); // try | wrong | solved | revealed
  // Progressive help: 1 shows which piece must move, 2 shows the full move.
  const [hint, setHint] = useState(0);
  const [heldId, setHeldId] = useState(null);
  const puzzle = (heldId && store.puzzles.find((p) => p.id === heldId)) || unsolved[Math.min(idx, Math.max(0, unsolved.length - 1))];
  const [alt, setAlt] = useState(false);
  const failed = useRef(false);
  const alive = useRef(true);
  const engine = useMemo(() => getEngine(), []);
  useEffect(
    () => () => {
      alive.current = false;
      engine.cancel("puzzle-check");
    },
    [engine]
  );
  useEffect(() => {
    failed.current = false;
    setAlt(false);
    setHeldId(puzzle?.id ?? null);
  }, [puzzle?.id]);

  const resolve = (solvedIt) => {
    const miss = failed.current || !solvedIt;
    setStore((s) => ({
      ...s,
      puzzles: s.puzzles.map((p) => {
        if (p.id !== puzzle.id) return p;
        const rest = { ...p, solved: true };
        delete rest.srs;
        return miss ? { ...rest, srs: srsNext(null, false) } : rest;
      }),
    }));
  };

  const chess = useMemo(() => (puzzle ? new Chess(puzzle.fen) : null), [puzzle]);

  const dests = useMemo(() => {
    if (!chess || state === "solved" || state === "revealed" || state === "checking") return null;
    const map = new Map();
    for (const m of chess.moves({ verbose: true })) {
      if (!map.has(m.from)) map.set(m.from, []);
      map.get(m.from).push(m.to);
    }
    return map;
  }, [chess, state]);

  if (!puzzle) {
    return (
      <div className="page">
        <TopBar title="My blunders" onBack={() => nav("puzzles")} />
        <p className="hint">
          {store.puzzles.length > 0
            ? "All cleaned up, every blunder retrained. 🎉"
            : "Play and review games; your mistakes will show up here as puzzles."}
        </p>
      </div>
    );
  }

  const turn = chess.turn() === "w" ? "White" : "Black";

  const tryMove = async (from, to, promotion) => {
    if (state === "checking") return;
    const test = new Chess(puzzle.fen);
    let mv;
    try {
      mv = test.move({ from, to, promotion: promotion || "q" });
    } catch {
      return;
    }
    if (!mv) return;
    const played = mv.from + mv.to + (mv.promotion || "");
    let ok = played === puzzle.bestUci || test.isCheckmate();
    let near = false;
    if (!ok) {
      setState("checking");
      near = await moveIsGoodEnough(engine, puzzle.fen, played);
      if (!alive.current) return;
      ok = near;
    }
    if (ok) {
      sfx(store, "gameEnd");
      buzz(store, [30, 40, 30]);
      setAlt(near ? mv.san : false);
      setState("solved");
      resolve(true);
    } else {
      failed.current = true;
      sfx(store, "lose");
      buzz(store, 60);
      setState("wrong");
    }
  };

  const next = () => {
    setState("try");
    setHint(0);
    setIdx(0);
    setHeldId(null);
  };

  return (
    <div className="page gamepage">
      <TopBar
        title="My blunders"
        sub={`${unsolved.length} to retrain · ${turn} to move`}
        onBack={() => nav("puzzles")}
      />
      <p className="hint small puzzleprompt">
        You played <b>{puzzle.playedSan}</b> here ({puzzle.severity}). Find the better move.
      </p>
      <Board
        fen={puzzle.fen}
        orientation={chess.turn()}
        dests={dests}
        onMove={tryMove}
        arrow={
          state === "solved" || state === "revealed" || hint >= 2
            ? [puzzle.bestUci.slice(0, 2), puzzle.bestUci.slice(2, 4)]
            : null
        }
        highlightSquares={
          hint === 1 && state !== "solved" && state !== "revealed" ? [puzzle.bestUci.slice(0, 2)] : null
        }
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
      {state === "checking" && <p className="hint center">Checking your move...</p>}
      {state === "wrong" && <p className="warn center">Not that one, try again.</p>}
      {(state === "solved" || state === "revealed") && (
        <p className="okmsg center">
          {state === "solved" ? (alt ? `✓ ${alt} is just as good. The engine's ` : "✓ Exactly: ") : ""}best was <b>{puzzle.bestSan}</b>
        </p>
      )}
      {(state === "solved" || state === "revealed") && failed.current && (
        <p className="hint small center">Scheduled for review tomorrow.</p>
      )}
      <div className="btnrow toolrow">
        {state !== "solved" && state !== "revealed" && (
          <>
            <button
              className="linkbtn"
              disabled={hint >= 2}
              onClick={() => {
                failed.current = true;
                setHint((h) => Math.min(h + 1, 2));
              }}
            >
              {hint === 0 ? "💡 Hint" : "Move"}
            </button>
            <button
              className="linkbtn"
              onClick={() => {
                failed.current = true;
                setState("revealed");
                resolve(false);
              }}
            >
              Reveal
            </button>
          </>
        )}
        {(state === "solved" || state === "revealed") && (
          <button
            className="linkbtn"
            onClick={() => nav("analysis", { fen: puzzle.fen, back: { screen: "puzzles", set: "blunders" } })}
          >
            🔬 Analysis
          </button>
        )}
        {(state === "solved" || state === "revealed") && (
          <button className="bigbtn" onClick={next}>
            Next puzzle
          </button>
        )}
        <button
          className="linkbtn danger"
          onClick={() => {
            setStore((s) => ({ ...s, puzzles: s.puzzles.filter((p) => p.id !== puzzle.id) }));
            setHeldId(null);
            setState("try");
            setHint(0);
          }}
        >
          Discard
        </button>
      </div>
    </div>
  );
}
