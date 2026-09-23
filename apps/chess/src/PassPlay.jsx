import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import Board from "./Board.jsx";
import { TopBar, Toggle, MoveList, useGameBackGuard } from "./ui.jsx";
import { findOpening } from "./openings.js";
import { play as sfx, buzz } from "./audio.js";
import { newId } from "./storage.js";
import { useConfirm } from "@shared/ui.jsx";
import { useWakeLock } from "@shared/useWakeLock.js";

export default function PassPlay({ store, setStore, nav, view }) {
  const cur = store.current;
  if (view.setup || !cur || cur.mode !== "pass") {
    return <Setup store={store} setStore={setStore} nav={nav} />;
  }
  return <Game store={store} setStore={setStore} nav={nav} />;
}

function Setup({ store, setStore, nav }) {
  const [autoFlip, setAutoFlip] = useState(true);
  const [useClock, setUseClock] = useState(false);
  const [minutes, setMinutes] = useState(10);
  const [inc, setInc] = useState(0);

  const start = () => {
    setStore((s) => ({
      ...s,
      current: {
        id: newId(),
        mode: "pass",
        autoFlip,
        sans: [],
        status: "playing",
        result: null,
        clock: useClock
          ? { w: minutes * 60000, b: minutes * 60000, incMs: inc * 1000, turnStartedAt: null }
          : null,
        createdAt: Date.now(),
      },
    }));
    nav("passplay");
  };

  return (
    <div className="page">
      <TopBar title="Pass & play" sub="Two players, one phone" onBack={() => nav("home")} />
      <div className="setrow">
        <span className="setlabel">Flip board each move</span>
        <Toggle checked={autoFlip} onChange={setAutoFlip} />
      </div>
      <div className="setrow">
        <span className="setlabel">Use clock</span>
        <Toggle checked={useClock} onChange={setUseClock} />
      </div>
      {useClock && (
        <>
          <div className="setrow">
            <span className="setlabel">Minutes per side</span>
            <div className="chips">
              {[3, 5, 10, 15].map((m) => (
                <button key={m} className={"chip" + (minutes === m ? " sel" : "")} onClick={() => setMinutes(m)}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="setrow">
            <span className="setlabel">Increment (s)</span>
            <div className="chips">
              {[0, 2, 5, 10].map((v) => (
                <button key={v} className={"chip" + (inc === v ? " sel" : "")} onClick={() => setInc(v)}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      {store.current && <p className="warn">Starting a new game abandons the current one.</p>}
      <button className="bigbtn start" onClick={start}>
        Start game
      </button>
    </div>
  );
}

function Game({ store, setStore, nav }) {
  const g = store.current;
  const [tickN, tick] = useState(0);
  const [confirm, confirmSheet] = useConfirm();
  const lowWarned = useRef(null);

  const chess = useMemo(() => {
    const c = new Chess();
    for (const san of g.sans) c.move(san);
    return c;
  }, [g.sans]);

  const turn = chess.turn();
  const orientation = g.autoFlip ? turn : "w";
  const opening = useMemo(() => findOpening(g.sans), [g.sans]);
  const over = g.status === "over";
  useWakeLock(!over);
  const askEnd = () =>
    confirm({ title: "End this game?", message: "The game is discarded without saving.", confirmLabel: "End game", danger: true });
  const discard = () => setStore((s) => ({ ...s, current: null }));
  useGameBackGuard(g.status === "playing" && g.sans.length > 0, askEnd, discard);

  // clock ticking (display only; remaining is computed from timestamps)
  useEffect(() => {
    if (!g.clock || over) return;
    const t = setInterval(() => tick((x) => x + 1), 200);
    return () => clearInterval(t);
  }, [g.clock, over]);

  const remaining = (color) => {
    if (!g.clock) return null;
    let ms = g.clock[color];
    if (turn === color && g.clock.turnStartedAt && !over) ms -= Date.now() - g.clock.turnStartedAt;
    return Math.max(0, ms);
  };

  useEffect(() => {
    if (!g.clock || over || !g.clock.turnStartedAt) return;
    const r = remaining(turn);
    const key = turn + g.sans.length;
    if (r > 0 && r < 10000 && lowWarned.current !== key) {
      lowWarned.current = key;
      sfx(store, "lowTime");
      buzz(store, 30);
    }
    if (r <= 0) {
      setStore((s) =>
        s.current && s.current.id === g.id && s.current.status === "playing"
          ? {
              ...s,
              current: {
                ...s.current,
                status: "over",
                result: turn === "w" ? "0-1" : "1-0",
                reason: "time",
                clock: { ...s.current.clock, [turn]: 0, turnStartedAt: null },
              },
            }
          : s
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickN, over, turn, g.clock, g.id, g.sans.length]);

  const dests = useMemo(() => {
    if (over) return null;
    const map = new Map();
    for (const m of chess.moves({ verbose: true })) {
      if (!map.has(m.from)) map.set(m.from, []);
      map.get(m.from).push(m.to);
    }
    return map;
  }, [chess, over]);

  const lastMove = useMemo(() => {
    const h = chess.history({ verbose: true });
    const m = h[h.length - 1];
    return m ? [m.from, m.to] : null;
  }, [chess]);

  const onMove = (from, to, promotion) => {
    const test = new Chess(chess.fen());
    const mv = test.move({ from, to, promotion: promotion || "q" });
    if (!mv) return;
    sfx(store, mv.captured ? "capture" : "move");
    buzz(store, 12);
    setStore((s) => {
      const c = s.current;
      if (!c || c.id !== g.id || c.status !== "playing") return s;
      let clock = c.clock;
      if (clock) {
        const spent = clock.turnStartedAt ? Date.now() - clock.turnStartedAt : 0;
        clock = {
          ...clock,
          [mv.color]: Math.max(0, clock[mv.color] - spent) + clock.incMs,
          turnStartedAt: Date.now(),
        };
      }
      const clockHist = c.clock ? [...(c.clockHist || []), c.clock].slice(-400) : c.clockHist;
      const next = { ...c, sans: [...c.sans, mv.san], clock, clockHist };
      if (test.isGameOver()) {
        next.status = "over";
        next.result = test.isCheckmate() ? (test.turn() === "w" ? "0-1" : "1-0") : "1/2-1/2";
        next.reason = test.isCheckmate() ? "checkmate" : "draw";
        sfx(store, "gameEnd");
      }
      return { ...s, current: next };
    });
  };

  const fmt = (ms) => {
    const s = Math.ceil(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  const checkSquare = useMemo(() => {
    if (!chess.inCheck()) return null;
    for (const row of chess.board())
      for (const sq of row) if (sq && sq.type === "k" && sq.color === chess.turn()) return sq.square;
    return null;
  }, [chess]);

  return (
    <div className="page gamepage">
      <TopBar
        title="Pass & play"
        sub={over ? `${g.result} · ${g.reason}` : opening ? opening.name : `${turn === "w" ? "White" : "Black"} to move`}
        onBack={() => nav("home")}
      />
      {g.clock && (
        <div className="clockrow">
          <span className={"clockchip" + (turn === "b" && !over ? " running" : "") + (remaining("b") < 10000 ? " low" : "")}>♟ {fmt(remaining("b"))}</span>
          <span className={"clockchip" + (turn === "w" && !over ? " running" : "") + (remaining("w") < 10000 ? " low" : "")}>♙ {fmt(remaining("w"))}</span>
        </div>
      )}
      <Board
        fen={chess.fen()}
        orientation={orientation}
        lastMove={lastMove}
        checkSquare={checkSquare}
        dests={dests}
        onMove={onMove}
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
      <div className="btnrow toolrow">
        <button
          className="linkbtn"
          onClick={() =>
            setStore((s) => {
              const c = s.current;
              if (!c || c.id !== g.id) return s;
              let clock = c.clock;
              let clockHist = c.clockHist;
              if (clock) {
                const hist = [...(c.clockHist || [])];
                const prev = hist.pop();
                clockHist = hist;
                clock = prev
                  ? { ...prev, turnStartedAt: c.sans.length > 1 ? Date.now() : null }
                  : { ...clock, turnStartedAt: null };
              }
              return {
                ...s,
                current: { ...c, sans: c.sans.slice(0, -1), status: "playing", result: null, reason: null, clock, clockHist },
              };
            })
          }
          disabled={g.sans.length === 0}
        >
          ↩ Undo
        </button>
        {over && (
          <button
            className="bigbtn"
            onClick={() => {
              const id = g.id;
              setStore((s) => ({
                ...s,
                games: [
                  { id, date: Date.now(), mode: "pass", sans: g.sans, result: g.result, reason: g.reason, review: null },
                  ...s.games,
                ].slice(0, 200),
                current: null,
              }));
              nav("review", { gameId: id });
            }}
          >
            Review game
          </button>
        )}
        <button
          className="linkbtn danger"
          onClick={async () => {
            if (!(await askEnd())) return;
            discard();
            nav("home");
          }}
        >
          End
        </button>
      </div>
      <MoveList sans={g.sans} activePly={g.sans.length - 1} />
      {confirmSheet}
    </div>
  );
}
