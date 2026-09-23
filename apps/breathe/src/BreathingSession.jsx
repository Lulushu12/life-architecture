import { useEffect, useRef, useState } from "react";
import { useBackGuard } from "@shared/useHistoryNav.js";
import { useWakeLock } from "@shared/useWakeLock.js";
import { ConfirmSheet } from "@shared/ui.jsx";
import { audio } from "@shared/audio.js";
import {
  GETREADY_MS,
  LATE_CUE_MS,
  advanceBreathing,
  cycleMs,
  isHalted,
  phaseElapsed,
  stateKey,
  writeHeartbeat,
} from "./engine.js";
import { cue } from "./cues.js";
import { formatCountdown, formatElapsed } from "./format.js";

const PHASE_NAMES = {
  getready: "Get ready",
  breathing: "Guided breathing",
  retention: "Retention",
  recovery: "Recovery",
  held: "Paused",
};

export function useSessionClock(active, onHidden) {
  const [now, setNow] = useState(Date.now);
  const hiddenRef = useRef(onHidden);
  hiddenRef.current = onHidden;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    writeHeartbeat(active.id);
    const t = setInterval(() => writeHeartbeat(active.id), 5000);
    return () => clearInterval(t);
  }, [active.id]);

  useEffect(() => {
    const onVis = () => {
      const at = Date.now();
      if (document.visibilityState === "hidden") {
        writeHeartbeat(active.id, at);
        hiddenRef.current(at);
      } else {
        setNow(at);
      }
    };
    const onPointer = () => audio.ensure();
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [active.id]);

  return now;
}

