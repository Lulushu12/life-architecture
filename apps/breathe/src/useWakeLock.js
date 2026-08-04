import { useEffect, useRef } from "react";

// Keeps the screen awake while `active` is true. Feature-detected — silently
// does nothing on browsers without the API. Re-acquires the lock whenever
// the tab becomes visible again while a session is still running, since the
// OS releases it automatically when the tab is hidden.
export function useWakeLock(active) {
  const lockRef = useRef(null);

  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let cancelled = false;

    navigator.wakeLock
      .request("screen")
      .then((lock) => {
        if (cancelled) {
          lock.release().catch(() => {});
        } else {
          lockRef.current = lock;
        }
      })
      .catch(() => {
        /* denied / unsupported in this context: fine, just no lock */
      });

    return () => {
      cancelled = true;
      if (lockRef.current) {
        lockRef.current.release().catch(() => {});
        lockRef.current = null;
      }
    };
  }, [active]);

  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    const onVisible = () => {
      if (document.visibilityState === "visible" && !lockRef.current) {
        navigator.wakeLock
          .request("screen")
          .then((lock) => {
            lockRef.current = lock;
          })
          .catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [active]);
}
