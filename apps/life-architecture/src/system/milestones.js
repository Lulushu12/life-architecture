export const milestonesOf = (q) => (Array.isArray(q?.milestones) ? q.milestones.filter(m => m && m.id) : []);

export function milestoneShares(q) {
  const list = milestonesOf(q);
  const xp = Math.max(0, +q?.xp || 0);
  if (!list.length) return [];
  const each = Math.round(xp / list.length);
  return list.map((_, i) => (i === list.length - 1 ? Math.max(0, xp - each * (list.length - 1)) : each));
}

export function longEarned(q) {
  if (!q) return 0;
  if (q.status === "Completed") return +q.xp || 0;
  const list = milestonesOf(q);
  if (!list.length) return 0;
  const shares = milestoneShares(q);
  return list.reduce((s, m, i) => s + (m.done ? shares[i] : 0), 0);
}

export function milestoneProgress(q) {
  const list = milestonesOf(q);
  const done = list.filter(m => m.done).length;
  return { done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
}
