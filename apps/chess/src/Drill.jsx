import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import Board from "./Board.jsx";
import { TopBar } from "./ui.jsx";
import { play as sfx, buzz } from "./audio.js";
import { loadOpeningMeta, continuations, nameFor } from "./openingdb.js";

const EXTRA_PLIES = 8;

export function drillKey(lineSans, color) {
  return `${lineSans.join(" ")}|${color}`;
}

function legalBook(prefix, meta) {
  const c = new Chess();
  try {
    for (const s of prefix) c.move(s);
  } catch {
    return [];
  }
  return continuations(prefix, meta).filter((n) => {
    try {
      new Chess(c.fen()).move(n.move);
      return true;
    } catch {
      return false;
    }
  });
}

function weightedPick(opts) {
  const total = opts.reduce((a, o) => a + (o.plays || 0) + o.lines, 0);
  let roll = Math.random() * total;
  for (const o of opts) {
    roll -= (o.plays || 0) + o.lines;
    if (roll <= 0) return o;
  }
  return opts[0];
}

function toSan(fen, from, to, promotion) {
  try {
    return new Chess(fen).move({ from, to, promotion: promotion || "q" });
  } catch {
    return null;
  }
}

export default function Drill({ store, setStore, nav, view }) {
  const line = useMemo(() => {
    const c = new Chess();
    const out = [];
    for (const s of view.sans || []) {
      try {
        out.push(c.move(s).san);
      } catch {
        break;
      }
    }
    return out;
  }, [view.sans]);
  const [color, setColor] = useState(view.color === "b" ? "b" : "w");
  const [meta, setMeta] = useState(null);
  const [sans, setSans] = useState([]);
  const [misses, setMisses] = useState(0);
  const [stepMiss, setStepMiss] = useState(0);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [runId, setRunId] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadOpeningMeta()
      .then((m) => !cancelled && setMeta(m))
      .catch(() => !cancelled && setMeta({}));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const named = useMemo(() => nameFor(line), [line]);
  const title = named ? named.name : "Opening drill";
  const key = drillKey(line, color);
  const progress = store.drillProgress?.[key] || { mastered: 0, runs: 0 };

  const chess = useMemo(() => {
    const c = new Chess();
    for (const s of sans) c.move(s);
    return c;
  }, [sans]);

  const expected = useMemo(() => {
    if (!meta) return null;
    if (sans.length < line.length) return line[sans.length];
    if (sans.length >= line.length + EXTRA_PLIES) return null;
    return legalBook(sans, meta)[0]?.move || null;
  }, [sans, line, meta]);

  const userTurn = chess.turn() === color;

  const finish = (missCount) => {
    setDone(true);
    sfx(store, "gameEnd");
    setStore((s) => {
      const prev = s.drillProgress?.[key] || { mastered: 0, runs: 0 };
      return {
        ...s,
        drillProgress: {
          ...(s.drillProgress || {}),
          [key]: {
            name: title,
            mastered: prev.mastered + (missCount === 0 ? 1 : 0),
            runs: prev.runs + 1,
            last: Date.now(),
          },
        },
      };
    });
  };

  useEffect(() => {
    if (!meta || done) return;
    if (!expected) {
      if (sans.length > 0) finish(misses);
      return;
    }
    if (userTurn) return;
    timer.current = setTimeout(() => {
      let move = expected;
      if (sans.length >= line.length) {
        const opts = legalBook(sans, meta);
        if (opts.length) move = weightedPick(opts).move;
      }
      sfx(store, "move");
      setSans((s) => [...s, move]);
    }, 450);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expected, userTurn, meta, done, runId]);

  const dests = useMemo(() => {
    if (!userTurn || done || !expected) return null;
    const map = new Map();
    for (const m of chess.moves({ verbose: true })) {
      if (!map.has(m.from)) map.set(m.from, []);
      map.get(m.from).push(m.to);
    }
    return map;
  }, [chess, userTurn, done, expected]);

  const expectedMove = useMemo(() => {
    if (!expected) return null;
    try {
      return new Chess(chess.fen()).move(expected);
    } catch {
      return null;
    }
  }, [chess, expected]);

  const onMove = (from, to, promotion) => {
    const mv = toSan(chess.fen(), from, to, promotion);
    if (!mv) return;
    if (mv.san === expected) {
      sfx(store, mv.captured ? "capture" : "move");
      setStepMiss(0);
      setNote("");
      setSans((s) => [...s, mv.san]);
      return;
    }
    sfx(store, "lose");
    buzz(store, 60);
    setMisses((n) => n + 1);
    setStepMiss((n) => n + 1);
    const book = legalBook(sans, meta).some((n) => n.move === mv.san);
    setNote(book ? `${mv.san} is book too, but this line continues differently.` : `${mv.san} is not the book move here.`);
  };

  const restart = (nextColor = color) => {
    clearTimeout(timer.current);
    setColor(nextColor);
    setSans([]);
    setMisses(0);
    setStepMiss(0);
    setNote("");
    setDone(false);
    setRunId((n) => n + 1);
  };

  const hintSquare = stepMiss === 1 && expectedMove ? [expectedMove.from] : null;
  const hintArrow = stepMiss >= 2 && expectedMove ? [expectedMove.from, expectedMove.to] : null;
  const last = useMemo(() => {
    const h = chess.history({ verbose: true });
    const m = h[h.length - 1];
    return m ? [m.from, m.to] : null;
  }, [chess]);

  return (
    <div className="page gamepage">
      <TopBar
        title={`Drill: ${title}`}
        sub={`${color === "w" ? "White" : "Black"} · mastered ${progress.mastered}x · ${progress.runs} runs`}
        onBack={() => nav("openings")}
      />
      {!meta ? (
        <p className="hint">Loading…</p>
      ) : (
        <>
          <Board
            fen={chess.fen()}
            orientation={color}
            lastMove={last}
            dests={dests}
            onMove={onMove}
            arrow={hintArrow}
            highlightSquares={hintSquare}
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
          <div className="movepath">
            {sans.map((s, i) => (
              <span key={i} className={"pathmove" + (i >= line.length ? " offline" : "")}>
                {i % 2 === 0 ? `${i / 2 + 1}.` : ""}
                {s}
              </span>
            ))}
          </div>
          {done ? (
            <div className="card center">
              <p className="okmsg">
                {misses === 0 ? "Clean run: line mastered +1" : `Line complete with ${misses} ${misses === 1 ? "miss" : "misses"}`}
              </p>
              <div className="btnrow endrow">
                <button className="linkbtn" onClick={() => restart()}>
                  Drill again
                </button>
                <button
                  className="bigbtn"
                  onClick={() =>
                    nav("play", { pick: true, fromFen: chess.fen(), fromLabel: named ? `${named.eco} ${named.name}` : "the drill" })
                  }
                >
                  ♟ Play from here
                </button>
              </div>
            </div>
          ) : (
            <>
              {note && <p className="warn center">{note}</p>}
              <p className="hint center small">
                {userTurn
                  ? stepMiss
                    ? stepMiss === 1
                      ? "Hint: the highlighted piece moves."
                      : "The arrow shows the book move."
                    : sans.length < line.length
                      ? "Your move: play the book move."
                      : "Past the named line: play the most popular reply."
                  : "Opponent is choosing a book move..."}
              </p>
              <div className="btnrow toolrow">
                <button className="linkbtn" onClick={() => restart(color === "w" ? "b" : "w")}>
                  ⇅ Drill as {color === "w" ? "Black" : "White"}
                </button>
                <button className="linkbtn" onClick={() => restart()}>
                  Restart
                </button>
                {userTurn && stepMiss < 2 && (
                  <button className="linkbtn" onClick={() => setStepMiss(2)}>
                    Show move
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
