import { vibrate } from "@shared/haptics.js";
import { gainFor, playSound } from "./sounds.js";
import { speak } from "./voice.js";

const BUZZ = {
  tap: 12,
  phase: [40, 50, 40],
  bell: [80, 60, 80],
  gong: [250, 120, 250],
  finish: [30, 40, 30, 40, 120],
};

const TICKS = new Set(["tick", "tickLast"]);

export function cue(settings, sound, buzz, phrase) {
  if (buzz) vibrate(BUZZ[buzz] ?? buzz, { enabled: settings.vibrateOn });
  const play = sound && settings.soundOn ? () => playSound(sound, settings.volume) : null;
  const deferred = play && !TICKS.has(sound) ? play : null;
  const spoke =
    !!phrase && settings.voiceOn && speak(phrase, { volume: Math.sqrt(gainFor(settings.volume)), then: deferred });
  if (play && !spoke) play();
}
