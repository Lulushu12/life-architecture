import { useMemo } from "react";
import { IconButton } from "@shared/ui.jsx";
import { DIFFICULTIES } from "./sudokuGen.js";
import { elapsedOf, fmtElapsed, fmtSeconds } from "./timing.js";
import { summarize } from "./stats.js";
import { DAILY_GAMES, DAILY_SUDOKU_DIFFICULTY, dailyStreak, dayProgress, gamesOn, lastDays } from "./daily.js";
import { MAX_GUESSES } from "./word.js";
import { ClockIcon, CryptoIcon, GAME_ICONS, GearIcon, NonogramIcon, SudokuIcon, WordIcon } from "./Icons.jsx";

function GameCard({ Icon, title, subtitle, lines, resume, onClick }) {
  return (
    <button type="button" className="card gamecard" onClick={onClick}>
      <span className="gc-icon">
        <Icon />
      </span>
      <span className="gamecard-main">
        <span className="gamecard-title">{title}</span>
        <span className="gamecard-sub">{subtitle}</span>
        {lines.filter(Boolean).map((line, i) => (
          <span key={line} className={`gamecard-stat${i === 0 ? " first" : ""}`}>
            {line}
          </span>
        ))}
      </span>
      <span className="gc-cta">{resume ? "Resume" : "Play"}</span>
    </button>
  );
}

function tileStatus(key, entry, started) {
  if (key === "word") {
    if (entry?.word != null) return { done: true, text: `✓ ${entry.word}/${MAX_GUESSES}` };
    if (entry?.wordFailed) return { failed: true, text: `X/${MAX_GUESSES}, try tomorrow` };
  } else if (entry?.[key] != null) {
    return { done: true, text: `✓ ${fmtSeconds(entry[key])}` };
  }
  return { text: started ? "In progress" : "Not started" };
}

const TILE_LABELS = {
  sudoku: `Sudoku · ${DIFFICULTIES[DAILY_SUDOKU_DIFFICULTY].label}`,
  crypto: "Cryptogram",
  word: "Word",
  nono: "Nonogram",
};

function DailyRow({ daily, today, started, onDaily }) {
  const entry = daily[today] || {};
  const streak = dailyStreak(daily, today);
  const days = lastDays(today, 30);
  const games = gamesOn(today);
  const full = days.filter((d) => {
    const p = dayProgress(daily[d], d);
    return p.done === p.total;
  }).length;
  const progress = dayProgress(entry, today);

  return (
    <div className="card daily">
      <div className="daily-head">
        <h3>Daily</h3>
        <span className="daily-streak">
          {streak > 0 ? `${streak} day streak` : `Solve all ${games.length} to start a streak`}
        </span>
      </div>
      <div className={`daily-tiles n${games.length}`}>
        {games.map((g) => {
          const Icon = GAME_ICONS[g.key];
          const st = tileStatus(g.key, entry, started[g.key]);
          return (
            <button
              key={g.key}
              type="button"
              className={`daily-tile${st.done ? " done" : ""}${st.failed ? " failed" : ""}`}
              onClick={() => onDaily(g.key)}
            >
              <span className="daily-tile-title">
                <Icon size={18} />
                {TILE_LABELS[g.key]}
              </span>
              <span className="daily-tile-sub">{st.text}</span>
            </button>
          );
        })}
      </div>
      <div
        className="daily-strip"
        style={{ "--rows": DAILY_GAMES.length }}
        role="img"
        aria-label={`Daily puzzles over the last 30 days: ${full} complete days, current streak ${streak}`}
      >
        {days.map((d) => {
          const e = daily[d];
          const p = dayProgress(e, d);
          return (
            <span
              key={d}
              className={`daily-col${p.done === p.total ? " full" : ""}${d === today ? " today" : ""}`}
              title={`${d}: ${p.done}/${p.total}`}
            >
              {DAILY_GAMES.map((g) => {
                const na = d < g.since;
                const done = e?.[g.key] != null;
                const failed = g.key === "word" && e?.wordFailed && !done;
                return (
                  <span
                    key={g.key}
                    className={`daily-seg${na ? " na" : done ? " done" : failed ? " failed" : ""}`}
                  />
                );
              })}
            </span>
          );
        })}
      </div>
      <div className="daily-foot">
        <span>Last 30 days</span>
        <span>
          Today {progress.done}/{progress.total} · {full} full days
        </span>
      </div>
    </div>
  );
}

