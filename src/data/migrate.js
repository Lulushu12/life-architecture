/**
 * v8 → v3 migration. Runs once per account (schemaVersion gate).
 * Preserves: longQ untouched, cumulativeDailyXP untouched, daily streaks
 * carried across via V8_DAILY_MIGRATION id map. Retired v8 HF quests
 * (swim, full-body home, core circuit) are dropped; their XP already lives
 * in cumulativeDailyXP so nothing is lost.
 */

import { DEFAULT_DAILY_V2, V8_DAILY_MIGRATION } from "../system/quests.js";

export const SCHEMA_VERSION = 3;

export function migrateUserData(data) {
  if ((data.schemaVersion || 0) >= SCHEMA_VERSION) return { data, changed: false };

  const oldDaily = data.dailyQ || [];
  const byOldId = oldDaily.reduce((m, q) => (m[q.id] = q, m), {});

  const dailyQ = DEFAULT_DAILY_V2.map(def => {
    // carry streak/lastDone from a mapped v8 quest, or from an identical id (non-HF carryovers)
    const mappedOldId = Object.keys(V8_DAILY_MIGRATION).find(k => V8_DAILY_MIGRATION[k] === def.id);
    const old = byOldId[def.id] || (mappedOldId ? byOldId[mappedOldId] : null);
    return old ? { ...def, streak: old.streak || 0, lastDone: old.lastDone || "" } : def;
  });

  // user-added daily quests (ids not in defaults and not v8 defaults) survive
  const knownOld = new Set(["d1","d2","d3","d4","d5","d6","d7","d7b","d7c","d8","d9","d10","d11","d12","d13","d14","d15","d16","d17","d18","d19","d20","d21","d22"]);
  const knownNew = new Set(DEFAULT_DAILY_V2.map(q => q.id));
  const custom = oldDaily.filter(q => !knownOld.has(q.id) && !knownNew.has(q.id));

  return {
    data: {
      ...data,
      dailyQ: [...dailyQ, ...custom],
      longQ: data.longQ || [],
      cumulativeDailyXP: data.cumulativeDailyXP || 0,
      liftProgress: data.liftProgress || {},
      pplOffset: data.pplOffset || 0,
      schemaVersion: SCHEMA_VERSION,
    },
    changed: true,
  };
}
