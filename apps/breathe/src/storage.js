import { Capacitor } from "@capacitor/core";
import { createStore, newId } from "@shared/store.js";

export const STORE_KEY = "breathe-v1";

export const PRESETS = [
  { id: "beginner", label: "Beginner", rounds: 3, breathsPerRound: 20, secondsPerBreath: 4 },
  { id: "standard", label: "Standard", rounds: 3, breathsPerRound: 30, secondsPerBreath: 3.5 },
  { id: "advanced", label: "Advanced", rounds: 4, breathsPerRound: 35, secondsPerBreath: 3 },
];

function isNative() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function defaults() {
  return {
    settings: {
      preset: "standard",
      rounds: 3,
      breathsPerRound: 30,
      secondsPerBreath: 3.5,
      recoverySeconds: 15,
      soundOn: true,
      vibrateOn: true,
      safetyAcknowledged: false,
    },
    meditationSettings: {
      durationMinutes: 10,
      bellIntervalMinutes: 0,
      autoPause: !isNative(),
    },
    history: [],
    activeSession: null,
  };
}

export const round1 = (n) => Math.round(n * 10) / 10;

const num = (v, fallback) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

function normalizeEntry(h) {
  if (!isObj(h) || (h.type !== "breathing" && h.type !== "meditation")) return null;
  const rounds = (Array.isArray(h.rounds) ? h.rounds : [])
    .filter((r) => isObj(r) && Number.isFinite(r.retentionSeconds))
    .map((r) => ({ ...r, retentionSeconds: round1(Math.max(0, r.retentionSeconds)) }));
  const out = {
    ...h,
    id: typeof h.id === "string" && h.id ? h.id : newId(),
    startedAt: num(h.startedAt, 0),
    endedAt: num(h.endedAt, null),
    complete: !!h.complete,
    rounds,
  };
  if (h.type === "breathing") {
    out.plannedRounds = Math.max(1, num(h.plannedRounds, rounds.length || 1));
    out.breathsPerRound = Math.max(1, num(h.breathsPerRound, 30));
    out.secondsPerBreath = Math.max(0.5, num(h.secondsPerBreath, 3.5));
    out.recoverySeconds = Math.max(0, num(h.recoverySeconds, 15));
  } else {
    out.targetSeconds = Math.max(1, num(h.targetSeconds, 600));
    out.bellIntervalMinutes = Math.max(0, num(h.bellIntervalMinutes, 0));
    out.actualSeconds = num(h.actualSeconds, null);
    out.bells = Math.max(0, num(h.bells, 0));
  }
  return out;
}

function normalizeActive(a, history) {
  if (!isObj(a) || !history.some((h) => h.id === a.id && h.type === a.mode)) return null;
  if (!Number.isFinite(a.phaseStartedAt) || typeof a.phase !== "string") return null;
  return {
    ...a,
    round: Math.max(0, num(a.round, 0)),
    pausedAt: num(a.pausedAt, null),
    pausedMs: Math.max(0, num(a.pausedMs, 0)),
    bellsRung: Math.max(0, num(a.bellsRung, 0)),
    startedAt: num(a.startedAt, a.phaseStartedAt),
    updatedAt: num(a.updatedAt, a.phaseStartedAt),
  };
}

function normalizeSettings(st) {
  const s = isObj(st) ? { ...defaults().settings, ...st } : defaults().settings;
  const p = PRESETS.find((x) => x.id === s.preset);
  const matches = p && p.rounds === s.rounds && p.breathsPerRound === s.breathsPerRound && p.secondsPerBreath === s.secondsPerBreath;
  if (!matches) s.preset = "custom";
  return s;
}

export function normalize(store) {
  const settings = normalizeSettings(store.settings);
  const history = (Array.isArray(store.history) ? store.history : []).map(normalizeEntry).filter(Boolean);
  return { ...store, settings, history, activeSession: normalizeActive(store.activeSession, history) };
}

export const storeDef = createStore({
  key: STORE_KEY,
  version: 1,
  defaults,
  migrate: (store) => store,
  normalize,
});

export function validateBackup(obj) {
  if (!isObj(obj) || !Array.isArray(obj.history)) return { ok: false };
  const kept = obj.history.map(normalizeEntry).filter(Boolean);
  return { ok: true, dropped: obj.history.length - kept.length };
}

export function fromBackup(obj, current) {
  const d = defaults();
  const merged = {
    ...d,
    ...obj,
    settings: { ...d.settings, ...(isObj(obj.settings) ? obj.settings : {}) },
    meditationSettings: { ...d.meditationSettings, ...(isObj(obj.meditationSettings) ? obj.meditationSettings : {}) },
    activeSession: null,
  };
  merged.settings.safetyAcknowledged = !!(merged.settings.safetyAcknowledged || current?.settings?.safetyAcknowledged);
  const { _recovered, ...rest } = normalize(merged);
  return { ...rest, version: 1 };
}
