export default function Sparkline({ values, width = 84, height = 26, label }) {
  const pts = values.filter((v) => Number.isFinite(v) && v > 0);
  if (pts.length < 2) return null;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const x = (i) => 2 + (i / (pts.length - 1)) * (width - 4);
  const y = (v) => 3 + (1 - (v - min) / span) * (height - 6);
  const d = pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = pts.length - 1;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="spark" role="img" aria-label={label}>
      <path d={d} fill="none" className="spark-line" />
      <circle cx={x(last)} cy={y(pts[last])} r="2.4" className="spark-dot" />
    </svg>
  );
}
