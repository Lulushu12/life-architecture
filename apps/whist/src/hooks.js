import { useCallback, useEffect, useRef, useState } from "react";

export function useFlash(ms = 1800) {
  const [flash, setFlash] = useState(null);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const trigger = useCallback(
    (key) => {
      clearTimeout(timer.current);
      setFlash(key);
      timer.current = setTimeout(() => setFlash(null), ms);
    },
    [ms]
  );
  return [flash, trigger];
}

export function useEscape(onEscape) {
  const ref = useRef(onEscape);
  ref.current = onEscape;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") ref.current?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
}
