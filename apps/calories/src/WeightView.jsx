import { useState, useEffect } from "react";
import { fmtDateHeader, addDays, todayStr, lastNDates } from "./dateUtils.js";
import { NumInput } from "./ui.jsx";

function avgOf(values) {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function WeightTrend({ weights, endDate }) {
  const days = lastNDates(endDate, 30);
  const points = days.map((d) => ({ date: d, kg: weights[d]?.kg ?? null }));
  const present = points.filter((p) => p.kg != null);
  if (present.length < 2) return <p className="hint small">Log at least two days to see a trend.</p>;

  const w = 300;
  const h = 90;
  const pad = 6;
  const kgs = present.map((p) => p.kg);
  const min = Math.min(...kgs);
  const max = Math.max(...kgs);
  const span = max - min || 1;
  const x = (i) => pad + (i / (points.length - 1)) * (w - pad * 2);
  const y = (kg) => pad + (1 - (kg - min) / span) * (h - pad * 2);

  let pathD = "";
  let started = false;
  points.forEach((p, i) => {
    if (p.kg == null) return;
    const cmd = started ? "L" : "M";
    pathD += `${cmd}${x(i).toFixed(1)},${y(p.kg).toFixed(1)} `;
    started = true;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="trendsvg" preserveAspectRatio="none">
      <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2" />
      {points.map((p, i) =>
        p.kg != null ? <circle key={i} cx={x(i)} cy={y(p.kg)} r="2.2" fill="var(--accent)" /> : null
      )}
    </svg>
  );
}

export default function WeightView({ weights, onSaveWeight, onDeleteWeight }) {
  const [date, setDate] = useState(todayStr());
  const [kg, setKg] = useState(weights[date]?.kg ?? 70);

  useEffect(() => {
    setKg(weights[date]?.kg ?? weights[todayStr()]?.kg ?? 70);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const recent = Object.entries(weights)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 14);

  const today = todayStr();
  const last7 = lastNDates(today, 7).map((d) => weights[d]?.kg).filter((v) => v != null);
  const prev7 = lastNDates(addDays(today, -7), 7).map((d) => weights[d]?.kg).filter((v) => v != null);
  const avg7 = avgOf(last7);
  const avgPrev7 = avgOf(prev7);
  const delta = avg7 != null && avgPrev7 != null ? avg7 - avgPrev7 : null;

  return (
    <div className="page">
      <div className="daynav">
        <button className="iconbtn" onClick={() => setDate(addDays(date, -1))}>
          ‹
        </button>
        <div className="daynav-label">{fmtDateHeader(date)}</div>
        <button className="iconbtn" onClick={() => setDate(addDays(date, 1))}>
          ›
        </button>
      </div>

      <div className="card">
        <div className="flabel">Weight (kg)</div>
        <NumInput value={kg} onChange={setKg} min={20} max={400} step={0.1} />
        <button className="bigbtn start" onClick={() => onSaveWeight(date, kg)}>
          {weights[date] ? "Update entry" : "Save entry"}
        </button>
      </div>

      <h2>30-day trend</h2>
      <div className="card">
        <WeightTrend weights={weights} endDate={today} />
        {avg7 != null && (
          <p className="hint small">
            7-day avg: {avg7.toFixed(1)} kg
            {delta != null && (
              <>
                {" "}
                ({delta > 0 ? "+" : ""}
                {delta.toFixed(1)} kg vs previous 7 days)
              </>
            )}
          </p>
        )}
      </div>

      <h2>Recent entries</h2>
      <div className="card">
        {recent.length === 0 && <p className="hint small" style={{ margin: "4px 2px" }}>No entries yet.</p>}
        {recent.map(([d, rec]) => (
          <div key={d} className="logrow" onClick={() => setDate(d)}>
            <div className="logrow-main">
              <div className="logrow-name">{fmtDateHeader(d)}</div>
              <div className="logrow-sub">{rec.kg.toFixed(1)} kg</div>
            </div>
            <button
              className="iconbtn"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete weight entry for ${d}?`)) onDeleteWeight(d);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
