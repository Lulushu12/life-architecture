import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import Board, { EvalBar } from "./Board.jsx";
import { TopBar, MoveList } from "./ui.jsx";
import { getEngine, cpWhite } from "./engine.js";
import { uciToSan } from "./review.js";
import { findOpening } from "./openings.js";

// Free analysis board: play both sides, paste a FEN or PGN, watch the eval
// bar and the engine's best line update continuously.
export default function Analysis({ store, nav }) {
  const engine = getEngine();
  const [sans, setSans] = useState([]);
  const [startFen, setStartFen] = useState(null);
  const [paste, setPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [orientation, setOrientation] = useState("w");
  const [evalInfo, setEvalInfo] = useState(null); // {cp, bestSan, pvSans, depth}
  const [engineReady, setEngineReady] = useState(false);
  const evalSeq = useRef(0);

  useEffect(() => {
    engine.ready.then(() => setEngineReady(true));
  }, [engine]);

  const chess = useMemo(() => {
    const c = startFen ? new Chess(startFen) : new Chess();
    for (const san of sans) c.move(san);
    return c;
  }, [startFen, sans]);
  const fen = chess.fen();
  const opening = useMemo(() => findOpening(sans), [sans]);

  // continuous evaluation of the current position
  useEffect(() => {
    let cancelled = false;
    const seq = ++evalSeq.current;
    if (chess.isGameOver()) {
      setEvalInfo(null);
      return;
    }
    engine
      .analyze(fen, { movetime: 600 })
      .then((r) => {
        if (cancelled || seq !== evalSeq.current || !r.lines[0]) return;
        const info = r.lines[0];
        const cp = cpWhite(info, chess.turn());
        const pvSans = pvToSans(fen, info.pv.slice(0, 6));
        setEvalInfo({ cp, bestUci: info.move, bestSan: pvSans[0], pvSans, depth: info.depth });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fen, engine, chess]);

  const dests = useMemo(() => {
    const map = new Map();
    for (const m of chess.moves({ verbose: true })) {
      if (!map.has(m.from)) map.set(m.from, []);
      map.get(m.from).push(m.to);
    }
    return map;
  }, [chess]);

  const lastMove = useMemo(() => {
    const h = chess.history({ verbose: true });
    const m = h[h.length - 1];
    return m ? [m.from, m.to] : null;
  }, [chess]);

  const onMove = (from, to, promotion) => {
    const test = new Chess(fen);
    const mv = test.move({ from, to, promotion: promotion || "q" });
    if (mv) setSans((s) => [...s, mv.san]);
  };

  const loadPaste = () => {
    const text = paste.trim();
    if (!text) return;
    // FEN?
    if (/^[rnbqkpRNBQKP1-8/]+ [wb] /.test(text)) {
      try {
        new Chess(text);
        setStartFen(text);
        setSans([]);
        setShowPaste(false);
        return;
      } catch {
        /* not a FEN, try PGN */
      }
    }
    try {
      const c = new Chess();
      c.loadPgn(text);
      setStartFen(null);
      setSans(c.history());
      setShowPaste(false);
    } catch {
      alert("Couldn't parse that as a FEN or PGN.");
    }
  };

  return (
    <div className="page gamepage">
      <TopBar
        title="Analysis board"
        sub={opening ? opening.name : evalInfo ? `depth ${evalInfo.depth}` : "free board"}
        onBack={() => nav("home")}
        right={
          <button className="linkbtn" onClick={() => setOrientation((o) => (o === "w" ? "b" : "w"))}>
            ⇅ Flip
          </button>
        }
      />
      {!engineReady && <div className="enginebanner">Loading engine (first time: ~39 MB)…</div>}

      <div className="boardrow">
        <EvalBar cp={evalInfo ? evalInfo.cp : 0} orientation={orientation} />
        <Board
          fen={fen}
          orientation={orientation}
          lastMove={lastMove}
          dests={dests}
          onMove={onMove}
          arrow={evalInfo?.bestUci ? [evalInfo.bestUci.slice(0, 2), evalInfo.bestUci.slice(2, 4)] : null}
          theme={store.settings.theme}
          needsPromotion={(from, to) => {
            const piece = chess.get(from);
            return piece?.type === "p" && (to[1] === "8" || to[1] === "1");
          }}
        />
      </div>

      {evalInfo && (
        <div className="bestline">
          <b>{(evalInfo.cp / 100).toFixed(2)}</b> · best: {evalInfo.pvSans.join(" ")}
        </div>
      )}

      <div className="btnrow toolrow">
        <button className="linkbtn" onClick={() => setSans((s) => s.slice(0, -1))} disabled={sans.length === 0}>
          ↩ Undo
        </button>
        <button
          className="linkbtn"
          onClick={() => {
            setSans([]);
            setStartFen(null);
          }}
        >
          Reset
        </button>
        <button className="linkbtn" onClick={() => setShowPaste((s) => !s)}>
          {showPaste ? "Close" : "Paste FEN/PGN"}
        </button>
      </div>

      {showPaste && (
        <div className="card">
          <textarea
            className="input"
            rows={4}
            placeholder={"Paste a FEN or a PGN…"}
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
          />
          <div className="btnrow">
            <button className="bigbtn" onClick={loadPaste}>
              Load
            </button>
          </div>
        </div>
      )}

      <MoveList sans={sans} activePly={sans.length - 1} />
    </div>
  );
}

function pvToSans(fen, pv) {
  const out = [];
  try {
    const c = new Chess(fen);
    for (const uci of pv) {
      const mv = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
      if (!mv) break;
      out.push(mv.san);
    }
  } catch {
    /* truncated pv is fine */
  }
  return out;
}
