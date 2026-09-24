import { SCHEDULE_V2 } from "./schedule.js";

const HM = /(\d{1,2}):(\d{2})/g;
const DAY_END = 23 * 60 + 30;

export const fmtHM = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(Math.round(min % 60)).padStart(2, "0")}`;

function parseTime(time) {
  const t = String(time || "").toLowerCase();
  const nums = [...t.matchAll(HM)].map(m => +m[1] * 60 + +m[2]);
  const approx = t.includes("~") || t.includes("by ");
  if (t.startsWith("by ") && nums.length) return { start: nums[0] - 90, end: nums[0], approx: true };
  if (nums.length >= 2) return { start: nums[0], end: nums[1], approx };
  if (nums.length === 1) return { start: nums[0], end: null, approx };
  if (t.includes("all day") || t.includes("flex")) return { allDay: true };
  return { keyword: t };
}

export function timelineFor(blocks) {
  const rows = blocks.map((b, i) => ({ b, i, ...parseTime(b.time) }));
  const timed = rows.filter(r => !r.allDay);
  for (let k = 0; k < timed.length; k++) {
    const r = timed[k];
    if (r.start != null) continue;
    const prev = timed.slice(0, k).reverse().find(x => x.start != null);
    const next = timed.slice(k + 1).find(x => x.start != null && x.keyword == null);
    const prevEnd = prev ? (prev.end ?? prev.start + 30) : null;
    if (r.keyword.includes("morning") && !prev) r.start = 7 * 60;
    else if (r.keyword.includes("evening")) r.start = Math.max(prevEnd ?? 0, 18 * 60 + 30);
    else if (prevEnd != null) r.start = prevEnd;
    else if (next) r.start = next.start - 60;
    else r.start = 12 * 60;
    if (next && next.start <= r.start) r.start = Math.max(prevEnd ?? 0, next.start - 30);
    r.approx = true;
  }
  for (let k = 0; k < timed.length; k++) {
    const r = timed[k];
    if (r.end != null && r.end > r.start) continue;
    const next = timed.slice(k + 1).find(x => x.start > r.start);
    r.end = Math.min(r.start + 90, next ? next.start : r.start + 30, DAY_END);
    if (r.end <= r.start) r.end = r.start + 15;
  }
  return [...rows].sort((a, b) => (a.allDay ? -1 : a.start) - (b.allDay ? -1 : b.start) || a.i - b.i);
}

export function timelineForDay(weekday) {
  return timelineFor(SCHEDULE_V2[weekday]?.blocks || []);
}

export function nowState(rows, nowMin) {
  const timed = rows.filter(r => !r.allDay);
  const current = timed.find(r => r.start <= nowMin && nowMin < r.end) || null;
  const next = timed.find(r => r.start > nowMin) || null;
  return { current, next, inMin: next ? Math.round(next.start - nowMin) : null };
}

export function inLabel(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
