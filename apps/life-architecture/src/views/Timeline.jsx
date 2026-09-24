import { useEffect, useMemo, useState } from "react";
import { BLOCK_META_V2 } from "../system/schedule.js";
import { timelineFor, nowState, fmtHM, inLabel } from "../system/timeline.js";

const minutesNow = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

function useNowMinutes() {
  const [now, setNow] = useState(minutesNow);
  useEffect(() => {
    const tick = () => setNow(minutesNow());
    const id = setInterval(tick, 30000);
    const onVis = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  return now;
}

const colorOf = (m, type) => (type === "wildcard" ? "var(--mut)" : m.color);

function useNextBlock(blocks) {
  const now = useNowMinutes();
  const rows = useMemo(() => timelineFor(blocks), [blocks]);
  return { now, rows, ...nowState(rows, now) };
}

export default function Timeline({ blocks }) {
  const { now, rows, current, next, inMin } = useNextBlock(blocks);
  const [open, setOpen] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const timed = rows.filter(r => !r.allDay);
  const allDay = rows.filter(r => r.allDay);
  const past = timed.filter(r => r.end <= now && r !== current);
  const visible = showPast ? timed : timed.filter(r => !past.includes(r));
  const nowIdx = next ? visible.indexOf(next) : visible.length;

  const row = (r) => {
    const m = BLOCK_META_V2[r.b.type] || BLOCK_META_V2.wildcard;
    const isOpen = open === r.i;
    const hasDetail = !!(r.b.detail || r.b.twoMin);
    const cls = "tl-i" + (r === current ? " cur" : "") + (r.end <= now && r !== current ? " past" : "");
    return (
      <li key={r.i} className={cls}>
        <button type="button" className="tl-b" aria-expanded={hasDetail ? isOpen : undefined} disabled={!hasDetail} onClick={() => setOpen(isOpen ? null : r.i)}>
          <span className="tl-t">{r.b.time}</span>
          <span className="tl-dot" style={{ background: colorOf(m, r.b.type) }} aria-hidden="true" />
          <span className="tl-l">{r.b.label}{r === current && <span className="tl-cur">now</span>}</span>
          {hasDetail && <span className={"blk-a" + (isOpen ? " open" : "")} aria-hidden="true">▾</span>}
        </button>
        {isOpen && (
          <div className="tl-d">
            {r.b.detail && <div className="det">{r.b.detail}</div>}
            {r.b.twoMin && <div className="tm"><span className="tm-l">FALLBACK</span><span className="tm-t">{r.b.twoMin}</span></div>}
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="card">
      <div className="tl-head">
        <div className="card-t" style={{ marginBottom: 0 }}>Timeline</div>
        <div className="tl-next" aria-live="polite">{next ? <>Next: <b>{next.b.label}</b> in {inLabel(inMin)}</> : "Nothing else planned today"}</div>
      </div>
      {allDay.length > 0 && <div className="tl-all">{allDay.map(r => <span key={r.i} className="tl-chip">{r.b.label}</span>)}</div>}
      {past.length > 0 && (
        <button type="button" className="tl-past" aria-expanded={showPast} onClick={() => setShowPast(v => !v)}>
          {showPast ? "Hide earlier blocks" : `${past.length} earlier block${past.length > 1 ? "s" : ""}`}
        </button>
      )}
      <ol className="tl">
        {visible.map((r, i) => (
          <FragmentRow key={r.i} marker={i === nowIdx} now={now}>{row(r)}</FragmentRow>
        ))}
        {nowIdx === visible.length && <NowMarker now={now} />}
      </ol>
    </div>
  );
}

function NowMarker({ now }) {
  return <li className="tl-now" aria-label={`Now, ${fmtHM(now)}`}><span>{fmtHM(now)}</span></li>;
}

function FragmentRow({ marker, now, children }) {
  return <>{marker && <NowMarker now={now} />}{children}</>;
}
