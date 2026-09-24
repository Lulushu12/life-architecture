import { SCHEDULE_V2, BLOCK_META_V2 } from "./schedule.js";
import { WEEKDAYS } from "./constants.js";
import { timelineFor } from "./timeline.js";

const BYDAY = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

const esc = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const pad = (n) => String(n).padStart(2, "0");
const localStamp = (d, min) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(Math.floor(min / 60))}${pad(min % 60)}00`;
const utcStamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function fold(line) {
  const out = [];
  let rest = line;
  while (rest.length > 73) { out.push(rest.slice(0, 73)); rest = " " + rest.slice(73); }
  out.push(rest);
  return out.join("\r\n");
}

export function weekIcs(now = new Date()) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7), 12);
  const stamp = utcStamp(now);
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Life Architecture//Week//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Life Architecture week"];
  let count = 0;
  WEEKDAYS.forEach((wd, di) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + di, 12);
    const rows = timelineFor(SCHEDULE_V2[wd]?.blocks || []);
    for (const r of rows) {
      if (r.allDay || r.start == null) continue;
      const meta = BLOCK_META_V2[r.b.type] || BLOCK_META_V2.wildcard;
      const desc = [r.b.detail, r.b.twoMin ? `Fallback: ${r.b.twoMin}` : "", r.approx ? `Planned time: ${r.b.time}` : ""].filter(Boolean).join("\n");
      lines.push(
        "BEGIN:VEVENT",
        `UID:la-${wd.toLowerCase()}-${r.i}@life-architecture`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${localStamp(date, Math.round(r.start))}`,
        `DTEND:${localStamp(date, Math.round(Math.min(r.end, 23 * 60 + 59)))}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[di]}`,
        `SUMMARY:${esc(r.b.label)}`,
        `CATEGORIES:${esc(meta.label)}`,
        `DESCRIPTION:${esc(desc)}`,
        "TRANSP:TRANSPARENT",
        "END:VEVENT",
      );
      count++;
    }
  });
  lines.push("END:VCALENDAR");
  return { text: lines.map(fold).join("\r\n") + "\r\n", count };
}
