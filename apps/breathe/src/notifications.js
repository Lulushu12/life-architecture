import { cancel, isNativeNotify, requestPermission, scheduleAt } from "@shared/notify.js";
import { GETREADY_MS } from "./engine.js";

export const END_ID = 2001;
export const BELL_BASE_ID = 2100;
export const GOAL_ID = 2500;
const MAX_BELLS = 390;
const GOAL_HOUR = 18;

let chain = Promise.resolve();
const run = (fn) => {
  chain = chain.then(fn, fn).catch(() => {});
  return chain;
};

export function askNotifyPermission() {
  if (!isNativeNotify()) return;
  run(() => requestPermission());
}

const cancelMeditation = async () => {
  await cancel(END_ID);
  await cancel(BELL_BASE_ID + 1, { count: MAX_BELLS });
};

export function clearMeditationNotifications() {
  if (!isNativeNotify()) return;
  run(cancelMeditation);
}

export function nextGoalReminder(now) {
  const d = new Date(now);
  d.setHours(GOAL_HOUR, 0, 0, 0);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  if (d.getTime() <= now) d.setDate(d.getDate() + 7);
  return d.getTime();
}

export function syncGoalReminder({ goal, done, weekStart }, now = Date.now()) {
  if (!isNativeNotify()) return;
  const at = nextGoalReminder(now);
  const sameWeek = at < weekStart + 7 * 86400000 + 3600000;
  const left = goal > 0 ? Math.max(0, goal - (sameWeek ? done : 0)) : 0;
  run(async () => {
    await cancel(GOAL_ID);
    if (left <= 0) return;
    await scheduleAt({
      id: GOAL_ID,
      title: "Weekly breathing goal",
      body: `${left} ${left === 1 ? "session" : "sessions"} to go this week`,
      at,
    });
  });
}

export function sittingStart(active) {
  return active.phase === "getready" ? active.phaseStartedAt + GETREADY_MS : active.phaseStartedAt;
}

export function scheduleMeditationNotifications(active, entry, now = Date.now()) {
  if (!isNativeNotify()) return;
  const start = sittingStart(active);
  const targetMs = entry.targetSeconds * 1000;
  const minutes = Math.round(entry.targetSeconds / 60);
  const plan = [];
  if (start + targetMs > now) {
    plan.push({
      id: END_ID,
      title: "Meditation complete",
      body: `${minutes} min sit finished. Take a moment before you get up.`,
      at: start + targetMs,
    });
  }
  const bellMs = entry.bellIntervalMinutes * 60000;
  if (bellMs > 0) {
    for (let k = 1; k * bellMs < targetMs && k <= MAX_BELLS; k++) {
      const at = start + k * bellMs;
      if (at > now) {
        plan.push({ id: BELL_BASE_ID + k, title: "Interval bell", body: `${k * entry.bellIntervalMinutes} min`, at });
      }
    }
  }
  run(async () => {
    await cancelMeditation();
    for (const n of plan) await scheduleAt(n);
  });
}
