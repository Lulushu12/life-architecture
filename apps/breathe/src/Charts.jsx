import { useEffect, useRef, useState } from "react";
import { formatElapsed } from "./format.js";

function useWidth(fallback = 320) {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => setWidth(Math.max(200, Math.round(el.getBoundingClientRect().width)));
    measure();
    if (typeof ResizeObserver !== "function") return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

function niceMax(v, step) {
  return Math.max(step, Math.ceil((v * 1.1) / step) * step);
}

const shortDate = (ts) => new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function barPath(x, y, w, h, r) {
  if (h <= 0) return "";
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

export function RetentionBars({ rounds }) {
  const [ref, width] = useWidth();
  const [sel, setSel] = useState(null);
  const h = 150;
  const top = 22;
  const bottom = 22;
  const plotH = h - top - bottom;
  const max = niceMax(Math.max(...rounds.map((r) => r.retentionSeconds), 1), 30);
  const slot = width / rounds.length;
  const barW = Math.min(44, slot - 8);
  const best = Math.max(...rounds.map((r) => r.retentionSeconds));
  return (
    <div className="chart" ref={ref}>
      <svg width={width} height={h} role="img" aria-label={`Retention per round, best ${formatElapsed(best)}`}>
        <line className="chart-base" x1={0} x2={width} y1={top + plotH} y2={top + plotH} />
        {rounds.map((r, i) => {
          const bh = (r.retentionSeconds / max) * plotH;
          const x = i * slot + (slot - barW) / 2;
          const y = top + plotH - bh;
          return (
            <g key={i} onPointerEnter={() => setSel(i)} onPointerLeave={() => setSel(null)} onClick={() => setSel(i)}>
              <rect x={i * slot} y={0} width={slot} height={h} fill="transparent" />
              <path
                d={barPath(x, y, barW, Math.max(bh, 2), 4)}
                className={"chart-bar" + (r.interrupted ? " muted" : "") + (sel === i ? " sel" : "")}
              />
              <text x={x + barW / 2} y={y - 6} className="chart-val" textAnchor="middle">
                {formatElapsed(r.retentionSeconds)}
              </text>
              <text x={x + barW / 2} y={h - 6} className="chart-axis" textAnchor="middle">
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
      {rounds.some((r) => r.interrupted) && (
        <p className="hint small">Lighter bars were stopped when the screen turned off.</p>
      )}
    </div>
  );
}

export function HoldTrend({ points }) {
  const [ref, width] = useWidth();
  const [sel, setSel] = useState(null);
  const h = 150;
  const left = 38;
  const right = 10;
  const top = 10;
  const bottom = 22;
  const plotW = width - left - right;
  const plotH = h - top - bottom;
  const max = niceMax(Math.max(...points.map((p) => p.value), 1), 30);
  const ticks = [0, max / 2, max];
  const xAt = (i) => left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const yAt = (v) => top + plotH - (v / max) * plotH;
  const d = points.map((p, i) => `${i ? "L" : "M"}${xAt(i).toFixed(1)},${yAt(p.value).toFixed(1)}`).join("");
  const active = sel != null ? points[sel] : null;
  const pick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const i = points.length === 1 ? 0 : Math.round(((x - left) / plotW) * (points.length - 1));
    setSel(Math.max(0, Math.min(points.length - 1, i)));
  };
  return (
    <div className="chart" ref={ref}>
      <div className="chart-readout" aria-live="polite">
        {active
          ? `${shortDate(active.at)}: best hold ${formatElapsed(active.value)}${active.mood ? ` · mood ${active.mood} of 5` : ""}`
          : `Last ${points.length} ${points.length === 1 ? "session" : "sessions"}`}
      </div>
      <svg
        width={width}
        height={h}
        role="img"
        aria-label={`Best hold per session, latest ${formatElapsed(points[points.length - 1].value)}`}
        onPointerMove={pick}
        onPointerDown={pick}
        onPointerLeave={() => setSel(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className="chart-grid" x1={left} x2={width - right} y1={yAt(t)} y2={yAt(t)} />
            <text x={left - 6} y={yAt(t) + 4} className="chart-axis" textAnchor="end">
              {formatElapsed(t)}
            </text>
          </g>
        ))}
        <path d={d} className="chart-line" />
        {points.map((p, i) => (
          <circle key={p.id} cx={xAt(i)} cy={yAt(p.value)} r={sel === i ? 5 : 3.5} className="chart-dot" />
        ))}
        {active && <line className="chart-cross" x1={xAt(sel)} x2={xAt(sel)} y1={top} y2={top + plotH} />}
        <text x={left} y={h - 6} className="chart-axis">
          {shortDate(points[0].at)}
        </text>
        {points.length > 1 && (
          <text x={width - right} y={h - 6} className="chart-axis" textAnchor="end">
            {shortDate(points[points.length - 1].at)}
          </text>
        )}
      </svg>
    </div>
  );
}

export function WeekBars({ weeks }) {
  const [ref, width] = useWidth();
  const [sel, setSel] = useState(null);
  const h = 120;
  const top = 16;
  const bottom = 22;
  const plotH = h - top - bottom;
  const max = niceMax(Math.max(...weeks.map((w) => w.minutes), 1), 10);
  const slot = width / weeks.length;
  const barW = Math.max(6, slot - 6);
  const active = sel != null ? weeks[sel] : null;
  const total = weeks.reduce((a, w) => a + w.minutes, 0);
  return (
    <div className="chart" ref={ref}>
      <div className="chart-readout" aria-live="polite">
        {active
          ? `Week of ${shortDate(active.start)}: ${active.minutes} min${active.mood != null ? ` · mood ${active.mood.toFixed(1)} of 5` : ""}`
          : `${total} min over 12 weeks`}
      </div>
      <svg width={width} height={h} role="img" aria-label={`Minutes per week, ${total} in total over 12 weeks`}>
        <line className="chart-base" x1={0} x2={width} y1={top + plotH} y2={top + plotH} />
        {weeks.map((w, i) => {
          const bh = (w.minutes / max) * plotH;
          const x = i * slot + (slot - barW) / 2;
          const y = top + plotH - bh;
          const current = i === weeks.length - 1;
          return (
            <g
              key={w.start}
              onPointerEnter={() => setSel(i)}
              onPointerLeave={() => setSel(null)}
              onClick={() => setSel(i)}
            >
              <rect x={i * slot} y={0} width={slot} height={h} fill="transparent" />
              {w.minutes > 0 && (
                <path d={barPath(x, y, barW, Math.max(bh, 2), 4)} className={"chart-bar" + (sel === i ? " sel" : "")} />
              )}
              {(i % 4 === 0 || current) && (
                <text x={x + barW / 2} y={h - 6} className="chart-axis" textAnchor="middle">
                  {current ? "Now" : shortDate(w.start)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function GoalRing({ done, goal, size = 64 }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = goal > 0 ? Math.min(1, done / goal) : 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${done} of ${goal} sessions this week`}
    >
      <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className={"ring-fill" + (frac >= 1 ? " done" : "")}
        strokeWidth={stroke}
        strokeDasharray={`${(frac * c).toFixed(2)} ${c.toFixed(2)}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dy="0.35em" textAnchor="middle" className="ring-text">
        {done}/{goal}
      </text>
    </svg>
  );
}
