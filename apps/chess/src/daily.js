// The daily puzzle (plan item 11): one puzzle per date from the bundled
// sets, 5 hearts, a streak and a calendar. It doesn't move your rating.

import { allPuzzles } from "./puzzledb.js";
import { addDays } from "@shared/store.js";

export const HEARTS = 5;

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * The puzzle for a date: a little above your rating, the same every time
 * for the same date and rating, never one an earlier daily already used.
 * Returns {key, id, r} or null. The pick is saved on first open, so a rating
 * change later that day doesn't swap it.
 */
export function pickDaily(db, date, rating, log = {}) {
  const used = new Set(Object.values(log).map((e) => e?.id));
  const all = allPuzzles(db).filter((p) => !used.has(p.i));
  let pool = [];
  for (const [lo, hi] of [[-150, 250], [-300, 400], [-600, 800]]) {
    pool = all.filter((p) => p.r >= rating + lo && p.r <= rating + hi);
    if (pool.length >= 20) break;
  }
  if (!pool.length) pool = all;
  if (!pool.length) return null;
  const p = pool[hash(date) % pool.length];
  return { key: p.k, id: p.i, r: p.r };
}

/** Days in a row solved, ending today (or yesterday, if today is still open). */
export function dailyStreak(log, today) {
  let day = log?.[today]?.result === "solved" ? today : addDays(today, -1);
  let n = 0;
  while (log?.[day]?.result === "solved") {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

export function bestStreak(log) {
  const days = Object.keys(log || {}).filter((d) => log[d]?.result === "solved").sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** A month as weeks of day keys (Monday first), null for padding. */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1, 12);
  const pad = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0, 12).getDate();
  const cells = Array(pad).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** One line on today's daily, for the hub and the home tile. */
export function dailyStatus(store, today) {
  const d = store.daily?.date === today ? store.daily : null;
  if (d?.result === "solved") return "Solved today ✓";
  if (d?.result === "failed") return "Out of hearts today";
  if (d) return `${d.hearts} ${d.hearts === 1 ? "heart" : "hearts"} left`;
  return "New today · 5 hearts";
}
