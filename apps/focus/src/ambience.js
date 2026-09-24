import { audio } from "@shared/audio.js";

export const AMBIENCE_KINDS = [
  { id: "off", label: "Off" },
  { id: "brown", label: "Brown noise" },
  { id: "pink", label: "Pink noise" },
  { id: "rain", label: "Rain" },
];

const LOOP_SECONDS = { brown: 6, pink: 6, rain: 9 };
const LEVEL = { brown: 0.9, pink: 0.55, rain: 0.8 };
const FADE_IN = 1.5;
const FADE_OUT = 0.4;

const buffers = new Map();
let current = null;

function white() {
  return Math.random() * 2 - 1;
}

function fillBrown(out) {
  let last = 0;
  for (let i = 0; i < out.length; i++) {
    last = (last + 0.02 * white()) / 1.02;
    out[i] = last * 3.5;
  }
}

function fillPink(out) {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < out.length; i++) {
    const w = white();
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
}

function fillRain(out, rate) {
  fillPink(out);
  let prev = 0;
  for (let i = 0; i < out.length; i++) {
    const p = out[i];
    out[i] = (p - prev * 0.6) * 0.45;
    prev = p;
  }
  const drops = Math.round((out.length / rate) * 70);
  for (let d = 0; d < drops; d++) {
    const pos = Math.floor(Math.random() * out.length);
    const amp = 0.04 + Math.random() ** 3 * 0.5;
    const tau = rate * (0.0015 + Math.random() * 0.006);
    const len = Math.min(out.length - pos, Math.floor(tau * 6));
    for (let j = 0; j < len; j++) out[pos + j] += white() * amp * Math.exp(-j / tau);
  }
}

const FILL = { brown: fillBrown, pink: fillPink, rain: fillRain };

function makeBuffer(ctx, kind) {
  const key = `${kind}@${ctx.sampleRate}`;
  if (buffers.has(key)) return buffers.get(key);
  const rate = ctx.sampleRate;
  const n = Math.floor(LOOP_SECONDS[kind] * rate);
  const fade = Math.floor(rate * 0.25);
  const buf = ctx.createBuffer(2, n, rate);
  for (let ch = 0; ch < 2; ch++) {
    const raw = new Float32Array(n + fade);
    FILL[kind](raw, rate);
    const data = buf.getChannelData(ch);
    for (let i = 0; i < n; i++) data[i] = raw[i];
    for (let i = 0; i < fade; i++) {
      const t = i / fade;
      data[i] = raw[i] * t + raw[n + i] * (1 - t);
    }
  }
  buffers.set(key, buf);
  return buf;
}

const gainFor = (kind, volume) => LEVEL[kind] * Math.max(0, Math.min(1, volume)) ** 2;

export function startAmbience(kind, volume) {
  if (!FILL[kind]) return stopAmbience();
  const ctx = audio.ensure();
  if (!ctx) return;
  if (current && current.kind === kind && current.ctx === ctx) {
    setAmbienceVolume(volume);
    return;
  }
  stopAmbience();
  try {
    const src = ctx.createBufferSource();
    src.buffer = makeBuffer(ctx, kind);
    src.loop = true;
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(gainFor(kind, volume), t + FADE_IN);
    let node = src;
    if (kind === "rain") {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 7000;
      node = node.connect(lp);
    }
    node.connect(gain).connect(ctx.destination);
    src.start();
    current = { kind, ctx, src, gain };
  } catch {
    current = null;
  }
}

export function setAmbienceVolume(volume) {
  if (!current) return;
  try {
    const t = current.ctx.currentTime;
    current.gain.gain.cancelScheduledValues(t);
    current.gain.gain.setTargetAtTime(gainFor(current.kind, volume), t, 0.08);
  } catch {
    return;
  }
}

export function stopAmbience() {
  const c = current;
  current = null;
  if (!c) return;
  try {
    const t = c.ctx.currentTime;
    c.gain.gain.cancelScheduledValues(t);
    c.gain.gain.setValueAtTime(c.gain.gain.value, t);
    c.gain.gain.linearRampToValueAtTime(0, t + FADE_OUT);
    c.src.stop(t + FADE_OUT + 0.05);
  } catch {
    return;
  }
}
