import { useCallback, useEffect, useRef, useState } from "react";
import { cancel, cancelAll, isNativeNotify, requestPermission, scheduleAt } from "@shared/notify.js";
import { NOTIFY_REMINDER_BLOCK, NOTIFY_REMINDER_REPEATS, rollForward } from "./logic.js";

async function readPermission() {
  if (isNativeNotify()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const res = await LocalNotifications.checkPermissions();
      if (res?.display === "granted") return "granted";
      if (res?.display === "denied") return "denied";
      return "prompt";
    } catch {
      return "prompt";
    }
  }
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "default") return "prompt";
  return Notification.permission;
}

export function useNotifyPermission() {
  const [permission, setPermission] = useState("prompt");

  const refresh = useCallback(() => {
    readPermission().then(setPermission);
  }, []);

  useEffect(() => {
    refresh();
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  const request = useCallback(async () => {
    const res = await requestPermission();
    const current = await readPermission();
    setPermission(current === "prompt" && res === "denied" ? "denied" : current);
    return res;
  }, []);

  return { permission, request, refresh };
}

const signature = (n) => `${n.at}|${n.every || 0}|${n.title}|${n.body}`;
const blockSize = (n) => (n.every > 0 ? NOTIFY_REMINDER_BLOCK : 1);

// Keeps the device's pending notifications equal to `plan`. Operations are
// chained so a cancel never races the schedule that replaces it.
export function useNotificationPlan(plan) {
  const applied = useRef(null);
  const queue = useRef(Promise.resolve());
  const key = JSON.stringify(plan);

  useEffect(() => {
    if (!isNativeNotify()) return;
    const wanted = new Map(JSON.parse(key).map((n) => [n.id, n]));
    queue.current = queue.current.then(async () => {
      const now = Date.now();
      if (applied.current == null) {
        await cancelAll(1);
        applied.current = new Map();
      }
      const prev = applied.current;
      const next = new Map();
      for (const [id, n] of prev) {
        const want = wanted.get(id);
        if (!want || signature(want) !== signature(n)) await cancel(id, { count: blockSize(n) });
      }
      for (const [id, n] of wanted) {
        const at = n.every > 0 ? rollForward(n.at, n.every, now) : n.at;
        if (at <= now) continue;
        const old = prev.get(id);
        if (old && signature(old) === signature(n)) {
          next.set(id, n);
          continue;
        }
        const repeat = n.every > 0 ? { every: n.every, count: NOTIFY_REMINDER_REPEATS } : {};
        if (await scheduleAt({ id, title: n.title, body: n.body, at, ...repeat })) next.set(id, n);
      }
      applied.current = next;
    });
  }, [key]);
}
