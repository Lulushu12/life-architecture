import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import Board, { EvalBar } from "./Board.jsx";
import { TopBar, Toggle, MoveList, PersonaCard } from "./ui.jsx";
import { PERSONAS, getPersona } from "./personas.js";
import { getEngine, cpWhite } from "./engine.js";
import { chooseBotMove } from "./bot.js";
import { detectEvents, pickLine, aiReact } from "./chat.js";
import { findOpening } from "./openings.js";
import { play as sfx, buzz } from "./audio.js";
import { newId } from "./storage.js";

export default function PlayBot({ store, setStore, nav, view }) {
  const cur = store.current;
  if (view.pick || !cur || cur.mode !== "bot") {
    return <BotPicker store={store} setStore={setStore} nav={nav} />;
  }
  return <BotGame store={store} setStore={setStore} nav={nav} />;
}

function BotPicker({ store, setStore, nav }) {
  const [color, setColor] = useState("w");
  const [serious, setSerious] = useState(false);

  const start = (persona) => {
    setStore((s) => ({
      ...s,
      current: {
        id: newId(),
        mode: "bot",
        personaId: persona.id,
        playerColor: color,
        serious,
        startFen: null,
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
      <TopBar title="Choose your opponent" onBack={() => nav("home")} />
      <div className="setrow">
        <span className="setlabel">You play</span>
        <div className="chips">
          <button className={"chip" + (color === "w" ? " sel" : "")} onClick={() => setColor("w")}>
            White
          </button>
          <button className={"chip" + (color === "b" ? " sel" : "")} onClick={() => setColor("b")}>
            Black
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
      {PERSONAS.map((p) => (
        <PersonaCard key={p.id} persona={p} record={store.botRecords[p.id]} onClick={() => start(p)} />
      ))}
    </div>
  );
}

function BotGame({ store, setStore, nav }) {
  const g = store.current;
  const persona = getPersona(g.personaId);
  const engine = getEngine();
  const [viewPly, setViewPly] = useState(null); // null = live
  const [hintArrow, setHintArrow] = useState(null);
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

  const dests = useMemo(() => {
    if (!playerTurn || viewPly != null) return null;
    const map = new Map();
    for (const m of chess.moves({ verbose: true })) {
      if (!map.has(m.from)) map.set(m.from, []);
      map.get(m.from).push(m.to);
    }
    return map;
  }, [chess, playerTurn, viewPly]);

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

  // ---- player's move ----
  const onMove = (from, to, promotion) => {
    if (!playerTurn) return;
    const test = new Chess(liveFen);
    const mv = test.move({ from, to, promotion: promotion || "q" });
    if (!mv) return;
    sfx(store, mv.captured ? "capture" : "move");
    buzz(store, mv.captured ? 25 : 12);
    applyMove(mv.san, g.sans.length);
    setHintArrow(null);
    lastMoveStart.current = Date.now();
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

    // quick eval for the new position (eval bar / chat / graph)
    if (g.cps.length === len && len > 0) {
      let cancelled = false;
      engine
        .analyze(liveFen, { movetime: 150 })
        .then((r) => {
          if (cancelled || !r.lines[0]) return;
          const cp = cpWhite(r.lines[0], chess.turn());
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
    engine.analyze(liveFen, { movetime: 350 }).then((r) => {
      if (r.bestmove) setHintArrow([r.bestmove.slice(0, 2), r.bestmove.slice(2, 4)]);
    });
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

  const rewindTo = (ply) => {
    if (!confirm(`Rewind the game to move ${Math.floor(ply / 2) + 1}? Later moves are discarded.`)) return;
    setStore((s) =>
      s.current && s.current.id === g.id
        ? { ...s, current: { ...s.current, sans: s.current.sans.slice(0, ply), cps: s.current.cps.slice(0, ply + 1), status: "playing", result: null } }
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
          dests={viewPly == null && !over ? dests : null}
          onMove={onMove}
          arrow={viewPly == null ? hintArrow : null}
          theme={store.settings.theme}
          needsPromotion={(from, to) => {
            const piece = new Chess(liveFen).get(from);
            return piece?.type === "p" && (to[1] === "8" || to[1] === "1");
          }}
        />
      </div>

      {viewPly != null && (
        <div className="previewbar">
          Viewing move {Math.floor(viewPly / 2) + 1}
          <button className="linkbtn" onClick={() => setViewPly(null)}>
            Back to live
          </button>
          {!over && (
            <button className="linkbtn danger" onClick={() => rewindTo(viewPly)}>
              Rewind here
            </button>
          )}
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
