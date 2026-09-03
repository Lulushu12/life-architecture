import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import Board, { EvalBar } from "./Board.jsx";
import { TopBar, Toggle, MoveList, useArrowKeys } from "./ui.jsx";
import { getPersona, personasByLang, LEVELS } from "./personas.js";
import { getEngine, cpWhite } from "./engine.js";
import { chooseBotMove } from "./bot.js";
import { detectEvents, pickLine, aiReact } from "./chat.js";
import { findOpening } from "./openings.js";
import { play as sfx, buzz } from "./audio.js";
import { newId } from "./storage.js";

export default function PlayBot({ store, setStore, nav, view }) {
  const cur = store.current;
  if (view.pick || !cur || cur.mode !== "bot") {
    return <BotPicker store={store} setStore={setStore} nav={nav} view={view} />;
  }
  return <BotGame store={store} setStore={setStore} nav={nav} />;
}

function BotPicker({ store, setStore, nav, view }) {
  // "r" is resolved to a real colour at the moment the game starts, so the
  // side stays a surprise until the board appears.
  const [color, setColor] = useState("w");
  const [serious, setSerious] = useState(false);
  // Set when arriving from a lesson step: the game starts from that position
  // instead of the initial one.
  const fromFen = view?.fromFen || null;
  const fromLabel = view?.fromLabel || null;
  const lang = store.settings.botLang || "ro";
  const setLang = (l) =>
    setStore((s) => ({ ...s, settings: { ...s.settings, botLang: l } }));
  const roster = personasByLang(lang);

  const start = (persona) => {
    const resolved = color === "r" ? (Math.random() < 0.5 ? "w" : "b") : color;
    setStore((s) => ({
      ...s,
      current: {
        id: newId(),
        mode: "bot",
        personaId: persona.id,
        playerColor: resolved,
        serious,
        startFen: fromFen,
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
      <div className="setrow">
        <span className="setlabel">Serious mode (no eval bar, no eval talk)</span>
        <Toggle checked={serious} onChange={setSerious} />
      </div>
      {store.current && store.current.mode === "bot" && (
        <p className="warn">Starting a new game abandons the current one.</p>
      )}
      {LEVELS.map((elo) => {
        const bots = roster.filter((p) => p.elo === elo);
        if (bots.length === 0) return null;
        return (
          <div key={elo} className="levelblock">
            <div className="levelhead">{elo}</div>
            <div className="botgrid">
              {bots.map((p) => {
                const rec = store.botRecords[p.id];
                return (
                  <button key={p.id} className="botmini" title={p.tagline} onClick={() => start(p)}>
                    <span className="bm-avatar">{p.avatar}</span>
                    <span className="bm-name">{p.name}</span>
                    <span className="bm-rec">
                      {rec ? `${rec.w}-${rec.d}-${rec.l}` : "—"}
                    </span>
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
  const [hintArrow, setHintArrow] = useState(null);
  // Last engine read of the live position: {fen, cp, bestUci}. The eval bar
  // and the hint both come from this one search, so a hinted move can never
  // be contradicted by the bar that judged it.
  const [evalInfo, setEvalInfo] = useState(null);
  const [engineReady, setEngineReady] = useState(false);
  const botBusy = useRef(false);
  const cooldowns = useRef({});
  const lastMoveStart = useRef(Date.now());

  useEffect(() => {
    engine.ready.then(() => setEngineReady(true));
  }, [engine]);

  const chess = useMemo(() => {
    const c = g.startFen ? new Chess(g.startFen) : new Chess();
    for (const san of g.sans) c.move(san);
    return c;
  }, [g.startFen, g.sans]);

  const liveFen = chess.fen();
  const botColor = g.playerColor === "w" ? "b" : "w";
  const playerTurn = chess.turn() === g.playerColor && g.status === "playing";
  const opening = useMemo(() => findOpening(g.sans), [g.sans]);

  // position being displayed (live or a past ply preview)
  const shownFen = useMemo(() => {
    if (viewPly == null) return liveFen;
    const c = g.startFen ? new Chess(g.startFen) : new Chess();
    for (let i = 0; i <= viewPly; i++) c.move(g.sans[i]);
    return c.fen();
  }, [viewPly, liveFen, g.startFen, g.sans]);

  // Legal moves for the player — from the live position, or from a past
  // position being previewed (playing there branches the game).
  const dests = useMemo(() => {
    if (g.status !== "playing") return null;
    const c = viewPly == null ? chess : new Chess(shownFen);
    if (c.turn() !== g.playerColor) return null;
    const map = new Map();
    for (const m of c.moves({ verbose: true })) {
      if (!map.has(m.from)) map.set(m.from, []);
      map.get(m.from).push(m.to);
    }
    return map;
  }, [chess, shownFen, viewPly, g.status, g.playerColor]);

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

  const pushCp = (cp, atLen) =>
    setStore((s) => {
      const c = s.current;
      if (!c || c.id !== g.id || c.sans.length !== atLen || c.cps.length >= atLen + 1) return s;
      return { ...s, current: { ...c, cps: [...c.cps, cp] } };
    });

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
        if (c.sans.length > base) branches.unshift({ atPly: base, sans: c.sans });
        return {
          ...s,
          current: {
            ...c,
            sans: [...c.sans.slice(0, base), mv.san],
            cps: c.cps.slice(0, base + 1),
            branches: branches.slice(0, 8),
          },
        };
      });
      setViewPly(null);
      setHintArrow(null);
      lastMoveStart.current = Date.now();
      return;
    }

    if (!playerTurn) return;
    sfx(store, mv.captured ? "capture" : "move");
    buzz(store, mv.captured ? 25 : 12);
    applyMove(mv.san, g.sans.length);
    setHintArrow(null);
    lastMoveStart.current = Date.now();
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
      if (c.sans.length > b.atPly) branches.unshift({ atPly: b.atPly, sans: c.sans });
      return {
        ...s,
        current: {
          ...c,
          sans: b.sans,
          cps: Array(b.sans.length).fill(0),
          status: "playing",
          result: null,
          branches: branches.slice(0, 8),
        },
      };
    });
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
    if (g.cps.length === len && len > 0) {
      let cancelled = false;
      engine
        .analyze(liveFen, { movetime: 400 })
        .then((r) => {
          if (cancelled || !r.lines[0]) return;
          const cp = cpWhite(r.lines[0], chess.turn());
          setEvalInfo({ fen: liveFen, cp, bestUci: r.lines[0].move });
          pushCp(cp, len);
          maybeChat(cp);
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

  // greeting
  useEffect(() => {
    if (g.sans.length === 0 && g.chat.length === 0) {
      const line = pickLine(persona, ["greeting"], 0, cooldowns.current);
      if (line) pushChat(line);
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
    const canned = pickLine(persona, events, g.sans.length, cooldowns.current);
    if (!canned) return;
    const ai = store.settings.ai;
    if (ai.baseUrl && ai.model && !g.serious) {
      aiReact({ ai, persona, event: events[0], pgn: chess.pgn(), cpWhitePersp: cpAfter, botColor }).then(
        (text) => {
          sfx(store, "chat");
          pushChat(text || canned);
        }
      );
    } else {
      sfx(store, "chat");
      pushChat(canned);
    }
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
    const line = pickLine(persona, [endEvent], g.sans.length, cooldowns.current);

    setStore((s) => {
      const c = s.current;
      if (!c || c.id !== g.id || c.status !== "playing") return s;
      const rec = s.botRecords[persona.id] || { w: 0, l: 0, d: 0 };
      const newRec =
        result === "1/2-1/2"
          ? { ...rec, d: rec.d + 1 }
          : playerWon
            ? { ...rec, w: rec.w + 1 }
            : { ...rec, l: rec.l + 1 };
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
          chat: line ? [...c.chat, { text: line, ply: c.sans.length }] : c.chat,
        },
      };
    });
  }

  const hint = () => {
    // Reuse the move the eval bar's own search already picked for this
    // position; search fresh only when that read is missing (e.g. move 1).
    if (evalInfo && evalInfo.fen === liveFen && evalInfo.bestUci) {
      setHintArrow([evalInfo.bestUci.slice(0, 2), evalInfo.bestUci.slice(2, 4)]);
    } else {
      engine.analyze(liveFen, { movetime: 400 }).then((r) => {
        if (!r.lines[0]) return;
        setEvalInfo({ fen: liveFen, cp: cpWhite(r.lines[0], liveFen.split(" ")[1]), bestUci: r.lines[0].move });
        setHintArrow([r.lines[0].move.slice(0, 2), r.lines[0].move.slice(2, 4)]);
      });
    }
    setStore((s) =>
      s.current && s.current.id === g.id ? { ...s, current: { ...s.current, hints: s.current.hints + 1 } } : s
    );
  };

  const takeback = () => {
    // undo back to the player's previous decision point
    let n = g.sans.length;
    const parity = g.playerColor === "w" ? 0 : 1;
    n = n - 1;
    while (n > 0 && n % 2 !== parity) n = n - 1;
    setStore((s) =>
      s.current && s.current.id === g.id
        ? { ...s, current: { ...s.current, sans: s.current.sans.slice(0, n), cps: s.current.cps.slice(0, n + 1) } }
        : s
    );
    setViewPly(null);
  };

  const cp = g.cps[g.cps.length - 1] ?? 0;
  const over = g.status === "over";

  return (
    <div className="page gamepage">
      <TopBar
        title={`${persona.avatar} ${persona.name} (${persona.elo})`}
        sub={over ? `${g.result} · ${g.reason}` : opening ? opening.name : g.serious ? "Serious game" : "Casual game"}
        onBack={() => nav("home")}
        right={
          !over && (
            <button
              className="linkbtn"
              onClick={() => {
                if (confirm("Resign this game?")) finishGame(true);
              }}
            >
              Resign
            </button>
          )
        }
      />

      {!engineReady && <div className="enginebanner">Loading engine (first time: ~39 MB)…</div>}

      <ChatBubbles chat={g.chat} persona={persona} />

      <div className="boardrow">
        {!g.serious && store.settings.evalBar && <EvalBar cp={cp} orientation={g.playerColor} />}
        <Board
          fen={shownFen}
          orientation={g.playerColor}
          lastMove={lastMove}
          checkSquare={checkSquare}
          dests={!over ? dests : null}
          onMove={onMove}
          arrow={viewPly == null ? hintArrow : null}
          theme={store.settings.theme}
          custom={store.settings.boardCustom}
          pieceSet={store.settings.pieces}
          animMs={store.settings.animMs}
        arrowColors={store.settings.arrowColors}
          needsPromotion={(from, to) => {
            const piece = new Chess(liveFen).get(from);
            return piece?.type === "p" && (to[1] === "8" || to[1] === "1");
          }}
        />
      </div>

      {viewPly != null && (
        <div className="previewbar">
          {viewPly < 0 ? "Start position" : `Viewing move ${Math.floor(viewPly / 2) + 1}`}
          {!over && " — play here to branch"}
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

      {over ? (
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
            className="linkbtn"
            onClick={() => {
              setStore((s) => ({ ...s, current: null }));
              nav("play", { pick: true });
            }}
          >
            New game
          </button>
        </div>
      ) : (
        <div className="btnrow toolrow">
          <button className="linkbtn" onClick={hint} disabled={!playerTurn}>
            💡 Hint
          </button>
          <button className="linkbtn" onClick={takeback} disabled={g.sans.length === 0}>
            ↩ Takeback
          </button>
          {!playerTurn && g.status === "playing" && <span className="thinking">{persona.name} is thinking…</span>}
        </div>
      )}

      <MoveList sans={g.sans} activePly={viewPly ?? g.sans.length - 1} onTap={setViewPly} />
    </div>
  );
}

function ChatBubbles({ chat, persona }) {
  const last = chat.slice(-2);
  if (last.length === 0) return <div className="chatarea empty" />;
  return (
    <div className="chatarea">
      {last.map((c, i) => (
        <div key={chat.length + "-" + i} className="bubble">
          <span className="bubble-avatar">{persona.avatar}</span>
          <span className="bubble-text">{c.text}</span>
        </div>
      ))}
    </div>
  );
}
