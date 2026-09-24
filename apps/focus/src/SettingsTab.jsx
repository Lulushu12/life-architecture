import { NumInput, SettingRow, Toggle, useToast } from "@shared/ui.jsx";
import { BackupPanel } from "@shared/BackupPanel.jsx";
import { canDownload, copyToClipboard, downloadJson } from "@shared/backup.js";
import { isNativeNotify } from "@shared/notify.js";
import { audio } from "@shared/audio.js";
import { applyConfig, sessionsCsv, setAmbience } from "./logic.js";
import { AMBIENCE_KINDS } from "./ambience.js";
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

function csvFilename() {
  return `focus-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
}

function CsvExport({ store }) {
  const toast = useToast();
  const count = store.logs.sessions.length;
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const onDownload = () => {
    downloadJson(sessionsCsv(store), csvFilename());
    toast("Sessions CSV downloaded");
  };
  const onCopy = async () => {
    const ok = await copyToClipboard(sessionsCsv(store));
    toast(ok ? "Sessions CSV copied" : "Copy failed");
  };
  const onShare = async () => {
    const text = sessionsCsv(store);
    const filename = csvFilename();
    try {
      let file = null;
      try {
        file = new File([text], filename, { type: "text/csv" });
        if (!navigator.canShare?.({ files: [file] })) file = null;
      } catch {
        file = null;
      }
      if (file) await navigator.share({ files: [file], title: filename });
      else await navigator.share({ title: filename, text });
    } catch (e) {
      if (e?.name !== "AbortError") toast("Sharing failed. Copy the CSV instead.");
    }
  };

  return (
    <div className="csvexport">
      <div className="flabel">Sessions as CSV</div>
      <p className="hint small">
        {count} {count === 1 ? "session" : "sessions"}: date, start, end, kind, task, minutes, completed, interruptions.
      </p>
      <div className="backuprow">
        {canDownload() ? (
          <button type="button" className="linkbtn" onClick={onDownload} disabled={!count}>
            Download CSV
          </button>
        ) : (
          <>
            <button type="button" className="linkbtn" onClick={onCopy} disabled={!count}>
              Copy CSV
            </button>
            {canShare && (
              <button type="button" className="linkbtn" onClick={onShare} disabled={!count}>
                Share CSV
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SettingsTab({ store, setStore, permission, onRequestPermission, onRestore }) {
  const c = store.pomodoro.config;
  const st = store.settings;
  const unitLabel = c.unit === "sec" ? "sec" : "min";
  const setConfig = (patch) => setStore((s) => applyConfig(s, patch));
  const setSettings = (patch) => setStore((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const amb = st.ambience;
  const setAmb = (patch) => {
    audio.ensure();
    setStore((s) => setAmbience(s, patch));
  };

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

      <h2>Ambience</h2>
      <div className="card">
        <div className="chips ambchips" role="group" aria-label="Ambient sound">
          {AMBIENCE_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              className={"chip" + (amb.kind === k.id ? " sel" : "")}
              aria-pressed={amb.kind === k.id}
              onClick={() => setAmb({ kind: k.id, muted: false })}
            >
              {k.label}
            </button>
          ))}
        </div>
        <SettingRow label="Volume">
          <input
            type="range"
            className="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(amb.volume * 100)}
            disabled={amb.kind === "off"}
            aria-label="Ambience volume"
            onChange={(e) => setAmb({ volume: Number(e.target.value) / 100 })}
          />
        </SettingRow>
        <p className="hint small">
          Generated on the device, no downloads. Plays during focus phases and stops on breaks and pauses. Mute it any time from the Pomodoro tab.
        </p>
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
        <CsvExport store={store} />
      </div>
    </div>
  );
}
