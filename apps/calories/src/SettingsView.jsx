import { useRef } from "react";
import { exportStore, mergeImport } from "./storage.js";
import { NumInput } from "./ui.jsx";

export default function SettingsView({ store, setStore, targets, setTargets }) {
  const fileRef = useRef();

  const onImport = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((t) => {
      try {
        setStore((s) => mergeImport(s, JSON.parse(t)));
        alert("Import complete.");
      } catch {
        alert("Not a valid backup file.");
      }
    });
    e.target.value = "";
  };

  return (
    <div className="page">
      <h1 className="apptitle">
        Settings<span>.</span>
      </h1>

      <h2>Daily targets</h2>
      <p className="hint small">Set a target to 0 to hide its progress bar on Today.</p>
      <div className="card">
        <div className="setrow">
          <span className="setlabel">Calories (kcal)</span>
          <NumInput value={targets.kcal} onChange={(v) => setTargets({ ...targets, kcal: v })} min={0} max={9000} step={50} />
        </div>
        <div className="setrow">
          <span className="setlabel">Protein (g)</span>
          <NumInput value={targets.protein} onChange={(v) => setTargets({ ...targets, protein: v })} min={0} max={500} step={5} />
        </div>
        <div className="setrow">
          <span className="setlabel">Carbs (g)</span>
          <NumInput value={targets.carbs} onChange={(v) => setTargets({ ...targets, carbs: v })} min={0} max={900} step={5} />
        </div>
        <div className="setrow">
          <span className="setlabel">Fat (g)</span>
          <NumInput value={targets.fat} onChange={(v) => setTargets({ ...targets, fat: v })} min={0} max={400} step={5} />
        </div>
      </div>

      <h2>Units</h2>
      <p className="hint small">Fixed to metric — grams for food, kilograms for weight.</p>

      <h2>Backup</h2>
      <div className="backuprow">
        <button className="linkbtn" onClick={() => exportStore(store)}>
          Export backup
        </button>
        <button className="linkbtn" onClick={() => fileRef.current.click()}>
          Import backup
        </button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
      </div>
    </div>
  );
}
