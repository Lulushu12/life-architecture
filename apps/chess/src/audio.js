// Synthesized sounds (no audio files) + haptics. The AudioContext is
// created lazily inside a user-gesture call, per mobile autoplay rules.

let ctx = null;
function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, dur, { type = "sine", gain = 0.16, when = 0 } = {}) {
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    const t = c.currentTime + when;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  } catch {
    /* audio unavailable */
  }
}

export const sounds = {
  move: () => tone(420, 0.07, { type: "triangle", gain: 0.12 }),
  capture: () => {
    tone(300, 0.06, { type: "square", gain: 0.1 });
    tone(180, 0.09, { type: "triangle", gain: 0.14, when: 0.02 });
  },
  check: () => {
    tone(660, 0.09, { gain: 0.14 });
    tone(880, 0.12, { gain: 0.12, when: 0.08 });
  },
  chat: () => tone(760, 0.05, { type: "sine", gain: 0.06 }),
  gameEnd: () => {
    tone(523, 0.15, { gain: 0.12 });
    tone(659, 0.15, { gain: 0.12, when: 0.13 });
    tone(784, 0.3, { gain: 0.12, when: 0.26 });
  },
  lose: () => {
    tone(392, 0.18, { gain: 0.12 });
    tone(311, 0.18, { gain: 0.12, when: 0.16 });
    tone(233, 0.35, { gain: 0.12, when: 0.32 });
  },
};

export function play(store, name) {
  if (store.settings.sounds) sounds[name]?.();
}

export function buzz(store, pattern = 15) {
  if (store.settings.haptics && navigator.vibrate) navigator.vibrate(pattern);
}
