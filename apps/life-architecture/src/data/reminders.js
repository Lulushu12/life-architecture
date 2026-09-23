import { scheduleAt, cancel, requestPermission, isNativeNotify } from "@shared/notify.js";
import { SCHEDULE_V2 } from "../system/schedule.js";
import { WEEKDAYS } from "../system/constants.js";

const BASE_ID = 3001;
const PER_DAY = 3;
const DAYS = 7;
const SETTINGS_KEY = "la3_settings";

export function getSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch { return {}; }
}
export function setSettings(patch) {
  const next = { ...getSettings(), ...patch };
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { /* blocked */ }
  return next;
}

function blockTime(day, test, fallback) {
  const b = (day?.blocks || []).find(test);
  const m = b && /(\d{1,2}):(\d{2})/.exec(b.time);
  return m ? [+m[1], +m[2]] : fallback;
}

export function plannedReminders(from = new Date()) {
  const out = [];
  for (let i = 0; i < DAYS; i++) {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    const day = SCHEDULE_V2[WEEKDAYS[(date.getDay() + 6) % 7]];
    const items = [
      { slot: 0, title: "Phone dock", body: "Dock the phone. Physical distance, no screens after this.", hm: blockTime(day, b => /phone docked/i.test(b.label), [21, 0]) },
      { slot: 1, title: "VMO + bedtime mobility", body: "Mat out. VMO and mobility before lights out.", hm: blockTime(day, b => b.type === "mobility", [21, 45]) },
    ];
    if (date.getDay() === 0) items.push({ slot: 2, title: "Waist measurement", body: "Before eating or drinking. Log it in Fuel.", hm: [10, 0] });
    for (const it of items) {
      const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(), it.hm[0], it.hm[1]).getTime();
      if (at > from.getTime()) out.push({ id: BASE_ID + i * PER_DAY + it.slot, title: it.title, body: it.body, at });
    }
  }
  return out;
}

export async function cancelReminders() {
  if (!isNativeNotify()) return;
  for (let id = BASE_ID; id < BASE_ID + DAYS * PER_DAY; id++) await cancel(id);
}

export async function rescheduleReminders(enabled) {
  if (!isNativeNotify()) return { ok: false, native: false, count: 0 };
  await cancelReminders();
  if (!enabled) return { ok: true, native: true, count: 0 };
  let count = 0;
  for (const r of plannedReminders()) if (await scheduleAt(r)) count++;
  return { ok: true, native: true, count };
}

export async function enableReminders() {
  const perm = await requestPermission();
  if (perm !== "granted") return { ok: false, perm };
  const res = await rescheduleReminders(true);
  return { ...res, perm };
}
