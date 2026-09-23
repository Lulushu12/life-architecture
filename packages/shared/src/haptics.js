export const haptics = {
  tap: 10,
  success: [30, 40, 30],
  warn: [60, 60, 60],
  fail: 120,
};

// Accepts a pattern or a haptics key ("tap", "success", ...).
export function vibrate(pattern, { enabled = true } = {}) {
  if (!enabled) return false;
  const p = typeof pattern === "string" ? haptics[pattern] : pattern;
  if (p == null) return false;
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      return navigator.vibrate(p);
    }
  } catch {
    /* some webviews throw when vibration is blocked */
  }
  return false;
}
