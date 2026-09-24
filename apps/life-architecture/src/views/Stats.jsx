import { useMemo } from "react";
import { addDays } from "@shared/store.js";
import { CATEGORIES, CAT_COLORS } from "../system/constants.js";
import { isPlanned, isSkipped, weekdayOfKey } from "../system/streak.js";
import { PROTOCOLS } from "../system/exercises.js";
import { recentBodyMetricsSync } from "../data/logs.js";
import { effectiveMacros } from "../data/macros.js";
import { proteinHit, kcalInWindow } from "../system/targets.js";

const WEEKS = 12;
const CELL = 10;
const GAP = 3;
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CATALOG = Object.values(PROTOCOLS).flat().reduce((m, e) => (m[e.id] = e, m), {});
const PROTEIN_COLOR = "#22c55e";

const shortDate = (k) => { const [, m, d] = k.split("-"); return `${+d}/${+m}`; };

export function questDayState(q, k, today, dayLog) {
  if (k > today) return "future";
  const done = dayLog?.[k]?.[q.id] != null || q.lastDone === k;
  if (done) return "done";
  if (isSkipped(q, k)) return "skipped";
  if (!isPlanned(q, k)) return "off";
  return k === today ? "pending" : "missed";
}

function gridDays(today) {
  const monIdx = (weekdayOfKey(today) + 6) % 7;
  const start = addDays(today, -monIdx - (WEEKS - 1) * 7);
  return Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, r) => addDays(start, w * 7 + r)));
}

function Cell({ x, y, state, color, label }) {
  const common = { x, y, width: CELL, height: CELL, rx: 2.5 };
  if (state === "future") return null;
  let body;
  if (state === "done") body = <rect {...common} style={{ fill: color }} />;
  else if (state === "missed") body = <rect {...common} style={{ fill: "var(--miss)" }} />;
  else if (state === "pending") body = <rect {...common} style={{ fill: "var(--ring)" }} />;
  else if (state === "skipped") body = (
    <g>
      <rect {...common} x={x + 0.5} y={y + 0.5} width={CELL - 1} height={CELL - 1} style={{ fill: "none", stroke: "var(--mut)", strokeWidth: 1 }} />
      <path d={`M${x + 2} ${y + CELL - 2}L${x + CELL - 2} ${y + 2}`} style={{ stroke: "var(--mut)", strokeWidth: 1.2 }} />
    </g>
  );
  else body = <rect {...common} x={x + 0.5} y={y + 0.5} width={CELL - 1} height={CELL - 1} style={{ fill: "none", stroke: "var(--bdh)", strokeWidth: 1, strokeDasharray: "2 1.5" }} />;
  return <g><title>{label}</title>{body}</g>;
}

function QuestGrid({ q, weeks, today, dayLog, color }) {
  const w = WEEKS * (CELL + GAP) - GAP;
  const h = 7 * (CELL + GAP) - GAP;
  let done = 0, hit = 0, missed = 0;
  const cells = [];
  weeks.forEach((col, wi) => col.forEach((k, r) => {
    const state = questDayState(q, k, today, dayLog);
    if (state === "done") { done++; if (isPlanned(q, k)) hit++; }
    if (state === "missed") missed++;
    cells.push(<Cell key={k} x={wi * (CELL + GAP)} y={r * (CELL + GAP)} state={state} color={color} label={`${DOW[weekdayOfKey(k)]} ${k}: ${state === "off" ? "not scheduled" : state}`} />);
  }));
  const pct = hit + missed ? Math.round((hit / (hit + missed)) * 100) : null;
  return (
    <div className="st-q">
      <div className="st-qh">
        <div className="st-qt" title={q.title}>{q.title}</div>
        <div className="st-qs">{done} done{pct != null ? ` · ${pct}% of scheduled` : ""}</div>
      </div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${q.title}: ${done} days done in the last ${WEEKS} weeks`}>{cells}</svg>
    </div>
  );
}

function HeatLegend() {
  const items = [["done", "Done"], ["missed", "Missed"], ["skipped", "Skipped"], ["off", "Not scheduled"], ["pending", "Today, open"]];
  return (
    <div className="leg" style={{ marginTop: 4, marginBottom: 12 }}>
      {items.map(([s, l]) => (
        <span className="leg-i" key={s}>
          <svg width={CELL} height={CELL} aria-hidden="true"><Cell x={0} y={0} state={s} color="var(--acc)" label={l} /></svg>{l}
        </span>
      ))}
    </div>
  );
}

function Sparkline({ values, width = 120, height = 34, color = "var(--gold)" }) {
  if (values.length < 2) return <svg width={width} height={height} aria-hidden="true"><line x1={0} x2={width} y1={height / 2} y2={height / 2} style={{ stroke: "var(--bd)", strokeWidth: 2 }} /></svg>;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pad = 4;
  const x = (i) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v) => height - pad - ((v - min) / span) * (height - pad * 2);
  let d = `M${x(0)} ${y(values[0])}`;
  for (let i = 1; i < values.length; i++) d += `H${x(i)}V${y(values[i])}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={d} style={{ fill: "none", stroke: color, strokeWidth: 2, strokeLinejoin: "round" }} />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={3.5} style={{ fill: color, stroke: "var(--card)", strokeWidth: 2 }} />
    </svg>
  );
}

