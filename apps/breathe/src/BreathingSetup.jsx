import { IconButton, SettingRow, Stepper, Toggle } from "@shared/ui.jsx";
import { PRESETS } from "./storage.js";
import { GETREADY_MS } from "./engine.js";
import { formatElapsed } from "./format.js";

export function estimateSeconds(s, hold) {
  const perRound = GETREADY_MS / 1000 + s.breathsPerRound * s.secondsPerBreath + hold + s.recoverySeconds;
  return s.rounds * perRound;
}

export default function BreathingSetup({ settings, onChange, onBack, onStart, onReadSafety, typicalHold }) {
  const set = (key) => (v) => onChange((s) => ({ ...s, [key]: v }));
  const custom = settings.preset === "custom";
  const pick = (p) =>
    onChange((s) =>
      p === "custom"
        ? { ...s, preset: "custom" }
        : { ...s, preset: p.id, rounds: p.rounds, breathsPerRound: p.breathsPerRound, secondsPerBreath: p.secondsPerBreath }
    );
  const estimate = Math.max(1, Math.round(estimateSeconds(settings, typicalHold) / 60));

  return (
    <div className="page">
      <div className="topbar">
        <IconButton label="Back" onClick={onBack}>
          ←
        </IconButton>
        <div>
          <div className="tb-title">Breathing</div>
          <div className="tb-sub">Wim Hof style session</div>
        </div>
      </div>

      <p className="safety-line">
        Sit or lie down. Never in water or while driving.{" "}
        <button type="button" className="linkbtn inline" onClick={onReadSafety}>
          Read again
        </button>
      </p>

      <div className="card">
        <h3>Level</h3>
        <div className="chips" role="radiogroup" aria-label="Level">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={settings.preset === p.id}
              className={"chip" + (settings.preset === p.id ? " sel" : "")}
              onClick={() => pick(p)}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            role="radio"
            aria-checked={custom}
            className={"chip" + (custom ? " sel" : "")}
            onClick={() => pick("custom")}
          >
            Custom
          </button>
        </div>
        {!custom && (
          <p className="hint small preset-desc">
            {settings.rounds} rounds × {settings.breathsPerRound} breaths × {settings.secondsPerBreath.toFixed(1)}s
          </p>
        )}

        {custom && (
          <>
            <SettingRow label="Rounds">
              <Stepper value={settings.rounds} onChange={set("rounds")} min={1} max={10} step={1} />
            </SettingRow>
            <SettingRow label="Breaths per round">
              <Stepper value={settings.breathsPerRound} onChange={set("breathsPerRound")} min={3} max={60} step={1} />
            </SettingRow>
            <SettingRow label="Seconds per breath">
              <Stepper
                value={settings.secondsPerBreath}
                onChange={set("secondsPerBreath")}
                min={2}
                max={6}
                step={0.5}
                format={(v) => v.toFixed(1)}
              />
            </SettingRow>
          </>
        )}

        <SettingRow label="Recovery hold (sec)">
          <Stepper value={settings.recoverySeconds} onChange={set("recoverySeconds")} min={5} max={60} step={5} />
        </SettingRow>
      </div>

      <div className="card">
        <SettingRow label="Sound cues">
          <Toggle checked={settings.soundOn} onChange={set("soundOn")} label="Sound cues" />
        </SettingRow>
        <SettingRow label="Vibration">
          <Toggle checked={settings.vibrateOn} onChange={set("vibrateOn")} label="Vibration" />
        </SettingRow>
      </div>

      <p className="estimate">
        About {estimate} min, assuming {formatElapsed(typicalHold)} holds
      </p>
      <p className="hint small">
        Each round: guided breathing, then exhale and hold as long as comfortable, then a recovery
        breath-hold before the next round.
      </p>

      <button type="button" className="bigbtn start" onClick={onStart}>
        Start session
      </button>
    </div>
  );
}
