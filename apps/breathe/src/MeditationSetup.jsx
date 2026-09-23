import { IconButton, SettingRow, Stepper, Toggle } from "@shared/ui.jsx";

const PRESETS = [5, 10, 15, 20, 30];

export default function MeditationSetup({ settings, cueSettings, onCueChange, onChange, onBack, onStart }) {
  const set = (key) => (v) => onChange((s) => ({ ...s, [key]: v }));

  return (
    <div className="page">
      <div className="topbar">
        <IconButton label="Back" onClick={onBack}>
          ←
        </IconButton>
        <div>
          <div className="tb-title">Meditation</div>
          <div className="tb-sub">Timed sit</div>
        </div>
      </div>

      <div className="card">
        <h3>Duration</h3>
        <div className="chips" role="radiogroup" aria-label="Duration">
          {PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={settings.durationMinutes === m}
              className={"chip" + (settings.durationMinutes === m ? " sel" : "")}
              onClick={() => set("durationMinutes")(m)}
            >
              {m} min
            </button>
          ))}
        </div>
        <SettingRow label="Custom (minutes)">
          <Stepper value={settings.durationMinutes} onChange={set("durationMinutes")} min={1} max={120} step={1} />
        </SettingRow>
      </div>

      <div className="card">
        <SettingRow label="Interval bell (min)" hint="0 turns it off">
          <Stepper
            value={settings.bellIntervalMinutes}
            onChange={set("bellIntervalMinutes")}
            min={0}
            max={30}
            step={1}
            format={(v) => (v === 0 ? "Off" : v)}
          />
        </SettingRow>
        <SettingRow label="Sound cues">
          <Toggle checked={cueSettings.soundOn} onChange={(v) => onCueChange("soundOn", v)} label="Sound cues" />
        </SettingRow>
        <SettingRow label="Vibration">
          <Toggle checked={cueSettings.vibrateOn} onChange={(v) => onCueChange("vibrateOn", v)} label="Vibration" />
        </SettingRow>
        <SettingRow label="Auto-pause when screen is off" hint="Off keeps the timer running with the screen locked">
          <Toggle checked={settings.autoPause} onChange={set("autoPause")} label="Auto-pause when screen is off" />
        </SettingRow>
      </div>

      <button type="button" className="bigbtn start" onClick={onStart}>
        Start meditation
      </button>
    </div>
  );
}
