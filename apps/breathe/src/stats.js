import { addDays, dayKey } from "@shared/store.js";
import { isRetention } from "./patterns.js";

export function isCounted(entry) {
  if (entry.type === "breathing") return isRetention(entry) ? entry.rounds.length > 0 : (entry.activeSeconds || 0) > 0;
  if (entry.type === "meditation") return typeof entry.actualSeconds === "number" && entry.actualSeconds > 0;
  return false;
}

export function secondsOf(h) {
  if (!isCounted(h)) return 0;
  if (h.type === "meditation") return h.actualSeconds || 0;
  if (typeof h.activeSeconds === "number") return h.activeSeconds;
  if (!isRetention(h)) return 0;
  return h.rounds.reduce(
    (a, r) => a + r.retentionSeconds + h.recoverySeconds + h.breathsPerRound * h.secondsPerBreath,
    0
  );
}

export function startOfWeek(now) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

export function streakFor(history, today) {
  const days = new Set(history.filter(isCounted).map((h) => dayKey(new Date(h.startedAt))));
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function holdsOf(history) {
  const sorted = history
    .filter((h) => h.type === "breathing" && isRetention(h))
    .sort((a, b) => a.startedAt - b.startedAt);
  return sorted.flatMap((h) => h.rounds.map((r) => r.retentionSeconds));
}

export function computeStats(history, today) {
  const weekStart = startOfWeek(Date.now());
  const thisWeek = history.filter((h) => isCounted(h) && h.startedAt >= weekStart);
  const holds = holdsOf(history);
  return {
    breathingThisWeek: thisWeek.filter((h) => h.type === "breathing").length,
    minutesThisWeek: Math.round(thisWeek.reduce((a, h) => a + secondsOf(h), 0) / 60),
    sessionsThisWeek: thisWeek.length,
    streak: streakFor(history, today),
    bestHold: holds.length ? Math.max(...holds) : 0,
  };
}

export function holdSummary(history) {
  const holds = holdsOf(history);
  if (!holds.length) return null;
  return { last: holds[holds.length - 1], best: Math.max(...holds) };
}

export function typicalHold(history) {
  const recent = holdsOf(history).slice(-10);
  if (!recent.length) return 60;
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

export const bestOf = (entry) => (entry.rounds.length ? Math.max(...entry.rounds.map((r) => r.retentionSeconds)) : 0);

export function averageMood(entries) {
  const moods = entries.map((h) => h.mood).filter((m) => Number.isInteger(m));
  if (!moods.length) return null;
  return moods.reduce((a, b) => a + b, 0) / moods.length;
}

export function holdTrend(history, count = 30) {
  return history
    .filter((h) => h.type === "breathing" && isRetention(h) && h.rounds.length > 0)
    .sort((a, b) => a.startedAt - b.startedAt)
    .slice(-count)
    .map((h) => ({ id: h.id, at: h.startedAt, value: bestOf(h), mood: h.mood }));
}

export function weeklyMinutes(history, now = Date.now(), weeks = 12) {
  const current = startOfWeek(now);
  const starts = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(current);
    d.setDate(d.getDate() - i * 7);
    starts.push(d.getTime());
  }
  const buckets = starts.map((start, i) => ({ start, end: starts[i + 1] ?? Infinity, seconds: 0, entries: [] }));
  for (const h of history) {
    if (!isCounted(h) || h.startedAt < starts[0]) continue;
    const b = buckets.find((x) => h.startedAt >= x.start && h.startedAt < x.end);
    if (!b) continue;
    b.seconds += secondsOf(h);
    b.entries.push(h);
  }
  return buckets.map((b) => ({ start: b.start, minutes: Math.round(b.seconds / 60), mood: averageMood(b.entries) }));
}

export function weekProgress(history, goal, now = Date.now()) {
  const start = startOfWeek(now);
  const done = history.filter((h) => isCounted(h) && h.startedAt >= start).length;
  return { done, goal, weekStart: start, left: Math.max(0, goal - done) };
}
