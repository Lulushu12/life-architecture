import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import Board, { EvalBar } from "./Board.jsx";
import { TopBar, Toggle, MoveList } from "./ui.jsx";
import { Engine, getEngine, cpWhite } from "./engine.js";
import { loadOpeningMeta, randomSharpLine } from "./openingdb.js";
import { findOpening } from "./openings.js";
import { newId } from "./storage.js";

// Two engines, both at full strength, playing each other while you watch.
//
// Nothing here handicaps anybody: skill stays at 20 and strength limiting stays
// off. The interest has to come from asymmetry instead, and there are two
// honest sources of it.
//
// The first is the evaluator. Stockfish 16 ships two: the neural net, and the
// classical hand-crafted evaluation it grew up with. Same search, same depth,
// same full strength — but they value positions differently enough to reach
// different moves, which is what makes a game instead of a handshake. The
// classical side never loads the 39 MB net, so running both costs no more
// memory than the app already uses.
//
// The second is the clock. A side given ten times longer simply sees further.
//
// The third source isn't a setting at all: where the game starts. Two equal
// engines from the initial position draw over and over. Start them somewhere
// already unbalanced — a gambit, or a position you built yourself — and they
// have to fight.

const KINDS = {
  nnue: { label: "Neural net", short: "NNUE" },
  classical: { label: "Classical", short: "HCE" },
};

const TIMES = [
  { ms: 100, label: "0.1s" },
  { ms: 500, label: "0.5s" },
  { ms: 1000, label: "1s" },
  { ms: 3000, label: "3s" },
  { ms: 10000, label: "10s" },
];

const MAX_PLIES = 400; // 200 moves; engines will grind forever otherwise
const ADJ_CP = 900; // adjudication threshold, in centipawns…
const ADJ_PLIES = 8; // …sustained this many plies

const timeLabel = (ms) => TIMES.find((t) => t.ms === ms)?.label ?? `${ms}ms`;
const nameOf = (cfg) => `${KINDS[cfg.kind].short} ${timeLabel(cfg.ms)}`;

/** Is the game over — by the rules, by the move cap, or by adjudication? */
function terminalOf(chess, plies, scores, adjudicate) {
  if (chess.isCheckmate()) return { result: chess.turn() === "w" ? "0-1" : "1-0", reason: "checkmate" };
  if (chess.isStalemate()) return { result: "1/2-1/2", reason: "stalemate" };
  if (chess.isInsufficientMaterial()) return { result: "1/2-1/2", reason: "insufficient material" };
  if (chess.isThreefoldRepetition()) return { result: "1/2-1/2", reason: "threefold repetition" };
  if (chess.isDraw()) return { result: "1/2-1/2", reason: "fifty-move rule" };
  if (plies >= MAX_PLIES) return { result: "*", reason: `stopped after ${MAX_PLIES / 2} moves` };
  if (adjudicate && scores.length >= ADJ_PLIES) {
    const tail = scores.slice(-ADJ_PLIES);
    if (tail.every((s) => s.cp >= ADJ_CP)) return { result: "1-0", reason: "adjudicated, White winning" };
    if (tail.every((s) => s.cp <= -ADJ_CP)) return { result: "0-1", reason: "adjudicated, Black winning" };
  }
  return null;
}

