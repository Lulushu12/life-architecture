// Local-calendar date helpers. We always work with YYYY-MM-DD strings built
// from local getFullYear/getMonth/getDate, never toISOString(), so a day
// boundary always matches what the device clock shows the user.

export function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr() {
  return toDateStr(new Date());
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return toDateStr(dt);
}

export function fmtDateHeader(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const today = todayStr();
  const yest = addDays(today, -1);
  const tom = addDays(today, 1);
  if (dateStr === today) return "Today";
  if (dateStr === yest) return "Yesterday";
  if (dateStr === tom) return "Tomorrow";
  return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

// Last `n` date strings ending at (and including) `endDateStr`, oldest first.
export function lastNDates(endDateStr, n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(endDateStr, -i));
  return out;
}
