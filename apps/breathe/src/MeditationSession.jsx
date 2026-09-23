import { useEffect, useRef, useState } from "react";
import { useBackGuard } from "@shared/useHistoryNav.js";
import { useWakeLock } from "@shared/useWakeLock.js";
import { ConfirmSheet } from "@shared/ui.jsx";
import { audio } from "@shared/audio.js";
import { GETREADY_MS, LATE_CUE_MS, advanceMeditation, isHalted, phaseElapsed, stateKey } from "./engine.js";
import { clearMeditationNotifications, scheduleMeditationNotifications, sittingStart } from "./notifications.js";
import { useSessionClock } from "./BreathingSession.jsx";
import { cue } from "./cues.js";
import { formatCountdown } from "./format.js";

export default function MeditationSession({ active, entry, settings, actions }) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const now = useSessionClock(active, (at) => actionsRef.current.hidden(at));
  const [endOpen, setEndOpen] = useState(false);
  const handledRef = useRef(null);
  const tickRef = useRef(null);
  const paused = isHalted(active);
  const start = sittingStart(active);

  useWakeLock(!paused);
  useBackGuard(true, () => setEndOpen(true));

  const entryRef = useRef(entry);
  entryRef.current = entry;
  const activeRef = useRef(active);
  activeRef.current = active;
  useEffect(() => {
    if (paused) {
      clearMeditationNotifications();
      return undefined;
    }
    scheduleMeditationNotifications(activeRef.current, entryRef.current);
    return () => clearMeditationNotifications();
  }, [paused, start]);

  useEffect(() => {
    const r = advanceMeditation(active, entry, now);
    if (!r) return;
    const key = stateKey(active);
    if (handledRef.current === key) return;
    handledRef.current = key;
    for (const ev of r.events) {
      if (now - ev.at > LATE_CUE_MS) continue;
      if (ev.type === "sitting") cue(settings, "bell", "phase");
      else if (ev.type === "bell") cue(settings, "bell", "bell");
      else if (ev.type === "finish") cue(settings, "gong", "gong");
    }
    if (r.finished) actionsRef.current.finish(r.activeMs, r.active.bellsRung);
    else actionsRef.current.advance(now);
  }, [now, active, entry, settings]);

  const el = phaseElapsed(active, now);

  useEffect(() => {
    if (paused || active.phase !== "getready") return;
    const n = Math.ceil((GETREADY_MS - el) / 1000);
    if (n < 1 || n > 3 || tickRef.current === n) return;
    tickRef.current = n;
    cue(settings, "tick", "tap");
  }, [el, paused, active.phase, settings]);

  const getready = active.phase === "getready";
  const remaining = getready ? entry.targetSeconds : entry.targetSeconds - el / 1000;

  return (
    <div className="session-page">
      <div className="phase-label" aria-live="polite">
        {paused ? "Paused" : getready ? "Get ready" : "Meditating"}
      </div>

      <div className="med-bg">
        <div className={"med-pulse" + (paused || getready ? " paused" : "")} />
        <div className="med-timer" role="timer">
          {getready && !paused ? Math.max(1, Math.ceil((GETREADY_MS - el) / 1000)) : formatCountdown(remaining)}
        </div>
      </div>
      {entry.bellIntervalMinutes > 0 && <div className="med-sub">Bell every {entry.bellIntervalMinutes} min</div>}
      {active.pausedAt != null && (
        <p className="hint center">Paused. Your time so far is kept.</p>
      )}

      <div className="session-actions">
        <button
          type="button"
          className="bigbtn"
          onClick={() => {
            audio.ensure();
            if (paused) actions.resume();
            else actions.pause();
          }}
        >
          {paused ? "Resume" : "Pause"}
        </button>
        <button type="button" className="bigbtn ghost" onClick={() => setEndOpen(true)}>
          End session
        </button>
      </div>

      <ConfirmSheet
        open={endOpen}
        title="End this meditation?"
        message="Your time so far will be saved to history."
        confirmLabel="End session"
        cancelLabel="Keep going"
        danger
        onCancel={() => setEndOpen(false)}
        onConfirm={() => {
          setEndOpen(false);
          actions.abort();
        }}
      />
    </div>
  );
}
