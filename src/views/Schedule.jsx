import { SCHEDULE_V2, BLOCK_META_V2 } from "../system/schedule.js";
import { Blk } from "./shared.jsx";

export default function Schedule({ schedDay, setSchedDay }) {
  const day = SCHEDULE_V2[schedDay];
  const used = [...new Set(day.blocks.map(b => b.type))].filter(t => t !== "wildcard");
  return (
    <>
      <div className="pg-title">SCHEDULE</div>
      <div className="pg-sub">Sovereign Health OS v2 · PPL @ Titan Park · Tap any block for details</div>
      <div className="day-tabs">{Object.keys(SCHEDULE_V2).map(d => <div key={d} className={"day-tab" + (schedDay === d ? " active" : "")} onClick={() => setSchedDay(d)}>{d}</div>)}</div>
      <div className="day-type">{day.type}</div>
      <div className="day-sub">{day.subtitle}</div>
      {day.blocks.map((b, i) => <Blk key={i} b={b} />)}
      {day.routing && (
        <div className="callout cn" style={{ marginTop: 14 }}>
          <div className="ct"><strong>Routing variants — </strong>{day.routing}</div>
        </div>
      )}
      <div className="leg">{used.map(t => { const m = BLOCK_META_V2[t]; if (!m) return null; return <div key={t} className="leg-i"><div className="leg-d" style={{ background: m.color }} />{m.label}</div>; })}</div>
    </>
  );
}
