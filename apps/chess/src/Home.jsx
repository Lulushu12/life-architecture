import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { IS_NATIVE } from "./platform.js";
import { getPersona } from "./personas.js";
import MiniBoard from "./MiniBoard.jsx";
import { newBotGame, lastBotGame } from "./botGame.js";
import { presetFlags, presetName, presetOf, helpOf } from "./helpLevels.js";
import { getRating, dueItems } from "./puzzledb.js";
import { wdl } from "./records.js";
import { dailyStreak, dailyStatus } from "./daily.js";
import { todayKey } from "@shared/store.js";
import {
  Archive, BookOpen, Bot, CalendarDays, ChartLine, ChevronRight, Download, GraduationCap, Handshake, Landmark, Microscope, Pencil,
  Play, Puzzle, Repeat, Settings, Swords,
} from "lucide-react";

// Home (plan item 10): one hero card with a real position, four tiles for
// what you do every day, then everything else as a list.
export default function Home({ store, setStore, nav }) {
  const cur = store.current;
  const last = useMemo(() => (cur ? null : lastBotGame(store.games)), [cur, store.games]);
  const rating = getRating(store);
  const due = useMemo(() => dueItems(store).length, [store]);
  const today = todayKey();
  const streak = dailyStreak(store.dailyLog, today);

  // The lessons are big, so the next one is looked up after the screen shows.
  const [next, setNext] = useState(null);
  useEffect(() => {
    let alive = true;
    import("./lessonRunner.js").then((m) => alive && setNext(m.nextLesson(store.lessonProgress) || "all"));
    return () => {
      alive = false;
    };
  }, [store.lessonProgress]);

  const recent = lastBotGame(store.games);
  const recentPersona = recent ? getPersona(recent.personaId) : null;

  const playAgain = () => {
    const help = presetFlags(store.settings.helpPreset);
    setStore((s) => ({ ...s, current: newBotGame({ personaId: last.personaId, playerColor: last.playerColor, help }) }));
    nav("play");
  };

  return (
    <div className="page homepage">
      <h1 className="apptitle">
        Chess<span>.</span>
      </h1>

      {cur ? <ResumeHero cur={cur} store={store} nav={nav} /> : last ? <AgainHero game={last} store={store} onPlay={playAgain} /> : (
        <button type="button" className="card hero herofirst" onClick={() => nav("play", { pick: true })}>
          <div className="hero-k">Welcome</div>
          <div className="hero-h">Play your first game</div>
          <div className="hero-s">Pick a bot from 800 up; help is on until you turn it off.</div>
        </button>
      )}

      <div className="hometiles">
        <button type="button" className="card hometile" onClick={() => nav("puzzles", { set: "daily" })}>
          <span className="ht-row">
            <CalendarDays aria-hidden="true" />
            <span className="ht-num">
              {streak}
              <small> {streak === 1 ? "day" : "days"}</small>
            </span>
          </span>
          <span className="ht-lbl">Daily puzzle</span>
          <span className="ht-sub">{dailyStatus(store, today)}</span>
        </button>
        <button type="button" className="card hometile" onClick={() => nav("puzzles", due ? { set: "due" } : {})}>
          <span className="ht-row">
            <Repeat aria-hidden="true" />
            <span className="ht-num">{due}</span>
          </span>
          <span className="ht-lbl">Due for review</span>
          <span className="ht-sub">{due ? "puzzles you missed" : "nothing due today"}</span>
        </button>
        <button
          type="button"
          className="card hometile"
          onClick={() => nav("lessons", next && next !== "all" ? { lessonId: next.lesson.id } : {})}
        >
          <span className="ht-row">
            <GraduationCap aria-hidden="true" />
            <span className="ht-num">
              {next && next !== "all" ? (
                <>
                  {next.done}
                  <small>/{next.total}</small>
                </>
              ) : (
                "…"
              )}
            </span>
          </span>
          <span className="ht-lbl">Next lesson</span>
          <span className="ht-sub">{next === "all" ? "all done" : next ? next.lesson.title : " "}</span>
        </button>
        <button type="button" className="card hometile" onClick={() => nav("play", { pick: true })}>
          <span className="ht-row">
            <Bot aria-hidden="true" />
            <span className="ht-num ht-ava">{recentPersona?.avatar || ""}</span>
          </span>
          <span className="ht-lbl">Play bots</span>
          <span className="ht-sub">
            {recentPersona ? `last: ${recentPersona.name} · ${wdl(store.botRecords[recentPersona.id])}` : "choose an opponent"}
          </span>
        </button>
      </div>

      <div className="homesection">Everything else</div>
      <div className="card homelist">
        {[
          [Puzzle, `Puzzles · rating ${rating.r}`, () => nav("puzzles")],
          [Handshake, "Pass & play", () => nav("passplay", { setup: true })],
          [GraduationCap, "Lessons", () => nav("lessons")],
          [BookOpen, "Openings", () => nav("openings")],
          [Microscope, "Analysis", () => nav("analysis")],
          [Archive, "Game archive", () => nav("archive")],
          [ChartLine, "Stats", () => nav("stats")],
          [Download, "Import games", () => nav("review", { importing: true })],
          [Landmark, "Pro games", () => nav("games")],
          [Pencil, "Custom position", () => nav("editor")],
          [Swords, "Engine match", () => nav("enginematch")],
          [Settings, "Settings & themes", () => nav("settings")],
        ].map(([Icon, label, go]) => (
          <button key={label} type="button" className="homerow" onClick={go}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
            <ChevronRight aria-hidden="true" className="chev" />
          </button>
        ))}
      </div>

      <p className="hint small footernote">
        Everything runs on this phone, Stockfish 16 NNUE included.
        {!IS_NATIVE && " First visit downloads the 39 MB engine net once; after that it works fully offline."}
      </p>
    </div>
  );
}

