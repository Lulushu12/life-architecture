import { cancelAll, isNativeNotify, requestPermission, scheduleAt } from "@shared/notify.js";
import { GETREADY_MS } from "./engine.js";

export const END_ID = 2001;
export const BELL_BASE_ID = 2100;
const MAX_BELLS = 899;

let chain = Promise.resolve();
const run = (fn) => {
  chain = chain.then(fn, fn).catch(() => {});
  return chain;
};

export function askNotifyPermission() {
  if (!isNativeNotify()) return;
  run(() => requestPermission());
}

export function clearMeditationNotifications() {
  if (!isNativeNotify()) return;
  run(() => cancelAll(2));
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
    await cancelAll(2);
    for (const n of plan) await scheduleAt(n);
  });
}
