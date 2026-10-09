import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import Board, { EvalBar } from "./Board.jsx";
import { TopBar, Toggle, MoveList, useArrowKeys, useGameBackGuard } from "./ui.jsx";
import { getPersona, personasByLang, LEVELS } from "./personas.js";
import { getEngine, cpWhite, nullMoveFen } from "./engine.js";
import { chooseBotMove } from "./bot.js";
import { detectEvents, pickLine, pickLineWithEvent, aiReact, recentMoves } from "./chat.js";
import { findOpening } from "./openings.js";
import { play as sfx, buzz } from "./audio.js";
import { ENGINE_LOADING } from "./platform.js";
import { useConfirm } from "@shared/ui.jsx";
import { useWakeLock } from "@shared/useWakeLock.js";
import { emitEvent } from "@shared/bridge.js";
import { legalDests, promotionCheck, startPly, materialBalance } from "./core/position.js";
import { threatsFromProbe } from "./core/threats.js";
import { HELP_PRESETS, DEFAULT_PRESET, HELP_SWITCHES, SWITCH_LABELS, presetFlags, presetOf, presetName, helpOf, isSerious } from "./helpLevels.js";
import Sheet from "./Sheet.jsx";
import { liveCoachNote, hintIdea, blunderCheck, tacticPrompt } from "./core/coach/live.js";
import { CLASSIFICATIONS } from "./review.js";
import { addResult, wdl, cleanWins, assistLabel } from "./records.js";
import { newBotGame } from "./botGame.js";
import { Lightbulb, MessageSquare, SlidersHorizontal, Undo2 } from "lucide-react";

export default function PlayBot({ store, setStore, nav, view }) {
  const cur = store.current;
  if (view.pick || !cur || cur.mode !== "bot") {
    return <BotPicker store={store} setStore={setStore} nav={nav} view={view} />;
  }
  // keyed by game, so a rematch starts with a clean slate (hints, coach, views)
  return <BotGame key={cur.id} store={store} setStore={setStore} nav={nav} />;
}

