import { NumInput, SettingRow } from "@shared/ui.jsx";
import { BackupPanel } from "@shared/BackupPanel.jsx";
import { validateBackup, STORAGE_KEY } from "./storage.js";
import { COUNTRIES } from "./offc.js";

export default function SettingsView({ store, onRestore, setSettings }) {
  const { targets, country } = store.settings;
  const setTarget = (k, v) => setSettings({ targets: { ...targets, [k]: v } });
  const macroKcal = Math.round(targets.protein * 4 + targets.carbs * 4 + targets.fat * 9);

  return (
    <div className="page page-tabs">
      <h1 className="apptitle">
        Settings<span>.</span>
      </h1>

      <h2>Daily targets</h2>
      <p className="hint small">Set a target to 0 to hide its progress bar on Today.</p>
      <div className="card">
        <SettingRow label="Calories (kcal)">
          <NumInput value={targets.kcal} onChange={(v) => setTarget("kcal", v)} min={0} max={9000} step={50} label="Calorie target" />
        </SettingRow>
        <SettingRow label="Protein (g)">
          <NumInput value={targets.protein} onChange={(v) => setTarget("protein", v)} min={0} max={500} step={5} label="Protein target" />
        </SettingRow>
        <SettingRow label="Carbs (g)">
          <NumInput value={targets.carbs} onChange={(v) => setTarget("carbs", v)} min={0} max={900} step={5} label="Carbs target" />
        </SettingRow>
        <SettingRow label="Fat (g)">
          <NumInput value={targets.fat} onChange={(v) => setTarget("fat", v)} min={0} max={400} step={5} label="Fat target" />
        </SettingRow>
        {macroKcal > 0 && (
          <p className="hint small">
            Your macro targets add up to {macroKcal} kcal
            {targets.kcal > 0 && Math.abs(macroKcal - targets.kcal) > 50 ? `, ${macroKcal > targets.kcal ? "above" : "below"} the calorie target.` : "."}
          </p>
        )}
      </div>

      <h2>Food search</h2>
      <p className="hint small">Open Food Facts results favour products sold in this country.</p>
      <div className="chips">
        {COUNTRIES.map((c) => (
          <button
            type="button"
            key={c.id || "world"}
            className={"chip" + (country === c.id ? " sel" : "")}
            aria-pressed={country === c.id}
            onClick={() => setSettings({ country: c.id })}
          >
            {c.label}
          </button>
        ))}
      </div>

      <h2>Units</h2>
      <p className="hint small">Metric: grams for food, kilograms for weight.</p>

      <h2>Backup</h2>
      <BackupPanel
        data={store}
        onRestore={onRestore}
        validate={validateBackup}
        prefix="calories"
        storageKey={STORAGE_KEY}
      />
    </div>
  );
}
