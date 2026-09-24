import { useMemo } from "react";
import { Toggle, SettingRow, NumInput, useConfirm } from "@shared/ui.jsx";
import { BackupPanel } from "@shared/BackupPanel.jsx";
import { MACROS } from "../system/constants.js";
import { TARGET_FIELDS, cleanTargets } from "../system/targets.js";
import { buildSnapshot } from "../data/store.js";
import { isNative } from "../data/platform.js";

export default function Settings({ data, commit, targets, theme, setTheme, settings, onSettings, reminders, toggleReminders, sync, syncWhere, go, onRestore, onTargetsChanged }) {
  const [confirm, confirmEl] = useConfirm();
  const snapshot = useMemo(() => buildSnapshot(), []);
  const custom = cleanTargets(data.targets);
  const customized = Object.keys(custom).length > 0;

  const setTarget = (key, value) => {
    commit(d => {
      const next = { ...cleanTargets(d.targets), [key]: value };
      if (next[key] === MACROS[key]) delete next[key];
      return { ...d, targets: next };
    });
    onTargetsChanged();
  };

  const resetTargets = async () => {
    const ok = await confirm({ title: "Reset macro targets?", message: `Back to ${MACROS.kcal.toLocaleString()} kcal, ${MACROS.protein}P / ${MACROS.fat}F / ${MACROS.carbs}C.`, confirmLabel: "Reset" });
    if (!ok) return;
    commit(d => ({ ...d, targets: {} }));
    onTargetsChanged();
  };

  const windowOk = targets.kcalFloor <= targets.kcal && targets.kcal <= targets.kcalCeil;

  return (
    <>
      <div className="pg-title">Settings</div>
      <div className="pg-sub">Targets, appearance, reminders, sync and backups</div>

      <div className="card">
        <div className="card-t">Macro targets</div>
        <div className="qhint" style={{ marginTop: -6, marginBottom: 8 }}>Used by Today, Fuel, the auto quests, the weekly review and Stats. Synced with your data.</div>
        {TARGET_FIELDS.map(f => (
          <SettingRow key={f.key} label={f.label} hint={custom[f.key] != null ? `${f.unit}, default ${MACROS[f.key].toLocaleString()}` : f.unit}>
            <NumInput value={targets[f.key]} onChange={v => setTarget(f.key, v)} min={f.min} max={f.max} step={f.step} label={`${f.label} in ${f.unit}`} />
          </SettingRow>
        ))}
        {!windowOk && <div className="callout cg" style={{ marginTop: 10, marginBottom: 0 }}><div className="ct">The calorie target sits outside the budget window, so the budget quest can tick on a day that misses the target.</div></div>}
        {customized && <div className="btnrow" style={{ marginTop: 12 }}><button type="button" className="bs" onClick={resetTargets}>Reset to defaults</button></div>}
      </div>

      <div className="card">
        <div className="card-t">Device</div>
        <SettingRow label="Light theme"><Toggle checked={theme === "light"} onChange={on => setTheme(on ? "light" : "dark")} label="Light theme" /></SettingRow>
        <SettingRow label="Haptics" hint="Short vibration on completions and long-press"><Toggle checked={settings.haptics !== false} onChange={on => onSettings({ haptics: on })} label="Haptics" /></SettingRow>
        <SettingRow label="Evening reminders" hint={isNative() ? "21:00 phone dock and 21:45 mobility daily, Sunday 10:00 waist." : "Fires in the Android app only."}>
          <Toggle checked={reminders} onChange={toggleReminders} label="Evening reminders" />
        </SettingRow>
        <div className="qhint" style={{ marginTop: 8 }}>Daily quest XP: open a quest's ⋯ menu and choose Edit quest.</div>
      </div>

      <div className="card">
        <div className="card-t">Sync</div>
        <div style={{ fontSize: 13, color: "var(--mut)", marginBottom: 12 }}>
          <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: sync.dot, marginRight: 6 }} />
          {sync.text} · {syncWhere}
        </div>
        <div className="btnrow"><button type="button" className="bs" onClick={() => go("sync")}>Sync mode & coach</button></div>
      </div>

      <div className="card">
        <div className="card-t">Backup</div>
        <div style={{ fontSize: 12.5, color: "var(--mut)", lineHeight: 1.55, marginBottom: 8 }}>
          Everything lives on this device. Export a backup and import it on another device to move your data.
        </div>
        <BackupPanel
          data={snapshot}
          onRestore={onRestore}
          validate={(d) => Boolean(d && typeof d === "object" && (d.user || d.workoutLogs || d.mealLogs))}
          prefix="life-architecture"
          storageKey="la3_local_user"
        />
      </div>
      {confirmEl}
    </>
  );
}