export default function EngineMatch({ store, setStore, nav, view }) {
  const [meta, setMeta] = useState(null);
  const [startFen, setStartFen] = useState(view?.fen || null);
  const [startLabel, setStartLabel] = useState(view?.fen ? "your custom position" : null);
  const [white, setWhite] = useState({ kind: "nnue", ms: 1000 });
  const [black, setBlack] = useState({ kind: "classical", ms: 1000 });
  const [adjudicate, setAdjudicate] = useState(true);
  const [running, setRunning] = useState(false);
  const [sans, setSans] = useState([]);
  const [scores, setScores] = useState([]); // per ply: {cp (White's view), by, depth}
  const [outcome, setOutcome] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [warming, setWarming] = useState(false);

  // Bumped whenever a search's result should be thrown away — pausing,
  // resetting, leaving the screen.
  const gen = useRef(0);
  const busy = useRef(false);
  const classical = useRef(null);
  // Only engines this screen actually handed out get stopped — asking for the
  // shared one just to stop it would build a neural-net worker that a
  // classical-only match never wanted.
  const used = useRef(new Set());

  const engineFor = (kind) => {
    let e;
    if (kind === "nnue") e = getEngine();
    else {
      if (!classical.current) classical.current = new Engine({ nnue: false });
      e = classical.current;
    }
    used.current.add(e);
    return e;
  };

  // Engines are built when the match starts, never before — warming up the
  // default pairing would download the 39 MB net for someone who was about to
  // pick two classical sides.
  const start = () => {
    const kinds = [...new Set([white.kind, black.kind])];
    const pending = kinds.map((k) => engineFor(k).ready);
    setWarming(true);
    Promise.all(pending).then(() => setWarming(false));
    setRunning(true);
  };

  useEffect(() => {
    let cancelled = false;
    loadOpeningMeta()
      .then((m) => !cancelled && setMeta(m))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Leaving mid-search must not leave a worker grinding in the background. The
  // shared engine belongs to the rest of the app, so it's stopped but kept; the
  // classical one exists only for this screen and goes with it.
  useEffect(
    () => () => {
      gen.current++;
      for (const e of used.current) e.stopCurrent();
      classical.current?.destroy();
      classical.current = null;
      used.current.clear();
    },
    []
  );

  const chess = useMemo(() => {
    const c = startFen ? new Chess(startFen) : new Chess();
    for (const san of sans) {
      try {
        c.move(san);
      } catch {
        break;
      }
    }
    return c;
  }, [startFen, sans]);

  const fen = chess.fen();
  const opening = useMemo(() => (startFen ? null : findOpening(sans)), [startFen, sans]);

  const stop = () => {
    gen.current++;
    busy.current = false;
    setRunning(false);
    for (const e of used.current) e.stopCurrent();
  };

  const finish = (o) => {
    stop();
    setOutcome(o);
  };

  // ---- the match loop: one search per ply, from whichever side is to move ----
  useEffect(() => {
    if (!running || outcome) return;
    const over = terminalOf(chess, sans.length, scores, adjudicate);
    if (over) {
      finish(over);
      return;
    }
    if (busy.current) return;
    busy.current = true;
    const myGen = gen.current;
    const turn = chess.turn();
    const cfg = turn === "w" ? white : black;
    const atLen = sans.length;

    engineFor(cfg.kind)
      .analyze(fen, { movetime: cfg.ms })
      .then((r) => {
        busy.current = false;
        if (myGen !== gen.current) return;
        const uci = r.bestmove;
        let mv = null;
        if (uci && uci !== "(none)") {
          try {
            mv = new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
          } catch {
            mv = null;
          }
        }
        if (!mv) {
          finish({ result: "*", reason: "the engine had no legal move to make" });
          return;
        }
        const info = r.lines[0];
        // Appends are guarded on length so a duplicated effect run can't play
        // the same move twice.
        setSans((s) => (s.length === atLen ? [...s, mv.san] : s));
        setScores((sc) =>
          sc.length === atLen
            ? [
                ...sc,
                {
                  cp: info ? cpWhite(info, turn) : (sc[sc.length - 1]?.cp ?? 0),
                  // kept separately so a forced mate reads as "M4" rather than
                  // the +99.96 that its centipawn stand-in would print
                  mate: info?.mate != null ? (turn === "w" ? info.mate : -info.mate) : null,
                  by: turn,
                  depth: info?.depth ?? 0,
                },
              ]
            : sc
        );
      })
      .catch(() => {
        busy.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, outcome, sans.length]);

  const reset = (fenTo, label) => {
    gen.current++;
    busy.current = false;
    setRunning(false);
    setSans([]);
    setScores([]);
    setOutcome(null);
    if (fenTo !== undefined) {
      setStartFen(fenTo);
      setStartLabel(label ?? null);
    }
  };

  // A random line the engine already reads as unbalanced. A few entries in the
  // list don't replay cleanly, so give up after a handful of tries rather than
  // spinning.
  const pickSharp = () => {
    for (let i = 0; i < 12; i++) {
      const line = randomSharpLine(meta);
      if (!line) return;
      const c = new Chess();
      let ok = true;
      for (const san of line.sans) {
        try {
          if (!c.move(san)) ok = false;
        } catch {
          ok = false;
        }
        if (!ok) break;
      }
      if (ok && !c.isGameOver()) {
        reset(c.fen(), `${line.eco} ${line.name}`);
        return;
      }
    }
  };

  const saveAndReview = () => {
    const id = newId();
    setStore((s) => ({
      ...s,
      games: [
        {
          id,
          date: Date.now(),
          mode: "engine",
          names: { w: nameOf(white), b: nameOf(black) },
          startFen,
          startLabel,
          sans,
          result: outcome.result === "*" ? null : outcome.result,
          reason: outcome.reason,
          review: null,
        },
        ...s.games,
      ].slice(0, 200),
    }));
    nav("review", { gameId: id });
  };

  const lastMove = useMemo(() => {
    const h = chess.history({ verbose: true });
    const m = h[h.length - 1];
    return m ? [m.from, m.to] : null;
  }, [chess]);

  const checkSquare = useMemo(() => {
    if (!chess.inCheck()) return null;
    for (const row of chess.board())
      for (const sq of row) if (sq && sq.type === "k" && sq.color === chess.turn()) return sq.square;
    return null;
  }, [chess]);

  const lastW = [...scores].reverse().find((s) => s.by === "w");
  const lastB = [...scores].reverse().find((s) => s.by === "b");
  const cp = scores[scores.length - 1]?.cp ?? 0;
  const configuring = !running && sans.length === 0 && !outcome;

  return (
    <div className="page gamepage">
      <TopBar
        title="Engine match"
        sub={
          outcome
            ? `${outcome.result} · ${outcome.reason}`
            : startLabel || opening?.name || "both sides at full strength"
        }
        onBack={() => nav("home")}
        right={
          <button className="linkbtn" onClick={() => setFlipped((f) => !f)}>
            ⇅ Flip
          </button>
        }
      />

      {warming && (
        <div className="enginebanner">
          {white.kind === "nnue" || black.kind === "nnue"
            ? "Loading engine (first time: ~39 MB)…"
            : "Starting engine…"}
        </div>
      )}

      <div className="matchhead">
        <SideBadge cfg={white} score={lastW} side="w" />
        <SideBadge cfg={black} score={lastB} side="b" />
      </div>

      <div className="boardrow">
        <EvalBar cp={cp} orientation={flipped ? "b" : "w"} />
        <Board
          fen={fen}
          orientation={flipped ? "b" : "w"}
          lastMove={lastMove}
          checkSquare={checkSquare}
          theme={store.settings.theme}
          pieceSet={store.settings.pieces}
          animMs={store.settings.animMs}
        />
      </div>

      {running && (
        <p className="thinking center">
          {chess.turn() === "w" ? "White" : "Black"} ({KINDS[(chess.turn() === "w" ? white : black).kind].short}) is
          thinking…
        </p>
      )}

      {outcome && (
        <div className="card matchresult">
          <b>{outcome.result === "*" ? "Match stopped" : outcome.result}</b> — {outcome.reason}
        </div>
      )}

      <div className="btnrow toolrow">
        {!running && !outcome && (
          <button className="bigbtn" onClick={start}>
            ▶ {sans.length ? "Resume" : "Start match"}
          </button>
        )}
        {running && (
          <button className="bigbtn" onClick={stop}>
            ⏸ Pause
          </button>
        )}
        {(sans.length > 0 || outcome) && (
          <button className="linkbtn" onClick={() => reset()}>
            ↺ Replay this position
          </button>
        )}
        {outcome && (
          <button className="bigbtn" onClick={saveAndReview}>
            📊 Save & review
          </button>
        )}
      </div>

      {configuring ? (
        <>
          <h2>Starting position</h2>
          <div className="btnrow toolrow">
            <button className="linkbtn" onClick={() => reset(null, null)}>
              Initial position
            </button>
            <button className="linkbtn" onClick={pickSharp} disabled={!meta}>
              🎲 Random sharp opening
            </button>
            <button className="linkbtn" onClick={() => nav("editor")}>
              ✎ Build a position
            </button>
          </div>
          <p className="hint small">
            {startLabel
              ? `Starting from ${startLabel}.`
              : "From the initial position two equal engines mostly draw. Start them somewhere lopsided and they have to fight."}
          </p>

          <h2>White</h2>
          <SideConfig cfg={white} onChange={setWhite} />
          <h2>Black</h2>
          <SideConfig cfg={black} onChange={setBlack} />

          <div className="setrow">
            <span className="setlabel">Call it once a side is winning by 9 pawns</span>
            <Toggle checked={adjudicate} onChange={setAdjudicate} />
          </div>

          <p className="hint small footernote">
            Neither engine is weakened: skill stays at maximum and strength limiting is off. The neural-net and
            classical evaluations are both Stockfish 16 at full search — they just disagree about what a position is
            worth, and each one's own read is shown above. When both sides use the same evaluator they share one
            worker, and with it one search table.
          </p>
        </>
      ) : (
        <MoveList sans={sans} activePly={sans.length - 1} />
      )}
    </div>
  );
}

function SideBadge({ cfg, score, side }) {
  return (
    <div className="mh-side">
      <span className="mh-dot" style={{ background: side === "w" ? "#f0eada" : "#2b2721" }} />
      <span className="mh-name">
        {KINDS[cfg.kind].label} · {timeLabel(cfg.ms)}
      </span>
      <span className="mh-score">
        {!score
          ? "—"
          : score.mate != null
            ? (score.mate > 0 ? "M" : "-M") + Math.abs(score.mate)
            : (score.cp > 0 ? "+" : "") + (score.cp / 100).toFixed(2)}
        {score ? <span className="mh-depth"> d{score.depth}</span> : null}
      </span>
    </div>
  );
}

function SideConfig({ cfg, onChange }) {
  return (
    <div className="card sidecfg">
      <div className="setrow">
        <span className="setlabel">Evaluation</span>
        <div className="chips">
          {Object.entries(KINDS).map(([k, v]) => (
            <button
              key={k}
              className={"chip" + (cfg.kind === k ? " sel" : "")}
              onClick={() => onChange({ ...cfg, kind: k })}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div className="setrow">
        <span className="setlabel">Thinking time per move</span>
        <div className="chips">
          {TIMES.map((t) => (
            <button
              key={t.ms}
              className={"chip" + (cfg.ms === t.ms ? " sel" : "")}
              onClick={() => onChange({ ...cfg, ms: t.ms })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
