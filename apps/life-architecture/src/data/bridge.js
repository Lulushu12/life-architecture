import { readEvents, subscribeEvents } from "@shared/bridge.js";
import { addDays } from "@shared/store.js";
import { isNative } from "./platform.js";
import { getMealLogSync } from "./logs.js";
import { macroTotals } from "./macros.js";

export { subscribeEvents };

export const CONSUMED_CAP = 3000;
const KEEP_DAYS = 120;

export function questForTask(name) {
  const n = String(name || "").toLowerCase();
  if (!n) return null;
  if (n.includes("trad")) return "d13";
  if (n.includes("cme")) return "d9";
  if (n.includes("learn") || n.includes("study") || n.includes("course")) return "d18";
  return null;
}

export function pendingEvents(consumed) {
  const seen = new Set(consumed || []);
  return readEvents().filter(e => e && e.id && !seen.has(e.id));
}

function prune(bag, today) {
  const cutoff = addDays(today, -KEEP_DAYS);
  const out = {};
  for (const [k, v] of Object.entries(bag || {})) if (k >= cutoff) out[k] = v;
  return out;
}

export function applyEvents(data, events, today) {
  const focusLog = { ...(data.focusLog || {}) };
  const bridgeMacros = { ...(data.bridgeMacros || {}) };
  const bridgeTraining = { ...(data.bridgeTraining || {}) };
  const completions = [];
  let macrosToday = false;
  let trainingToday = false;

  for (const e of events) {
    const day = e.dayKey || today;
    const v = e.value && typeof e.value === "object" ? e.value : {};
    if (e.type === "focus.pomodoro") {
      const qid = questForTask(v.taskName);
      const min = +v.minutes || 0;
      if (!qid || min <= 0) continue;
      const d = { ...(focusLog[day] || {}) };
      d[qid] = (d[qid] || 0) + min;
      focusLog[day] = d;
      if (day === today && d[qid] >= 25) completions.push(qid);
    } else if (e.type === "breathe.session") {
      if (day === today) completions.push("hf_breath");
    } else if (e.type === "calories.day") {
      const prev = bridgeMacros[day];
      if (!prev || (e.at || 0) >= (prev.at || 0)) {
        bridgeMacros[day] = { kcal: +v.kcal || 0, protein: +v.protein || 0, carbs: +v.carbs || 0, fat: +v.fat || 0, at: e.at || Date.now() };
        if (day === today) macrosToday = true;
      }
    } else if (e.type === "calories.training") {
      bridgeTraining[day] = { at: e.at || Date.now(), exercises: Array.isArray(v.exercises) ? v.exercises.length : +v.exercises || 0 };
      if (day === today) trainingToday = true;
    }
  }

  const consumedEvents = [...(data.consumedEvents || []), ...events.map(e => e.id)].slice(-CONSUMED_CAP);
  return {
    data: {
      ...data,
      consumedEvents,
      focusLog: prune(focusLog, today),
      bridgeMacros: prune(bridgeMacros, today),
      bridgeTraining: prune(bridgeTraining, today),
    },
    completions: [...new Set(completions)],
    macrosToday,
    trainingToday,
  };
}

export function caloriesStoreTotals(day) {
  if (isNative()) return null;
  let store;
  try {
    const raw = localStorage.getItem("calories-v1");
    if (!raw) return null;
    store = JSON.parse(raw);
  } catch {
    return null;
  }
  const dayLogs = store?.logs?.[day];
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, entries: 0 };
  if (!dayLogs || typeof dayLogs !== "object") return t;
  for (const list of Object.values(dayLogs)) {
    if (!Array.isArray(list)) continue;
    for (const e of list) {
      if (!e) continue;
      const g = (+e.grams || 0) / 100;
      t.kcal += (+e.kcal100 || 0) * g;
      t.protein += (+e.protein100 || 0) * g;
      t.carbs += (+e.carbs100 || 0) * g;
      t.fat += (+e.fat100 || 0) * g;
      t.entries++;
    }
  }
  return t;
}

export function hasCaloriesStore() {
  if (isNative()) return false;
  try { return localStorage.getItem("calories-v1") != null; } catch { return false; }
}

export function effectiveMacros(data, day) {
  const bridged = data?.bridgeMacros?.[day];
  if (bridged) return { totals: bridged, source: "calories" };
  const la = macroTotals(getMealLogSync(day));
  const direct = caloriesStoreTotals(day);
  if (direct && (direct.entries > 0 || la.kcal === 0)) return { totals: direct, source: "calories" };
  return { totals: la, source: la.kcal > 0 ? "la" : null };
}
