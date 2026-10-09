import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import Board from "./Board.jsx";
import { TopBar } from "./ui.jsx";
import { play as sfx, buzz } from "./audio.js";
import { emitEvent } from "@shared/bridge.js";
import { todayKey } from "@shared/store.js";
import { acceptsMove, isMateUci, getRating } from "./puzzledb.js";
import { HEARTS, pickDaily, dailyStreak, bestStreak, monthGrid } from "./daily.js";
import { themeTip } from "./core/coach/puzzle.js";
import { legalDests, promotionCheck } from "./core/position.js";
import { uciToSan } from "./review.js";
import { useDb, boardLook, applyUci, useWrongMoveTip, TipStrip } from "./PuzzleSets.jsx";
import { ChevronLeft, ChevronRight, Flame, Heart } from "lucide-react";

// The daily puzzle (plan item 11). Wrong moves and hints cost a heart; the
// streak counts days solved with a heart to spare. Unrated.
export default function DailyPuzzle({ store, setStore, nav }) {
  const today = todayKey();
  const [db, error] = useDb();
  const daily = store.daily?.date === today ? store.daily : null;

  // Pick today's puzzle on first open, and keep it for the day.
  useEffect(() => {
    if (!db || daily) return;
    const pick = pickDaily(db, today, getRating(store).r, store.dailyLog);
    if (pick) setStore((s) => (s.daily?.date === today ? s : { ...s, daily: { date: today, ...pick, hearts: HEARTS, result: null } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, daily, today]);

  const puzzle = useMemo(() => (db && daily ? (db.puzzles[daily.key] || []).find((p) => p.i === daily.id) : null), [db, daily]);

  if (error) return <Shell nav={nav}><p className="warn">Couldn't load the puzzles: {error}</p></Shell>;
  if (!puzzle) return <Shell nav={nav}><p className="hint">Loading…</p></Shell>;
  return <DailyBoard key={daily.date} store={store} setStore={setStore} nav={nav} daily={daily} puzzle={puzzle} today={today} />;
}

function Shell({ nav, children, sub }) {
  return (
    <div className="page">
      <TopBar title="Daily puzzle" sub={sub} onBack={() => nav("puzzles")} />
      {children}
    </div>
  );
}

function DailyBoard({ store, setStore, nav, daily, puzzle, today }) {
  const moves = useMemo(() => puzzle.m.split(" "), [puzzle]);
  const over = daily.result != null;
  // ply = index into the solution; a finished daily shows its last position
  const [ply, setPly] = useState(over ? moves.length : 1);
  const [hint, setHint] = useState(false);
  const [showing, setShowing] = useState(false); // stepping through the solution after a fail
  const tip = useWrongMoveTip();

  const chess = useMemo(() => {
    const c = new Chess(puzzle.f);
    for (let i = 0; i < ply && i < moves.length; i++) applyUci(c, moves[i]);
    return c;
  }, [puzzle, moves, ply]);
  const solverColor = useMemo(() => {
    const c = new Chess(puzzle.f);
    applyUci(c, moves[0]);
    return c.turn();
  }, [puzzle, moves]);
  const expected = moves[ply];
  const log = store.dailyLog || {};
  const streak = dailyStreak(log, today);

  const finish = (result, hearts) => {
    setStore((s) => {
      if (s.daily?.date !== today || s.daily.result) return s;
      const dailyLog = { ...(s.dailyLog || {}), [today]: { id: daily.id, result, hearts } };
      return { ...s, daily: { ...s.daily, result, hearts }, dailyLog };
    });
    const nextLog = { ...log, [today]: { id: daily.id, result, hearts } };
    emitEvent({ app: "chess", type: "chess.daily", value: { result, hearts, streak: dailyStreak(nextLog, today) } });
    if (result === "solved") {
      sfx(store, "gameEnd");
      buzz(store, [30, 40, 30]);
    } else {
      sfx(store, "lose");
      buzz(store, 60);
    }
  };

  const loseHeart = () => {
    const hearts = Math.max(0, daily.hearts - 1);
    setStore((s) => (s.daily?.date === today ? { ...s, daily: { ...s.daily, hearts } } : s));
    if (hearts === 0) finish("failed", 0);
    return hearts;
  };

  const tryMove = (from, to, promotion) => {
    if (over) return;
    const played = from + to + (promotion || "");
    if (!acceptsMove(chess.fen(), played, expected)) {
      buzz(store, 60);
      const left = loseHeart();
      if (left > 0) {
        sfx(store, "lose");
        tip.explain(chess.fen(), played, puzzle.t);
      } else tip.clear();
      return;
    }
    tip.clear();
    setHint(false);
    if (ply + 1 >= moves.length || isMateUci(chess.fen(), played)) {
      setPly(moves.length);
      finish("solved", daily.hearts);
    } else if (ply + 2 >= moves.length) {
      setPly(moves.length);
      finish("solved", daily.hearts);
    } else setPly(ply + 2);
  };

  const takeHint = () => {
    if (hint || daily.hearts <= 1) return;
    loseHeart();
    setHint(true);
  };

  const failed = daily.result === "failed";
  const solved = daily.result === "solved";
  const arrow = (failed && !showing && expected) || (showing && expected) ? [expected.slice(0, 2), expected.slice(2, 4)] : null;

  return (
    <div className="page gamepage">
      <TopBar
        title="Daily puzzle"
        sub={`${new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} · puzzle ${puzzle.r}`}
        onBack={() => nav("puzzles")}
      />
      <div className="dailyhead">
        <span className="hearts" aria-label={`${daily.hearts} of ${HEARTS} hearts left`}>
          {Array.from({ length: HEARTS }, (_, i) => (
            <Heart key={i} aria-hidden="true" className={i < daily.hearts ? "full" : "empty"} />
          ))}
        </span>
        <span className="dailystreak">
          <Flame aria-hidden="true" /> {streak} day{streak === 1 ? "" : "s"}
        </span>
      </div>

      <Board
        fen={chess.fen()}
        orientation={solverColor}
        dests={over ? null : legalDests(chess)}
        onMove={tryMove}
        arrow={failed && ply < moves.length ? arrow : null}
        highlightSquares={hint && !over && expected ? [expected.slice(0, 2)] : null}
        needsPromotion={promotionCheck(chess)}
        {...boardLook(store)}
      />

      {!over && (
        <>
          <p className="hint center small">
            {solverColor === "w" ? "White" : "Black"} to move. {ply > 1 ? "Keep going, the line continues." : "Find the best move."}
          </p>
          {tip.text && <TipStrip text={tip.text} />}
          {hint && !tip.text && <TipStrip text={themeTip(puzzle.t) || "The highlighted piece moves."} />}
          <div className="btnrow toolrow">
            <button className="linkbtn" onClick={takeHint} disabled={hint || daily.hearts <= 1}>
              💡 Hint (costs a heart)
            </button>
          </div>
        </>
      )}

      {solved && (
        <p className="okmsg center">
          ✓ Solved with {daily.hearts} {daily.hearts === 1 ? "heart" : "hearts"} left
        </p>
      )}
      {failed && (
        <>
          <p className="warn center">Out of hearts. The streak starts again tomorrow.</p>
          {ply < moves.length && (
            <div className="btnrow toolrow">
              <span className="hint small">The arrow shows {uciToSan(chess.fen(), expected) || expected}.</span>
              <button
                className="linkbtn"
                onClick={() => {
                  setShowing(true);
                  setPly((p) => Math.min(p + 2, moves.length));
                }}
              >
                Play it
              </button>
            </div>
          )}
        </>
      )}

      {over && <DailyCalendar log={log} today={today} />}
      {over && (
        <div className="btnrow endrow">
          <button className="bigbtn" onClick={() => nav("puzzles", { set: "mix" })}>
            More puzzles
          </button>
          <span className="hint small">A new daily puzzle tomorrow.</span>
        </div>
      )}
    </div>
  );
}

export function DailyCalendar({ log, today }) {
  const [y0, m0] = today.split("-").map(Number);
  const [offset, setOffset] = useState(0);
  const d = new Date(y0, m0 - 1 + offset, 1, 12);
  const weeks = monthGrid(d.getFullYear(), d.getMonth());
  const best = bestStreak(log);
  return (
    <div className="card dailycal">
      <div className="cal-head">
        <button type="button" className="iconbtn" aria-label="Previous month" onClick={() => setOffset((o) => o - 1)}>
          <ChevronLeft aria-hidden="true" />
        </button>
        <span>{d.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
        <button type="button" className="iconbtn" aria-label="Next month" disabled={offset >= 0} onClick={() => setOffset((o) => o + 1)}>
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
      <div className="cal-grid">
        {["M", "T", "W", "T", "F", "S", "S"].map((l, i) => (
          <span key={i} className="cal-dow">
            {l}
          </span>
        ))}
        {weeks.flat().map((day, i) => (
          <span
            key={i}
            className={
              "cal-day" +
              (day ? "" : " pad") +
              (day && log[day]?.result ? " " + log[day].result : "") +
              (day === today ? " today" : "")
            }
            title={day && log[day]?.result ? `${day}: ${log[day].result}` : undefined}
          >
            {day ? Number(day.slice(8)) : ""}
          </span>
        ))}
      </div>
      <p className="hint small">Best streak: {best} day{best === 1 ? "" : "s"}</p>
    </div>
  );
}
