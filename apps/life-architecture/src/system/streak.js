import { addDays } from "@shared/store.js";
import { STREAK_MULT } from "./constants.js";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdayOfKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12).getDay();
}

export const isScheduled = (q, key) =>
  !Array.isArray(q.days) || q.days.length === 0 || q.days.includes(weekdayOfKey(key));

const anchorOf = (q) => q.lastSched || q.lastDone || "";

function missesBetween(q, anchor, today) {
  let n = 0;
  let k = addDays(anchor, 1);
  for (let guard = 0; k < today && guard < 400 && n < 2; guard++) {
    if (isScheduled(q, k)) n++;
    k = addDays(k, 1);
  }
  return n;
}

export function streakState(q, today) {
  const anchor = anchorOf(q);
  if (!anchor || !q.streak) return { streak: 0, held: false, broken: false };
  if (q.lastDone === today) return { streak: q.streak, held: !!q.graceUsed, broken: false };
  const m = missesBetween(q, anchor, today);
  if (m >= 2) return { streak: 0, held: false, broken: true };
  return { streak: q.streak, held: m === 1, broken: false };
}

export function previewCompletion(q, today) {
  const scheduled = isScheduled(q, today);
  const anchor = anchorOf(q);
  let streak;
  let graceUsed = !!q.graceUsed;
  if (!scheduled) {
    streak = streakState(q, today).streak;
  } else if (!anchor || !q.streak) {
    streak = 1;
    graceUsed = false;
  } else {
    const m = missesBetween(q, anchor, today);
    if (m >= 2) { streak = 1; graceUsed = false; }
    else { streak = q.streak + 1; graceUsed = m === 1; }
  }
  const mult = STREAK_MULT(streak);
  return { streak, graceUsed, mult, xp: Math.round(q.baseXp * mult), scheduled };
}

export function completeQuest(q, today) {
  const p = previewCompletion(q, today);
  const next = {
    ...q,
    prevLastDone: q.lastDone || "",
    prevLastSched: q.lastSched || "",
    prevStreak: q.streak || 0,
    prevGraceUsed: !!q.graceUsed,
    lastDone: today,
    lastSched: p.scheduled ? today : q.lastSched || "",
    streak: p.streak,
    graceUsed: p.graceUsed,
    lastXp: p.xp,
  };
  return { next, xp: p.xp, mult: p.mult, streak: p.streak };
}

export function uncompleteQuest(q) {
  const xp = q.lastXp != null ? q.lastXp : Math.round(q.baseXp * STREAK_MULT(q.streak));
  const { lastXp: _drop, ...rest } = q;
  const next = {
    ...rest,
    lastDone: q.prevLastDone || "",
    lastSched: q.prevLastSched || "",
    streak: q.prevStreak != null ? q.prevStreak : Math.max(0, (q.streak || 0) - 1),
    graceUsed: !!q.prevGraceUsed,
  };
  return { next, xp: -xp };
}

export function daysLabel(days) {
  if (!Array.isArray(days) || days.length === 0 || days.length === 7) return "Daily";
  const s = [...days].sort();
  if (s.join() === "1,2,3,4,5,6") return "Mon-Sat";
  if (s.join() === "1,2,3,4,5") return "Mon-Fri";
  return s.map(d => DAY_SHORT[d]).join(", ");
}

export function ruleHint(q, today) {
  const st = streakState(q, today);
  const parts = [`${daysLabel(q.days)}, never miss twice`];
  if (!isScheduled(q, today)) parts.push("off day: no effect on the streak");
  else if (st.held && q.lastDone !== today) parts.push("1 miss: do it today to keep the streak");
  else if (st.held) parts.push("grace used");
  return parts.join(" · ");
}
