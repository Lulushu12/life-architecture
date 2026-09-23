export const STATS_CAP = 500;

export function pushStat(stats, game, entry) {
  const list = [...(stats?.[game] || []), { at: Date.now(), ...entry }];
  return { ...stats, [game]: list.length > STATS_CAP ? list.slice(-STATS_CAP) : list };
}

export function summarize(list, keyOf) {
  const out = {};
  for (const rec of list || []) {
    const key = keyOf(rec);
    const sec = Number(rec.seconds);
    if (key == null || !Number.isFinite(sec)) continue;
    const s = out[key] || (out[key] = { count: 0, best: Infinity, total: 0 });
    s.count++;
    s.total += sec;
    if (sec < s.best) s.best = sec;
  }
  for (const s of Object.values(out)) s.avg = s.total / s.count;
  return out;
}
