let voices = [];
let gen = 0;
const timers = new Set();

function synth() {
  try {
    if (typeof window === "undefined") return null;
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") return null;
    return window.speechSynthesis;
  } catch {
    return null;
  }
}

function loadVoices() {
  const s = synth();
  if (!s) return;
  try {
    voices = s.getVoices() || [];
  } catch {
    voices = [];
  }
}

(() => {
  const s = synth();
  if (!s) return;
  loadVoices();
  try {
    s.addEventListener("voiceschanged", loadVoices);
  } catch {
    return;
  }
})();

export const voiceSupported = () => !!synth();

export function voiceAvailable() {
  if (!voices.length) loadVoices();
  return !!synth() && voices.length > 0;
}

function pickVoice() {
  const lang = (typeof navigator !== "undefined" && navigator.language) || "en";
  const base = lang.slice(0, 2).toLowerCase();
  const english = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("en"));
  const pool = base === "en" ? english : english.length ? english : voices;
  return pool.find((v) => v.localService && v.default) || pool.find((v) => v.localService) || pool[0] || null;
}

function later(fn, ms) {
  const t = setTimeout(() => {
    timers.delete(t);
    fn();
  }, ms);
  timers.add(t);
  return t;
}

export function speak(text, { volume = 1, then } = {}) {
  const s = synth();
  if (!s || !voiceAvailable() || volume <= 0) return false;
  try {
    s.cancel();
    const u = new window.SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    }
    u.volume = Math.min(1, Math.max(0, volume));
    u.rate = 0.9;
    const mine = ++gen;
    let done = false;
    let fallback = null;
    const finish = (delay) => {
      if (done) return;
      done = true;
      if (fallback) {
        clearTimeout(fallback);
        timers.delete(fallback);
      }
      if (then && mine === gen) later(then, delay);
    };
    u.onend = () => finish(300);
    u.onerror = () => finish(0);
    fallback = later(() => finish(0), 4000);
    s.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function cancelVoice() {
  gen++;
  for (const t of timers) clearTimeout(t);
  timers.clear();
  try {
    synth()?.cancel();
  } catch {
    return;
  }
}
