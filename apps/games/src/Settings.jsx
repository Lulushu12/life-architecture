import { useMemo } from "react";
import { IconButton, SettingRow, Toggle } from "@shared/ui.jsx";
import { BackupPanel } from "@shared/BackupPanel.jsx";
import { STORE_KEY, SUDOKU_CHECKS, TENTHS_OPTIONS, validateBackup } from "./storage.js";

const CHECK_LABELS = { conflicts: "Conflicts", mistakes: "Mistakes", both: "Both", off: "Off" };
const CHECK_HINTS = {
  conflicts: "Digits that clash with their row, column or box turn red.",
  mistakes: "Digits that differ from the solution are marked as you place them.",
  both: "Conflicts and mistakes are both marked.",
  off: "Nothing is marked; turn Conflicts or Mistakes on in the game when you want them.",
};
const QUOTA = 5 * 1024 * 1024;

function measure() {
  let games = 0;
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const n = (k.length + (localStorage.getItem(k) || "").length) * 2;
      total += n;
      if (k === STORE_KEY || k.startsWith(`${STORE_KEY}.`) || k.startsWith("games:")) games += n;
    }
  } catch {
    return null;
  }
  return { games, total };
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function Chips({ options, value, onChange, label }) {
  return (
    <div className="chips" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={value === v}
          className={`chip${value === v ? " sel" : ""}`}
          onClick={() => onChange(v)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export default function Settings({ store, settings, onSettings, onRestore, onHome }) {
  const set = (key) => (v) => onSettings((s) => ({ ...s, [key]: v }));
  const usage = useMemo(() => measure(), [store]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page settings-page">
      <div className="topbar">
        <IconButton label="Back" onClick={onHome}>
          ←
        </IconButton>
        <div>
          <div className="tb-title">Settings</div>
          <div className="tb-sub">Applies to every game on this device</div>
        </div>
      </div>

      <h2>Feedback</h2>
      <div className="card">
        <SettingRow label="Sound" hint="Clock clicks, low-time beeps and puzzle results">
          <Toggle label="Sound" checked={settings.sound} onChange={set("sound")} />
        </SettingRow>
        <SettingRow label="Haptics" hint="Vibration on taps, mistakes and flags">
          <Toggle label="Haptics" checked={settings.haptics} onChange={set("haptics")} />
        </SettingRow>
        <SettingRow label="Keep screen on" hint="While a clock runs or a puzzle is open">
          <Toggle label="Keep screen on" checked={settings.keepAwake} onChange={set("keepAwake")} />
        </SettingRow>
      </div>

      <h2>Chess clock</h2>
      <div className="card">
        <div className="field">
          <span className="flabel">Show tenths of a second below</span>
          <Chips
            label="Tenths threshold"
            value={settings.tenthsSec}
            onChange={set("tenthsSec")}
            options={TENTHS_OPTIONS.map((n) => [n, n === 0 ? "Never" : `${n}s`])}
          />
        </div>
      </div>

      <h2>Sudoku</h2>
      <div className="card">
        <SettingRow label="Highlight row, column and box" hint="Shade the peers of the selected cell">
          <Toggle label="Peer highlight" checked={settings.peerHighlight} onChange={set("peerHighlight")} />
        </SettingRow>
        <SettingRow label="Highlight matching digits" hint="Cells and notes with the selected digit">
          <Toggle label="Matching digits" checked={settings.sameDigit} onChange={set("sameDigit")} />
        </SettingRow>
        <SettingRow label="Auto notes in new games" hint="Candidates are filled in for you">
          <Toggle label="Auto notes" checked={settings.autoCandidates} onChange={set("autoCandidates")} />
        </SettingRow>
        <div className="field">
          <span className="flabel">Checking in new games</span>
          <Chips
            label="Checking"
            value={settings.sudokuCheck}
            onChange={set("sudokuCheck")}
            options={SUDOKU_CHECKS.map((k) => [k, CHECK_LABELS[k]])}
          />
          <p className="hint small">{CHECK_HINTS[settings.sudokuCheck]}</p>
        </div>
      </div>

      <h2>Word</h2>
      <div className="card">
        <SettingRow label="Hard mode by default" hint="Revealed hints must be used in later guesses">
          <Toggle label="Hard mode" checked={settings.wordHard} onChange={set("wordHard")} />
        </SettingRow>
      </div>

      <h2>Appearance</h2>
      <div className="card">
        <SettingRow label="Theme" hint="Only the dark theme is available for now">
          <div className="chips" aria-disabled="true">
            <span className="chip sel">Dark</span>
            <span className="chip disabled">Light</span>
          </div>
        </SettingRow>
      </div>

      <h2>Storage</h2>
      <div className="card">
        {usage ? (
          <>
            <div className="storage-bar" aria-hidden="true">
              <span className="storage-games" style={{ width: `${Math.min(100, (usage.games / QUOTA) * 100)}%` }} />
              <span
                className="storage-other"
                style={{ width: `${Math.min(100, ((usage.total - usage.games) / QUOTA) * 100)}%` }}
              />
            </div>
            <p className="hint small">
              Games uses {fmtBytes(usage.games)}. All apps on this device use {fmtBytes(usage.total)} of about{" "}
              {fmtBytes(QUOTA)}.
            </p>
          </>
        ) : (
          <p className="hint small">Storage size is not available here.</p>
        )}
      </div>

      <h2>Backup</h2>
      <div className="card">
        <BackupPanel
          prefix="games"
          storageKey={STORE_KEY}
          data={store}
          validate={validateBackup}
          strip={["sudokuNext", "_recovered"]}
          onRestore={onRestore}
        />
      </div>
    </div>
  );
}
