import { useCallback, useEffect, useRef, useState } from "react";
import { IconButton, useToast } from "@shared/ui.jsx";
import { useBackGuard } from "@shared/useHistoryNav.js";
import { audio } from "@shared/audio.js";
import { vibrate } from "@shared/haptics.js";
import {
  BEEP_TIME_MS,
  LOW_TIME_MS,
  delayLeftMs,
  flagIfOut,
  fmtClock,
  isRunning,
  pauseClock,
  pressClock,
  remainingMs,
  togglePause,
} from "./chessClock.js";

const FLAG_BUZZ = [400, 120, 400, 120, 400];

export default function ChessClock({ game, prefs, onChange, onReset, onSettings, onHome, confirm }) {
  const toast = useToast();
  const [, setTick] = useState(0);
  const gameRef = useRef(game);
  gameRef.current = game;
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const beepRef = useRef({ side: null, sec: null });
  const flagRef = useRef(game.flagged);

  const running = isRunning(game);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      const g = gameRef.current;
      const now = Date.now();
      if (!isRunning(g)) return;
      const left = remainingMs(g, now)[g.activeSide];
      if (left <= 0) {
        changeRef.current((x) => flagIfOut(x, Date.now()));
        return;
      }
      if (left < BEEP_TIME_MS) {
        const sec = Math.ceil(left / 1000);
        const last = beepRef.current;
        if (last.side !== g.activeSide || last.sec !== sec) {
          beepRef.current = { side: g.activeSide, sec };
          audio.play("lowTime", { enabled: prefsRef.current.sound });
        }
      }
      setTick((t) => (t + 1) % 1000000);
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (flagRef.current == null && game.flagged != null) {
      audio.play("fail", { enabled: prefsRef.current.sound });
      vibrate(FLAG_BUZZ, { enabled: prefsRef.current.vibrate });
    }
    flagRef.current = game.flagged;
  }, [game.flagged]);

  const pause = useCallback(() => {
    const now = Date.now();
    changeRef.current((g) => pauseClock(g, now));
  }, []);

  useBackGuard(running, () => {
    pause();
    toast("Clock paused. Press back again to leave.");
  });

  const tap = useCallback((side) => {
    const g = gameRef.current;
    if (g.flagged != null || g.paused) return;
    if (g.started && g.activeSide !== side) return;
    const now = Date.now();
    audio.ensure();
    audio.play("click", { enabled: prefsRef.current.sound });
    vibrate("tap", { enabled: prefsRef.current.vibrate });
    changeRef.current((x) => pressClock(x, side, now));
  }, []);

  const onTogglePause = () => {
    audio.ensure();
    const now = Date.now();
    onChange((g) => togglePause(g, now));
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== " " && e.code !== "Space") return;
      if (document.querySelector(".sheet-backdrop")) return;
      const g = gameRef.current;
      if (!isRunning(g)) return;
      e.preventDefault();
      tap(g.activeSide);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tap]);

  const leaveOr = (fn) => () => {
    if (isRunning(gameRef.current)) {
      pause();
      toast("Clock paused. Tap again to leave.");
      return;
    }
    fn();
  };

  const reset = async () => {
    const g = gameRef.current;
    if (g.started && g.flagged == null) {
      if (isRunning(g)) pause();
      const ok = await confirm({
        title: "Reset the clock?",
        message: "Both sides go back to the start of this time control.",
        confirmLabel: "Reset",
        danger: true,
      });
      if (!ok) return;
    }
    onReset();
  };

  const tenthsMs = (prefs.tenthsSec ?? 20) * 1000;
  const now = Date.now();
  const times = remainingMs(game, now);
  const delayLeft = delayLeftMs(game, now);
  const moves = game.moves || [0, 0];

  const zone = (side) => {
    const ms = times[side];
    const active = game.started && game.flagged == null && game.activeSide === side;
    const classes = ["cc-zone", side === 0 ? "top" : "bottom"];
    if (game.flagged === side) classes.push("flagged");
    else if (active && !game.paused) classes.push("active");
    else if (active && game.paused) classes.push("waiting");
    if (game.started && game.flagged == null && ms < LOW_TIME_MS) {
      classes.push("low");
      if (active && !game.paused) classes.push("pulse");
    }
    let status = "";
    if (game.flagged === side) status = "Flag fell";
    else if (game.flagged != null) status = "Wins on time";
    else if (!game.started) status = side === 0 ? "Tap to start bottom clock" : "Tap to start top clock";
    else if (game.paused) status = "Paused";
    else if (active && delayLeft > 0) status = `Delay ${(delayLeft / 1000).toFixed(1)}`;
    return (
      <button
        type="button"
        className={classes.join(" ")}
        aria-label={`${side === 0 ? "Top" : "Bottom"} clock, ${fmtClock(ms, tenthsMs)}`}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          tap(side);
        }}
        onClick={(e) => {
          if (e.detail === 0) tap(side);
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span className="cc-face">
          <span className="cc-time">{fmtClock(ms, tenthsMs)}</span>
          <span className="cc-meta">
            <span>Moves {moves[side]}</span>
            {status && <span className="cc-status">{status}</span>}
          </span>
        </span>
      </button>
    );
  };

  const pauseLabel = game.paused ? "Resume" : "Pause";
  const pauseIcon = game.paused ? "▶" : "⏸";
  const pauseDisabled = !game.started || game.flagged != null;

  return (
    <div className="chessclock">
      {zone(0)}

      <div className="cc-mid">
        <div className="cc-strip cc-strip-top">
          <IconButton
            label={`${pauseLabel} (top player)`}
            onClick={onTogglePause}
            disabled={pauseDisabled}
            className="cc-btn"
          >
            {pauseIcon}
          </IconButton>
          <span className="cc-label">{game.presetLabel}</span>
          <span className="cc-count">#{Math.max(moves[0], moves[1]) + (game.started ? 1 : 0)}</span>
        </div>
        <div className="cc-strip">
          <IconButton label="Home" onClick={leaveOr(onHome)} className="cc-btn">
            ⌂
          </IconButton>
          <IconButton label="Reset" onClick={reset} className="cc-btn">
            ⟲
          </IconButton>
          <span className="cc-label">{game.presetLabel}</span>
          <IconButton label={pauseLabel} onClick={onTogglePause} disabled={pauseDisabled} className="cc-btn">
            {pauseIcon}
          </IconButton>
          <IconButton label="Time control and settings" onClick={leaveOr(onSettings)} className="cc-btn">
            ⚙
          </IconButton>
        </div>
      </div>

      {zone(1)}
    </div>
  );
}
