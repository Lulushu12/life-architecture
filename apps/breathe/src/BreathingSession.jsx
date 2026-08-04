import { useEffect, useRef, useState } from "react";
import { playTick, playPhaseChime } from "./audio.js";
import { useWakeLock } from "./useWakeLock.js";
import { formatMMSS } from "./ui.jsx";

export default function BreathingSession({ entry, soundOn, getAudioCtx, onRoundComplete, onFinish, onAbort }) {
  const { plannedRounds, breathsPerRound, secondsPerBreath, recoverySeconds } = entry;
  const cycleMs = secondsPerBreath * 1000;

  const [round, setRound] = useState(0); // 0-indexed
  const [phase, setPhase] = useState("breathing"); // breathing | retention | recovery
  const [now, setNow] = useState(Date.now());
  const [confirmAbort, setConfirmAbort] = useState(false);

  const breathingStartedAtRef = useRef(Date.now());
  const lastBreathIdxRef = useRef(-1);
  const retentionStartedAtRef = useRef(null);
  const recoveryEndsAtRef = useRef(null);

  useWakeLock(true);

  // Drive the display + phase transitions from a 100ms poll against absolute
  // timestamps, so background-tab throttling never desyncs the session.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (phase === "breathing") {
      const elapsed = now - breathingStartedAtRef.current;
      const idx = Math.floor(elapsed / cycleMs);
      if (idx !== lastBreathIdxRef.current && idx < breathsPerRound) {
        lastBreathIdxRef.current = idx;
        if (soundOn) playTick(getAudioCtx());
      }
      if (elapsed >= breathsPerRound * cycleMs) {
        retentionStartedAtRef.current = Date.now();
        if (soundOn) playPhaseChime(getAudioCtx());
        setPhase("retention");
      }
    } else if (phase === "recovery") {
      if (now >= recoveryEndsAtRef.current) {
        if (round + 1 >= plannedRounds) {
          onFinish();
        } else {
          breathingStartedAtRef.current = Date.now();
          lastBreathIdxRef.current = -1;
          setRound((r) => r + 1);
          if (soundOn) playPhaseChime(getAudioCtx());
          setPhase("breathing");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, phase]);

  function skipBreathing() {
    retentionStartedAtRef.current = Date.now();
    if (soundOn) playPhaseChime(getAudioCtx());
    setPhase("retention");
  }

  function endRetention() {
    const secs = (Date.now() - retentionStartedAtRef.current) / 1000;
    onRoundComplete(secs);
    recoveryEndsAtRef.current = Date.now() + recoverySeconds * 1000;
    if (soundOn) playPhaseChime(getAudioCtx());
    setPhase("recovery");
  }

  const roundLabel = `Round ${round + 1} of ${plannedRounds}`;

  return (
    <div className="session-page">
      <div className="session-top">
        <span />
        <span />
      </div>

      {phase === "breathing" && (
        <>
          <div className="phase-label">Guided breathing</div>
          <div className="round-label">{roundLabel}</div>
          <BreathingCircle now={now} breathingStartedAt={breathingStartedAtRef.current} cycleMs={cycleMs} breathsPerRound={breathsPerRound} />
          <div className="breath-sub">Deep breath in, let it go — no force on the exhale</div>
          <div className="session-actions">
            <button className="bigbtn secondary" onClick={skipBreathing}>
              Skip to hold
            </button>
            <button className="bigbtn ghost" onClick={() => setConfirmAbort(true)}>
              End session
            </button>
          </div>
        </>
      )}

      {phase === "retention" && (
        <>
          <div className="phase-label">Retention</div>
          <div className="round-label">{roundLabel}</div>
          <div className="instruction">Exhale and hold</div>
          <div className="timer-big">
            {formatMMSS((now - retentionStartedAtRef.current) / 1000)}
          </div>
          <div className="session-actions">
            <button className="bigbtn" onClick={endRetention}>
              I need to breathe
            </button>
            <button className="bigbtn ghost" onClick={() => setConfirmAbort(true)}>
              End session
            </button>
          </div>
        </>
      )}

      {phase === "recovery" && (
        <>
          <div className="phase-label">Recovery</div>
          <div className="round-label">{roundLabel}</div>
          <div className="instruction">Inhale deeply and hold</div>
          <div className="timer-big recovery">
            {formatMMSS(Math.max(0, recoveryEndsAtRef.current - now) / 1000)}
          </div>
          <div className="session-actions">
            <button className="bigbtn ghost" onClick={() => setConfirmAbort(true)}>
              End session
            </button>
          </div>
        </>
      )}

      {confirmAbort && (
        <div className="overlay">
          <div className="card modal">
            <h3>End this session?</h3>
            <p className="hint" style={{ margin: "0 0 4px" }}>
              Rounds you've already completed stay saved to your history.
            </p>
            <div className="btnrow">
              <button className="linkbtn" onClick={() => setConfirmAbort(false)}>
                Keep going
              </button>
              <button className="bigbtn danger" onClick={onAbort}>
                End session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BreathingCircle({ now, breathingStartedAt, cycleMs, breathsPerRound }) {
  const elapsed = now - breathingStartedAt;
  const breathNumber = Math.min(breathsPerRound, Math.floor(elapsed / cycleMs) + 1);
  const cycleFrac = (elapsed % cycleMs) / cycleMs;
  const scale = (1 - Math.cos(cycleFrac * 2 * Math.PI)) / 2; // 0..1 smooth breathing wave
  const size = 0.62 + scale * 0.48;

  return (
    <div className="breath-circle-wrap">
      <div className="breath-circle" style={{ transform: `scale(${size.toFixed(3)})` }}>
        <span className="count">
          {breathNumber}
          <small>/{breathsPerRound}</small>
        </span>
      </div>
    </div>
  );
}
