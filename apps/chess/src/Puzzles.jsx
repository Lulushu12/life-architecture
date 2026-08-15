import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import Board from "./Board.jsx";
import { TopBar } from "./ui.jsx";
import { play as sfx, buzz } from "./audio.js";

// "My blunders": every mistake/blunder from your reviewed games becomes a
// find-the-better-move puzzle.
export default function BlunderTrainer({ store, setStore, nav }) {
  const unsolved = store.puzzles.filter((p) => !p.solved);
  const [idx, setIdx] = useState(0);
  const [state, setState] = useState("try"); // try | wrong | solved | revealed
  const puzzle = unsolved[Math.min(idx, Math.max(0, unsolved.length - 1))];

  const chess = useMemo(() => (puzzle ? new Chess(puzzle.fen) : null), [puzzle]);

  const dests = useMemo(() => {
    if (!chess || state === "solved" || state === "revealed") return null;
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
            ? "All cleaned up — every blunder retrained. 🎉"
            : "Play and review games; your mistakes will show up here as puzzles."}
        </p>
      </div>
    );
  }

  const turn = chess.turn() === "w" ? "White" : "Black";

  const tryMove = (from, to, promotion) => {
    const test = new Chess(puzzle.fen);
    const mv = test.move({ from, to, promotion: promotion || "q" });
    if (!mv) return;
    const played = mv.from + mv.to + (mv.promotion || "");
    if (played === puzzle.bestUci) {
      sfx(store, "gameEnd");
      buzz(store, [30, 40, 30]);
      setState("solved");
      setStore((s) => ({
        ...s,
        puzzles: s.puzzles.map((p) => (p.id === puzzle.id ? { ...p, solved: true } : p)),
      }));
    } else {
      sfx(store, "lose");
      buzz(store, 60);
      setState("wrong");
    }
  };

  const next = () => {
    setState("try");
    setIdx(0); // unsolved list shrinks as puzzles get solved
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
          state === "solved" || state === "revealed"
            ? [puzzle.bestUci.slice(0, 2), puzzle.bestUci.slice(2, 4)]
            : null
        }
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
      {(state === "solved" || state === "revealed") && (
        <p className="okmsg center">
          {state === "solved" ? "✓ Exactly — " : ""}best was <b>{puzzle.bestSan}</b>
        </p>
      )}
      <div className="btnrow toolrow">
        {state !== "solved" && state !== "revealed" && (
          <button className="linkbtn" onClick={() => setState("revealed")}>
            Reveal
          </button>
        )}
        {(state === "solved" || state === "revealed") && unsolved.length > 0 && (
          <button className="bigbtn" onClick={next}>
            Next puzzle
          </button>
        )}
        <button
          className="linkbtn danger"
          onClick={() =>
            setStore((s) => ({ ...s, puzzles: s.puzzles.filter((p) => p.id !== puzzle.id) })) || setState("try")
          }
        >
          Discard
        </button>
      </div>
    </div>
  );
}
