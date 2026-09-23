import { Capacitor, registerPlugin } from "@capacitor/core";

// A bare-specifier import("@capacitor/local-notifications") cannot resolve in
// the built bundle, and a literal one would force every app to install the
// package. On native the JS package only calls registerPlugin, so do that
// directly; the native half still comes from the package via `cap sync`.
let plugin = null;
function localNotifications() {
  if (!isNativeNotify()) return null;
  if (!plugin) plugin = registerPlugin("LocalNotifications");
  return plugin;
}

const webSupported = () => typeof Notification !== "undefined";

export function isNativeNotify() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function requestPermission() {
  try {
    const ln = localNotifications();
    if (ln) {
      const res = await ln.requestPermissions();
      return res?.display === "granted" ? "granted" : "denied";
    }
    if (!webSupported()) return "unsupported";
    const res = await Notification.requestPermission();
    return res === "granted" ? "granted" : "denied";
  } catch {
    return isNativeNotify() || webSupported() ? "denied" : "unsupported";
  }
}

export async function scheduleAt({ id, title, body, at, channel, every, count = 12 }) {
  const ln = localNotifications();
  if (!ln) return false;
  try {
    const times = every > 0 ? Array.from({ length: Math.max(1, count) }, (_, k) => at + k * every) : [at];
    const notifications = times.map((t, k) => {
      const n = { id: id + k, title, body, schedule: { at: new Date(t), allowWhileIdle: true } };
      if (channel) n.channelId = channel;
      return n;
    });
    await ln.schedule({ notifications });
    return true;
  } catch (err) {
    console.warn("scheduleAt failed:", err);
    return false;
  }
}

export async function cancel(id, { count = 1 } = {}) {
  const ln = localNotifications();
  if (!ln) return false;
  try {
    const notifications = Array.from({ length: Math.max(1, count) }, (_, k) => ({ id: id + k }));
    await ln.cancel({ notifications });
    return true;
  } catch {
    return false;
  }
}

// Ids are numbers, so `prefix` matches the id's leading digits (1 -> 1000-1999).
export async function cancelAll(prefix) {
  const ln = localNotifications();
  if (!ln) return false;
  try {
    const { notifications = [] } = await ln.getPending();
    const ids = notifications
      .filter((n) => prefix == null || String(n.id).startsWith(String(prefix)))
      .map((n) => ({ id: n.id }));
    if (ids.length) await ln.cancel({ notifications: ids });
    return true;
  } catch {
    return false;
  }
}

export async function notifyNow({ title, body, tag, id }) {
  const ln = localNotifications();
  if (ln) {
    try {
      const nid = id ?? 1000000 + Math.floor(Math.random() * 1000000);
      await ln.schedule({ notifications: [{ id: nid, title, body }] });
      return true;
    } catch {
      return false;
    }
  }
  if (!webSupported() || Notification.permission !== "granted") return false;
  const options = { body, tag, icon: `${import.meta.env.BASE_URL}icon-192.png` };
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && typeof reg.showNotification === "function") {
        await reg.showNotification(title, options);
        return true;
      }
    }
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}