function LiftRows({ liftProgress }) {
  const rows = Object.entries(liftProgress || {})
    .filter(([id]) => CATALOG[id] && CATALOG[id].incrementKg != null)
    .map(([id, p]) => {
      const hist = (p.history || []).filter(h => Number.isFinite(+h.weightKg));
      const values = [CATALOG[id].startWeightKg, ...hist.map(h => +h.weightKg)];
      const lastAdv = p.lastAdvanced || [...hist].reverse().find(h => h.event === "advance")?.date || null;
      return { id, name: CATALOG[id].name, values, current: p.currentWeightKg, lastAdv, drops: hist.filter(h => h.event === "drop_back").length };
    })
    .sort((a, b) => (b.lastAdv || "").localeCompare(a.lastAdv || "") || a.name.localeCompare(b.name));
  if (!rows.length) return <div className="qhint">No lifts gated yet. Log a session in Train and the gate history shows up here.</div>;
  return rows.map(r => (
    <div className="st-lift" key={r.id}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="st-qt">{r.name}</div>
        <div className="st-qs">{r.lastAdv ? `last advance ${r.lastAdv}` : "no advance yet"}{r.drops ? ` · ${r.drops} drop-back${r.drops > 1 ? "s" : ""}` : ""}</div>
      </div>
      <Sparkline values={r.values} />
      <div className="st-w">{r.current}<span>kg</span></div>
    </div>
  ));
}

