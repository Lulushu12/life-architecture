/**
 * Local-first store. All app data lives in localStorage under la3_local_*;
 * the whole state can be serialized to / restored from a single snapshot.
 *
 * Keys:
 *   la3_local_user          quests, XP, liftProgress, pplOffset, schemaVersion, ledger state
 *   la3_local_wo_{date}     one workout log per day
 *   la3_local_meal_{date}   meal entries per day
 *   la3_local_bm_{date}     body metrics per day
 *   la3_local_savedAt       last local write (ms epoch), for sync conflict resolution
 */

export const PREFIX = "la3_local_";
export const USER_KEY = PREFIX + "user";

let status = { ok: true, error: null };
const listeners = new Set();

function setStatus(next) {
  if (next.ok === status.ok && next.error === status.error) return;
  status = next;
  for (const cb of listeners) cb(status);
}

export function onStorageStatus(cb) {
  listeners.add(cb);
  cb(status);
  return () => listeners.delete(cb);
}

function isQuota(e) {
  return !!e && (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.code === 22);
}

export function lsGet(key, fallback) {
  try { const r = localStorage.getItem(PREFIX + key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}

export function lsSet(key, val) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(val));
  } catch (e) {
    const res = { ok: false, error: isQuota(e) ? "Storage full: changes are not being saved." : "Storage is unavailable: changes are not being saved." };
    setStatus(res);
    return res;
  }
  touch();
  setStatus({ ok: true, error: null });
  return { ok: true, error: null };
}

export function lsRemove(key) {
  try { localStorage.removeItem(PREFIX + key); } catch { /* blocked */ }
  touch();
}

export function loadUserRaw() {
  let raw = null;
  try { raw = localStorage.getItem(USER_KEY); } catch { return { data: null, recovered: false }; }
  if (raw == null) return { data: null, recovered: false };
  try {
    const data = JSON.parse(raw);
    if (data && typeof data === "object" && !Array.isArray(data)) return { data, recovered: false };
  } catch { /* fall through */ }
  try { localStorage.setItem(USER_KEY + ".corrupt", raw); } catch { /* nowhere to keep it */ }
  return { data: null, recovered: true };
}

export function touch(at = Date.now()) {
  try { localStorage.setItem(PREFIX + "savedAt", String(at)); } catch { /* ignore */ }
}
export function savedAt() {
  try { return +localStorage.getItem(PREFIX + "savedAt") || 0; } catch { return 0; }
}

export function keysByKind(kind) {
  const out = [];
  const p = PREFIX + kind + "_";
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(p)) out.push(k.slice(p.length));
    }
  } catch { /* blocked */ }
  return out.sort();
}

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

export function applySnapshot(snap, { stamp } = {}) {
  if (!snap) return;
  if (snap.user) lsSet("user", snap.user);
  for (const [kind, bag] of [["wo", snap.workoutLogs], ["meal", snap.mealLogs], ["bm", snap.bodyMetrics]]) {
    for (const [date, val] of Object.entries(bag || {})) lsSet(`${kind}_${date}`, val);
  }
  touch(stamp || snap.savedAt || Date.now());
}
