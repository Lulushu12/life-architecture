import { useEffect, useState } from "react";

function other(side) {
  return side === 0 ? 1 : 0;
}

// Remaining ms for both sides right now, folding in the running side's
// elapsed time since turnStartedAt. Pure function of persisted state + now.
function remainingMs(game, now) {
  const tl = [...game.timeLeft];
  if (game.started && !game.paused && game.flagged == null && game.activeSide != null) {
    const elapsed = now - game.turnStartedAt;
    tl[game.activeSide] = Math.max(0, tl[game.activeSide] - elapsed);
  }
  return tl;
}

function fmtTime(ms) {
  if (ms <= 0) return "0:00";
  if (ms < 20000) return (ms / 1000).toFixed(1);
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ChessClock({ game, onChange, onNewClock, onHome }) {
  const [, setTick] = useState(0);

  // Force a re-render every 100ms while a clock is actually running, and
  // commit a flag to the store the instant a side hits zero.
  useEffect(() => {
    if (!game.started || game.paused || game.flagged != null || game.activeSide == null) return;
    const id = setInterval(() => {
      const now = Date.now();
      const elapsed = now - game.turnStartedAt;
      const remaining = game.timeLeft[game.activeSide] - elapsed;
      if (remaining <= 0) {
        onChange((g) => {
          if (g.flagged != null) return g;
          const timeLeft = [...g.timeLeft];
          timeLeft[g.activeSide] = 0;
          return { ...g, timeLeft, flagged: g.activeSide, paused: true };
        });
      } else {
        setTick((t) => t + 1);
      }
    }, 100);
    return () => clearInterval(id);
  }, [game.started, game.paused, game.flagged, game.activeSide, game.turnStartedAt, game.timeLeft, onChange]);

  const now = Date.now();
  const [msTop, msBottom] = remainingMs(game, now);

  const tap = (side) => {
    if (game.flagged != null || game.paused) return;
    onChange((g) => {
      if (g.flagged != null || g.paused) return g;
      const incMs = g.incrementSec * 1000;
      if (!g.started) {
        return { ...g, started: true, activeSide: other(side), turnStartedAt: Date.now() };
      }
      if (g.activeSide !== side) return g;
      const elapsed = Date.now() - g.turnStartedAt;
      const remaining = g.timeLeft[side] - elapsed;
      const timeLeft = [...g.timeLeft];
      if (remaining <= 0) {
        timeLeft[side] = 0;
        return { ...g, timeLeft, flagged: side, paused: true };
      }
      timeLeft[side] = remaining + incMs;
      return { ...g, timeLeft, activeSide: other(side), turnStartedAt: Date.now() };
    });
  };

  const togglePause = () => {
    onChange((g) => {
      if (g.flagged != null || !g.started) return g;
      if (g.paused) {
        return { ...g, paused: false, turnStartedAt: Date.now() };
      }
      const elapsed = Date.now() - g.turnStartedAt;
      const timeLeft = [...g.timeLeft];
      if (g.activeSide != null) timeLeft[g.activeSide] = Math.max(0, timeLeft[g.activeSide] - elapsed);
      return { ...g, paused: true, timeLeft, turnStartedAt: null };
    });
  };

  const reset = () => {
    if (game.started && !confirm("Reset the clock back to the start of this time control?")) return;
    onChange((g) => {
      const ms = g.minutesPerSide * 60000;
      return {
        ...g,
        timeLeft: [ms, ms],
        started: false,
        paused: false,
        activeSide: null,
        turnStartedAt: null,
        flagged: null,
      };
    });
  };

  const newControl = () => {
    if (game.started && !confirm("Start a new time control? Current clock will be discarded.")) return;
    onNewClock();
  };

  const zoneClass = (side, ms) => {
    const classes = ["cc-zone", side === 0 ? "top" : "bottom"];
    if (game.flagged === side) classes.push("flagged");
    else if (game.started && !game.paused && game.activeSide === side) classes.push("active");
    return classes.join(" ");
  };

  return (
    <div className="chessclock">
      <button className="cc-corner cc-home" onClick={onHome} aria-label="Home">
        ⌂
      </button>
      <button className="cc-corner cc-new" onClick={newControl} aria-label="New time control">
        ⚙
      </button>

      <div className={zoneClass(0, msTop)} onClick={() => tap(0)}>
        <div className="cc-time">{fmtTime(msTop)}</div>
      </div>

      <div className="cc-mid">
        <button className="cc-midbtn" onClick={togglePause} disabled={!game.started || game.flagged != null}>
          {game.paused ? "▶ Resume" : "⏸ Pause"}
        </button>
        <div className="cc-label">{game.presetLabel}</div>
        <button className="cc-midbtn" onClick={reset}>
          ⟲ Reset
        </button>
      </div>

      <div className={zoneClass(1, msBottom)} onClick={() => tap(1)}>
        <div className="cc-time">{fmtTime(msBottom)}</div>
      </div>
    </div>
  );
}
