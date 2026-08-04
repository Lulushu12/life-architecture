import { useState } from "react";

const PRESETS = [
  { label: "1+0", minutes: 1, inc: 0 },
  { label: "3+0", minutes: 3, inc: 0 },
  { label: "3+2", minutes: 3, inc: 2 },
  { label: "5+0", minutes: 5, inc: 0 },
  { label: "10+0", minutes: 10, inc: 0 },
  { label: "15+10", minutes: 15, inc: 10 },
];

export function freshClock(minutes, inc, label) {
  const ms = minutes * 60000;
  const now = Date.now();
  return {
    minutesPerSide: minutes,
    incrementSec: inc,
    presetLabel: label,
    timeLeft: [ms, ms],
    started: false,
    paused: false,
    activeSide: null,
    turnStartedAt: null,
    flagged: null,
    createdAt: now,
    updatedAt: now,
  };
}

export default function ChessSetup({ onStart, onCancel }) {
  const [preset, setPreset] = useState(PRESETS[3]);
  const [custom, setCustom] = useState(false);
  const [minutes, setMinutes] = useState(5);
  const [inc, setInc] = useState(0);

  const start = () => {
    if (custom) onStart(freshClock(Math.max(1, minutes), Math.max(0, inc), `${minutes}+${inc}`));
    else onStart(freshClock(preset.minutes, preset.inc, preset.label));
  };

  return (
    <div className="page">
      <div className="topbar">
        <button className="iconbtn" onClick={onCancel}>
          ←
        </button>
        <div>
          <div className="tb-title">Chess Clock</div>
          <div className="tb-sub">Choose a time control</div>
        </div>
      </div>

      <div className="field">
        <div className="flabel">Presets</div>
        <div className="chips">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              className={`chip ${!custom && preset.label === p.label ? "sel" : ""}`}
              onClick={() => {
                setCustom(false);
                setPreset(p);
              }}
            >
              {p.label}
            </button>
          ))}
          <button className={`chip ${custom ? "sel" : ""}`} onClick={() => setCustom(true)}>
            Custom
          </button>
        </div>
      </div>

      {custom && (
        <div className="card">
          <div className="setrow">
            <div className="setlabel">Minutes per side</div>
            <div className="stepper">
              <button onClick={() => setMinutes((m) => Math.max(1, m - 1))}>−</button>
              <input
                type="number"
                inputMode="numeric"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value) || 1)}
              />
              <button onClick={() => setMinutes((m) => m + 1)}>+</button>
            </div>
          </div>
          <div className="setrow">
            <div className="setlabel">Increment (seconds)</div>
            <div className="stepper">
              <button onClick={() => setInc((m) => Math.max(0, m - 1))}>−</button>
              <input
                type="number"
                inputMode="numeric"
                value={inc}
                onChange={(e) => setInc(Number(e.target.value) || 0)}
              />
              <button onClick={() => setInc((m) => m + 1)}>+</button>
            </div>
          </div>
        </div>
      )}

      <button className="bigbtn start" onClick={start}>
        Start clock
      </button>
    </div>
  );
}
