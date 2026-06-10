/**
 * Firestore data layer for the living tracker, local-first with localStorage mirror.
 *
 * Layout:
 *   users/{uid}                       — quests, XP, liftProgress, pplOffset, schemaVersion
 *   users/{uid}/workoutLogs/{date}    — one doc per day
 *   users/{uid}/mealLogs/{date}       — one doc per day: { entries: [...] }
 *   users/{uid}/bodyMetrics/{date}    — { waistCm?, weightKg? }
 *
 * Firestore rules need the subcollection wildcard:
 *   match /users/{userId}/{document=**} { allow read, write: if request.auth.uid == userId; }
 */

import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

const LS = (uid, key) => `la3_${uid}_${key}`;

function lsGet(uid, key, fallback) {
  try { const r = localStorage.getItem(LS(uid, key)); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function lsSet(uid, key, val) {
  try { localStorage.setItem(LS(uid, key), JSON.stringify(val)); } catch { /* full/blocked */ }
}

const sub = (uid, name) => collection(db, "users", uid, name);

// ── Workout logs ─────────────────────────────────────────────────────────
export async function saveWorkoutLog(uid, log) {
  lsSet(uid, `wo_${log.date}`, log);
  await setDoc(doc(sub(uid, "workoutLogs"), log.date), log).catch(() => {});
}
export async function getWorkoutLog(uid, date) {
  try {
    const snap = await getDoc(doc(sub(uid, "workoutLogs"), date));
    if (snap.exists()) return snap.data();
  } catch { /* offline */ }
  return lsGet(uid, `wo_${date}`, null);
}
export async function recentWorkoutLogs(uid, n = 12) {
  try {
    const snap = await getDocs(query(sub(uid, "workoutLogs"), orderBy("date", "desc"), limit(n)));
    if (!snap.empty) return snap.docs.map(d => d.data()).sort((a, b) => a.date.localeCompare(b.date));
  } catch { /* offline */ }
  return [];
}

// ── Meal logs ────────────────────────────────────────────────────────────
export async function saveMealLog(uid, date, entries) {
  lsSet(uid, `meal_${date}`, entries);
  await setDoc(doc(sub(uid, "mealLogs"), date), { date, entries }).catch(() => {});
}
export async function getMealLog(uid, date) {
  try {
    const snap = await getDoc(doc(sub(uid, "mealLogs"), date));
    if (snap.exists()) return snap.data().entries || [];
  } catch { /* offline */ }
  return lsGet(uid, `meal_${date}`, []);
}

// ── Body metrics ─────────────────────────────────────────────────────────
export async function saveBodyMetric(uid, date, metric) {
  lsSet(uid, `bm_${date}`, metric);
  await setDoc(doc(sub(uid, "bodyMetrics"), date), { date, ...metric }, { merge: true }).catch(() => {});
}
export async function recentBodyMetrics(uid, n = 12) {
  try {
    const snap = await getDocs(query(sub(uid, "bodyMetrics"), orderBy("date", "desc"), limit(n)));
    if (!snap.empty) return snap.docs.map(d => d.data()).sort((a, b) => a.date.localeCompare(b.date));
  } catch { /* offline */ }
  return [];
}
export async function deleteBodyMetric(uid, date) {
  try { await deleteDoc(doc(sub(uid, "bodyMetrics"), date)); } catch { /* offline */ }
}

export { macroTotals } from "./macros.js";
