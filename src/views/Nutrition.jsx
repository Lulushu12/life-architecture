import { useState, useEffect, useCallback } from "react";
import { MACROS, todayKey } from "../system/constants.js";
import { SLOTS, OPTIONS, FAT_RULE, DINNER_NOTE } from "../system/meals.js";
import { saveMealLog, getMealLog, macroTotals, saveBodyMetric, recentBodyMetrics } from "../data/logs.js";
import { MacroBar } from "./shared.jsx";
import { uid } from "../system/constants.js";

export default function Nutrition({ user, onMacrosChanged }) {
  const today = todayKey();
  const [entries, setEntries] = useState([]);
  const [slot, setSlot] = useState("breakfast");
  const [custom, setCustom] = useState({ description: "", kcal: "", protein: "", fat: "", carbs: "" });
  const [metrics, setMetrics] = useState([]);
  const [waist, setWaist] = useState("");
  const [weight, setWeight] = useState("");

  useEffect(() => { getMealLog(user.uid, today).then(setEntries); }, [user.uid, today]);
  useEffect(() => { recentBodyMetrics(user.uid).then(setMetrics); }, [user.uid]);

  const totals = macroTotals(entries);

  const persist = useCallback(async (next) => {
    setEntries(next);
    await saveMealLog(user.uid, today, next);
    onMacrosChanged(macroTotals(next));
  }, [user.uid, today, onMacrosChanged]);

  const quickAdd = (opt) => persist([...entries, { id: uid(), slot, description: opt.label, kcal: opt.kcal, protein: opt.protein, fat: opt.fat, carbs: opt.carbs }]);
  const addCustom = () => {
    if (!custom.description.trim() || !custom.kcal) return;
    persist([...entries, { id: uid(), slot, description: custom.description.trim(), kcal: +custom.kcal || 0, protein: +custom.protein || 0, fat: +custom.fat || 0, carbs: +custom.carbs || 0 }]);
    setCustom({ description: "", kcal: "", protein: "", fat: "", carbs: "" });
  };
  const remove = (id) => persist(entries.filter(e => e.id !== id));

  const gap = {
    kcal: Math.max(0, MACROS.kcal - totals.kcal),
    protein: Math.max(0, MACROS.protein - totals.protein),
    fat: Math.max(0, MACROS.fat - totals.fat),
    carbs: Math.max(0, MACROS.carbs - totals.carbs),
  };

  const saveMetrics = async () => {
    if (!waist && !weight) return;
    const m = {};
    if (waist) m.waistCm = +waist;
    if (weight) m.weightKg = +weight;
    await saveBodyMetric(user.uid, today, m);
    setMetrics(await recentBodyMetrics(user.uid));
    setWaist(""); setWeight("");
  };

  // deterministic waist-review trigger (doc: flat across 2 consecutive measurements)
  const waists = metrics.filter(m => m.waistCm != null);
  const flat = waists.length >= 3 &&
    waists[waists.length - 1].waistCm >= waists[waists.length - 2].waistCm &&
    waists[waists.length - 2].waistCm >= waists[waists.length - 3].waistCm;

  return (
    <>
      <div className="pg-title">FUEL</div>
      <div className="pg-sub">2,100 kcal · 160P / 65F / 210C flat. Dinner is the adjustment valve — the gap below is the dinner target.</div>

      <div className="card">
        <div className="card-t">Today's running total</div>
        <div className="mac-row">
          <MacroBar label="KCAL" value={totals.kcal} target={MACROS.kcal} color="#3b82f6" unit="" />
          <MacroBar label="PROTEIN" value={totals.protein} target={MACROS.protein} color="#22c55e" />
        </div>
        <div className="mac-row">
          <MacroBar label="FAT" value={totals.fat} target={MACROS.fat} color="#f59e0b" />
          <MacroBar label="CARBS" value={totals.carbs} target={MACROS.carbs} color="#06b6d4" />
        </div>
        <div style={{ fontSize: 11, color: "#64748b", fontFamily: "JetBrains Mono", marginTop: 8 }}>
          Remaining gap: {Math.round(gap.kcal)} kcal · {Math.round(gap.protein)}P / {Math.round(gap.fat)}F / {Math.round(gap.carbs)}C
        </div>
      </div>

      <div className="frow">
        {SLOTS.map(s => <div key={s.id} className={"chip" + (slot === s.id ? " active" : "")} onClick={() => setSlot(s.id)} title={s.when}>{s.label}</div>)}
      </div>
      {slot === "preworkout" && <div className="callout cg"><div className="ct"><strong>FAT RULE — </strong>{FAT_RULE}</div></div>}
      {slot === "dinner" && <div className="callout cn"><div className="ct"><strong>Dinner — </strong>{DINNER_NOTE}</div></div>}
      {slot === "recovery" && <div className="callout cr"><div className="ct"><strong>Wednesday recovery bridge — non-optional.</strong> In the car or at Sun Plaza entrance. Covers the 6-hour gap before dinner.</div></div>}

      {(OPTIONS[slot] || []).length > 0 && (
        <div className="card">
          <div className="card-t">Quick add — choose one</div>
          {OPTIONS[slot].map(o => (
            <div key={o.id} className="dq" style={{ cursor: "pointer" }} onClick={() => quickAdd(o)}>
              <div className="di">
                <div className="dt">{o.label}</div>
                <div className="dm"><span className="qxp">{o.kcal} kcal · {o.protein}P / {o.fat}F / {o.carbs}C{o.fatNote ? ` · ${o.fatNote}` : ""}</span></div>
              </div>
              <button className="bi">+</button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-t">Custom entry ({slot})</div>
        <div className="fg"><input className="fi" placeholder="What did you eat?" value={custom.description} onChange={e => setCustom({ ...custom, description: e.target.value })} /></div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["kcal", "protein", "fat", "carbs"].map(f => (
            <input key={f} className="fi sm" style={{ width: 80 }} type="number" placeholder={f} value={custom[f]} onChange={e => setCustom({ ...custom, [f]: e.target.value })} />
          ))}
          <button className="bp" onClick={addCustom}>Add</button>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="card">
          <div className="card-t">Logged today</div>
          {entries.map(e => (
            <div key={e.id} className="dq">
              <div className="di">
                <div className="dt">{e.description}</div>
                <div className="dm"><span className="qxp">{e.slot} · {Math.round(e.kcal)} kcal · {Math.round(e.protein)}P / {Math.round(e.fat)}F / {Math.round(e.carbs)}C</span></div>
              </div>
              <button className="bi del" onClick={() => remove(e.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-t">Waist log — every 2nd Sunday, before eating, before drinking</div>
        {flat && <div className="callout cr"><div className="ct"><strong>Review trigger (waist_flat):</strong> no decrease across two consecutive measurements. Reduce carbs by 25–38g from the rice portion in Meal 3.</div></div>}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          <input className="fi sm" style={{ width: 100 }} type="number" step="0.1" placeholder="waist cm" value={waist} onChange={e => setWaist(e.target.value)} />
          <input className="fi sm" style={{ width: 100 }} type="number" step="0.1" placeholder="weight kg" value={weight} onChange={e => setWeight(e.target.value)} />
          <button className="bp" onClick={saveMetrics}>Log</button>
        </div>
        {waists.length > 0 && (
          <table className="tbl">
            <thead><tr><th>DATE</th><th>WAIST</th><th>Δ</th><th>WEIGHT</th></tr></thead>
            <tbody>
              {metrics.slice(-8).map((m, i, arr) => {
                const prev = arr.slice(0, i).reverse().find(x => x.waistCm != null);
                const d = m.waistCm != null && prev ? (m.waistCm - prev.waistCm).toFixed(1) : null;
                return (
                  <tr key={m.date}>
                    <td>{m.date}</td>
                    <td>{m.waistCm != null ? m.waistCm + " cm" : "—"}</td>
                    <td style={{ color: d == null ? "#475569" : +d < 0 ? "#4ade80" : +d > 0 ? "#f87171" : "#94a3b8" }}>{d == null ? "—" : (+d > 0 ? "+" : "") + d}</td>
                    <td>{m.weightKg != null ? m.weightKg + " kg" : <span style={{ color: "#475569" }}>directional noise only</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
