import { Capacitor } from "@capacitor/core";

export function isNative() {
  if (import.meta.env.MODE === "android") return true;
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}
