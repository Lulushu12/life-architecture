/**
 * Data layer for the living tracker — pure localStorage, mirrored to a git
 * branch by branchSync.js (see store.js for the key layout). The uid
 * argument is kept for API compatibility with the views; all data is local.
 */

import { lsGet, lsSet } from "./store.js";
import { schedulePush } from "./branchSync.js";

// ── Workout logs ─────────────────────────────────────────────────────────
export async function saveWorkoutLog(_uid, log) {
  lsSet(`wo_${log.date}`, log);
  schedulePush();
}
export async function getWorkoutLog(_uid, date) {
  return lsGet(`wo_${date}`, null);
}
export async function recentWorkoutLogs(_uid, n = 12) {
  return scanDates("wo").slice(-n).map(d => lsGet(`wo_${d}`, null)).filter(Boolean);
}

// ── Meal logs ────────────────────────────────────────────────────────────
export async function saveMealLog(_uid, date, entries) {
  lsSet(`meal_${date}`, entries);
  schedulePush();
}
export async function getMealLog(_uid, date) {
  return lsGet(`meal_${date}`, []);
}

// ── Body metrics ─────────────────────────────────────────────────────────
export async function saveBodyMetric(_uid, date, metric) {
  lsSet(`bm_${date}`, { date, ...lsGet(`bm_${date}`, {}), ...metric });
  schedulePush();
}
export async function recentBodyMetrics(_uid, n = 12) {
  return scanDates("bm").slice(-n).map(d => lsGet(`bm_${d}`, null)).filter(Boolean);
}
export async function deleteBodyMetric(_uid, date) {
  try { localStorage.removeItem(`la3_local_bm_${date}`); } catch { /* blocked */ }
  schedulePush();
}

function scanDates(kind) {
  const prefix = `la3_local_${kind}_`;
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) out.push(k.slice(prefix.length));
    }
  } catch { /* blocked */ }
  return out.sort();
}

export { macroTotals } from "./macros.js";