function replay(startFen, sans) {
  const c = startFen ? new Chess(startFen) : new Chess();
  let last = null;
  for (const san of sans) {
    try {
      last = c.move(san);
    } catch {
      break;
    }
  }
  return { fen: c.fen(), turn: c.turn(), lastMove: last ? [last.from, last.to] : null };
}

function ResumeHero({ cur, store, nav }) {
  const pos = useMemo(() => replay(cur.startFen, cur.sans), [cur.startFen, cur.sans]);
  const bot = cur.mode === "bot";
  const persona = bot ? getPersona(cur.personaId) : null;
  const yourMove = bot ? pos.turn === cur.playerColor : true;
  const moveNo = Math.floor(cur.sans.length / 2) + 1;
  return (
    <div className="card hero">
      <MiniBoard
        fen={pos.fen}
        orientation={bot ? cur.playerColor : "w"}
        lastMove={pos.lastMove}
        settings={store.settings}
        label="Your game in progress"
      />
      <div className="hero-body">
        <div className="hero-k">{bot ? (yourMove ? "Your move" : "Their move") : "Pass & play"}</div>
        <div className="hero-h">{bot ? `vs ${persona.name} ${persona.avatar}` : `${pos.turn === "w" ? "White" : "Black"} to move`}</div>
        <div className="hero-s">
          {bot ? `${persona.elo} · ${presetName(presetOf(helpOf(cur, store.settings)))} · ` : ""}move {moveNo}
        </div>
        <button type="button" className="bigbtn herobtn" onClick={() => nav(bot ? "play" : "passplay")}>
          <Play aria-hidden="true" /> Resume game
        </button>
      </div>
    </div>
  );
}

function AgainHero({ game, store, onPlay }) {
  const pos = useMemo(() => replay(game.startFen, game.sans), [game.startFen, game.sans]);
  const persona = getPersona(game.personaId);
  const won = game.result !== "1/2-1/2" && (game.result === "1-0") === (game.playerColor === "w");
  const outcome = game.result === "1/2-1/2" ? "Drawn" : won ? "Won" : "Lost";
  return (
    <div className="card hero">
      <MiniBoard fen={pos.fen} orientation={game.playerColor} lastMove={pos.lastMove} settings={store.settings} label="Your last game" />
      <div className="hero-body">
        <div className="hero-k">Last game: {outcome.toLowerCase()}</div>
        <div className="hero-h">Play again vs {persona.name} {persona.avatar}</div>
        <div className="hero-s">
          {persona.elo} · {wdl(store.botRecords[persona.id])} · {presetName(store.settings.helpPreset || "some")}
        </div>
        <button type="button" className="bigbtn herobtn" onClick={onPlay}>
          <Play aria-hidden="true" /> Play again
        </button>
      </div>
    </div>
  );
}