function BotPicker({ store, setStore, nav, view }) {
  // "r" is resolved to a real colour at the moment the game starts, so the
  // side stays a surprise until the board appears.
  const [color, setColor] = useState("w");
  const [preset, setPreset] = useState(store.settings.helpPreset || DEFAULT_PRESET);
  const levelRefs = useRef({});
  // Set when arriving from a lesson step: the game starts from that position
  // instead of the initial one.
  const fromFen = view?.fromFen || null;
  const fromLabel = view?.fromLabel || null;
  const lang = store.settings.botLang || "ro";
  const setLang = (l) =>
    setStore((s) => ({ ...s, settings: { ...s.settings, botLang: l } }));
  const roster = personasByLang(lang);

  // Opponents you've played recently, newest first.
  const recent = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const g of [...store.games].sort((a, b) => (b.date || 0) - (a.date || 0))) {
      if (g.mode !== "bot" || seen.has(g.personaId)) continue;
      const p = roster.find((x) => x.id === g.personaId);
      if (!p) continue;
      seen.add(g.personaId);
      out.push(p);
      if (out.length === 3) break;
    }
    return out;
  }, [store.games, roster]);

  // Open at the level you last played, so the bots that fit you are on screen.
  useEffect(() => {
    const elo = recent[0]?.elo;
    if (elo && levelRefs.current[elo]) levelRefs.current[elo].scrollIntoView({ block: "start" });
  }, [recent]);

  const start = (persona) => {
    const resolved = color === "r" ? (Math.random() < 0.5 ? "w" : "b") : color;
    const help = presetFlags(preset);
    setStore((s) => ({
      ...s,
      settings: { ...s.settings, helpPreset: preset },
      current: newBotGame({ personaId: persona.id, playerColor: resolved, help, startFen: fromFen }),
    }));
    nav("play");
  };

  return (
    <div className="page">
      <TopBar
        title="Choose your opponent"
        sub={fromLabel ? `From: ${fromLabel}` : null}
        onBack={() => nav("home")}
      />
      <div className="setrow">
        <span className="setlabel">Bots speak</span>
        <div className="chips">
          <button className={"chip" + (lang === "ro" ? " sel" : "")} onClick={() => setLang("ro")}>
            Română
          </button>
          <button className={"chip" + (lang === "en" ? " sel" : "")} onClick={() => setLang("en")}>
            English
          </button>
        </div>
      </div>
      <div className="setrow">
        <span className="setlabel">You play</span>
        <div className="chips">
          <button className={"chip" + (color === "w" ? " sel" : "")} onClick={() => setColor("w")}>
            White
          </button>
          <button className={"chip" + (color === "b" ? " sel" : "")} onClick={() => setColor("b")}>
            Black
          </button>
          <button className={"chip" + (color === "r" ? " sel" : "")} onClick={() => setColor("r")}>
            Random
          </button>
        </div>
      </div>
      <div className="setrow helprow">
        <span className="setlabel">Help</span>
        <div className="chips" role="radiogroup" aria-label="Help level">
          {HELP_PRESETS.map((p) => (
            <button
              key={p.id}
              role="radio"
              aria-checked={preset === p.id}
              className={"chip" + (preset === p.id ? " sel" : "")}
              onClick={() => setPreset(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <p className="hint small helpblurb">{HELP_PRESETS.find((p) => p.id === preset)?.blurb}. You can change it during the game.</p>
      {recent.length > 0 && (
        <div className="levelblock">
          <div className="levelhead">Recent opponents</div>
          <div className="botgrid">
            {recent.map((p) => {
              const rec = store.botRecords[p.id];
              return (
                <button key={p.id} className="botmini" title={p.tagline} onClick={() => start(p)}>
                  <span className="bm-avatar">{p.avatar}</span>
                  <span className="bm-name">{p.name}</span>
                  <span className="bm-rec">
                    {p.elo}
                    {rec ? ` · ${wdl(rec)}` : ""}
                  </span>
                  {cleanWins(rec) > 0 && <CleanMark n={cleanWins(rec)} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {store.current && store.current.mode === "bot" && (
        <p className="warn">Starting a new game abandons the current one.</p>
      )}
      {LEVELS.map((elo) => {
        const bots = roster.filter((p) => p.elo === elo);
        if (bots.length === 0) return null;
        return (
          <div key={elo} className="levelblock" ref={(el) => (levelRefs.current[elo] = el)}>
            <div className="levelhead">{elo}</div>
            <div className="botgrid">
              {bots.map((p) => {
                const rec = store.botRecords[p.id];
                return (
                  <button key={p.id} className="botmini" title={p.tagline} onClick={() => start(p)}>
                    <span className="bm-avatar">{p.avatar}</span>
                    <span className="bm-name">{p.name}</span>
                    {rec && <span className="bm-rec">{wdl(rec)}</span>}
                    {cleanWins(rec) > 0 && <CleanMark n={cleanWins(rec)} />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BotGame({ store, setStore, nav }) {
  const g = store.current;
  const persona = getPersona(g.personaId);
  const engine = getEngine();
  const [viewPly, setViewPly] = useState(null); // null = live
  // Two-step hint for one position: {fen, step: 1|2, from, to, text}. Step 1
  // lights the piece and says the idea; step 2 draws the move.
  const [hintState, setHintState] = useState(null);
  // The coach's comment on your last move (plan item 8): {text, kind, cls, ply}.
  const [coachNote, setCoachNote] = useState(null);
  // Your move waiting for the engine's read of the position it made.
  const coachPending = useRef(null);
  const coachSeq = useRef(0);
  const lastPraise = useRef(-99);
  // Blunder check (plan item 9): the move being checked, shown on the board
  // while the engine looks ({san, from, to, fen}), then the nudge if it fails.
  const [checking, setChecking] = useState(null);
  const [nudge, setNudge] = useState(null);
  const checkSeq = useRef(0);
  // Last engine read of the live position: {fen, cp, bestUci, pv}. The eval bar
  // and the hint both come from this one search, so a hinted move can never
  // be contradicted by the bar that judged it.
  const [evalInfo, setEvalInfo] = useState(null);
  // Eval of a browsed past position: {fen, cp}. While a move is selected in
  // the list, the bar shows THIS, not the live position's eval.
  const [viewEval, setViewEval] = useState(null);
  const [engineReady, setEngineReady] = useState(false);
  const [confirm, confirmSheet] = useConfirm();
  const botBusy = useRef(false);
  const cooldowns = useRef({});
  const lastMoveStart = useRef(Date.now());
  const chatGate = useRef({ lastPly: -99, queued: null });
  const mutedRef = useRef(false);
  const botToMoveRef = useRef(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [threats, setThreats] = useState([]);
  const help = helpOf(g, store.settings);
  const helpPreset = presetOf(help);
  const setHelp = (patch) =>
    setStore((s) => {
      const c = s.current;
      if (!c || c.id !== g.id) return s;
      const next = { ...helpOf(c, s.settings), ...patch };
      const assist = c.assist ?? (isSerious(next) ? null : "help");
      return { ...s, current: { ...c, help: next, serious: isSerious(next), assist } };
    });

  // The first thing that made this game assisted sticks.
  const markAssist = (why) =>
    setStore((s) => (s.current && s.current.id === g.id && !s.current.assist ? { ...s, current: { ...s.current, assist: why } } : s));

  useEffect(() => {
    engine.ready.then(() => setEngineReady(true));
  }, [engine]);

  const chess = useMemo(() => {
    const c = g.startFen ? new Chess(g.startFen) : new Chess();
    for (const san of g.sans) c.move(san);
    return c;
  }, [g.startFen, g.sans]);

  const liveFen = chess.fen();
  // The position before the last move, so taking back what was just taken
  // isn't called a tactic.
  const prevFen = useMemo(() => {
    if (!g.sans.length) return null;
    const c = g.startFen ? new Chess(g.startFen) : new Chess();
    for (const san of g.sans.slice(0, -1)) c.move(san);
    return c.fen();
  }, [g.startFen, g.sans]);
  const botColor = g.playerColor === "w" ? "b" : "w";
  const playerTurn = chess.turn() === g.playerColor && g.status === "playing";
  const opening = useMemo(() => findOpening(g.sans), [g.sans]);
  mutedRef.current = !!g.muted;
  botToMoveRef.current = g.status === "playing" && chess.turn() === botColor;
  useWakeLock(g.status === "playing");

  // position being displayed (live or a past ply preview)
  const shownFen = useMemo(() => {
    if (viewPly == null) return liveFen;
    const c = g.startFen ? new Chess(g.startFen) : new Chess();
    for (let i = 0; i <= viewPly; i++) c.move(g.sans[i]);
    return c.fen();
  }, [viewPly, liveFen, g.startFen, g.sans]);

  // Browsing history: point the eval bar at the position being VIEWED. The
  // stored game eval fills in instantly (see `cp` below); this refines it
  // with a fresh search, sharing the engine queue with the bot's thinking.
  useEffect(() => {
    if (viewPly == null || !help.evalBar) return;
    const fen = shownFen;
    const c = new Chess(fen);
    if (c.isGameOver()) {
      setViewEval({ fen, cp: c.isCheckmate() ? (c.turn() === "w" ? -10000 : 10000) : 0 });
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => engine
      .analyze(fen, { movetime: 300, tag: "play-view" })
      .then((r) => {
        if (cancelled || !r.lines[0]) return;
        setViewEval({ fen, cp: cpWhite(r.lines[0], fen.split(" ")[1]) });
      })
      .catch(() => {}), 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      engine.cancel("play-view");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewPly, shownFen, help.evalBar, engine]);

  // Legal moves for the player — from the live position, or from a past
  // position being previewed (playing there branches the game).
  const dests = useMemo(() => {
    if (g.status !== "playing") return null;
    const c = viewPly == null ? chess : new Chess(shownFen);
    if (c.turn() !== g.playerColor) return null;
    return legalDests(c);
  }, [chess, shownFen, viewPly, g.status, g.playerColor]);

  const premoveDests = useMemo(() => {
    if (g.status !== "playing" || viewPly != null || chess.turn() !== botColor) return null;
    try {
      const c = new Chess(nullMoveFen(liveFen));
      return legalDests(c);
    } catch {
      return null;
    }
  }, [chess, liveFen, viewPly, g.status, botColor]);

  const setPremove = (from, to, promotion) =>
    setStore((s) =>
      s.current && s.current.id === g.id
        ? { ...s, current: { ...s.current, premove: from ? { from, to, promotion: promotion || null } : null } }
        : s
    );

  useEffect(() => {
    const pm = g.premove;
    if (!pm || g.status !== "playing" || chess.turn() !== g.playerColor) return;
    if (g.cps.length < g.sans.length + 1) return;
    let mv = null;
    try {
      mv = new Chess(liveFen).move({ from: pm.from, to: pm.to, promotion: pm.promotion || "q" });
    } catch {
      mv = null;
    }
    if (!mv) {
      setPremove(null);
      return;
    }
    sfx(store, mv.captured ? "capture" : "move");
    buzz(store, mv.captured ? 25 : 12);
    noteMove(mv.san);
    applyMove(mv.san, g.sans.length, { premove: null });
    lastMoveStart.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.premove, g.sans.length, g.cps.length, g.status]);

  // Arrow keys: left/right step through the game.
  useArrowKeys(
    () =>
      setViewPly((v) => {
        const cur = v == null ? g.sans.length - 1 : v;
        return Math.max(-1, cur - 1);
      }),
    () =>
      setViewPly((v) => {
        if (v == null) return null;
        return v >= g.sans.length - 1 ? null : v + 1;
      })
  );

  const lastMove = useMemo(() => {
    const h = chess.history({ verbose: true });
    if (viewPly != null) {
      const c = g.startFen ? new Chess(g.startFen) : new Chess();
      for (let i = 0; i <= viewPly; i++) c.move(g.sans[i]);
      const hh = c.history({ verbose: true });
      const m = hh[hh.length - 1];
      return m ? [m.from, m.to] : null;
    }
    const m = h[h.length - 1];
    return m ? [m.from, m.to] : null;
  }, [chess, viewPly, g.startFen, g.sans]);

  const checkSquare = useMemo(() => {
    if (!chess.inCheck() || viewPly != null) return null;
    const board = chess.board();
    for (const row of board)
      for (const sq of row) if (sq && sq.type === "k" && sq.color === chess.turn()) return sq.square;
    return null;
  }, [chess, viewPly]);

  // Apply a move (by either side) at an exact ply — idempotent under
  // StrictMode double-invocation.
  const applyMove = (san, atPly, extra = {}) =>
    setStore((s) => {
      const c = s.current;
      if (!c || c.id !== g.id || c.sans.length !== atPly || c.status !== "playing") return s;
      return { ...s, current: { ...c, sans: [...c.sans, san], ...extra } };
    });

  const pushChat = (text) =>
    setStore((s) =>
      s.current && s.current.id === g.id
        ? { ...s, current: { ...s.current, chat: [...s.current.chat.slice(-19), { text, ply: s.current.sans.length }] } }
        : s
    );

  // Evals of positions you moved past before the engine judged them are
  // filled with the last known value, so the list stays one per position.
  const pushCp = (cp, atLen) =>
    setStore((s) => {
      const c = s.current;
      if (!c || c.id !== g.id || c.sans.length !== atLen || c.cps.length >= atLen + 1) return s;
      const gap = new Array(atLen - c.cps.length).fill(c.cps[c.cps.length - 1] ?? 0);
      return { ...s, current: { ...c, cps: [...c.cps, ...gap, cp] } };
    });

  // Remember your move so the coach can judge it once the engine has read
  // the new position. Called just before the move is applied.
  const noteMove = (san) => {
    coachSeq.current += 1;
    setCoachNote(null);
    const ply = g.sans.length;
    if (!help.coach) {
      coachPending.current = null;
      return;
    }
    const known = evalInfo && evalInfo.fen === liveFen ? evalInfo : null;
    coachPending.current = {
      seq: coachSeq.current,
      fenBefore: liveFen,
      san,
      ply,
      bestUci: known?.bestUci || null,
      bestPv: known?.pv || null,
      cpBefore: known ? known.cp : null,
    };
  };

  function coachAfter(ply, cpAfter, replyPv) {
    const p = coachPending.current;
    if (!p || p.ply !== ply) return;
    coachPending.current = null;
    const finish = (cpBefore, bestUci, bestPv) => {
      if (p.seq !== coachSeq.current) return; // you've moved on
      const note = liveCoachNote({ ...p, cpBefore, bestUci, bestPv, cpAfter, replyPv, lastPraise: lastPraise.current });
      if (!note) return;
      if (note.kind === "praise") lastPraise.current = ply;
      setCoachNote(note);
    };
    if (p.cpBefore != null && p.bestPv?.length) {
      finish(p.cpBefore, p.bestUci, p.bestPv);
      return;
    }
    // You moved before the engine had read the position: read it now.
    engine
      .analyze(p.fenBefore, { movetime: 300, tag: "play-coach" })
      .then((r) => {
        if (r.lines[0]) finish(cpWhite(r.lines[0], p.fenBefore.split(" ")[1]), r.lines[0].move, r.lines[0].pv);
      })
      .catch(() => {});
  }

  // ---- player's move (live, or from a preview → branch) ----
  const onMove = (from, to, promotion) => {
    if (g.status !== "playing") return;
    const baseFen = viewPly == null ? liveFen : shownFen;
    const test = new Chess(baseFen);
    const mv = test.move({ from, to, promotion: promotion || "q" });
    if (!mv) return;

    if (viewPly != null) {
      const base = viewPly + 1; // plies kept before the new move
      if (g.sans[base] === mv.san) {
        // same move as the game — just walk forward
        setViewPly(base >= g.sans.length - 1 ? null : base);
        return;
      }
      // different move: stash the abandoned continuation as a branch
      sfx(store, mv.captured ? "capture" : "move");
      buzz(store, mv.captured ? 25 : 12);
      setStore((s) => {
        const c = s.current;
        if (!c || c.id !== g.id || c.status !== "playing") return s;
        const branches = [...(c.branches || [])];
        if (c.sans.length > base) branches.unshift({ atPly: base, sans: c.sans, cps: c.cps });
        return {
          ...s,
          current: {
            ...c,
            sans: [...c.sans.slice(0, base), mv.san],
            cps: c.cps.slice(0, base + 1),
            premove: null,
            branches: branches.slice(0, 8),
          },
        };
      });
      markAssist("branch");
      setViewPly(null);
      coachPending.current = null;
      setCoachNote(null);
      lastMoveStart.current = Date.now();
      return;
    }

    if (!playerTurn || checking) return;
    if (nudge) {
      if (nudge.san === mv.san) return; // the same move again: the nudge stays
      recordCheck(true); // a different move: the check did its job
      setNudge(null);
    }
    if (help.check) checkThenPlay(mv);
    else playNow(mv);
  };

  const playNow = (mv) => {
    sfx(store, mv.captured ? "capture" : "move");
    buzz(store, mv.captured ? 25 : 12);
    noteMove(mv.san);
    applyMove(mv.san, g.sans.length);
    lastMoveStart.current = Date.now();
  };

  // One quick search on the position after your move (and on the one before,
  // if the eval bar hasn't read it yet); a move that gives a lot away waits
  // for you to confirm it.
  const checkThenPlay = (mv) => {
    const seq = ++checkSeq.current;
    const fenBefore = liveFen;
    const ply = g.sans.length;
    setChecking({ san: mv.san, from: mv.from, to: mv.to, fen: mv.after });
    const known = evalInfo && evalInfo.fen === fenBefore ? evalInfo.cp : null;
    const before =
      known != null
        ? Promise.resolve(known)
        : engine
            .analyze(fenBefore, { movetime: 250, tag: "play-check" })
            .then((r) => (r.lines[0] ? cpWhite(r.lines[0], fenBefore.split(" ")[1]) : null));
    before
      .then((cpBefore) =>
        engine.analyze(mv.after, { movetime: 300, tag: "play-check" }).then((r) => ({ cpBefore, line: r.lines[0] }))
      )
      .then(({ cpBefore, line }) => {
        if (seq !== checkSeq.current) return;
        setChecking(null);
        const res = line
          ? blunderCheck({ fenBefore, san: mv.san, cpBefore, cpAfter: cpWhite(line, mv.after.split(" ")[1]), replyPv: line.pv, ply })
          : null;
        if (res) {
          buzz(store, [20, 60, 20]);
          setNudge({ ...res, san: mv.san, move: mv });
        } else playNow(mv);
      })
      .catch(() => {
        if (seq !== checkSeq.current) return;
        setChecking(null);
        playNow(mv);
      });
  };

  const recordCheck = (saved) =>
    setStore((s) => ({ ...s, blunderChecks: [...(s.blunderChecks || []).slice(-499), { t: Date.now(), saved }] }));
  const playAnyway = () => {
    const n = nudge;
    setNudge(null);
    recordCheck(false);
    playNow(n.move);
  };
  const pickAnother = () => {
    setNudge(null);
    recordCheck(true);
  };

  // Swap the current line for a stashed branch (the current continuation
  // gets stashed in its place, so you can always come back).
  const restoreBranch = (i) => {
    setStore((s) => {
      const c = s.current;
      if (!c) return s;
      const branches = [...(c.branches || [])];
      const b = branches.splice(i, 1)[0];
      if (!b) return s;
      if (c.sans.length > b.atPly) branches.unshift({ atPly: b.atPly, sans: c.sans, cps: c.cps });
      const cps = Array.isArray(b.cps) ? b.cps.slice(0, b.sans.length + 1) : [...c.cps.slice(0, b.atPly + 1)];
      return {
        ...s,
        current: {
          ...c,
          sans: b.sans,
          cps: cps.length ? cps : [0],
          premove: null,
          status: "playing",
          result: null,
          branches: branches.slice(0, 8),
        },
      };
    });
    markAssist("branch");
    setViewPly(null);
  };

  // ---- after every move: quick eval, chat, end detection, bot reply ----
  useEffect(() => {
    if (g.status !== "playing") return;
    const len = g.sans.length;

    // game over?
    if (chess.isGameOver()) {
      finishGame();
      return;
    }

    // Eval for the new position (eval bar / chat / graph / hint). One search
    // serves all of them; 150ms used to feed the bar while the hint ran its
    // own deeper look, and the two shallow searches contradicting each other
    // made good hints look penalized.
    if (g.cps.length <= len && len > 0) {
      let cancelled = false;
      engine
        .analyze(liveFen, { movetime: 400 })
        .then((r) => {
          if (cancelled || !r.lines[0]) return;
          const cp = cpWhite(r.lines[0], chess.turn());
          setEvalInfo({ fen: liveFen, cp, bestUci: r.lines[0].move, pv: r.lines[0].pv });
          pushCp(cp, len);
          maybeChat(cp);
          coachAfter(len - 1, cp, r.lines[0].pv);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }

    // bot's turn?
    if (chess.turn() === botColor && !botBusy.current) {
      botBusy.current = true;
      const thinkLen = len;
      chooseBotMove(engine, liveFen, persona)
        .then((uci) => {
          const test = new Chess(liveFen);
          const mv = test.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
          if (mv) {
            sfx(store, mv.captured ? "capture" : "move");
            applyMove(mv.san, thinkLen);
          }
        })
        .finally(() => {
          botBusy.current = false;
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.sans.length, g.cps.length, g.status]);

  useEffect(() => {
    const gate = chatGate.current;
    if (botToMoveRef.current || !gate.queued) return;
    const q = gate.queued;
    gate.queued = null;
    if (mutedRef.current || g.status !== "playing") return;
    gate.lastPly = q.ply;
    sfx(store, "chat");
    pushChat(q.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.sans.length, g.status]);

  // greeting
  useEffect(() => {
    if (g.sans.length === 0 && g.chat.length === 0) {
      const line = pickLine(persona, ["greeting"], 0, cooldowns.current);
      if (line && !g.muted) pushChat(line);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function maybeChat(cpAfter) {
    const hist = chess.history({ verbose: true });
    const mv = hist[hist.length - 1];
    if (!mv) return;
    const byBot = mv.color === botColor;
    const cpBefore = g.cps[g.cps.length - 1] ?? 0;
    const count = liveFen.split(" ")[0].replace(/[^a-zA-Z]/g, "").length;
    let events = detectEvents({
      move: mv,
      byBot,
      cpBefore,
      cpAfter,
      botColor,
      thinkMs: byBot ? 0 : Date.now() - lastMoveStart.current,
      pieceCount: count,
      prevPieceCount: count + (mv.captured ? 1 : 0),
    });
    if (g.serious) {
      const allowed = ["castle", "promote", "i_check", "you_check", "endgame"];
      events = events.filter((e) => allowed.includes(e));
    }
    if (g.sans.length < 10) events = events.filter((e) => e !== "equal");
    const ply = g.sans.length;
    if (mutedRef.current || ply - chatGate.current.lastPly < 2) return;
    const picked = pickLineWithEvent(persona, events, ply, cooldowns.current);
    if (!picked) return;
    const ai = store.settings.ai;
    if (ai.baseUrl && ai.model && !g.serious) {
      aiReact({
        ai,
        persona,
        event: picked.event,
        recent: recentMoves(g.sans, 10, startPly(g.startFen)),
        cpWhitePersp: cpAfter,
        cpWhiteBefore: cpBefore,
        botColor,
      }).then((text) => say(text || picked.text, ply));
    } else {
      say(picked.text, ply);
    }
  }

  function say(text, ply) {
    const gate = chatGate.current;
    if (mutedRef.current || ply - gate.lastPly < 2) return;
    if (botToMoveRef.current) {
      gate.queued = { text, ply };
      return;
    }
    gate.queued = null;
    gate.lastPly = ply;
    sfx(store, "chat");
    pushChat(text);
  }

  function finishGame(resigned = false) {
    let result, reason;
    if (resigned) {
      result = g.playerColor === "w" ? "0-1" : "1-0";
      reason = "resignation";
    } else if (chess.isCheckmate()) {
      result = chess.turn() === "w" ? "0-1" : "1-0";
      reason = "checkmate";
    } else {
      result = "1/2-1/2";
      reason = chess.isStalemate() ? "stalemate" : "draw";
    }
    const playerWon = (result === "1-0") === (g.playerColor === "w") && result !== "1/2-1/2";
    sfx(store, result === "1/2-1/2" ? "chat" : playerWon ? "gameEnd" : "lose");
    const endEvent = result === "1/2-1/2" ? "draw" : playerWon ? "i_lose" : "i_win";
    const line = g.muted ? null : pickLine(persona, [endEvent], g.sans.length, cooldowns.current);
    chatGate.current.queued = null;
    emitEvent({ app: "chess", type: "chess.game", value: { result: playerWon ? "win" : result === "1/2-1/2" ? "draw" : "loss", botElo: persona.elo } });

    setStore((s) => {
      const c = s.current;
      if (!c || c.id !== g.id || c.status !== "playing") return s;
      // games begun before records were split: judge by the help level
      const assist = c.assist !== undefined ? c.assist : isSerious(helpOf(c, s.settings)) ? null : "help";
      const newRec = addResult(s.botRecords[persona.id], result === "1/2-1/2" ? "d" : playerWon ? "w" : "l", assist);
      const entry = {
        id: c.id,
        date: Date.now(),
        mode: "bot",
        personaId: c.personaId,
        playerColor: c.playerColor,
        startFen: c.startFen,
        sans: c.sans,
        result,
        reason,
        assist,
        review: null,
      };
      return {
        ...s,
        botRecords: { ...s.botRecords, [persona.id]: newRec },
        games: [entry, ...s.games].slice(0, 200),
        current: {
          ...c,
          status: "over",
          result,
          reason,
          assist,
          chat: line ? [...c.chat, { text: line, ply: c.sans.length }] : c.chat,
        },
      };
    });
  }

  // The hint for the live position, if one is open.
  const hintNow = hintState && hintState.fen === liveFen && viewPly == null ? hintState : null;
  const hint = () => {
    if (hintNow) {
      setHintState({ ...hintNow, step: 2 });
      return;
    }
    const fen = liveFen;
    markAssist("hint");
    const open = (bestUci, pv, cp) =>
      setHintState({ fen, step: 1, from: bestUci.slice(0, 2), to: bestUci.slice(2, 4), text: hintIdea(fen, pv, cp, prevFen) });
    // Reuse the move the eval bar's own search already picked for this
    // position; search fresh only when that read is missing (e.g. move 1).
    if (evalInfo && evalInfo.fen === fen && evalInfo.bestUci && evalInfo.pv) {
      open(evalInfo.bestUci, evalInfo.pv, evalInfo.cp);
    } else {
      engine.analyze(fen, { movetime: 400 }).then((r) => {
        if (!r.lines[0]) return;
        const cp = cpWhite(r.lines[0], fen.split(" ")[1]);
        setEvalInfo({ fen, cp, bestUci: r.lines[0].move, pv: r.lines[0].pv });
        open(r.lines[0].move, r.lines[0].pv, cp);
      });
    }
  };

  const takeback = () => {
    // undo back to the player's previous decision point
    let n = g.sans.length;
    const parity = g.playerColor === "w" ? 0 : 1;
    n = n - 1;
    while (n > 0 && n % 2 !== parity) n = n - 1;
    setStore((s) =>
      s.current && s.current.id === g.id
        ? { ...s, current: { ...s.current, sans: s.current.sans.slice(0, n), cps: s.current.cps.slice(0, n + 1), premove: null } }
        : s
    );
    markAssist("takeback");
    setViewPly(null);
    coachSeq.current += 1;
    coachPending.current = null;
    setCoachNote(null);
    checkSeq.current += 1;
    setChecking(null);
    setNudge(null);
  };

  // Threat arrows (help level): on your turn, what would the bot do if you
  // passed? Judged against the position's own eval, so only real threats show.
  const evalForLive = evalInfo && evalInfo.fen === liveFen ? evalInfo.cp : null;
  useEffect(() => {
    setThreats([]);
    if (!help.threats || g.status !== "playing" || viewPly != null || !playerTurn || evalForLive == null) return;
    if (chess.inCheck()) return;
    let cancelled = false;
    const nfen = nullMoveFen(liveFen);
    engine
      .analyze(nfen, { movetime: 300, multipv: 2, tag: "play-threat" })
      .then((r) => {
        if (!cancelled) setThreats(threatsFromProbe(r.lines, nfen.split(" ")[1], evalForLive));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      engine.cancel("play-threat");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveFen, evalForLive, help.threats, g.status, viewPly, playerTurn]);

  // Best-move arrow (help level): the engine move for the live position, on your turn.
  const suggestArrow =
    help.suggest && playerTurn && viewPly == null && evalInfo?.fen === liveFen && evalInfo.bestUci
      ? [evalInfo.bestUci.slice(0, 2), evalInfo.bestUci.slice(2, 4)]
      : null;
  // The coach speaking up on its own when there's a tactic for you.
  const prompt = useMemo(
    () =>
      help.coach && playerTurn && viewPly == null && evalInfo?.fen === liveFen && evalInfo.pv
        ? tacticPrompt(liveFen, evalInfo.pv, evalInfo.cp, prevFen)
        : null,
    [help.coach, playerTurn, viewPly, evalInfo, liveFen, prevFen]
  );
  const balance = materialBalance(shownFen);
  const myAhead = g.playerColor === "w" ? balance : -balance;

  // Live position's eval normally; the viewed position's while browsing —
  // stored game eval as the instant placeholder until the fresh search lands.
  const liveCp = g.cps[g.cps.length - 1] ?? 0;
  const cp =
    viewPly == null ? liveCp : viewEval?.fen === shownFen ? viewEval.cp : (g.cps[viewPly + 1] ?? liveCp);
  const over = g.status === "over";
  const askResign = () => confirm({ title: "Resign this game?", confirmLabel: "Resign", danger: true });
  useGameBackGuard(g.status === "playing" && g.sans.length > 0, askResign, () => finishGame(true));

  const toggleChat = () =>
    setStore((s) => (s.current && s.current.id === g.id ? { ...s, current: { ...s.current, muted: !s.current.muted } } : s));
  const lastSay = g.muted ? null : g.chat[g.chat.length - 1];

  return (
    <div className="page gamepage botgame">
      <TopBar
        title={over ? `${g.result} · ${g.reason}` : presetName(helpPreset) === "On my own" ? "Serious game" : "Casual game"}
        sub={opening ? opening.name : `${presetName(helpPreset)}`}
        onBack={() => nav("home")}
      />

      {!engineReady && <div className="enginebanner">{ENGINE_LOADING}</div>}

      <div className="plate">
        <span className="plate-ava">{persona.avatar}</span>
        <div className="plate-who">
          <div className="plate-name">{persona.name}</div>
          <div className="plate-sub">
            {persona.elo} · bot{myAhead < 0 ? ` · +${-myAhead}` : ""}
          </div>
        </div>
        {!playerTurn && g.status === "playing" && <span className="thinking">thinking…</span>}
      </div>
      {!g.muted && (
        <div className={"plate-say" + (lastSay ? "" : " empty")} aria-live="polite">
          {lastSay ? lastSay.text : ""}
        </div>
      )}

      <div className="boardrow">
        {help.evalBar && <EvalBar cp={cp} orientation={g.playerColor} />}
        <Board
          fen={checking && viewPly == null ? checking.fen : shownFen}
          orientation={g.playerColor}
          lastMove={checking && viewPly == null ? [checking.from, checking.to] : lastMove}
          checkSquare={checkSquare}
          dests={!over && !checking ? dests : null}
          onMove={onMove}
          premoveDests={!over ? premoveDests : null}
          onPremove={setPremove}
          premove={g.premove || null}
          arrow={viewPly == null ? (hintNow?.step === 2 ? [hintNow.from, hintNow.to] : suggestArrow) : null}
          highlightSquares={nudge && viewPly == null ? nudge.squares : hintNow?.step === 1 ? [hintNow.from] : null}
          threats={viewPly == null ? threats : []}
          theme={store.settings.theme}
          custom={store.settings.boardCustom}
          pieceSet={store.settings.pieces}
          animMs={store.settings.animMs}
          arrowColors={store.settings.arrowColors}
          needsPromotion={promotionCheck(new Chess(shownFen))}
        />
      </div>

      <div className="plate">
        <span className="plate-ava you">♙</span>
        <div className="plate-who">
          <div className="plate-name">You</div>
          <div className="plate-sub">
            {g.playerColor === "w" ? "White" : "Black"}
            {myAhead > 0 ? ` · +${myAhead}` : myAhead === 0 ? " · even material" : ""}
          </div>
        </div>
        <button type="button" className="plate-chip" onClick={() => setHelpOpen(true)}>
          {presetName(helpPreset)}
        </button>
      </div>

      {nudge && !over ? (
        <div className="coachstrip cs-check" role="alert">
          <span className="coachtag">Blunder check</span>
          <p>
            Before you play {nudge.san}: {nudge.text}
          </p>
          <div className="checkbtns">
            <button type="button" className="chip sel" onClick={pickAnother}>
              Pick another move
            </button>
            <button type="button" className="linkbtn" onClick={playAnyway}>
              Play it anyway
            </button>
          </div>
        </div>
      ) : (
        (hintNow || (help.coach && !over)) && (
          <CoachStrip
            hint={hintNow}
            note={help.coach && !hintNow ? coachNote : null}
            prompt={!hintNow ? prompt : null}
            onTakeback={g.status === "playing" ? takeback : null}
          />
        )
      )}

      {viewPly != null && (
        <div className="previewbar">
          {viewPly < 0 ? "Start position" : `Viewing move ${Math.floor(viewPly / 2) + 1}`}
          {!over && ". Play here to branch"}
          <button className="linkbtn" onClick={() => setViewPly(null)}>
            Back to live
          </button>
        </div>
      )}

      {(g.branches || []).length > 0 && (
        <div className="branchrow">
          {g.branches.map((b, i) => (
            <button key={i} className="branchchip" onClick={() => restoreBranch(i)}>
              ⑂ move {Math.floor(b.atPly / 2) + 1}: {b.sans.slice(b.atPly, b.atPly + 3).join(" ")}
              {b.sans.length > b.atPly + 3 ? "…" : ""}
            </button>
          ))}
        </div>
      )}

      <MoveList sans={g.sans} activePly={viewPly ?? g.sans.length - 1} onTap={setViewPly} />

      {over ? (
        <div className="gameend">
          <p className="hint small endnote">
            {g.assist ? `Counted as assisted: ${assistLabel(g.assist)}.` : "Counted as a clean game: no help, hints or takebacks."}
          </p>
          <div className="btnrow endrow">
            <button
              className="bigbtn"
              onClick={() => {
                setStore((s) => ({ ...s, current: null }));
                nav("review", { gameId: g.id });
              }}
            >
              Review game
            </button>
            <button
              className="bigbtn secondary"
              onClick={() =>
                setStore((s) => ({
                  ...s,
                  current: newBotGame({ personaId: g.personaId, playerColor: botColor, help: help, startFen: g.startFen }),
                }))
              }
            >
              Rematch
            </button>
            <button
              className="linkbtn"
              onClick={() => {
                setStore((s) => ({ ...s, current: null }));
                nav("play", { pick: true });
              }}
            >
              New game
            </button>
          </div>
        </div>
      ) : (
        <nav className="actionbar" aria-label="Game actions">
          <button type="button" className={"act" + (hintNow ? " on" : "")} onClick={hint} disabled={!playerTurn || hintNow?.step === 2}>
            <Lightbulb aria-hidden="true" />
            {hintNow ? "Show move" : "Hint"}
          </button>
          <button type="button" className="act" onClick={takeback} disabled={g.sans.length === 0}>
            <Undo2 aria-hidden="true" />
            Takeback
          </button>
          <button
            type="button"
            className={"act" + (help.coach ? " on" : "")}
            aria-pressed={!!help.coach}
            onClick={() => setHelp({ coach: !help.coach })}
          >
            <MessageSquare aria-hidden="true" />
            Coach {help.coach ? "on" : "off"}
          </button>
          <button type="button" className="act" onClick={() => setHelpOpen(true)}>
            <SlidersHorizontal aria-hidden="true" />
            Help
          </button>
        </nav>
      )}

      <Sheet open={helpOpen} title="Help in this game" onClose={() => setHelpOpen(false)}>
        <div className="chips" role="radiogroup" aria-label="Help level">
          {HELP_PRESETS.map((p) => (
            <button
              key={p.id}
              role="radio"
              aria-checked={helpPreset === p.id}
              className={"chip" + (helpPreset === p.id ? " sel" : "")}
              onClick={() => setHelp(presetFlags(p.id))}
            >
              {p.name}
            </button>
          ))}
          {helpPreset === "custom" && (
            <span className="chip sel" aria-current="true">
              Custom
            </span>
          )}
        </div>
        {HELP_SWITCHES.map((k) => (
          <div key={k} className="setrow">
            <span>{SWITCH_LABELS[k]}</span>
            <Toggle checked={!!help[k]} onChange={(v) => setHelp({ [k]: v })} label={SWITCH_LABELS[k]} />
          </div>
        ))}
        <div className="setrow">
          <span>Bot chat</span>
          <Toggle checked={!g.muted} onChange={toggleChat} label="Bot chat" />
        </div>
        <div className="sheet-actions">
          <button
            type="button"
            className="bigbtn danger"
            onClick={async () => {
              setHelpOpen(false);
              if (await askResign()) finishGame(true);
            }}
          >
            Resign
          </button>
        </div>
      </Sheet>
      {confirmSheet}
    </div>
  );
}

// The coach's line under your plate: a hint's idea while one is open, else
// its comment on your last move, else a quiet note that it's listening.
function CoachStrip({ hint, note, prompt, onTakeback }) {
  if (hint) {
    return (
      <div className="coachstrip" aria-live="polite">
        <span className="coachtag">Hint</span>
        <p>{hint.step === 1 ? hint.text : "The arrow shows the engine's move."}</p>
      </div>
    );
  }
  if (prompt && note?.kind !== "warn") {
    return (
      <div className="coachstrip cs-prompt" aria-live="polite">
        <span className="coachtag">Coach</span>
        <p>{prompt}</p>
      </div>
    );
  }
  if (!note) {
    return (
      <div className="coachstrip quiet" aria-live="polite">
        <span className="coachtag">Coach</span>
        <p>Speaks up when a move matters.</p>
      </div>
    );
  }
  const info = CLASSIFICATIONS[note.cls];
  return (
    <div className={"coachstrip cs-" + note.kind} aria-live="polite" style={{ "--cls": info?.color }}>
      <span className="coachtag">{note.kind === "warn" && info ? info.label : "Coach"}</span>
      <p>
        {note.text}
        {prompt && <span className="cs-also"> {prompt}</span>}
      </p>
      {note.kind === "warn" && onTakeback && (
        <button type="button" className="linkbtn" onClick={onTakeback}>
          Take it back
        </button>
      )}
    </div>
  );
}

function CleanMark({ n }) {
  return (
    <span className="cleanmark" title={`${n} clean ${n === 1 ? "win" : "wins"}: no help, hints or takebacks`}>
      ✓ {n} clean
    </span>
  );
}
