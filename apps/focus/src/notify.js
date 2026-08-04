// Notification API helpers — everything feature-detected so the app never
// throws on browsers/webviews that lack it or restrict it.
export function notifySupported() {
  return typeof Notification !== "undefined";
}

export function notifyPermission() {
  return notifySupported() ? Notification.permission : "unsupported";
}

export function requestNotifyPermission() {
  if (!notifySupported()) return Promise.resolve("unsupported");
  return Notification.requestPermission();
}

export async function sendNotification(title, body) {
  if (!notifySupported() || Notification.permission !== "granted") return;
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        reg.showNotification(title, { body, icon: "icon-192.png" });
        return;
      }
    }
    new Notification(title, { body });
  } catch {
    /* best-effort only — never let a notification failure break the app */
  }
}
