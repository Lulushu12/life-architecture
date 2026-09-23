import { NumInput, SettingRow, Toggle } from "@shared/ui.jsx";
import { BackupPanel } from "@shared/BackupPanel.jsx";
import { isNativeNotify } from "@shared/notify.js";
import { applyConfig } from "./logic.js";
import { STORAGE_KEY, validateBackup } from "./storage.js";

function PermissionRow({ permission, onRequest }) {
  const native = isNativeNotify();
  if (permission === "unsupported") {
    return <p className="hint small">This browser does not support notifications.</p>;
  }
  if (permission === "granted") {
    return (
      <p className="okmsg">
        {native
          ? "Notifications are on. Phase ends and reminders arrive even when the app is closed."
          : "Notifications are on while the app is open in a tab."}
      </p>
    );
  }
  if (permission === "denied") {
    return (
      <p className="warn">
        {native
          ? "Notifications are blocked. Turn them on in Android Settings, Apps, Focus, Notifications."
          : "Notifications are blocked. Allow them in your browser's site settings."}
      </p>
    );
  }
  return (
    <button type="button" className="bigbtn" onClick={onRequest}>
      Enable notifications
    </button>
  );
}

export default function SettingsTab({ store, setStore, permission, onRequestPermission, onRestore }) {
  const c = store.pomodoro.config;
  const st = store.settings;
  const unitLabel = c.unit === "sec" ? "sec" : "min";
  const setConfig = (patch) => setStore((s) => applyConfig(s, patch));
  const setSettings = (patch) => setStore((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  return (
    <div>
      <h2>Timer</h2>
      <div className="card">
        {import.meta.env.DEV && (
          <SettingRow label="Debug unit" hint="Development builds only">
            <div className="chips unitchips">
              {["min", "sec"].map((u) => (
                <button
                  key={u}
                  type="button"
                  className={"chip" + (c.unit === u ? " sel" : "")}
                  aria-pressed={c.unit === u}
                  onClick={() => setConfig({ unit: u })}
                >
                  {u}
                </button>
              ))}
            </div>
          </SettingRow>
        )}
        <SettingRow label={`Focus (${unitLabel})`}>
          <NumInput value={c.workMin} min={1} max={180} label="Focus length" onChange={(v) => setConfig({ workMin: Math.round(v) })} />
        </SettingRow>
        <SettingRow label={`Short break (${unitLabel})`}>
          <NumInput value={c.shortBreakMin} min={1} max={60} label="Short break length" onChange={(v) => setConfig({ shortBreakMin: Math.round(v) })} />
        </SettingRow>
        <SettingRow label={`Long break (${unitLabel})`}>
          <NumInput value={c.longBreakMin} min={1} max={90} label="Long break length" onChange={(v) => setConfig({ longBreakMin: Math.round(v) })} />
        </SettingRow>
        <SettingRow label="Long break every" hint="Focus sessions">
          <NumInput value={c.longBreakEvery} min={2} max={12} label="Long break every" onChange={(v) => setConfig({ longBreakEvery: Math.round(v) })} />
        </SettingRow>
        <SettingRow label="Auto-start next phase">
          <Toggle checked={c.autoStart} label="Auto-start next phase" onChange={(v) => setConfig({ autoStart: v })} />
        </SettingRow>
        <SettingRow label="Daily goal" hint="Pomodoros per day">
          <NumInput value={st.dailyGoal} min={1} max={30} label="Daily goal" onChange={(v) => setSettings({ dailyGoal: Math.round(v) })} />
        </SettingRow>
      </div>

      <h2>Feedback</h2>
      <div className="card">
        <SettingRow label="Sound">
          <Toggle checked={c.sound} label="Sound" onChange={(v) => setConfig({ sound: v })} />
        </SettingRow>
        <SettingRow label="Vibration">
          <Toggle checked={st.vibrate} label="Vibration" onChange={(v) => setSettings({ vibrate: v })} />
        </SettingRow>
        <SettingRow label="Keep screen on" hint="While a pomodoro or task timer runs">
          <Toggle checked={st.keepAwake} label="Keep screen on" onChange={(v) => setSettings({ keepAwake: v })} />
        </SettingRow>
      </div>

      <h2>Notifications</h2>
      <div className="card">
        <PermissionRow permission={permission} onRequest={onRequestPermission} />
      </div>

      <h2>Backup</h2>
      <div className="card">
        <BackupPanel
          data={store}
          onRestore={onRestore}
          validate={validateBackup}
          prefix="focus"
          storageKey={STORAGE_KEY}
        />
      </div>
    </div>
  );
}
