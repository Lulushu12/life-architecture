/**
 * Local-first store. All app data lives in localStorage under la3_local_*;
 * the whole state can be serialized to / restored from a single snapshot
 * object, which is what branchSync.js commits to a git branch.
 *
 * Keys:
 *   la3_local_user          — quests, XP, liftProgress, pplOffset, schemaVersion
 *   la3_local_wo_{date}     — one workout log per day
 *   la3_local_meal_{date}   — meal entries per day
 *   la3_local_bm_{date}     — body metrics per day
 *   la3_local_savedAt       — last local write (ms epoch), for sync conflict resolution
 */

const PREFIX = "la3_local_";

export function lsGet(key, fallback) {
  try { const r = localStorage.getItem(PREFIX + key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
export function lsSet(key, val) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch { /* full/blocked */ }
  touch();
}

export function touch() {
  try { localStorage.setItem(PREFIX + "savedAt", String(Date.now())); } catch { /* ignore */ }
}
export function savedAt() {
  try { return +localStorage.getItem(PREFIX + "savedAt") || 0; } catch { return 0; }
}

function keysByKind(kind) {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX + kind + "_")) out.push(k.slice((PREFIX + kind + "_").length));
    }
  } catch { /* blocked */ }
  return out.sort();
}

/** Serialize the full local state. */
export function buildSnapshot() {
  const pack = (kind) => Object.fromEntries(keysByKind(kind).map(date => [date, lsGet(`${kind}_${date}`, null)]).filter(([, v]) => v != null));
  return {
    savedAt: savedAt(),
    user: lsGet("user", null),
    workoutLogs: pack("wo"),
    mealLogs: pack("meal"),
    bodyMetrics: pack("bm"),
  };
}

/** Restore a snapshot wholesale (remote won a conflict). */
export function applySnapshot(snap) {
  if (!snap) return;
  if (snap.user) lsSet("user", snap.user);
  for (const [kind, bag] of [["wo", snap.workoutLogs], ["meal", snap.mealLogs], ["bm", snap.bodyMetrics]]) {
    for (const [date, val] of Object.entries(bag || {})) lsSet(`${kind}_${date}`, val);
  }
  try { localStorage.setItem(PREFIX + "savedAt", String(snap.savedAt || Date.now())); } catch { /* ignore */ }
}
