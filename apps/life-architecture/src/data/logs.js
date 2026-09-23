import { lsGet, lsSet, lsRemove, keysByKind } from "./store.js";
import { schedulePush } from "./branchSync.js";

export async function saveWorkoutLog(_uid, log) {
  lsSet(`wo_${log.date}`, log);
  schedulePush();
}
export async function getWorkoutLog(_uid, date) {
  return lsGet(`wo_${date}`, null);
}
export function getWorkoutLogSync(date) {
  return lsGet(`wo_${date}`, null);
}
export async function recentWorkoutLogs(_uid, n = 12) {
  return keysByKind("wo").slice(-n).map(d => lsGet(`wo_${d}`, null)).filter(Boolean);
}

export async function saveMealLog(_uid, date, entries) {
  lsSet(`meal_${date}`, entries);
  schedulePush();
}
export async function getMealLog(_uid, date) {
  return lsGet(`meal_${date}`, []);
}
export function getMealLogSync(date) {
  return lsGet(`meal_${date}`, []);
}

export async function saveBodyMetric(_uid, date, metric) {
  lsSet(`bm_${date}`, { date, ...lsGet(`bm_${date}`, {}), ...metric });
  schedulePush();
}
export async function recentBodyMetrics(_uid, n = 12) {
  return recentBodyMetricsSync(n);
}
export function recentBodyMetricsSync(n = 12) {
  return keysByKind("bm").slice(-n).map(d => lsGet(`bm_${d}`, null)).filter(Boolean);
}
export async function deleteBodyMetric(_uid, date) {
  lsRemove(`bm_${date}`);
  schedulePush();
}

