import { audio } from "@shared/audio.js";
import { vibrate } from "@shared/haptics.js";

const BUZZ = {
  tap: 12,
  phase: [40, 50, 40],
  bell: [80, 60, 80],
  gong: [250, 120, 250],
  finish: [30, 40, 30, 40, 120],
};

export function cue(settings, sound, buzz) {
  if (sound) audio.play(sound, { enabled: settings.soundOn });
  if (buzz) vibrate(BUZZ[buzz] ?? buzz, { enabled: settings.vibrateOn });
}
