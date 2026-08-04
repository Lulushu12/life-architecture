// All sound cues are synthesized with the Web Audio API — no audio files.
// The AudioContext itself must be created/resumed from inside a user
// gesture (the start-button click handler); see getAudioCtx() in App.jsx.
// These helpers just schedule tones on an already-live context.

function tone(ctx, { freq = 440, duration = 0.12, type = "sine", gain = 0.2, delay = 0 }) {
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.03);
  } catch {
    /* audio glitches should never break a session */
  }
}

// Short tick on each breath.
export function playTick(ctx) {
  tone(ctx, { freq: 880, duration: 0.09, type: "sine", gain: 0.16 });
}

// Two-note cue for entering a new phase (retention / recovery).
export function playPhaseChime(ctx) {
  tone(ctx, { freq: 660, duration: 0.16, type: "triangle", gain: 0.2 });
  tone(ctx, { freq: 990, duration: 0.2, type: "triangle", gain: 0.16, delay: 0.14 });
}

// Interval bell during meditation.
export function playBell(ctx) {
  tone(ctx, { freq: 660, duration: 0.7, type: "triangle", gain: 0.22 });
  tone(ctx, { freq: 1320, duration: 0.5, type: "sine", gain: 0.1, delay: 0.02 });
}

// Lower, longer closing gong.
export function playGong(ctx) {
  tone(ctx, { freq: 196, duration: 2.4, type: "sine", gain: 0.26 });
  tone(ctx, { freq: 294, duration: 2.0, type: "sine", gain: 0.14, delay: 0.06 });
}
