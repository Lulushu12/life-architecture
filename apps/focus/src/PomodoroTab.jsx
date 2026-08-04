import { useState } from "react";
import {
  startPomodoro,
  pausePomodoro,
  resetPomodoro,
  skipPomodoro,
  phaseDurationMs,
  pomodoroRemainingMs,
} from "./logic.js";
import { dayKey } from "./storage.js";
import { ensureAudioContext } from "./audio.js";
import { notifySupported, notifyPermission, requestNotifyPermission } from "./notify.js";
import { NumInput, Toggle, SettingRow, ProgressRing } from "./ui.jsx";

function fmt(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PomodoroTab({ store, setStore, now, phaseLabel }) {
  const p = store.pomodoro;
  const phase = p.run?.phase || "work";
  const running = !!(p.run && p.run.pausedRemainingMs == null);
  const remainingMs = pomodoroRemainingMs(store, now);
  const totalMs = phaseDurationMs(p.config, phase);
  const pct = totalMs > 0 ? 1 - remainingMs / totalMs : 0;
  const todayCount = store.logs.days[dayKey(now)]?.pomodoroCount || 0;
  const [permission, setPermission] = useState(notifyPermission());

  const setConfig = (patch) =>
    setStore((s) => ({ ...s, pomodoro: { ...s.pomodoro, config: { ...s.pomodoro.config, ...patch } } }));

  const handleStart = () => {
    ensureAudioContext();
    setStore((s) => startPomodoro(s, Date.now()));
  };
  const handlePause = () => setStore((s) => pausePomodoro(s, Date.now()));
  const handleSkip = () => setStore((s) => skipPomodoro(s, Date.now()));
  const handleReset = () => setStore((s) => resetPomodoro(s));

  const unit = p.config.unit;
  const unitLabel = unit === "sec" ? "sec" : "min";

  return (
    <div>
      <div className="card pomo-card">
        <div className="pomo-phase">{phaseLabel(phase)}</div>
        <ProgressRing pct={pct}>
          <div className="pomo-time">{fmt(remainingMs)}</div>
        </ProgressRing>
        <div className="pomo-count">🍅 {todayCount} today</div>
        <div className="pomo-controls">
          {running ? (
            <button className="bigbtn" onClick={handlePause}>
              Pause
            </button>
          ) : (
            <button className="bigbtn" onClick={handleStart}>
              {p.run ? "Resume" : "Start"}
            </button>
          )}
          <div className="pomo-subbtns">
            <button className="linkbtn" onClick={handleSkip}>
              Skip
            </button>
            <button className="linkbtn" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </div>

      <h2>Settings</h2>
      <div className="card">
        <div className="unitrow">
          <span className="setlabel">Debug unit</span>
          <div className="chips">
            {["min", "sec"].map((u) => (
              <button
                key={u}
                className={"chip" + (unit === u ? " sel" : "")}
                onClick={() => setConfig({ unit: u })}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <SettingRow label={`Work (${unitLabel})`}>
          <NumInput
            value={p.config.workMin}
            min={unit === "sec" ? 1 : 1}
            max={unit === "sec" ? 600 : 180}
            onChange={(v) => setConfig({ workMin: v })}
          />
        </SettingRow>
        <SettingRow label={`Short break (${unitLabel})`}>
          <NumInput
            value={p.config.shortBreakMin}
            min={1}
            max={unit === "sec" ? 600 : 60}
            onChange={(v) => setConfig({ shortBreakMin: v })}
          />
        </SettingRow>
        <SettingRow label={`Long break (${unitLabel})`}>
          <NumInput
            value={p.config.longBreakMin}
            min={1}
            max={unit === "sec" ? 600 : 90}
            onChange={(v) => setConfig({ longBreakMin: v })}
          />
        </SettingRow>
        <SettingRow label="Long break every">
          <NumInput
            value={p.config.longBreakEvery}
            min={2}
            max={12}
            onChange={(v) => setConfig({ longBreakEvery: Math.round(v) })}
          />
        </SettingRow>
        <SettingRow label="Auto-start next phase">
          <Toggle checked={p.config.autoStart} onChange={(v) => setConfig({ autoStart: v })} />
        </SettingRow>
        <SettingRow label="Sound">
          <Toggle checked={p.config.sound} onChange={(v) => setConfig({ sound: v })} />
        </SettingRow>
      </div>

      <h2>Notifications</h2>
      <div className="card">
        {!notifySupported() ? (
          <div className="hint small">Notifications aren't supported in this browser.</div>
        ) : permission === "granted" ? (
          <div className="hint small">Notifications enabled.</div>
        ) : permission === "denied" ? (
          <div className="hint small">Notifications blocked — enable them in your browser settings.</div>
        ) : (
          <button
            className="bigbtn"
            onClick={async () => {
              const res = await requestNotifyPermission();
              setPermission(res);
            }}
          >
            Enable notifications
          </button>
        )}
      </div>
    </div>
  );
}
