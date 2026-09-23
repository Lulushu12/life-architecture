import { useMemo } from "react";
import { BackupPanel } from "@shared/BackupPanel.jsx";
import { DIFFICULTIES } from "./sudokuGen.js";
import { elapsedOf, fmtElapsed, fmtSeconds } from "./timing.js";
import { summarize } from "./stats.js";
import { DAILY_SUDOKU_DIFFICULTY, dailyStreak, dayState, lastDays } from "./daily.js";
import { STORE_KEY, validateBackup } from "./storage.js";

function GameCard({ icon, title, subtitle, stats, resume, onClick }) {
  return (
    <button type="button" className="card gamecard" onClick={onClick}>
      <span className="gc-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="gamecard-main">
        <span className="gamecard-title">{title}</span>
        <span className="gamecard-sub">{subtitle}</span>
        {stats?.map((line) => (
          <span key={line} className="gamecard-stat">
            {line}
          </span>
        ))}
      </span>
      <span className="gc-cta">{resume ? "Resume →" : "Play →"}</span>
    </button>
  );
}

function DailyRow({ daily, today, sudokuGame, cryptoProgress, onDaily }) {
  const done = daily[today] || {};
  const streak = dailyStreak(daily, today);
  const days = lastDays(today, 30);
  const sudokuStarted = sudokuGame && sudokuGame.daily === today && !sudokuGame.solved;
  const cryptoStarted = cryptoProgress && !cryptoProgress.solved && Object.keys(cryptoProgress.guesses || {}).length;

  const tile = (which, label, seconds, started) => (
    <button type="button" className={`daily-tile${seconds != null ? " done" : ""}`} onClick={() => onDaily(which)}>
      <span className="daily-tile-title">{label}</span>
      <span className="daily-tile-sub">
        {seconds != null ? `✓ ${fmtSeconds(seconds)}` : started ? "In progress" : "Not started"}
      </span>
    </button>
  );

  return (
    <div className="card daily">
      <div className="daily-head">
        <h3>Daily</h3>
        <span className="daily-streak">
          {streak > 0 ? `${streak} day streak` : "Solve both to start a streak"}
        </span>
      </div>
      <div className="daily-tiles">
        {tile("sudoku", `Sudoku · ${DIFFICULTIES[DAILY_SUDOKU_DIFFICULTY].label}`, done.sudoku, sudokuStarted)}
        {tile("crypto", "Cryptogram", done.crypto, cryptoStarted)}
      </div>
      <div className="daily-strip" role="img" aria-label={`Daily completion over the last 30 days, current streak ${streak}`}>
        {days.map((d) => (
          <span key={d} className={`daily-dot ${dayState(daily[d])}${d === today ? " today" : ""}`} title={d} />
        ))}
      </div>
    </div>
  );
}

export default function Home({ store, today, puzzles, onChess, onSudoku, onCrypto, onDaily, onRestore }) {
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

  const sudokuStats = useMemo(() => {
    const byTier = summarize(store.stats.sudoku.filter((r) => !r.daily), (r) => r.difficulty);
    return Object.keys(DIFFICULTIES)
      .filter((k) => byTier[k])
      .map((k) => `${DIFFICULTIES[k].label}: best ${fmtSeconds(byTier[k].best)}, avg ${fmtSeconds(byTier[k].avg)} (${byTier[k].count})`);
  }, [store.stats.sudoku]);

  const cryptoStats = useMemo(() => {
    const by = summarize(store.stats.crypto, (r) => (r.daily ? "Daily" : "Puzzles"));
    return ["Puzzles", "Daily"]
      .filter((k) => by[k])
      .map((k) => `${k}: best ${fmtSeconds(by[k].best)}, avg ${fmtSeconds(by[k].avg)} (${by[k].count})`);
  }, [store.stats.crypto]);

  const chessStats = useMemo(() => {
    const by = {};
    for (const r of store.stats.chess) {
      const s = by[r.control] || (by[r.control] = { count: 0, moves: 0, most: 0 });
      s.count++;
      s.moves += Number(r.moves) || 0;
      s.most = Math.max(s.most, Number(r.moves) || 0);
    }
    return Object.entries(by)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([control, s]) => `${control}: ${s.count} games, avg ${Math.round(s.moves / s.count)} moves, most ${s.most}`);
  }, [store.stats.chess]);

  return (
    <div className="page">
      <h1 className="apptitle">
        <span>Games</span>
      </h1>

      <DailyRow
        daily={store.daily}
        today={today}
        sudokuGame={store.dailySudoku}
        cryptoProgress={store.crypto.progress[`d:${today}`]}
        onDaily={onDaily}
      />

      <GameCard icon="♟" title="Chess Clock" subtitle={chessSub} stats={chessStats} resume={chessActive} onClick={onChess} />
      <GameCard icon="🔢" title="Sudoku" subtitle={sudokuSub} stats={sudokuStats} resume={sudokuActive} onClick={onSudoku} />
      <GameCard icon="🔐" title="Cryptogram" subtitle={cryptoSub} stats={cryptoStats} resume={cryptoActive} onClick={onCrypto} />

      <h2>Backup</h2>
      <div className="card">
        <BackupPanel
          prefix="games"
          storageKey={STORE_KEY}
          data={store}
          validate={validateBackup}
          strip={["sudokuNext", "_recovered"]}
          onRestore={onRestore}
        />
      </div>
    </div>
  );
}
