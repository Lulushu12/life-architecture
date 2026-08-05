import { useState, useEffect, useCallback } from "react";
import { MACROS, todayKey } from "../system/constants.js";
import { SLOTS, OPTIONS, FAT_RULE, DINNER_NOTE } from "../system/meals.js";
import { saveMealLog, getMealLog, macroTotals, saveBodyMetric, recentBodyMetrics } from "../data/logs.js";
import { Ring } from "./shared.jsx";
import { uid } from "../system/constants.js";

const SLOT_NOTES = {
  preworkout: { cls: "cg", body: <><strong>Fat rule — </strong>{FAT_RULE}</> },
  dinner:     { cls: "cn", body: <><strong>Dinner — </strong>{DINNER_NOTE}</> },
  recovery:   { cls: "cr", body: <><strong>Wednesday recovery bridge — non-optional.</strong> In the car or at Sun Plaza entrance. Covers the 6-hour gap before dinner.</> },
};

const MACRO_RINGS = [
  { key: "protein", label: "Protein", color: "#22c55e" },
  { key: "carbs",   label: "Carbs",   color: "#06b6d4" },
  { key: "fat",     label: "Fat",     color: "#f59e0b" },
];

export default function Nutrition({ user, onMacrosChanged }) {
  const today = todayKey();
  const [entries, setEntries] = useState([]);
  const [openSlot, setOpenSlot] = useState(null);
  const [custom, setCustom] = useState({ description: "", kcal: "", protein: "", fat: "", carbs: "" });
  const [metrics, setMetrics] = useState([]);
  const [waist, setWaist] = useState("");
  const [weight, setWeight] = useState("");

  useEffect(() => { getMealLog(user.uid, today).then(setEntries); }, [user.uid, today]);
  useEffect(() => { recentBodyMetrics(user.uid).then(setMetrics); }, [user.uid]);

  const totals = macroTotals(entries);
  const remaining = Math.round(MACROS.kcal - totals.kcal);
  const over = remaining < 0;

  const persist = useCallback(async (next) => {
    setEntries(next);
    await saveMealLog(user.uid, today, next);
    onMacrosChanged(macroTotals(next));
  }, [user.uid, today, onMacrosChanged]);

  const quickAdd = (slot, opt) => persist([...entries, { id: uid(), slot, description: opt.label, kcal: opt.kcal, protein: opt.protein, fat: opt.fat, carbs: opt.carbs }]);
  const addCustom = (slot) => {
    if (!custom.description.trim() || !custom.kcal) return;
    persist([...entries, { id: uid(), slot, description: custom.description.trim(), kcal: +custom.kcal || 0, protein: +custom.protein || 0, fat: +custom.fat || 0, carbs: +custom.carbs || 0 }]);
    setCustom({ description: "", kcal: "", protein: "", fat: "", carbs: "" });
  };
  const remove = (id) => persist(entries.filter(e => e.id !== id));

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
      <div className="pg-title">Fuel</div>
      <div className="pg-sub">2,100 kcal · 160P / 65F / 210C flat. Dinner is the adjustment valve — the remaining gap is the dinner target.</div>

      <div className="card">
        <div className="card-t">Calories</div>
        <div style={{ fontSize: 12.5, color: "var(--mut)", marginTop: -8, marginBottom: 14 }}>Remaining = Goal − Food</div>
        <div className="fh-row">
          <Ring size={136} stroke={11} pct={(totals.kcal / MACROS.kcal) * 100} color={over ? "#ef4444" : "var(--acc)"}>
            <span className="fh-big" style={over ? { color: "var(--red-t)" } : {}}>{Math.abs(remaining).toLocaleString()}</span>
            <span className="fh-lbl">{over ? "Over" : "Remaining"}</span>
          </Ring>
          <div className="fh-eq">
            <div className="fh-line">
              <span className="fh-ic" style={{ background: "var(--acc-soft)", color: "var(--acc)" }}>⚑</span>
              <span className="fh-k">Base goal</span>
              <span className="fh-v">{MACROS.kcal.toLocaleString()}</span>
            </div>
            <div className="fh-line">
              <span className="fh-ic" style={{ background: "rgba(34,197,94,0.12)", color: "var(--green-t)" }}>🍽</span>
              <span className="fh-k">Food</span>
              <span className="fh-v">{Math.round(totals.kcal).toLocaleString()}</span>
            </div>
            <div className="fh-line">
              <span className="fh-ic" style={{ background: over ? "rgba(239,68,68,0.12)" : "var(--hover)", color: over ? "var(--red-t)" : "var(--tx2)" }}>=</span>
              <span className="fh-k">{over ? "Over budget" : "Remaining"}</span>
              <span className="fh-v" style={{ color: over ? "var(--red-t)" : "var(--acc)" }}>{Math.abs(remaining).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-t">Macros</div>
        <div className="mac-rings">
          {MACRO_RINGS.map(m => {
            const val = Math.round(totals[m.key]);
            const target = MACROS[m.key];
            const left = target - val;
            return (
              <div className="mac-ring" key={m.key}>
                <Ring size={88} stroke={8} pct={(val / target) * 100} color={val > target * 1.03 ? "#ef4444" : m.color}>
                  <span className="mac-ring-v">{val}<span style={{ fontSize: 10, color: "var(--mut)" }}>g</span></span>
                  <span className="mac-ring-t">/ {target}g</span>
                </Ring>
                <div style={{ textAlign: "center" }}>
                  <div className="mac-ring-n" style={{ color: m.color }}>{m.label}</div>
                  <div className="mac-ring-l">{left >= 0 ? `${left}g left` : `${-left}g over`}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {SLOTS.map(s => {
        const slotEntries = entries.filter(e => e.slot === s.id);
        const slotKcal = Math.round(slotEntries.reduce((sum, e) => sum + (e.kcal || 0), 0));
        const isOpen = openSlot === s.id;
        const note = SLOT_NOTES[s.id];
        return (
          <div className="card" key={s.id}>
            <div className="dy-hd">
              <div>
                <div className="dy-nm">{s.label}</div>
                <div className="dy-when">{s.when}</div>
              </div>
              {slotKcal > 0 && <div className="dy-kcal">{slotKcal.toLocaleString()} kcal</div>}
            </div>
            {slotEntries.length > 0 && (
              <div style={{ marginTop: 6 }}>
                {slotEntries.map(e => (
                  <div className="dy-en" key={e.id}>
                    <div className="dy-en-b">
                      <div className="dy-en-t">{e.description}</div>
                      <div className="dy-en-m">{Math.round(e.protein)}P · {Math.round(e.carbs)}C · {Math.round(e.fat)}F</div>
                    </div>
                    <span className="dy-en-k">{Math.round(e.kcal)}</span>
                    <button className="bi del" onClick={() => remove(e.id)} aria-label="Remove entry">✕</button>
                  </div>
                ))}
              </div>
            )}
            <button className="dy-add" onClick={() => setOpenSlot(isOpen ? null : s.id)}>{isOpen ? "− Close" : "＋ Add Food"}</button>
            {isOpen && (
              <div className="dy-panel">
                {note && <div className={"callout " + note.cls}><div className="ct">{note.body}</div></div>}
                {(OPTIONS[s.id] || []).map(o => (
                  <div key={o.id} className="dy-opt" onClick={() => quickAdd(s.id, o)}>
                    <span className="dy-plus">＋</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="dy-en-t">{o.label}</div>
                      <div className="dy-en-m">{o.kcal} kcal · {o.protein}P / {o.carbs}C / {o.fat}F{o.fatNote ? ` · ${o.fatNote}` : ""}</div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 10 }}>
                  <div className="fl">Custom entry</div>
                  <div className="fg"><input className="fi" placeholder="What did you eat?" value={custom.description} onChange={e => setCustom({ ...custom, description: e.target.value })} /></div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["kcal", "protein", "carbs", "fat"].map(f => (
                      <input key={f} className="fi sm" style={{ width: 76 }} type="number" placeholder={f} value={custom[f]} onChange={e => setCustom({ ...custom, [f]: e.target.value })} />
                    ))}
                    <button className="bp" onClick={() => addCustom(s.id)}>Add</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="card">
        <div className="card-t">Waist & weight</div>
        <div style={{ fontSize: 12.5, color: "var(--mut)", marginTop: -8, marginBottom: 12 }}>Every 2nd Sunday, before eating, before drinking.</div>
        {flat && <div className="callout cr"><div className="ct"><strong>Review trigger (waist flat):</strong> no decrease across two consecutive measurements. Reduce carbs by 25–38g from the rice portion in Meal 3.</div></div>}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          <input className="fi sm" style={{ width: 104 }} type="number" step="0.1" placeholder="waist cm" value={waist} onChange={e => setWaist(e.target.value)} />
          <input className="fi sm" style={{ width: 104 }} type="number" step="0.1" placeholder="weight kg" value={weight} onChange={e => setWeight(e.target.value)} />
          <button className="bp" onClick={saveMetrics}>Log</button>
        </div>
        {waists.length > 0 && (
          <table className="tbl">
            <thead><tr><th>Date</th><th>Waist</th><th>Δ</th><th>Weight</th></tr></thead>
            <tbody>
              {metrics.slice(-8).map((m, i, arr) => {
                const prev = arr.slice(0, i).reverse().find(x => x.waistCm != null);
                const d = m.waistCm != null && prev ? (m.waistCm - prev.waistCm).toFixed(1) : null;
                return (
                  <tr key={m.date}>
                    <td>{m.date}</td>
                    <td>{m.waistCm != null ? m.waistCm + " cm" : "—"}</td>
                    <td style={{ color: d == null ? "var(--dim)" : +d < 0 ? "var(--green-t)" : +d > 0 ? "var(--red-t)" : "var(--tx2)", fontWeight: 700 }}>{d == null ? "—" : (+d > 0 ? "+" : "") + d}</td>
                    <td>{m.weightKg != null ? m.weightKg + " kg" : <span style={{ color: "var(--dim)" }}>directional noise only</span>}</td>
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