export default function BreathingSession({ active, entry, settings, holds, actions }) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const now = useSessionClock(active, (at) => actionsRef.current.hidden(at));
  const [endOpen, setEndOpen] = useState(false);
  const handledRef = useRef(null);
  const tickRef = useRef(null);
  const halted = isHalted(active);

  useWakeLock(!halted);
  useBackGuard(true, () => setEndOpen(true));

  useEffect(() => {
    const r = advanceBreathing(active, entry, now);
    if (!r) return;
    const key = stateKey(active);
    if (handledRef.current === key) return;
    handledRef.current = key;
    for (const ev of r.events) {
      if (now - ev.at > LATE_CUE_MS) continue;
      if (ev.type === "breathing") cue(settings, null, "phase");
      else if (ev.type === "retention") cue(settings, "chime", "phase");
      else if (ev.type === "recoveryEnd") cue(settings, "chime", "phase");
      else if (ev.type === "finish") cue(settings, "success", "finish");
    }
    if (r.finished) actionsRef.current.finish(r.endAt);
    else actionsRef.current.advance(now);
  }, [now, active, entry, settings]);

  useEffect(() => {
    if (halted) return;
    const el = phaseElapsed(active, now);
    let key = null;
    let sound = "tick";
    let buzz = null;
    if (active.phase === "getready") {
      const n = Math.ceil((GETREADY_MS - el) / 1000);
      if (n >= 1 && n <= 3) key = `g|${active.round}|${n}`;
      buzz = "tap";
    } else if (active.phase === "breathing") {
      const idx = Math.floor(el / cycleMs(entry));
      if (idx < entry.breathsPerRound) {
        key = `b|${active.round}|${idx}`;
        if (idx >= entry.breathsPerRound - 3) {
          sound = "tickLast";
          buzz = "tap";
        }
      }
    }
    if (key && tickRef.current !== key) {
      tickRef.current = key;
      cue(settings, sound, buzz);
    }
  }, [now, active, entry, settings, halted]);

  const el = phaseElapsed(active, now);
  const roundLabel = `Round ${active.round + 1} of ${entry.plannedRounds}`;
  const endButton = (
    <button type="button" className="bigbtn ghost" onClick={() => setEndOpen(true)}>
      End session
    </button>
  );

  const resume = () => {
    audio.ensure();
    actions.resume();
  };

  let body;
  if (active.phase === "held") {
    body = (
      <>
        <div className="instruction">Resume when ready</div>
        <p className="hint center">
          {active.lastHold != null
            ? `The screen turned off, so your hold was stopped and recorded at ${formatElapsed(active.lastHold)}.`
            : "The app was closed during the hold, so that hold was not recorded."}{" "}
          Breathe normally. The next step is the recovery breath.
        </p>
        <div className="session-actions">
          <button
            type="button"
            className="bigbtn"
            onClick={() => {
              audio.ensure();
              actions.continueHeld();
            }}
          >
            Continue to recovery
          </button>
          {endButton}
        </div>
      </>
    );
  } else if (active.pausedAt != null) {
    body = (
      <>
        <div className="instruction">Paused</div>
        <p className="hint center">The session paused when the screen turned off. Breathe normally and resume when ready.</p>
        <div className="session-actions">
          <button type="button" className="bigbtn" onClick={resume}>
            Resume
          </button>
          {endButton}
        </div>
      </>
    );
  } else if (active.phase === "getready") {
    body = (
      <>
        <div className="breath-circle-wrap">
          <div className="breath-circle getready" aria-live="assertive">
            <span className="count">{Math.max(1, Math.ceil((GETREADY_MS - el) / 1000))}</span>
          </div>
        </div>
        <div className="breath-sub">Sit or lie down and relax your shoulders</div>
        <div className="session-actions">{endButton}</div>
      </>
    );
  } else if (active.phase === "breathing") {
    body = (
      <>
        <BreathingCircle elapsed={el} cycle={cycleMs(entry)} total={entry.breathsPerRound} />
        <div className="breath-sub">Deep breath in, let it go. No force on the exhale.</div>
        <div className="session-actions">
          <button type="button" className="bigbtn secondary" onClick={() => {
            cue(settings, "chime", "phase");
            actions.skipToHold();
          }}>
            Skip to hold
          </button>
          {endButton}
        </div>
      </>
    );
  } else if (active.phase === "retention") {
    body = (
      <>
        <div className="instruction">Exhale and hold</div>
        <div className="timer-big" role="timer">{formatElapsed(el / 1000)}</div>
        {holds && (
          <div className="hold-ref">
            Last {formatElapsed(holds.last)} · Best {formatElapsed(holds.best)}
          </div>
        )}
        <div className="session-actions">
          <button
            type="button"
            className="bigbtn"
            onClick={() => {
              cue(settings, "chime", "phase");
              actions.endRetention(Date.now());
            }}
          >
            I need to breathe
          </button>
          {endButton}
        </div>
      </>
    );
  } else {
    body = (
      <>
        <div className="instruction">Inhale deeply and hold</div>
        <div className="timer-big recovery" role="timer">
          {formatCountdown((entry.recoverySeconds * 1000 - el) / 1000)}
        </div>
        <div className="session-actions">{endButton}</div>
      </>
    );
  }

  return (
    <div className="session-page">
      <div className="phase-label" aria-live="polite">
        {active.pausedAt != null ? "Paused" : PHASE_NAMES[active.phase]}
      </div>
      <div className="round-label">{roundLabel}</div>
      {body}
      <ConfirmSheet
        open={endOpen}
        title="End this session?"
        message="Rounds you have already completed stay saved to your history."
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

function BreathingCircle({ elapsed, cycle, total }) {
  const breathNumber = Math.min(total, Math.floor(elapsed / cycle) + 1);
  const frac = (elapsed % cycle) / cycle;
  const scale = 0.62 + ((1 - Math.cos(frac * 2 * Math.PI)) / 2) * 0.48;
  const last = breathNumber > total - 3;
  return (
    <div className="breath-circle-wrap">
      <div className={"breath-circle" + (last ? " last" : "")} style={{ transform: `scale(${scale.toFixed(3)})` }}>
        <span className="count">
          {breathNumber}
          <small>/{total}</small>
        </span>
      </div>
    </div>
  );
}
