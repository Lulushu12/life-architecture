import { vibrate } from "@shared/haptics.js";
import { getSettings } from "./reminders.js";

export const hapticsOn = () => getSettings().haptics !== false;

export function buzz(pattern) {
  if (!hapticsOn()) return;
  if (typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive === false) return;
  vibrate(pattern);
}
