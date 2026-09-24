import { SCHEDULE_V2, BLOCK_META_V2 } from "../system/schedule.js";
import { Blk } from "./shared.jsx";
import { useToast } from "@shared/ui.jsx";
import { canDownload, downloadText, copyToClipboard } from "@shared/backup.js";
import { weekIcs } from "../system/ics.js";

const ICS_NAME = "life-architecture-week.ics";

async function exportWeek(toast) {
  const { text, count } = weekIcs();
  try {
    if (typeof File === "function" && navigator.canShare) {
      const file = new File([text], ICS_NAME, { type: "text/calendar" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Life Architecture week" });
        return;
      }
    }
  } catch (e) {
    if (e?.name === "AbortError") return;
  }
  if (canDownload()) {
    downloadText(text, ICS_NAME, "text/calendar");
    toast(`Exported ${count} weekly events`);
    return;
  }
  const ok = await copyToClipboard(text);
  toast(ok ? "Calendar copied. Paste it into a file named week.ics to import." : "Could not export on this device");
}

export default function Schedule({ schedDay, setSchedDay }) {
  const toast = useToast();
  const day = SCHEDULE_V2[schedDay];
  const used = [...new Set(day.blocks.map(b => b.type))].filter(t => t !== "wildcard");
  return (
    <>
      <div className="pg-title">Schedule</div>
      <div className="pg-sub">Sovereign Health OS v2 · PPL @ Titan Park · Tap any block for details</div>
      <div className="day-tabs">{Object.keys(SCHEDULE_V2).map(d => <button type="button" key={d} aria-pressed={schedDay === d} className={"day-tab" + (schedDay === d ? " active" : "")} style={{ minHeight: 40, fontFamily: "inherit" }} onClick={() => setSchedDay(d)}>{d}</button>)}</div>
      <div className="day-type">{day.type}</div>
      <div className="day-sub">{day.subtitle}</div>
      {day.blocks.map((b, i) => <Blk key={i} b={b} />)}
      <div className="btnrow" style={{ marginTop: 14 }}>
        <button type="button" className="bs" onClick={() => exportWeek(toast)}>Export week (.ics)</button>
      </div>
      <div className="qhint">Repeats weekly in your calendar. Blocks without a clock time get an estimated slot.</div>
      {day.routing && (
        <div className="callout cn" style={{ marginTop: 14 }}>
          <div className="ct"><strong>Routing variants: </strong>{day.routing}</div>
        </div>
      )}
      <div className="leg">{used.map(t => { const m = BLOCK_META_V2[t]; if (!m) return null; return <div key={t} className="leg-i"><div className="leg-d" style={{ background: m.color }} />{m.label}</div>; })}</div>
    </>
  );
}
