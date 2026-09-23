// Synthesized cues, no audio files. Mobile browsers only let an AudioContext
// start inside a user gesture, so call audio.ensure() from a tap handler (and
// on visibilitychange); cues fired later by timers reuse that context.

let ctx = null;

function ensure() {
  try {
    const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return null;
    if (!ctx || ctx.state === "closed") ctx = new AC();
    if (ctx.state !== "running") {
      const p = ctx.resume();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, dur = 0.12, { type = "sine", gain = 0.16, when = 0, attack = 0.01 } = {}) {
  const c = ensure();
  if (!c) return;
  try {
    const t = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  } catch {
    /* audio glitches must never break a session */
  }
}

const cues = {
  tick: () => tone(880, 0.09, { gain: 0.16 }),
  tickLast: () => tone(1320, 0.14, { gain: 0.2 }),
  chime: () => {
    tone(880, 0.4, { gain: 0.26, attack: 0.02 });
    tone(1318.5, 0.4, { gain: 0.26, attack: 0.02, when: 0.16 });
  },
  bell: () => {
    tone(660, 0.7, { type: "triangle", gain: 0.22, attack: 0.015 });
    tone(1320, 0.5, { gain: 0.1, when: 0.02 });
  },
  // Phone speakers roll off below ~400 Hz, so the 196 Hz fundamental alone is
  // nearly silent on a phone; the upper partials carry it.
  gong: () => {
    tone(196, 2.4, { gain: 0.26, attack: 0.015 });
    tone(294, 2.0, { gain: 0.14, attack: 0.015, when: 0.06 });
    tone(392, 2.2, { gain: 0.14, attack: 0.015, when: 0.01 });
    tone(588, 1.8, { gain: 0.09, attack: 0.015, when: 0.03 });
    tone(784, 1.4, { gain: 0.06, attack: 0.015, when: 0.05 });
  },
  click: () => tone(420, 0.07, { type: "triangle", gain: 0.12, attack: 0.005 }),
  warn: () => {
    tone(440, 0.14, { type: "triangle", gain: 0.18 });
    tone(440, 0.14, { type: "triangle", gain: 0.18, when: 0.2 });
  },
  success: () => {
    tone(523, 0.15, { gain: 0.12 });
    tone(659, 0.15, { gain: 0.12, when: 0.13 });
    tone(784, 0.3, { gain: 0.12, when: 0.26 });
  },
  fail: () => {
    tone(392, 0.18, { gain: 0.12 });
    tone(311, 0.18, { gain: 0.12, when: 0.16 });
    tone(233, 0.35, { gain: 0.12, when: 0.32 });
  },
  lowTime: () => {
    tone(988, 0.08, { type: "square", gain: 0.07, attack: 0.005 });
    tone(988, 0.08, { type: "square", gain: 0.07, attack: 0.005, when: 0.14 });
  },
};

function play(name, { enabled = true } = {}) {
  if (!enabled) return;
  const cue = cues[name];
  if (cue) cue();
}

export const audio = { ensure, tone, play, ...cues };
