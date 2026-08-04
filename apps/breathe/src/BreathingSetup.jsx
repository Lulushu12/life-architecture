import { Stepper, Toggle, SettingRow } from "./ui.jsx";

export default function BreathingSetup({ settings, onChange, onCancel, onStart }) {
  const set = (key) => (v) => onChange((s) => ({ ...s, [key]: v }));

  return (
    <div className="page">
      <div className="topbar">
        <button className="iconbtn" onClick={onCancel}>
          ←
        </button>
        <div>
          <div className="tb-title">Breathing</div>
          <div className="tb-sub">Wim Hof style session</div>
        </div>
      </div>

      <div className="card">
        <h3>Session settings</h3>

        <SettingRow label="Rounds">
          <Stepper value={settings.rounds} onChange={set("rounds")} min={1} max={10} step={1} />
        </SettingRow>

        <SettingRow label="Breaths per round">
          <Stepper
            value={settings.breathsPerRound}
            onChange={set("breathsPerRound")}
            min={3}
            max={60}
            step={1}
          />
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

        <SettingRow label="Recovery hold (sec)">
          <Stepper
            value={settings.recoverySeconds}
            onChange={set("recoverySeconds")}
            min={5}
            max={60}
            step={5}
          />
        </SettingRow>

        <SettingRow label="Sound cues">
          <Toggle checked={settings.soundOn} onChange={set("soundOn")} />
        </SettingRow>
      </div>

      <p className="hint small">
        Each round: guided breathing, then exhale and hold as long as comfortable, then a recovery
        breath-hold before the next round.
      </p>

      <button className="bigbtn start" onClick={() => onStart(settings)}>
        Start session
      </button>
    </div>
  );
}
