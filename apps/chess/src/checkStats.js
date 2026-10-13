// The blunder check's record, by week (plan item 9): how often it stopped a
// move you then changed ("saved") and how often you played it anyway.

const WEEK = 7 * 24 * 3600 * 1000;

/** Monday 00:00 local time of the week holding `t`. */
export function weekStart(t) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

/** The last `weeks` weeks, oldest first: [{start, saved, anyway}]. */
export function checkWeeks(checks, now = Date.now(), weeks = 8) {
  const first = weekStart(now) - (weeks - 1) * WEEK;
  const out = Array.from({ length: weeks }, (_, i) => ({ start: first + i * WEEK, saved: 0, anyway: 0 }));
  for (const c of checks || []) {
    // whole days between week starts, robust to daylight-saving shifts
    const i = Math.round((weekStart(c.t) - first) / WEEK);
    if (i < 0 || i >= weeks) continue;
    out[i][c.saved ? "saved" : "anyway"]++;
  }
  return out;
}
