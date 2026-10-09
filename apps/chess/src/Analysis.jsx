import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import Board, { EvalBar } from "./Board.jsx";
import { TopBar, MoveList, useArrowKeys } from "./ui.jsx";
import { getEngine, cpWhite, winPct, nullMoveFen, fmtCp } from "./engine.js";
import { CLASSIFICATIONS } from "./review.js";
import { findOpening } from "./openings.js";
import { ENGINE_LOADING } from "./platform.js";
import { useToast } from "@shared/ui.jsx";
import { gamePgn, pgnFilename, copyToClipboard } from "./pgn.js";
import ExportSheet from "./ExportSheet.jsx";
import { legalDests, promotionCheck, pvToSans } from "./core/position.js";
import { classifyDrop } from "./core/classify.js";
import { threatsFromProbe } from "./core/threats.js";

// Free analysis board: play both sides, paste a FEN or PGN, watch the eval
// bar and the engine's best line update continuously.
export default function Analysis({ store, nav, view }) {
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const engine = getEngine();
  const [sans, setSans] = useState([]);
  // Arriving from the position editor hands the board a position to start from.
  const [startFen, setStartFen] = useState(view?.fen || null);
  const [viewPly, setViewPly] = useState(null); // null = end of line
  const [branches, setBranches] = useState([]); // {atPly, sans}
  const [paste, setPaste] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [orientation, setOrientation] = useState("w");
  const [evalInfo, setEvalInfo] = useState(null); // {fen, cp, bestSan, pvSans, depth, alts}
  const [engineReady, setEngineReady] = useState(false);
  const [verdict, setVerdict] = useState(null); // last move's quality
  const [showMissed, setShowMissed] = useState(false);
  const [showThreats, setShowThreats] = useState(true);
  const [threats, setThreats] = useState([]);
  const evalSeq = useRef(0);
  const threatSeq = useRef(0);
  const pending = useRef(null); // move awaiting its post-move eval

  useEffect(() => {
    engine.ready.then(() => setEngineReady(true));
  }, [engine]);

  // The displayed position: full line, or truncated at viewPly.
  const dispSans = viewPly == null ? sans : sans.slice(0, viewPly + 1);
  const chess = useMemo(() => {
    const c = startFen ? new Chess(startFen) : new Chess();
    for (const san of dispSans) c.move(san);
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startFen, sans, viewPly]);
  const fen = chess.fen();
  // The engine read of the position on the board right now. After a move the
  // previous read is stale until the new search lands: lines, arrow and move
  // grading use only this; the eval bar keeps the last value to avoid a jump.
  const live = evalInfo && evalInfo.fen === fen ? evalInfo : null;
  const liveCp = live ? live.cp : null;
  // Opening names only mean something from the normal start (bug 16).
  const opening = useMemo(() => (startFen ? null : findOpening(sans)), [startFen, sans]);

  const navTo = (fn) => {
    setVerdict(null);
    setShowMissed(false);
    setViewPly(fn);
  };

  useArrowKeys(
    () =>
      navTo((v) => {
        const cur = v == null ? sans.length - 1 : v;
        return Math.max(-1, cur - 1);
      }),
    () =>
      navTo((v) => {
        if (v == null) return null;
        return v >= sans.length - 1 ? null : v + 1;
      })
  );

  // continuous evaluation of the current position
  useEffect(() => {
    let cancelled = false;
    const seq = ++evalSeq.current;
    if (chess.isGameOver()) {
      setEvalInfo(null);
      return;
    }
    const timer = setTimeout(() => engine
      .analyze(fen, { movetime: 600, multipv: 5, tag: "analysis" })
      .then((r) => {
        if (cancelled || seq !== evalSeq.current || !r.lines[0]) return;
        const info = r.lines[0];
        const cp = cpWhite(info, chess.turn());
        const pvSans = pvToSans(fen, info.pv.slice(0, 6));
        const alts = r.lines.map((l) => ({
          cp: cpWhite(l, chess.turn()),
          uci: l.move,
          sans: pvToSans(fen, l.pv.slice(0, 8)),
        }));
        setEvalInfo({ fen, cp, bestUci: info.move, bestSan: pvSans[0], pvSans, depth: info.depth, alts });

        // Grade the move that produced this position, if we have the
        // "before" evaluation for it.
        const p = pending.current;
        if (p && p.fenAfter === fen) {
          pending.current = null;
          const sign = p.mover === "w" ? 1 : -1;
          const drop = Math.max(0, winPct(p.cpBefore * sign) - winPct(cp * sign));
          const isBest = p.bestUci === p.playedUci;
          setVerdict({
            san: p.san,
            cls: isBest ? "best" : classifyDrop(drop),
            drop,
            lost: (p.cpBefore - cp) * sign,
            bestSan: p.bestSan,
            bestUci: p.bestUci,
            fenBefore: p.fenBefore,
          });
        }
      })
      .catch(() => {}), 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      engine.cancel("analysis");
    };
  }, [fen, engine, chess]);

  // What is the opponent threatening in this position? Judged against the
  // position's own eval, so harmless ideas are not drawn as threats.
  useEffect(() => {
    const seq = ++threatSeq.current;
    setThreats([]);
    if (!showThreats || liveCp == null || chess.isGameOver() || chess.inCheck()) return;
    let cancelled = false;
    const nfen = nullMoveFen(fen);
    const timer = setTimeout(() => engine
      .analyze(nfen, { movetime: 350, multipv: 2, tag: "analysis-threat" })
      .then((r) => {
        if (cancelled || seq !== threatSeq.current) return;
        setThreats(threatsFromProbe(r.lines, nfen.split(" ")[1], liveCp));
      })
      .catch(() => {}), 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      engine.cancel("analysis-threat");
    };
  }, [fen, engine, chess, showThreats, liveCp]);

  const dests = useMemo(() => {
    return legalDests(chess);
  }, [chess]);

  const lastMove = useMemo(() => {
    const h = chess.history({ verbose: true });
    const m = h[h.length - 1];
    return m ? [m.from, m.to] : null;
  }, [chess]);

  const onMove = (from, to, promotion) => {
    const test = new Chess(fen);
    const mv = test.move({ from, to, promotion: promotion || "q" });
    if (!mv) return;
    setShowMissed(false);
    setVerdict(null);
    // Remember this position's evaluation so the move can be graded once
    // the resulting position has been analyzed.
    pending.current = live
      ? {
          fenBefore: fen,
          fenAfter: test.fen(),
          cpBefore: live.cp,
          bestUci: live.bestUci,
          bestSan: live.bestSan,
          playedUci: mv.from + mv.to + (mv.promotion || ""),
          san: mv.san,
          mover: mv.color,
        }
      : null;
    if (viewPly != null) {
      const base = viewPly + 1;
      if (sans[base] === mv.san) {
        setViewPly(base >= sans.length - 1 ? null : base);
        return;
      }
      if (sans.length > base) setBranches((bs) => [{ atPly: base, sans }, ...bs].slice(0, 8));
      setSans([...sans.slice(0, base), mv.san]);
      setViewPly(null);
      return;
    }
    setSans((s) => [...s, mv.san]);
  };

  const restoreBranch = (i) => {
    setBranches((bs) => {
      const next = [...bs];
      const b = next.splice(i, 1)[0];
      if (b) {
        if (sans.length > b.atPly) next.unshift({ atPly: b.atPly, sans });
        setSans(b.sans);
        setViewPly(null);
      }
      return next.slice(0, 8);
    });
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
        setViewPly(null);
        setBranches([]);
        setShowPaste(false);
        return;
      } catch {
        /* not a FEN, try PGN */
      }
    }
    try {
      const c = new Chess();
      c.loadPgn(text);
      // A PGN that starts from a set-up position carries it in its headers;
      // the moves only replay from there (bug 1: this used to crash the app).
      const h = c.header();
      setStartFen(h.FEN || null);
      setSans(c.history());
      setViewPly(null);
      setBranches([]);
      setShowPaste(false);
    } catch {
      toast("Couldn't parse that as a FEN or PGN.");
    }
  };

  return (
    <div className="page gamepage">
      <TopBar
        title="Analysis board"
        sub={opening ? opening.name : live ? `depth ${live.depth}` : "free board"}
        onBack={() => {
          // Screens that hand over a position (e.g. a finished puzzle) also
          // say where "back" should land; a free board goes home.
          if (view?.back) {
            const { screen, ...params } = view.back;
            nav(screen, params);
          } else nav("home");
        }}
        right={
          <button className="linkbtn" onClick={() => setOrientation((o) => (o === "w" ? "b" : "w"))}>
            ⇅ Flip
          </button>
        }
      />
      {!engineReady && <div className="enginebanner">{ENGINE_LOADING}</div>}

      <div className="boardrow">
        <EvalBar cp={evalInfo ? evalInfo.cp : 0} orientation={orientation} />
        <Board
          fen={showMissed && verdict ? verdict.fenBefore : fen}
          orientation={orientation}
          lastMove={showMissed ? null : lastMove}
          dests={showMissed ? null : dests}
          onMove={onMove}
          arrow={
            showMissed && verdict?.bestUci
              ? [verdict.bestUci.slice(0, 2), verdict.bestUci.slice(2, 4)]
              : live?.bestUci
                ? [live.bestUci.slice(0, 2), live.bestUci.slice(2, 4)]
                : null
          }
          threats={showMissed ? [] : threats}
          theme={store.settings.theme}
          custom={store.settings.boardCustom}
          pieceSet={store.settings.pieces}
          animMs={store.settings.animMs}
          arrowColors={store.settings.arrowColors}
          needsPromotion={promotionCheck(chess)}
        />
      </div>

      {verdict && (
        <div className="moveverdict" style={{ borderColor: CLASSIFICATIONS[verdict.cls].color }}>
          <b style={{ color: CLASSIFICATIONS[verdict.cls].color }}>
            {verdict.san}: {CLASSIFICATIONS[verdict.cls].label}
          </b>
          {verdict.cls !== "best" && verdict.bestSan && (
            <>
              {" "}
              · best was <b>{verdict.bestSan}</b>
              {verdict.lost >= 30 && <span className="lostcp"> ({(verdict.lost / 100).toFixed(1)})</span>}
              <button className="linkbtn" onClick={() => setShowMissed((s) => !s)}>
                {showMissed ? "back" : "show me"}
              </button>
            </>
          )}
        </div>
      )}

      {live?.alts?.length > 0 && (
        <div className="enginelines">
          {live.alts.map((l, i) => (
            <button
              key={i}
              className="engineline"
              onClick={() => onMove(l.uci.slice(0, 2), l.uci.slice(2, 4), l.uci[4])}
            >
              <b>{fmtCp(l.cp)}</b> {l.sans.join(" ")}
            </button>
          ))}
        </div>
      )}

      {viewPly != null && (
        <div className="previewbar">
          {viewPly < 0 ? "Start position" : `Viewing move ${Math.floor(viewPly / 2) + 1}`}. Play here to
          branch
          <button className="linkbtn" onClick={() => setViewPly(null)}>
            To end
          </button>
        </div>
      )}

      {branches.length > 0 && (
        <div className="branchrow">
          {branches.map((b, i) => (
            <button key={i} className="branchchip" onClick={() => restoreBranch(i)}>
              ⑂ move {Math.floor(b.atPly / 2) + 1}: {b.sans.slice(b.atPly, b.atPly + 3).join(" ")}
              {b.sans.length > b.atPly + 3 ? "…" : ""}
            </button>
          ))}
        </div>
      )}

      <div className="btnrow toolrow">
        <button
          className="linkbtn"
          onClick={() => {
            setSans((s) => s.slice(0, -1));
            setViewPly(null);
          }}
          disabled={sans.length === 0}
        >
          ↩ Undo
        </button>
        <button
          className="linkbtn"
          onClick={() => {
            const prev = { sans, startFen, branches };
            setSans([]);
            setStartFen(null);
            setViewPly(null);
            setBranches([]);
            if (prev.sans.length || prev.startFen)
              toast.undo("Board reset", () => {
                setSans(prev.sans);
                setStartFen(prev.startFen);
                setBranches(prev.branches);
                setViewPly(null);
              });
          }}
        >
          Reset
        </button>
        <button
          className={"linkbtn" + (showThreats ? " on" : "")}
          onClick={() => setShowThreats((s) => !s)}
        >
          ⚠ Threats {showThreats ? "on" : "off"}
        </button>
        <button className="linkbtn" onClick={() => setShowPaste((s) => !s)}>
          {showPaste ? "Close" : "Paste FEN/PGN"}
        </button>
        <button className="linkbtn" onClick={() => setExporting(true)} disabled={sans.length === 0}>
          ⤓ Export PGN
        </button>
        <button
          className="linkbtn"
          onClick={async () => toast((await copyToClipboard(fen)) ? "FEN copied" : "Copy blocked by the browser")}
        >
          Copy FEN
        </button>
      </div>
      <ExportSheet
        open={exporting}
        title="Export analysis"
        text={exporting ? gamePgn({ mode: "analysis", date: Date.now(), sans, startFen, result: null }) : ""}
        filename={pgnFilename("analysis")}
        onClose={() => setExporting(false)}
      />

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

      <MoveList
        sans={sans}
        activePly={viewPly ?? sans.length - 1}
        onTap={(p) => navTo(p >= sans.length - 1 ? null : p)}
      />
    </div>
  );
}
