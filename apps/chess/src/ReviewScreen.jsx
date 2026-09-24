import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import Board from "./Board.jsx";
import { TopBar, MoveList, useArrowKeys } from "./ui.jsx";
import { getEngine, winPct, cpWhite, nullMoveFen, fmtCp } from "./engine.js";
import { reviewGame, withReview, CLASSIFICATIONS, CLASS_ORDER, PHASES, phaseAccuracy, keyMoments, pvToSans } from "./review.js";
import { PERSONAS, getPersona } from "./personas.js";
import { newId, GAME_CAP } from "./storage.js";
import { useToast, useConfirm } from "@shared/ui.jsx";
import { fetchRecentGames, toArchiveGame, SOURCES, ImportError } from "./importers.js";
import { gamePgn, pgnFilename, copyToClipboard } from "./pgn.js";
import ExportSheet from "./ExportSheet.jsx";

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
  const toast = useToast();
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
            headers: {
              ...(header.Event ? { Event: header.Event } : {}),
              ...(header.Site ? { Site: header.Site } : {}),
              ...(header.Date ? { Date: header.Date } : {}),
            },
            players: header.White && header.Black
              ? { w: header.White, b: header.Black, wElo: header.WhiteElo || null, bElo: header.BlackElo || null }
              : undefined,
            sans,
            ...(header.SetUp === "1" && header.FEN ? { startFen: header.FEN } : {}),
            result: header.Result && header.Result !== "*" ? header.Result : null,
            review: null,
          },
          ...s.games,
        ],
      }));
      nav("review", { gameId: id });
    } catch {
      toast("Couldn't parse that PGN. Paste the full game text, headers optional.");
    }
  };
  return (
    <div className="page">
      <TopBar title="Import games" sub="From Lichess, Chess.com or any PGN" onBack={() => nav("home")} />
      <OnlineImport store={store} setStore={setStore} nav={nav} />
      <BatchReview store={store} setStore={setStore} />
      <h2>Paste a PGN</h2>
      <textarea
        className="input"
        rows={8}
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

function fmtPlayed(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function outcomeFor(g) {
  if (!g.result || !g.playerColor) return g.result || "*";
  if (g.result === "1/2-1/2") return "Draw";
  const won = (g.result === "1-0") === (g.playerColor === "w");
  return won ? "Won" : "Lost";
}

function OnlineImport({ store, setStore, nav }) {
  const toast = useToast();
  const [confirm, confirmSheet] = useConfirm();
  const saved = store.settings.importUser || {};
  const [source, setSource] = useState(saved.source === "chesscom" ? "chesscom" : "lichess");
  const [user, setUser] = useState(saved.name || "");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState(null);
  const [picked, setPicked] = useState(() => new Set());
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const have = useMemo(() => new Set(store.games.map((g) => g.sourceId).filter(Boolean)), [store.games]);

  const fetchGames = async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setList(null);
    try {
      const games = await fetchRecentGames(source, user, { signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      setList(games);
      setPicked(new Set(games.filter((g) => !have.has(g.sourceId)).map((g) => g.sourceId)));
      setStore((s) => ({ ...s, settings: { ...s.settings, importUser: { source, name: user.trim() } } }));
      if (!games.length) toast(`No standard games found for ${user.trim()} on ${SOURCES[source].label}.`);
    } catch (e) {
      if (!ctrl.signal.aborted) toast(e instanceof ImportError ? e.message : "Import failed. Try again later.");
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  };

  const toggle = (id) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const importSelected = async () => {
    const chosen = (list || []).filter((g) => picked.has(g.sourceId) && !have.has(g.sourceId));
    if (!chosen.length) return;
    const favs = store.games.filter((g) => g.favourite).length;
    const room = Math.max(0, GAME_CAP - favs - 1);
    const take = chosen.slice(0, room);
    if (!take.length) {
      toast("The archive is full of starred games. Unstar some to import more.");
      return;
    }
    const overflow = store.games.length + take.length - GAME_CAP;
    if (overflow > 0) {
      const ok = await confirm({
        title: "Archive limit",
        message: `The archive holds ${GAME_CAP} games. Importing ${take.length} will remove ${overflow} older ${overflow === 1 ? "game" : "games"} (starred games are kept).`,
        confirmLabel: "Import",
      });
      if (!ok) return;
    }
    const now = Date.now();
    const made = take.map((g, i) => toArchiveGame(g, newId(), now - i));
    setStore((s) => {
      const known = new Set(s.games.map((g) => g.sourceId).filter(Boolean));
      return { ...s, games: [...made.filter((g) => !known.has(g.sourceId)), ...s.games] };
    });
    setPicked(new Set());
    const skipped = chosen.length - take.length;
    toast(`Imported ${take.length} ${take.length === 1 ? "game" : "games"}${skipped ? `, ${skipped} skipped (archive full)` : ""}`, {
      action: take.length === 1 ? { label: "Review", onClick: () => nav("review", { gameId: made[0].id }) } : undefined,
    });
  };

  const selectable = (list || []).filter((g) => !have.has(g.sourceId));
  const pickedCount = selectable.filter((g) => picked.has(g.sourceId)).length;

  return (
    <div className="card importcard">
      <div className="chips">
        {Object.entries(SOURCES).map(([k, v]) => (
          <button
            key={k}
            className={"chip" + (source === k ? " sel" : "")}
            onClick={() => {
              setSource(k);
              setList(null);
            }}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="importrow">
        <input
          className="input"
          placeholder={`${SOURCES[source].label} username`}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={user}
          onChange={(e) => setUser(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && user.trim() && !loading && fetchGames()}
        />
        <button className="bigbtn" disabled={!user.trim() || loading} onClick={fetchGames}>
          {loading ? "Fetching..." : "Fetch last 20"}
        </button>
      </div>
      {list && list.length > 0 && (
        <>
          <div className="btnrow">
            <button
              className="linkbtn"
              onClick={() =>
                setPicked(pickedCount === selectable.length ? new Set() : new Set(selectable.map((g) => g.sourceId)))
              }
            >
              {pickedCount === selectable.length ? "Select none" : "Select all"}
            </button>
            <span className="hint small">{list.length - selectable.length > 0 ? `${list.length - selectable.length} already imported` : ""}</span>
          </div>
          <div className="importlist">
            {list.map((g) => {
              const done = have.has(g.sourceId);
              return (
                <label key={g.sourceId} className={"importitem" + (done ? " done" : "")}>
                  <input
                    type="checkbox"
                    disabled={done}
                    checked={done || picked.has(g.sourceId)}
                    onChange={() => toggle(g.sourceId)}
                  />
                  <span className="ii-main">
                    <span className="ii-title">
                      {g.white}
                      {g.whiteElo ? ` (${g.whiteElo})` : ""} vs {g.black}
                      {g.blackElo ? ` (${g.blackElo})` : ""}
                    </span>
                    <span className="ii-sub">
                      {[outcomeFor(g), g.speed, `${Math.ceil(g.sans.length / 2)} moves`, fmtPlayed(g.playedAt), done ? "imported" : ""]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          <button className="bigbtn start" disabled={!pickedCount} onClick={importSelected}>
            Import selected ({pickedCount})
          </button>
        </>
      )}
      {confirmSheet}
    </div>
  );
}

function BatchReview({ store, setStore }) {
  const toast = useToast();
  const engine = getEngine();
  const [job, setJob] = useState(null);
  const stopRef = useRef(false);
  const unreviewed = store.games.filter((g) => !g.review && g.sans.length >= 2);
  const storeRef = useRef(store);
  storeRef.current = store;

  useEffect(
    () => () => {
      stopRef.current = true;
      engine.cancel("batch-review");
    },
    [engine]
  );

  const run = async () => {
    const ids = unreviewed.map((g) => g.id);
    stopRef.current = false;
    let done = 0;
    for (let i = 0; i < ids.length; i++) {
      if (stopRef.current) break;
      const game = storeRef.current.games.find((g) => g.id === ids[i]);
      if (!game || game.review) continue;
      setJob({ i, total: ids.length, p: 0, label: game.label || "Game" });
      try {
        const result = await reviewGame(engine, game.sans, {
          startFen: game.startFen || null,
          movetime: storeRef.current.settings.reviewMovetime,
          onProgress: (p) => !stopRef.current && setJob((j) => (j ? { ...j, p } : j)),
          shouldStop: () => stopRef.current,
          tag: "batch-review",
        });
        if (result === null) break;
        setStore((s) => withReview(s, game.id, result, newId));
        done++;
      } catch (e) {
        toast(`Review failed for ${game.label || "a game"}: ${e.message}`);
      }
    }
    if (!stopRef.current) {
      setJob(null);
      toast(`Reviewed ${done} ${done === 1 ? "game" : "games"}`);
    }
  };

  const stop = () => {
    stopRef.current = true;
    engine.cancel("batch-review");
    setJob(null);
  };

  if (!job && !unreviewed.length) return null;
  return (
    <div className="card batchcard">
      {job ? (
        <>
          <div className="batch-title">
            Reviewing game {job.i + 1} of {job.total}
          </div>
          <div className="hint small">{job.label}</div>
          <div className="progressbar">
            <div className="progressfill" style={{ width: Math.round(((job.i + job.p) / job.total) * 100) + "%" }} />
          </div>
          <div className="btnrow">
            <span className="hint small">Pauses while the app is in the background.</span>
            <button className="linkbtn danger" onClick={stop}>
              Stop
            </button>
          </div>
        </>
      ) : (
        <button className="bigbtn start" onClick={run}>
          Review all unreviewed ({unreviewed.length})
        </button>
      )}
    </div>
  );
}

function Review({ store, setStore, nav, game }) {
  const toast = useToast();
  const engine = getEngine();
  const [progress, setProgress] = useState(game.review ? 1 : 0);
  const [running, setRunning] = useState(false);
  const [viewIdx, setViewIdx] = useState(0); // 0..n positions
  const [showBest, setShowBest] = useState(false);
  const [showThreats, setShowThreats] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [threats, setThreats] = useState([]);
  // Variation play, chess.com style: moves made on the board (either side)
  // open a branch off the reviewed game instead of starting a bot game.
  // branch = the active line; branchPly views inside it (null = its end);
  // stash = abandoned lines, restorable as chips — so branches can branch.
  const [branch, setBranch] = useState(null); // {baseIdx, sans[]}
  const [branchPly, setBranchPly] = useState(null);
  const [stash, setStash] = useState([]);
  const [lines, setLines] = useState([]); // live top engine lines for the shown position
  const threatSeq = useRef(0);
  const lineSeq = useRef(0);
  const startedRef = useRef(false);
  const [retryN, setRetryN] = useState(0);
  const [exporting, setExporting] = useState(false);
  const review = game.review;

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
      tag: "review",
    })
      .then((result) => {
        if (result === null) return; // abandoned; nothing to commit
        setStore((s) => withReview(s, game.id, result, newId));
        setViewIdx(game.sans.length);
      })
      .catch((e) => {
        if (!abandoned) toast("Review failed: " + e.message, { action: { label: "Retry", onClick: () => { startedRef.current = false; setRunning(false); setRetryN((n) => n + 1); } } });
      })
      .finally(() => {
        if (!abandoned) setRunning(false);
      });

    return () => {
      abandoned = true;
      startedRef.current = false; // let a re-entry restart the review
      engine.cancel("review");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [review, retryN]);

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

  // How much of the active variation is shown, its position, and its last move.
  const branchUpto = branch ? (branchPly == null ? branch.sans.length : branchPly + 1) : 0;
  const branchState = useMemo(() => {
    if (!branch) return null;
    const c = new Chess(positions[branch.baseIdx]);
    let mv = null;
    for (let i = 0; i < branchUpto; i++) mv = c.move(branch.sans[i]);
    return { fen: c.fen(), last: mv ? [mv.from, mv.to] : null };
  }, [branch, branchUpto, positions]);
  const dispFen = branch ? branchState.fen : positions[viewIdx];

  const annotations = useMemo(() => {
    if (!review) return null;
    return review.moves.map((m) => CLASSIFICATIONS[m.class]);
  }, [review]);

  // What is the opponent threatening in the shown position (game or
  // variation)? Same null-move probe as the analysis board; the shared engine
  // is idle while browsing a finished review, so this costs nothing extra
  // during the review pass.
  const viewedFen = dispFen;
  useEffect(() => {
    const seq = ++threatSeq.current;
    setThreats([]);
    if (!review || !showThreats) return;
    const c = new Chess(viewedFen);
    if (c.isGameOver() || c.inCheck()) return;
    let cancelled = false;
    const nfen = nullMoveFen(viewedFen);
    const timer = setTimeout(() => engine
      .analyze(nfen, { movetime: 350, multipv: 2, tag: "review-threat" })
      .then((r) => {
        if (cancelled || seq !== threatSeq.current || !r.lines[0]) return;
        const best = cpWhite(r.lines[0] || {}, nfen.split(" ")[1]);
        setThreats(
          r.lines
            .filter((l) => Math.abs(cpWhite(l, nfen.split(" ")[1]) - best) < 120) // only genuinely dangerous ideas
            .slice(0, 2)
            .map((l) => [l.move.slice(0, 2), l.move.slice(2, 4)])
        );
      })
      .catch(() => {}), 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      engine.cancel("review-threat");
    };
  }, [viewedFen, review, showThreats, engine]);

  // Top engine lines for the shown position, tappable to step into.
  useEffect(() => {
    const seq = ++lineSeq.current;
    setLines([]);
    if (!review) return;
    if (new Chess(dispFen).isGameOver()) return;
    let cancelled = false;
    const timer = setTimeout(() => engine
      .analyze(dispFen, { movetime: 700, multipv: 5, tag: "review-lines" })
      .then((r) => {
        if (cancelled || seq !== lineSeq.current) return;
        setLines(
          r.lines.map((l) => ({
            cp: cpWhite(l, dispFen.split(" ")[1]),
            uci: l.move,
            sans: pvToSans(dispFen, l.pv.slice(0, 8)),
          }))
        );
      })
      .catch(() => {}), 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      engine.cancel("review-lines");
    };
  }, [dispFen, review, engine]);

  // Both sides are playable: reviewing means asking "what if" for either
  // color, so any legal move on the shown position opens or extends a branch.
  const dests = useMemo(() => {
    if (!review) return null;
    const c = new Chess(dispFen);
    if (c.isGameOver()) return null;
    const map = new Map();
    for (const m of c.moves({ verbose: true })) {
      if (!map.has(m.from)) map.set(m.from, []);
      map.get(m.from).push(m.to);
    }
    return map;
  }, [dispFen, review]);

  const stashLine = (b) =>
    b &&
    b.sans.length > 0 &&
    setStash((st) => [{ baseIdx: b.baseIdx, sans: b.sans, info: b.info }, ...st].slice(0, 8));

  // The engine's pick for the position a branch move is played FROM, captured
  // at play time from the live lines — it's what grades that move and powers
  // "best was X" inside variations.
  const ideaNow = () =>
    lines.length > 0 ? { bestUci: lines[0].uci, bestSan: lines[0].sans[0] || null, cpBefore: lines[0].cp } : null;

  const playMove = (from, to, promotion) => {
    const test = new Chess(dispFen);
    const mv = test.move({ from, to, promotion: promotion || "q" });
    if (!mv) return;
    setShowBest(false);
    if (!branch) {
      setBranch({ baseIdx: viewIdx, sans: [mv.san], info: [ideaNow()] });
      setBranchPly(null);
      return;
    }
    const base = branchUpto;
    if (branch.sans[base] === mv.san) {
      // same move the line already continues with — just walk forward
      setBranchPly(base >= branch.sans.length - 1 ? null : base);
      return;
    }
    // a different idea mid-line: stash the abandoned continuation as a chip
    if (branch.sans.length > base) stashLine(branch);
    setBranch({
      baseIdx: branch.baseIdx,
      sans: [...branch.sans.slice(0, base), mv.san],
      info: [...(branch.info || []).slice(0, base), ideaNow()],
    });
    setBranchPly(null);
  };

  const leaveBranch = () => {
    stashLine(branch); // keep the idea recoverable
    setBranch(null);
    setBranchPly(null);
  };

  const restoreVariation = (i) => {
    const b = stash[i];
    if (!b) return;
    setStash((st) => {
      const next = st.filter((_, j) => j !== i);
      if (branch && branch.sans.length > 0)
        next.unshift({ baseIdx: branch.baseIdx, sans: branch.sans, info: branch.info });
      return next.slice(0, 8);
    });
    setBranch(b);
    setBranchPly(null);
    setViewIdx(b.baseIdx);
  };

  const stepBack = () => {
    setShowBest(false);
    if (branch) {
      const cur = branchPly == null ? branch.sans.length - 1 : branchPly;
      if (cur <= 0) leaveBranch();
      else setBranchPly(cur - 1);
      return;
    }
    setViewIdx((i) => Math.max(0, i - 1));
  };

  const stepFwd = () => {
    setShowBest(false);
    if (branch) {
      if (branchPly != null) setBranchPly(branchPly >= branch.sans.length - 1 ? null : branchPly + 1);
      return;
    }
    setViewIdx((i) => Math.min(game.sans.length, i + 1));
  };

  useArrowKeys(stepBack, stepFwd);

  const moveAt = viewIdx > 0 && review ? review.moves[viewIdx - 1] : null;
  const badMove = moveAt && ["inaccuracy", "mistake", "miss", "blunder"].includes(moveAt.class);
  // The engine's alternative to the played move, when they differ — shown as
  // an overlay on the CURRENT board, never by rewinding the position.
  const playedUci = lastMovePair ? lastMovePair[0] + lastMovePair[1] : null;
  const altUci = moveAt?.bestUci && playedUci && moveAt.bestUci.slice(0, 4) !== playedUci ? moveAt.bestUci : null;

  // Same verdict for the last variation move: graded against the engine pick
  // captured when it was played, with the live eval of the resulting position.
  const brInfo = branch && branchUpto > 0 ? (branch.info || [])[branchUpto - 1] : null;
  const brPlayed = branch && branchState.last ? branchState.last[0] + branchState.last[1] : null;
  const brIsBest = brInfo?.bestUci && brPlayed && brInfo.bestUci.slice(0, 4) === brPlayed;
  const brAlt = brInfo?.bestUci && !brIsBest ? brInfo : null;
  let brCls = null;
  if (brInfo) {
    if (brIsBest) brCls = "best";
    else if (lines.length > 0 && brInfo.cpBefore != null) {
      const mover = dispFen.split(" ")[1] === "w" ? "b" : "w"; // who just moved
      const sign = mover === "w" ? 1 : -1;
      const drop = Math.max(0, winPct(brInfo.cpBefore * sign) - winPct(lines[0].cp * sign));
      brCls = classifyDrop(drop);
    }
  }
  // What the "show" toggle overlays on the current board, wherever we are.
  const overlayUci = showBest ? (branch ? brAlt?.bestUci || null : altUci) : null;

  const baseOrientation = (game.mode === "bot" || game.mode === "import") && game.playerColor === "b" ? "b" : "w";
  const orientation = flipped ? (baseOrientation === "w" ? "b" : "w") : baseOrientation;

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
  const phases = review.phases || phaseAccuracy(review.moves);
  const moments = keyMoments(review);
  const who =
    game.mode === "bot"
      ? { w: game.playerColor === "w" ? "You" : botName(game), b: game.playerColor === "b" ? "You" : botName(game) }
      : game.mode === "engine" && game.names
        ? { w: game.names.w, b: game.names.b }
        : game.players
          ? { w: game.players.w, b: game.players.b }
          : { w: "White", b: "Black" };

  return (
    <div className="page gamepage">
      <TopBar
        title="Game review"
        sub={(review.opening ? review.opening.name + " · " : "") + (game.result || "")}
        onBack={() => nav(game.mode === "import" ? "home" : "archive")}
        right={
          <button className="linkbtn" onClick={() => setFlipped((f) => !f)}>
            ⇅ Flip
          </button>
        }
      />

      <div className="accrow">
        <div className="acccard">
          <div className="acc-name">{who.w} (White)</div>
          <div className="acc-val">{acc.w}%</div>
          <PhaseLine phases={phases.w} />
          <ClassCounts counts={review.counts.w} />
        </div>
        <div className="acccard">
          <div className="acc-name">{who.b} (Black)</div>
          <div className="acc-val">{acc.b}%</div>
          <PhaseLine phases={phases.b} />
          <ClassCounts counts={review.counts.b} />
        </div>
      </div>

      {moments.length > 0 && (
        <div className="momentrow" aria-label="Key moments">
          <span className="moment-label">Key moments</span>
          {moments.map((m) => (
            <button
              key={m.ply}
              className={"chip moment" + (viewIdx === m.ply + 1 && !branch ? " sel" : "")}
              style={{ borderColor: CLASSIFICATIONS[m.cls]?.color }}
              onClick={() => {
                if (branch) leaveBranch();
                setViewIdx(m.ply + 1);
                setShowBest(false);
              }}
            >
              {Math.floor(m.ply / 2) + 1}
              {m.color === "w" ? "." : "..."} {m.san}
              {CLASSIFICATIONS[m.cls]?.icon && !["best", "book", "forced"].includes(m.cls) ? ` ${CLASSIFICATIONS[m.cls].icon}` : ""}{" "}
              <span className="moment-swing">-{Math.round(m.swing)}%</span>
            </button>
          ))}
        </div>
      )}

      <EvalGraph
        evals={review.evals}
        viewIdx={viewIdx}
        onScrub={(i) => {
          if (branch) leaveBranch();
          setViewIdx(i);
        }}
      />

      <Board
        fen={dispFen}
        orientation={orientation}
        lastMove={branch ? branchState.last : lastMovePair}
        guideArrows={overlayUci ? [[overlayUci.slice(0, 2), overlayUci.slice(2, 4)]] : []}
        highlightSquares={overlayUci ? [overlayUci.slice(0, 2)] : []}
        threats={threats}
        dests={dests}
        onMove={playMove}
        theme={store.settings.theme}
        custom={store.settings.boardCustom}
        pieceSet={store.settings.pieces}
        animMs={store.settings.animMs}
        arrowColors={store.settings.arrowColors}
        needsPromotion={(from, to) => {
          const piece = new Chess(dispFen).get(from);
          return piece?.type === "p" && (to[1] === "8" || to[1] === "1");
        }}
      />

      {branch && (
        <div className="previewbar">
          <span>
            ⑂ from move {Math.floor(branch.baseIdx / 2) + 1}:{" "}
            {branch.sans.map((s, i) => (
              <span key={i} className={"vmove" + (i < branchUpto ? " on" : "")}>
                {s}{" "}
              </span>
            ))}
          </span>
          <button className="linkbtn" onClick={leaveBranch}>
            Back to game
          </button>
        </div>
      )}

      {stash.length > 0 && (
        <div className="branchrow">
          {stash.map((b, i) => (
            <button key={i} className="branchchip" onClick={() => restoreVariation(i)}>
              ⑂ move {Math.floor(b.baseIdx / 2) + 1}: {b.sans.slice(0, 3).join(" ")}
              {b.sans.length > 3 ? "…" : ""}
            </button>
          ))}
        </div>
      )}

      {branch && brInfo && (brCls || brAlt) && (
        <div
          className="moveverdict"
          style={{ borderColor: brCls ? CLASSIFICATIONS[brCls].color : "var(--border)" }}
        >
          <b style={brCls ? { color: CLASSIFICATIONS[brCls].color } : undefined}>
            {branch.sans[branchUpto - 1]}
            {brCls ? `: ${CLASSIFICATIONS[brCls].label}` : ""}
          </b>
          {brAlt && brAlt.bestSan && (
            <span>
              {" "}
              · best was <b>{brAlt.bestSan}</b>{" "}
              <button className="linkbtn" onClick={() => setShowBest((s) => !s)}>
                {showBest ? "hide" : "show"}
              </button>
            </span>
          )}
        </div>
      )}

      {!branch && moveAt && (
        <div className="moveverdict" style={{ borderColor: CLASSIFICATIONS[moveAt.class].color }}>
          <b style={{ color: CLASSIFICATIONS[moveAt.class].color }}>
            {moveAt.san}: {CLASSIFICATIONS[moveAt.class].label}
          </b>
          {altUci && moveAt.bestSan && (
            <span>
              {" "}
              · best was <b>{moveAt.bestSan}</b>{" "}
              <button className="linkbtn" onClick={() => setShowBest((s) => !s)}>
                {showBest ? "hide" : "show"}
              </button>
              {badMove && (
                <button className="linkbtn" onClick={() => retryFrom(pickRetryPersona(game))}>
                  ⟳ Retry from here
                </button>
              )}
            </span>
          )}
        </div>
      )}

      {lines.length > 0 ? (
        <div className="enginelines">
          {lines.map((l, i) => (
            <button
              key={i}
              className="engineline"
              onClick={() => playMove(l.uci.slice(0, 2), l.uci.slice(2, 4), l.uci[4])}
            >
              <b>{fmtCp(l.cp)}</b> {l.sans.join(" ")}
            </button>
          ))}
        </div>
      ) : !branch && review.pvs?.[viewIdx]?.length > 0 ? (
        <div className="bestline">
          <b>{fmtCp(review.evals[viewIdx])}</b> · best: {review.pvs[viewIdx].join(" ")}
        </div>
      ) : null}

      <div className="btnrow toolrow">
        <button className="linkbtn" onClick={stepBack} disabled={!branch && viewIdx === 0}>
          ‹ Prev
        </button>
        <button
          className="linkbtn"
          onClick={stepFwd}
          disabled={branch ? branchPly == null : viewIdx >= game.sans.length}
        >
          Next ›
        </button>
        <button
          className={"linkbtn" + (showThreats ? " on" : "")}
          onClick={() => setShowThreats((s) => !s)}
        >
          ⚠ Threats {showThreats ? "on" : "off"}
        </button>
      </div>
      <div className="btnrow toolrow">
        <button className="linkbtn" onClick={() => setExporting(true)}>
          ⤓ Export PGN
        </button>
        <button
          className="linkbtn"
          onClick={async () => toast((await copyToClipboard(dispFen)) ? "FEN copied" : "Copy blocked by the browser")}
        >
          Copy FEN
        </button>
      </div>
      <ExportSheet
        open={exporting}
        title="Export game"
        text={exporting ? gamePgn(game) : ""}
        filename={pgnFilename("game")}
        onClose={() => setExporting(false)}
      />

      <MoveList
        sans={game.sans}
        annotations={annotations}
        activePly={viewIdx - 1}
        onTap={(p) => {
          if (branch) leaveBranch();
          setViewIdx(p + 1);
          setShowBest(false);
        }}
      />
    </div>
  );
}

// Same thresholds the analysis board uses to grade a played move.
function classifyDrop(drop) {
  if (drop < 2) return "excellent";
  if (drop < 5) return "good";
  if (drop < 10) return "inaccuracy";
  if (drop < 20) return "mistake";
  return "blunder";
}

function botName(game) {
  const p = getPersona(game.personaId);
  return `${p.avatar} ${p.name}`;
}

function pickRetryPersona(game) {
  return game.mode === "bot" ? game.personaId : PERSONAS[Math.floor(PERSONAS.length / 2)].id;
}

function PhaseLine({ phases }) {
  return (
    <div className="phaseline">
      {PHASES.map(([k, label]) => (
        <span key={k} title={`${label} accuracy`}>
          {label.slice(0, 3)} <b>{phases[k] == null ? "-" : Math.round(phases[k])}</b>
        </span>
      ))}
    </div>
  );
}

function ClassCounts({ counts }) {
  const order = CLASS_ORDER.filter((k) => k !== "book" && k !== "forced");
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
