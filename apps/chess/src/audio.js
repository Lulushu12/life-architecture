import { audio } from "@shared/audio.js";
import { vibrate } from "@shared/haptics.js";

const tone = audio.tone;

export const sounds = {
  move: () => tone(420, 0.07, { type: "triangle", gain: 0.12, attack: 0.008 }),
  capture: () => {
    tone(300, 0.06, { type: "square", gain: 0.1, attack: 0.008 });
    tone(180, 0.09, { type: "triangle", gain: 0.14, when: 0.02, attack: 0.008 });
  },
  check: () => {
    tone(660, 0.09, { gain: 0.14, attack: 0.008 });
    tone(880, 0.12, { gain: 0.12, when: 0.08, attack: 0.008 });
  },
  chat: () => tone(760, 0.05, { gain: 0.06, attack: 0.008 }),
  gameEnd: audio.success,
  lose: audio.fail,
  lowTime: audio.lowTime,
};

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") audio.ensure();
  });
}

export function play(store, name) {
  if (store.settings.sounds) sounds[name]?.();
}

export function buzz(store, pattern = 15) {
  vibrate(pattern, { enabled: store.settings.haptics });
}
