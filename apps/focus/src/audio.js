// Synthesized Web Audio chime — no audio assets. Browsers require the
// AudioContext to be created (or resumed) from within a user-gesture
// handler, so `ensureAudioContext` is called from click handlers (Start
// pomodoro, enabling a reminder, etc.) and the resulting context is reused
// by `playChime` when timers fire later without a fresh gesture.
let ctx = null;

export function ensureAudioContext() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  else if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function playChime() {
  const c = ctx;
  if (!c || c.state !== "running") return;
  const now = c.currentTime;
  [880, 1318.5].forEach((freq, i) => {
    const start = now + i * 0.16;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.28, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.42);
  });
}
