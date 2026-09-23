import { useEffect, useRef } from "react";

// Keeps the screen awake while `active` is true; silently a no-op without the
// API. The OS releases the lock whenever the page is hidden, so it is
// re-requested on visibilitychange once the page is visible again.
export function useWakeLock(active) {
  const lockRef = useRef(null);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let cancelled = false;
    let pending = false;

    const acquire = () => {
      if (cancelled || pending || document.visibilityState !== "visible") return;
      if (lockRef.current && !lockRef.current.released) return;
      pending = true;
      navigator.wakeLock
        .request("screen")
        .then((lock) => {
          pending = false;
          // The session may have ended while the request was in flight.
          if (cancelled) {
            lock.release().catch(() => {});
            return;
          }
          lockRef.current = lock;
          lock.addEventListener("release", () => {
            if (lockRef.current === lock) lockRef.current = null;
          });
        })
        .catch(() => {
          pending = false;
        });
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      const lock = lockRef.current;
      lockRef.current = null;
      if (lock && !lock.released) lock.release().catch(() => {});
    };
  }, [active]);
}