export default function Home({ store, today, puzzles, wordSummary, onChess, onSudoku, onCrypto, onWord, onNono, onDaily, onSettings }) {
  const chess = store.chess;
  const chessActive = !!chess && chess.started && chess.flagged == null;
  const chessSub = chess
    ? `${chess.presetLabel} · ${chess.flagged != null ? "flag fallen" : chess.started ? "in progress" : "not started"}`
    : "Presets, favourites, increment, Bronstein and delay";

  const sudoku = store.sudoku;
  const sudokuActive = !!sudoku && !sudoku.solved;
  const sudokuSub = sudoku
    ? `${DIFFICULTIES[sudoku.difficulty].label} · ${sudoku.solved ? "solved" : fmtElapsed(elapsedOf(sudoku))}`
    : "Generated puzzles with a unique solution";

  const solvedCount = puzzles.filter((p) => store.crypto.progress[p.id]?.solved).length;
  const cryptoActive = puzzles.some((p) => {
    const prog = store.crypto.progress[p.id];
    return prog && !prog.solved && Object.keys(prog.guesses || {}).length > 0;
  });
  const cryptoSub = `${solvedCount}/${puzzles.length} solved`;

  const practice = store.word.practice;
  const wordActive = !!practice && practice.status === "playing" && practice.guesses.length > 0;
  const wordSub = wordActive ? `Practice · guess ${practice.guesses.length + 1} of ${MAX_GUESSES}` : "Five letters, six guesses";

  const nono = store.nono.practice;
  const nonoActive = !!nono && !nono.solved && nono.undo.length > 0;
  const nonoSub = nonoActive ? `Practice · ${fmtElapsed(elapsedOf(nono))}` : "10 by 10 picture logic puzzles";

  const lines = useMemo(() => {
    const { chess: cs, sudoku: ss, crypto: cr, word: ws, nono: ns } = store.stats;
    const lastNono = ns[ns.length - 1];
    const nonoAll = summarize(ns, () => "all").all;
    const lastChess = cs[cs.length - 1];
    const lastSudoku = ss[ss.length - 1];
    const lastCrypto = cr[cr.length - 1];

    const byTier = summarize(ss.filter((r) => !r.daily), (r) => r.difficulty);
    const best = Object.keys(DIFFICULTIES)
      .filter((k) => byTier[k])
      .map((k) => `${DIFFICULTIES[k].label} ${fmtSeconds(byTier[k].best)}`);
    const cryptoAll = summarize(cr, () => "all").all;
    const controls = {};
    for (const r of cs) controls[r.control] = (controls[r.control] || 0) + 1;
    const fav = Object.entries(controls).sort((a, b) => b[1] - a[1])[0];

    return {
      chess: [
        lastChess && `Last: ${lastChess.control}, ${lastChess.moves} moves, ${String(lastChess.result).toLowerCase()}`,
        cs.length > 0 && `${cs.length} ${cs.length === 1 ? "game" : "games"} · most played ${fav[0]}`,
      ],
      sudoku: [
        lastSudoku &&
          `Last: ${DIFFICULTIES[lastSudoku.difficulty]?.label || ""}${lastSudoku.daily ? " daily" : ""} in ${fmtSeconds(lastSudoku.seconds)}`,
        best.length > 0 && `Best: ${best.join(" · ")}`,
      ],
      crypto: [
        lastCrypto && `Last: solved in ${fmtSeconds(lastCrypto.seconds)}`,
        cryptoAll && `Best ${fmtSeconds(cryptoAll.best)} · avg ${fmtSeconds(cryptoAll.avg)} over ${cryptoAll.count}`,
      ],
      nono: [
        lastNono && `Last: ${lastNono.daily ? "daily " : ""}solved in ${fmtSeconds(lastNono.seconds)}`,
        nonoAll && `Best ${fmtSeconds(nonoAll.best)} · avg ${fmtSeconds(nonoAll.avg)} over ${nonoAll.count}`,
      ],
      word: [
        ws.length > 0 &&
          `${wordSummary.streak > 0 ? `Streak ${wordSummary.streak} · ` : ""}${wordSummary.winRate}% of ${wordSummary.played} won`,
      ],
    };
  }, [store.stats, wordSummary]);

  const started = {
    sudoku: store.dailySudoku && store.dailySudoku.daily === today && !store.dailySudoku.solved,
    crypto: (() => {
      const p = store.crypto.progress[`d:${today}`];
      return !!p && !p.solved && Object.keys(p.guesses || {}).length > 0;
    })(),
    word: store.word.daily && store.word.daily.daily === today && store.word.daily.guesses.length > 0,
    nono: store.nono.daily && store.nono.daily.daily === today && !store.nono.daily.solved && store.nono.daily.undo.length > 0,
  };

  return (
    <div className="page">
      <div className="home-head">
        <h1 className="apptitle">
          <span>Games</span>
        </h1>
        {onSettings && (
          <IconButton label="Settings" onClick={onSettings}>
            <GearIcon />
          </IconButton>
        )}
      </div>

      <DailyRow daily={store.daily} today={today} started={started} onDaily={onDaily} />

      <GameCard Icon={ClockIcon} title="Chess Clock" subtitle={chessSub} lines={lines.chess} resume={chessActive} onClick={onChess} />
      <GameCard Icon={SudokuIcon} title="Sudoku" subtitle={sudokuSub} lines={lines.sudoku} resume={sudokuActive} onClick={onSudoku} />
      <GameCard Icon={CryptoIcon} title="Cryptogram" subtitle={cryptoSub} lines={lines.crypto} resume={cryptoActive} onClick={onCrypto} />
      <GameCard Icon={WordIcon} title="Word" subtitle={wordSub} lines={lines.word} resume={wordActive} onClick={onWord} />
      <GameCard Icon={NonogramIcon} title="Nonogram" subtitle={nonoSub} lines={lines.nono} resume={nonoActive} onClick={onNono} />
    </div>
  );
}
