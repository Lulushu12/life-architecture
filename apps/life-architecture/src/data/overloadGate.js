/**
 * Progressive-overload gate — pure, deterministic. No AI here.
 *
 * Doc rule: "Advance by the smallest available increment ONLY when 3x10 is
 * clean and pain-free across two consecutive sessions. Hard stop at any
 * discomfort on shoulder work. Drop back to previous weight, not to zero."
 *
 * liftProgress entry shape:
 *   { exercise: id, currentWeightKg, cleanStreak, lastAdvanced: dateKey|null,
 *     history: [{ date, weightKg, event: "advance"|"drop_back"|"start" }] }
 */

import { PROTOCOLS, SETS, REPS } from "../system/exercises.js";

const CATALOG = Object.values(PROTOCOLS).flat().reduce((m, e) => (m[e.id] = e, m), {});

export function defaultProgress(exId) {
  const ex = CATALOG[exId];
  return {
    exercise: exId,
    currentWeightKg: ex ? ex.startWeightKg : 0,
    cleanStreak: 0,
    lastAdvanced: null,
    history: [],
  };
}

export function catalogEntry(exId) { return CATALOG[exId] || null; }

/**
 * Evaluate one logged exercise against the gate.
 * @param progress  current liftProgress entry (or undefined → defaults)
 * @param logged    { sets: [{reps, weightKg, clean, painFree}] }
 * @param date      dateKey of the session
 * @returns { action: "advance"|"hold"|"drop_back"|"untracked", next, reason }
 */
export function evaluateLift(exId, progress, logged, date) {
  const ex = CATALOG[exId];
  const p = progress ? { ...progress, history: [...(progress.history || [])] } : defaultProgress(exId);
  if (!ex) return { action: "untracked", next: p, reason: "Unknown exercise." };

  const sets = (logged && logged.sets) || [];
  const anyPain = sets.some(s => s.painFree === false);

  // HARD STOP — shoulder work with discomfort: drop back to previous weight, never advance.
  if (anyPain && ex.shoulderWork) {
    const prev = [...p.history].reverse().find(h => h.event === "advance");
    const backTo = prev
      ? Math.max(ex.startWeightKg, p.currentWeightKg - (ex.incrementKg || 0))
      : ex.startWeightKg;
    p.currentWeightKg = Math.min(p.currentWeightKg, backTo);
    p.cleanStreak = 0;
    p.history.push({ date, weightKg: p.currentWeightKg, event: "drop_back" });
    return { action: "drop_back", next: p, reason: "Shoulder discomfort — hard stop. Dropped to previous weight, not to zero." };
  }

  // Bodyweight / manual-progression lifts: never auto-advance.
  if (ex.incrementKg == null) {
    return { action: "untracked", next: p, reason: "Bodyweight lift — progression is manual (add weight when 3×10 BW is easy)." };
  }

  // Non-shoulder pain: no advancement, streak resets, weight holds.
  if (anyPain) {
    p.cleanStreak = 0;
    return { action: "hold", next: p, reason: "Discomfort logged — streak reset, weight held." };
  }

  // Clean session test: ≥3 sets of ≥10 clean reps at (or above) current weight.
  const cleanSets = sets.filter(s => s.clean !== false && (s.reps || 0) >= REPS && (s.weightKg || 0) >= p.currentWeightKg);
  const isClean = cleanSets.length >= SETS;

  if (!isClean) {
    p.cleanStreak = 0;
    return { action: "hold", next: p, reason: `Not a clean ${SETS}×${REPS} at ${p.currentWeightKg}kg — streak reset.` };
  }

  p.cleanStreak += 1;
  if (p.cleanStreak >= 2) {
    p.currentWeightKg = +(p.currentWeightKg + ex.incrementKg).toFixed(2);
    p.cleanStreak = 0;
    p.lastAdvanced = date;
    p.history.push({ date, weightKg: p.currentWeightKg, event: "advance" });
    return { action: "advance", next: p, reason: `Two consecutive clean ${SETS}×${REPS} sessions → +${ex.incrementKg}kg → ${p.currentWeightKg}kg.` };
  }
  return { action: "hold", next: p, reason: `Clean session 1/2 at ${p.currentWeightKg}kg — one more to advance.` };
}

/**
 * Run the gate across a whole logged session.
 * @returns { progress: updated map, results: [{exId, name, action, reason}], advances: n }
 */
export function evaluateSession(progressMap, exercisesLogged, date) {
  const progress = { ...(progressMap || {}) };
  const results = [];
  let advances = 0;
  for (const entry of exercisesLogged || []) {
    const exId = entry.id;
    if (!CATALOG[exId]) continue;
    const r = evaluateLift(exId, progress[exId], entry, date);
    progress[exId] = r.next;
    results.push({ exId, name: CATALOG[exId].name, action: r.action, reason: r.reason });
    if (r.action === "advance") advances++;
  }
  return { progress, results, advances };
}

/** Deterministic deload pre-screen (the coach confirms; this only counts regressions). */
export function weightsRegressing(workoutLogs) {
  // true if any lift shows strictly lower top-set weight across 2 consecutive sessions
  const byLift = {};
  for (const log of workoutLogs) {
    for (const ex of log.exercises || []) {
      const top = Math.max(0, ...(ex.sets || []).map(s => s.weightKg || 0));
      (byLift[ex.id] = byLift[ex.id] || []).push({ date: log.date, top });
    }
  }
  return Object.values(byLift).some(arr => {
    const a = arr.sort((x, y) => x.date.localeCompare(y.date));
    for (let i = 2; i < a.length; i++) {
      if (a[i].top < a[i - 1].top && a[i - 1].top < a[i - 2].top) return true;
    }
    return false;
  });
}
