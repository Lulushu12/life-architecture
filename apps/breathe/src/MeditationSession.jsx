import { useEffect, useRef, useState } from "react";
import { playBell, playGong } from "./audio.js";
import { useWakeLock } from "./useWakeLock.js";
import { formatMMSS } from "./ui.jsx";

export default function MeditationSession({ entry, soundOn, getAudioCtx, onFinish }) {
  const { targetSeconds, bellIntervalMinutes } = entry;
  const targetMs = targetSeconds * 1000;

  const startedAtRef = useRef(Date.now());
  const totalPausedMsRef = useRef(0);
  const pausedAtRef = useRef(null);
  const lastBellCountRef = useRef(0);
  const finishedRef = useRef(false);

  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [confirmEnd, setConfirmEnd] = useState(false);

  useWakeLock(!paused);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const activeMs = (paused ? pausedAtRef.current : now) - startedAtRef.current - totalPausedMsRef.current;
  const remainingMs = Math.max(0, targetMs - activeMs);

  useEffect(() => {
    if (finishedRef.current) return;

    if (bellIntervalMinutes > 0) {
      const bellMs = bellIntervalMinutes * 60000;
      const count = Math.floor(activeMs / bellMs);
      if (count > lastBellCountRef.current && remainingMs > 0) {
        lastBellCountRef.current = count;
        if (soundOn) playBell(getAudioCtx());
      }
    }

    if (remainingMs <= 0) {
      finishedRef.current = true;
      if (soundOn) playGong(getAudioCtx());
      onFinish(Math.round(activeMs / 1000));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, paused]);

  function togglePause() {
    if (paused) {
      totalPausedMsRef.current += Date.now() - pausedAtRef.current;
      setPaused(false);
    } else {
      pausedAtRef.current = Date.now();
      setPaused(true);
    }
  }

  function endEarly() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const finalActiveMs = paused ? pausedAtRef.current - startedAtRef.current - totalPausedMsRef.current : activeMs;
    if (soundOn) playGong(getAudioCtx());
    onFinish(Math.round(finalActiveMs / 1000));
  }

  return (
    <div className="session-page">
      <div className="phase-label">{paused ? "Paused" : "Meditating"}</div>

      <div className="med-bg">
        <div className={"med-pulse" + (paused ? " paused" : "")} />
        <div className="med-timer">{formatMMSS(remainingMs / 1000)}</div>
      </div>
      {bellIntervalMinutes > 0 && <div className="med-sub">Bell every {bellIntervalMinutes} min</div>}

      <div className="session-actions">
        <button className="bigbtn" onClick={togglePause}>
          {paused ? "Resume" : "Pause"}
        </button>
        <button className="bigbtn ghost" onClick={() => setConfirmEnd(true)}>
          End session
        </button>
      </div>

      {confirmEnd && (
        <div className="overlay">
          <div className="card modal">
            <h3>End this meditation?</h3>
            <p className="hint" style={{ margin: "0 0 4px" }}>
              Your time so far will be saved to history.
            </p>
            <div className="btnrow">
              <button className="linkbtn" onClick={() => setConfirmEnd(false)}>
                Keep going
              </button>
              <button className="bigbtn danger" onClick={endEarly}>
                End session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
