import { IconButton, SettingRow, Stepper, Toggle } from "@shared/ui.jsx";
import { TestSoundsButton, VoiceRow, VolumeRow } from "./SoundControls.jsx";

export default function Settings({ settings, onChange, onBack, onGoalChange }) {
  const set = (key) => (v) => onChange((s) => ({ ...s, [key]: v }));

  return (
    <div className="page">
      <div className="topbar">
        <IconButton label="Back" onClick={onBack}>
          ←
        </IconButton>
        <div>
          <div className="tb-title">Settings</div>
          <div className="tb-sub">Cues and goals</div>
        </div>
      </div>

      <h2>Cues</h2>
      <div className="card">
        <SettingRow label="Sound cues">
          <Toggle checked={settings.soundOn} onChange={set("soundOn")} label="Sound cues" />
        </SettingRow>
        <VolumeRow value={settings.volume} onChange={set("volume")} />
        <SettingRow label="Vibration">
          <Toggle checked={settings.vibrateOn} onChange={set("vibrateOn")} label="Vibration" />
        </SettingRow>
        <VoiceRow settings={settings} onChange={set("voiceOn")} />
        <TestSoundsButton volume={settings.volume} />
      </div>

      <h2>Weekly goal</h2>
      <div className="card">
        <SettingRow label="Sessions per week" hint="A Sunday reminder if you are behind. 0 turns it off.">
          <Stepper
            value={settings.weeklyGoal}
            onChange={onGoalChange}
            min={0}
            max={14}
            step={1}
            format={(v) => (v === 0 ? "Off" : v)}
          />
        </SettingRow>
      </div>
    </div>
  );
}
