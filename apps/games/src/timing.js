import { useEffect, useRef, useState } from "react";

export function elapsedOf(rec, now = Date.now()) {
  if (!rec) return 0;
  const base = Number(rec.elapsedMs) || 0;
  return rec.resumedAt != null ? base + Math.max(0, now - rec.resumedAt) : base;
}

export function stopTimer(rec, now = Date.now()) {
  if (!rec || rec.resumedAt == null) return rec;
  return { ...rec, elapsedMs: elapsedOf(rec, now), resumedAt: null };
}

export function fmtElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export function fmtSeconds(sec) {
  return fmtElapsed((Number(sec) || 0) * 1000);
}

export function usePageVisible() {
  const [visible, setVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible"
  );
  useEffect(() => {
    const on = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", on);
    window.addEventListener("pagehide", on);
    return () => {
      document.removeEventListener("visibilitychange", on);
      window.removeEventListener("pagehide", on);
    };
  }, []);
  return visible;
}

export function useActiveTimer(update, running, idle = false) {
  const updateRef = useRef(update);
  updateRef.current = update;
  useEffect(() => {
    if (!running) return undefined;
    updateRef.current((r) => (r && r.resumedAt == null ? { ...r, resumedAt: Date.now() } : r));
    return () => updateRef.current((r) => stopTimer(r));
  }, [running]);
  useEffect(() => {
    if (running && idle) updateRef.current((r) => (r && r.resumedAt == null ? { ...r, resumedAt: Date.now() } : r));
  }, [running, idle]);
}

export function useFocused() {
  const read = () => typeof document === "undefined" || typeof document.hasFocus !== "function" || document.hasFocus();
  const [focused, setFocused] = useState(read);
  useEffect(() => {
    const on = () => setFocused(read());
    window.addEventListener("focus", on);
    window.addEventListener("blur", on);
    document.addEventListener("visibilitychange", on);
    return () => {
      window.removeEventListener("focus", on);
      window.removeEventListener("blur", on);
      document.removeEventListener("visibilitychange", on);
    };
  }, []);
  return focused;
}

export function useTicker(active, every = 1000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), every);
    return () => clearInterval(id);
  }, [active, every]);
}