function AdherenceChart({ weeks }) {
  const W = 320, H = 132, left = 18, bottom = 18, top = 8;
  const plotH = H - bottom - top;
  const gw = (W - left) / weeks.length;
  const bw = Math.min(9, (gw - 6) / 2);
  const y = (n) => top + plotH - (n / 7) * plotH;
  const bar = (x, n, color, label) => {
    const h = Math.max(n > 0 ? 2 : 0, (n / 7) * plotH);
    const r = Math.min(3, h / 2);
    const x2 = x + bw, yb = top + plotH, yt = yb - h;
    const d = h ? `M${x} ${yb}V${yt + r}Q${x} ${yt} ${x + r} ${yt}H${x2 - r}Q${x2} ${yt} ${x2} ${yt + r}V${yb}Z` : "";
    return (
      <g>
        <title>{label}</title>
        <rect x={x - 1} y={top} width={bw + 2} height={plotH} style={{ fill: "transparent" }} />
        {d && <path d={d} style={{ fill: color }} />}
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Weekly macro adherence, days per week">
      {[0, 7].map(n => (
        <g key={n}>
          <line x1={left} x2={W} y1={y(n)} y2={y(n)} style={{ stroke: "var(--bd)", strokeWidth: 1 }} />
          <text x={0} y={y(n) + 3} style={{ fill: "var(--mut)", fontSize: 9 }}>{n}</text>
        </g>
      ))}
      {weeks.map((wk, i) => {
        const gx = left + i * gw + (gw - bw * 2 - 2) / 2;
        return (
          <g key={wk.start}>
            {bar(gx, wk.protein, PROTEIN_COLOR, `Week of ${wk.start}: protein target hit ${wk.protein} of ${wk.days} days`)}
            {bar(gx + bw + 2, wk.kcal, "var(--acc)", `Week of ${wk.start}: kcal in window ${wk.kcal} of ${wk.days} days`)}
            {(i % 3 === 0 || i === weeks.length - 1) && <text x={left + i * gw + gw / 2} y={H - 4} textAnchor="middle" style={{ fill: "var(--mut)", fontSize: 9 }}>{shortDate(wk.start)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function TrendChart({ points, color, unit, label }) {
  if (points.length < 2) {
    return <div className="qhint">{points.length ? `${label}: ${points[0].v} ${unit} on ${points[0].date}. One more entry draws the trend.` : `No ${label.toLowerCase()} logged yet. Log it in Fuel.`}</div>;
  }
  const W = 320, H = 110, left = 34, right = 8, top = 10, bottom = 18;
  const t0 = new Date(points[0].date).getTime(), t1 = new Date(points[points.length - 1].date).getTime();
  const vs = points.map(p => p.v);
  const min = Math.min(...vs), max = Math.max(...vs);
  const span = max - min || 1;
  const x = (d) => left + ((new Date(d).getTime() - t0) / (t1 - t0 || 1)) * (W - left - right);
  const y = (v) => top + (1 - (v - min) / span) * (H - top - bottom);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)} ${y(p.v).toFixed(1)}`).join("");
  const first = points[0], last = points[points.length - 1];
  const delta = +(last.v - first.v).toFixed(1);
  return (
    <>
      <div className="st-trend-h">
        <span>{label}</span>
        <b>{last.v} {unit} <span style={{ color: delta < 0 ? "var(--green-t)" : delta > 0 ? "var(--red-t)" : "var(--mut)" }}>{delta > 0 ? "+" : ""}{delta} since {shortDate(first.date)}</span></b>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${label} trend from ${first.v} to ${last.v} ${unit}`}>
        {[max, min].map((v, i) => (
          <g key={i}>
            <line x1={left} x2={W - right} y1={y(v)} y2={y(v)} style={{ stroke: "var(--bd)", strokeWidth: 1 }} />
            <text x={left - 4} y={y(v) + 3} textAnchor="end" style={{ fill: "var(--mut)", fontSize: 9 }}>{v}</text>
          </g>
        ))}
        <text x={left} y={H - 4} style={{ fill: "var(--mut)", fontSize: 9 }}>{shortDate(first.date)}</text>
        <text x={W - right} y={H - 4} textAnchor="end" style={{ fill: "var(--mut)", fontSize: 9 }}>{shortDate(last.date)}</text>
        <path d={d} style={{ fill: "none", stroke: color, strokeWidth: 2, strokeLinejoin: "round" }} />
        {points.map(p => (
          <g key={p.date}>
            <title>{`${p.date}: ${p.v} ${unit}`}</title>
            <circle cx={x(p.date)} cy={y(p.v)} r={8} style={{ fill: "transparent" }} />
            <circle cx={x(p.date)} cy={y(p.v)} r={3.5} style={{ fill: color, stroke: "var(--card)", strokeWidth: 2 }} />
          </g>
        ))}
      </svg>
    </>
  );
}

export default function Stats({ data, today, targets }) {
  const weeks = useMemo(() => gridDays(today), [today]);

  const adherence = useMemo(() => weeks.map(col => {
    let protein = 0, kcal = 0, days = 0;
    for (const k of col) {
      if (k > today) continue;
      const m = effectiveMacros(data, k);
      if (!m.source) continue;
      days++;
      if (proteinHit(m.totals, targets)) protein++;
      if (kcalInWindow(m.totals, targets)) kcal++;
    }
    return { start: col[0], protein, kcal, days };
  }), [weeks, data, today, targets]);

  const body = useMemo(() => {
    const all = recentBodyMetricsSync(400);
    return {
      waist: all.filter(m => m.waistCm != null && m.date).map(m => ({ date: m.date, v: +m.waistCm })),
      weight: all.filter(m => m.weightKg != null && m.date).map(m => ({ date: m.date, v: +m.weightKg })),
    };
  }, []);

  const logged = adherence.reduce((s, w) => s + w.days, 0);
  const pHit = adherence.reduce((s, w) => s + w.protein, 0);
  const kHit = adherence.reduce((s, w) => s + w.kcal, 0);

  return (
    <>
      <div className="pg-title">Stats</div>
      <div className="pg-sub">Last {WEEKS} weeks, from the day logs on this device</div>

      <div className="card">
        <div className="card-t">Quest heatmap</div>
        <div className="qhint" style={{ marginTop: -6, marginBottom: 8 }}>Columns are weeks, rows run Monday to Sunday.</div>
        <HeatLegend />
        {CATEGORIES.map(cat => {
          const items = data.dailyQ.filter(q => q.category === cat);
          if (!items.length) return null;
          const color = (CAT_COLORS[cat] || CAT_COLORS["Health & Fitness"]).accent;
          return (
            <div key={cat} className="st-cat">
              <div className="st-cat-h"><span className="cat-dot" style={{ background: color }} />{cat}</div>
              {items.map(q => <QuestGrid key={q.id} q={q} weeks={weeks} today={today} dayLog={data.dayLog} color={color} />)}
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-t">Lift progression</div>
        <LiftRows liftProgress={data.liftProgress} />
      </div>

      <div className="card">
        <div className="card-t">Macro adherence per week</div>
        <div className="leg" style={{ marginTop: -4, marginBottom: 8 }}>
          <span className="leg-i"><span className="leg-d" style={{ background: PROTEIN_COLOR }} />Protein at least {targets.protein}g</span>
          <span className="leg-i"><span className="leg-d" style={{ background: "var(--acc)" }} />kcal {targets.kcalFloor.toLocaleString()} to {targets.kcalCeil.toLocaleString()}</span>
        </div>
        <AdherenceChart weeks={adherence} />
        <div className="qhint">{logged ? `${logged} logged days: protein hit on ${pHit}, kcal in window on ${kHit}.` : "No macro logs in this range yet."}</div>
      </div>

      <div className="card">
        <div className="card-t">Body metrics</div>
        <TrendChart points={body.waist} color="#06b6d4" unit="cm" label="Waist" />
        <div style={{ height: 14 }} />
        <TrendChart points={body.weight} color="var(--gold)" unit="kg" label="Weight" />
      </div>
    </>
  );
}
