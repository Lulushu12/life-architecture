import { Stepper, Toggle, SettingRow } from "./ui.jsx";

const PRESETS = [5, 10, 15, 20];

export default function MeditationSetup({ settings, soundOn, onSoundChange, onChange, onCancel, onStart }) {
  const setDuration = (v) => onChange((s) => ({ ...s, durationMinutes: v }));
  const setBell = (v) => onChange((s) => ({ ...s, bellIntervalMinutes: v }));

  return (
    <div className="page">
      <div className="topbar">
        <button className="iconbtn" onClick={onCancel}>
          ←
        </button>
        <div>
          <div className="tb-title">Meditation</div>
          <div className="tb-sub">Timed sit</div>
        </div>
      </div>

      <div className="card">
        <h3>Duration</h3>
        <div className="chips">
          {PRESETS.map((m) => (
            <button
              key={m}
              className={"chip" + (settings.durationMinutes === m ? " sel" : "")}
              onClick={() => setDuration(m)}
            >
              {m} min
            </button>
          ))}
        </div>
        <SettingRow label="Custom (minutes)">
          <Stepper value={settings.durationMinutes} onChange={setDuration} min={1} max={120} step={1} />
        </SettingRow>
      </div>

      <div className="card">
        <SettingRow label="Interval bell (min, 0 = off)">
          <Stepper value={settings.bellIntervalMinutes} onChange={setBell} min={0} max={30} step={1} />
        </SettingRow>
        <SettingRow label="Sound cues">
          <Toggle checked={soundOn} onChange={onSoundChange} />
        </SettingRow>
      </div>

      <button className="bigbtn start" onClick={() => onStart(settings)}>
        Start meditation
      </button>
    </div>
  );
}
