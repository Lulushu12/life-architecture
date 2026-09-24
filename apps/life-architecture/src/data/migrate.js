import { cleanTargets } from "../system/targets.js";
import { DEFAULT_DAILY_V2, V8_DAILY_MIGRATION, DEFAULT_DAYS, BREATH_QUEST } from "../system/quests.js";

export const SCHEMA_VERSION = 4;

const KNOWN_V8 = new Set(["d1","d2","d3","d4","d5","d6","d7","d7b","d7c","d8","d9","d10","d11","d12","d13","d14","d15","d16","d17","d18","d19","d20","d21","d22"]);
const DEFAULT_BY_ID = Object.fromEntries(DEFAULT_DAILY_V2.map(q => [q.id, q]));

function toV3(data) {
  const oldDaily = Array.isArray(data.dailyQ) ? data.dailyQ : [];
  const byOldId = oldDaily.reduce((m, q) => (q && q.id ? (m[q.id] = q, m) : m), {});
  const dailyQ = DEFAULT_DAILY_V2.map(def => {
    const mappedOldId = Object.keys(V8_DAILY_MIGRATION).find(k => V8_DAILY_MIGRATION[k] === def.id);
    const old = byOldId[def.id] || (mappedOldId ? byOldId[mappedOldId] : null);
    return old ? { ...def, streak: old.streak || 0, lastDone: old.lastDone || "" } : def;
  });
  const knownNew = new Set(DEFAULT_DAILY_V2.map(q => q.id));
  const custom = oldDaily.filter(q => q && !KNOWN_V8.has(q.id) && !knownNew.has(q.id));
  return {
    ...data,
    dailyQ: [...dailyQ, ...custom],
    longQ: data.longQ || [],
    cumulativeDailyXP: data.cumulativeDailyXP || 0,
    liftProgress: data.liftProgress || {},
    pplOffset: data.pplOffset || 0,
  };
}

function toV4(data) {
  const dailyQ = (data.dailyQ || []).map(q => {
    if (!q || !q.id) return q;
    const def = DEFAULT_BY_ID[q.id];
    const out = { ...q };
    if (out.days === undefined && DEFAULT_DAYS[q.id]) out.days = DEFAULT_DAYS[q.id];
    if (def && def.note !== undefined) out.note = def.note;
    return out;
  });
  if (!dailyQ.some(q => q && q.id === BREATH_QUEST.id)) {
    const idx = dailyQ.findIndex(q => q && q.id === "hf_lights");
    dailyQ.splice(idx >= 0 ? idx + 1 : dailyQ.length, 0, { ...BREATH_QUEST });
  }
  const longQ = (data.longQ || []).map(q =>
    q && q.id === "l5" && q.due === undefined && q.status !== "Completed" ? { ...q, due: "2026-09-30" } : q,
  );
  return { ...data, dailyQ, longQ };
}

const num = (v, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : +v || d);
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

export function normalizeUser(data) {
  const dailyQ = (Array.isArray(data.dailyQ) ? data.dailyQ : [])
    .filter(q => q && typeof q === "object" && q.id)
    .map(q => {
      const out = { ...q, title: String(q.title || q.id), baseXp: num(q.baseXp, 25), streak: num(q.streak), lastDone: typeof q.lastDone === "string" ? q.lastDone : "" };
      if (Array.isArray(q.skips)) out.skips = q.skips.filter(k => typeof k === "string" && /^\d{4}-\d{2}-\d{2}$/.test(k)).slice(-120);
      else delete out.skips;
      return out;
    });
  const longQ = (Array.isArray(data.longQ) ? data.longQ : [])
    .filter(q => q && typeof q === "object" && q.id)
    .map(q => {
      const out = { ...q, title: String(q.title || ""), xp: num(q.xp), status: q.status || "Pending" };
      if (Array.isArray(q.milestones)) out.milestones = q.milestones.filter(m => m && typeof m === "object" && m.id).map(m => ({ id: String(m.id), title: String(m.title || ""), done: !!m.done }));
      else delete out.milestones;
      return out;
    });
  return {
    ...data,
    dailyQ,
    longQ,
    cumulativeDailyXP: num(data.cumulativeDailyXP),
    liftProgress: obj(data.liftProgress),
    pplOffset: num(data.pplOffset),
    consumedEvents: Array.isArray(data.consumedEvents) ? data.consumedEvents.slice(-3000) : [],
    focusLog: obj(data.focusLog),
    bridgeMacros: obj(data.bridgeMacros),
    bridgeTraining: obj(data.bridgeTraining),
    dayLog: obj(data.dayLog),
    reviews: obj(data.reviews),
    targets: cleanTargets(data.targets),
  };
}

export function migrateUserData(input) {
  let data = obj(input);
  const from = data.schemaVersion || 0;
  let changed = false;
  if (from < 3) { data = toV3(data); changed = true; }
  if (from < 4) { data = toV4(data); changed = true; }
  return { data: { ...normalizeUser(data), schemaVersion: SCHEMA_VERSION }, changed };
}
