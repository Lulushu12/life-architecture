import { useMemo, useState } from "react";
import { addDays } from "@shared/store.js";
import { MACROS, plannedSession, CAT_COLORS } from "../system/constants.js";
import { isScheduled, weekdayOfKey } from "../system/streak.js";
import { getWorkoutLogSync, recentBodyMetricsSync } from "../data/logs.js";
import { effectiveMacros } from "../data/bridge.js";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export function isoWeek(key) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

const keyToDate = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d, 12); };

const CADENCE = [
  { title: "Weekly, Sunday", items: ["Trading: review all trades against documented rules", "Quests: mark completed, activate next milestones", "Identity check: what evidence did I generate this week?"] },
  { title: "Bi-weekly, every 2nd Sunday morning", items: ["Waist measurement before eating, before drinking: log it", "4 weeks flat despite compliance: cut 25–38g carbs from the Meal 3 rice portion", "Performance degrading: intake too low, add one planned snack"] },
  { title: "Monthly, first Sunday", items: ["Six-month output progress: where are the four outputs tracking?", "Deload screen: any 2+ co-occurring fatigue signals this month?", "Sleep check: is the 22:00–22:30 lights-out window holding?", "Trading P&L review and system adjustments"] },
];

export default function Review({ data, today, commit, setDailyAuto }) {
  const week = isoWeek(today);
  const review = data.reviews?.[week] || {};
  const priorities = [0, 1, 2].map(i => review.priorities?.[i] || "");
  const [showCadence, setShowCadence] = useState(false);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)), [today]);

  const stats = useMemo(() => {
    let planned = 0, sessions = 0, pain = 0, macroHit = 0, macroDays = 0;
    for (const k of days) {
      if (plannedSession(keyToDate(k), data.pplOffset) !== "REST") planned++;
      const log = getWorkoutLogSync(k);
      if (log && !log.missed) sessions++;
      for (const ex of log?.exercises || []) for (const s of ex.sets || []) if (s.painFree === false) pain++;
      const m = effectiveMacros(data, k);
      if (m.source) {
        macroDays++;
        if (m.totals.protein >= MACROS.protein && m.totals.kcal >= MACROS.kcalFloor && m.totals.kcal <= MACROS.kcalCeil) macroHit++;
      }
    }
    const first = days[0];
    let advances = 0, drops = 0;
    for (const p of Object.values(data.liftProgress || {})) {
      for (const h of p.history || []) {
        if (h.date >= first && h.date <= today) { if (h.event === "advance") advances++; if (h.event === "drop_back") drops++; }
      }
    }
    const waists = recentBodyMetricsSync(30).filter(m => m.waistCm != null);
    const last = waists[waists.length - 1], prev = waists[waists.length - 2];
    const waistDelta = last && prev ? +(last.waistCm - prev.waistCm).toFixed(1) : null;
    return { planned, sessions, pain, macroHit, macroDays, advances, drops, waistDelta, lastWaist: last };
  }, [days, data, today]);

  const setPriority = (i, text) => {
    commit(d => {
      const cur = d.reviews?.[week] || {};
      const list = [0, 1, 2].map(j => cur.priorities?.[j] || "");
      list[i] = text;
      return { ...d, reviews: { ...(d.reviews || {}), [week]: { ...cur, priorities: list } } };
    });
  };

  const complete = () => {
    commit(d => ({ ...d, reviews: { ...(d.reviews || {}), [week]: { ...(d.reviews?.[week] || {}), priorities, completedAt: Date.now() } } }));
    setDailyAuto("d17", true);
  };

  const done = (q, k) => (data.dayLog?.[k]?.[q.id] != null) || q.lastDone === k;

  return (
    <>
      <div className="pg-title">Weekly review</div>
      <div className="pg-sub">{week} · last 7 days · completing it ticks the weekly review quest</div>

      <div className="card">
        <div className="card-t">Quest heatmap</div>
        <div style={{ overflowX: "auto" }}>
          <table className="heat">
            <thead>
              <tr><th />{days.map(k => <th key={k}>{DOW[weekdayOfKey(k)]}</th>)}</tr>
            </thead>
            <tbody>
              {data.dailyQ.map(q => {
                const c = (CAT_COLORS[q.category] || CAT_COLORS["Health & Fitness"]).accent;
                return (
                  <tr key={q.id}>
                    <td className="q" title={q.title}>{q.title}</td>
                    {days.map(k => {
                      const sched = isScheduled(q, k);
                      const hit = done(q, k);
                      return <td key={k} aria-label={`${q.title} ${k}: ${hit ? "done" : sched ? "missed" : "off day"}`} style={{ background: hit ? c : sched ? "var(--ring)" : "transparent", border: sched ? "none" : "1px dashed var(--bd)" }} />;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-t">Week in numbers</div>
        <div className="stat"><span>Sessions vs planned</span><b>{stats.sessions} / {stats.planned}</b></div>
        <div className="stat"><span>Overload gate advances</span><b>{stats.advances}{stats.drops ? ` (${stats.drops} drop-back)` : ""}</b></div>
        <div className="stat"><span>Pain flags</span><b style={{ color: stats.pain ? "var(--red-t)" : undefined }}>{stats.pain}</b></div>
        <div className="stat"><span>Macro hit rate</span><b>{stats.macroDays ? `${stats.macroHit} / ${stats.macroDays} logged days` : "no data"}</b></div>
        <div className="stat"><span>Waist delta</span><b>{stats.waistDelta == null ? (stats.lastWaist ? `${stats.lastWaist.waistCm} cm (first)` : "not measured") : `${stats.waistDelta > 0 ? "+" : ""}${stats.waistDelta} cm`}</b></div>
      </div>

      <div className="card">
        <div className="card-t">3 priorities for the coming 7 days</div>
        {priorities.map((p, i) => (
          <div className="fg" key={i}>
            <input className="fi" aria-label={`Priority ${i + 1}`} placeholder={`Priority ${i + 1}`} value={p} onChange={e => setPriority(i, e.target.value)} />
          </div>
        ))}
        <div className="btnrow">
          <button className="bp green" onClick={complete} disabled={!priorities.some(p => p.trim())}>
            {review.completedAt ? "Review completed · save again" : "Complete review"}
          </button>
        </div>
      </div>

      <button type="button" className="bs" style={{ minHeight: 44, marginBottom: 12 }} aria-expanded={showCadence} onClick={() => setShowCadence(v => !v)}>
        {showCadence ? "Hide review cadence" : "Show review cadence"}
      </button>
      {showCadence && CADENCE.map(s => (
        <div className="card" key={s.title}>
          <div className="card-t">{s.title}</div>
          {s.items.map((item, i) => <div key={i} style={{ fontSize: 12.5, color: "var(--tx2)", lineHeight: 1.6, marginBottom: 6 }}>□ {item}</div>)}
        </div>
      ))}
    </>
  );
}
