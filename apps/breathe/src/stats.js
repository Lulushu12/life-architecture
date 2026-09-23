import { addDays, dayKey } from "@shared/store.js";

export function isCounted(entry) {
  if (entry.type === "breathing") return entry.rounds.length > 0;
  if (entry.type === "meditation") return typeof entry.actualSeconds === "number" && entry.actualSeconds > 0;
  return false;
}

function startOfWeek(now) {
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
  const sorted = history.filter((h) => h.type === "breathing").sort((a, b) => a.startedAt - b.startedAt);
  return sorted.flatMap((h) => h.rounds.map((r) => r.retentionSeconds));
}

export function computeStats(history, today) {
  const weekStart = startOfWeek(Date.now());
  const thisWeek = history.filter((h) => isCounted(h) && h.startedAt >= weekStart);
  const holds = holdsOf(history);
  return {
    breathingThisWeek: thisWeek.filter((h) => h.type === "breathing").length,
    meditationMinutesThisWeek: Math.round(
      thisWeek.filter((h) => h.type === "meditation").reduce((a, h) => a + h.actualSeconds, 0) / 60
    ),
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
