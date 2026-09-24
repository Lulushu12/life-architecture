export function e1rm(reps, weight) {
  const r = Number(reps) || 0;
  const w = Number(weight) || 0;
  if (r <= 0 || w <= 0) return 0;
  return r === 1 ? w : w * (1 + r / 30);
}

export function entryBest(entry) {
  let best = 0;
  for (const s of Array.isArray(entry?.sets) ? entry.sets : []) best = Math.max(best, e1rm(s.reps, s.weight));
  return best;
}

export function entryVolume(entry) {
  let v = 0;
  for (const s of Array.isArray(entry?.sets) ? entry.sets : []) v += (Number(s.reps) || 0) * (Number(s.weight) || 0);
  return v;
}

export function bestBefore(training, exerciseId, date, excludeId) {
  let best = 0;
  for (const [d, day] of Object.entries(training || {})) {
    if (d > date) continue;
    for (const e of day.entries || []) {
      if (e.exerciseId !== exerciseId || e.planned || e.id === excludeId) continue;
      best = Math.max(best, entryBest(e));
    }
  }
  return best;
}

export function isPR(training, date, entry) {
  if (entry.planned) return false;
  const best = entryBest(entry);
  if (!best) return false;
  const prev = bestBefore(training, entry.exerciseId, date, entry.id);
  return prev > 0 && best > prev + 1e-9;
}

export function sessionsFor(training, exerciseId, limit = 12) {
  const rows = [];
  for (const [date, day] of Object.entries(training || {})) {
    let best = 0;
    let minutes = 0;
    let found = false;
    for (const e of day.entries || []) {
      if (e.exerciseId !== exerciseId || e.planned) continue;
      found = true;
      best = Math.max(best, entryBest(e));
      minutes += Number(e.minutes) || 0;
    }
    if (found) rows.push({ date, best, minutes });
  }
  rows.sort((a, b) => (a.date < b.date ? -1 : 1));
  return rows.slice(-limit);
}

export function lastSession(training, exerciseId, beforeDate) {
  let found = null;
  for (const [date, day] of Object.entries(training || {})) {
    if (date >= beforeDate) continue;
    for (const e of day.entries || []) {
      if (e.exerciseId !== exerciseId || e.planned) continue;
      if (!found || date > found.date) found = { date, entry: e };
    }
  }
  return found?.entry || null;
}

export function fmtKg(v) {
  return `${Math.round(v * 10) / 10} kg`;
}

export function fmtVolume(v) {
  return `${Math.round(v).toLocaleString()} kg`;
}
