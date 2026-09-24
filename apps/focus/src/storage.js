import { createStore } from "@shared/store.js";
import { AMBIENCE_IDS, PHASES, phaseDurationMs } from "./logic.js";

export const STORAGE_KEY = "focus-v1";

export const DEFAULT_CONFIG = {
  workMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  longBreakEvery: 4,
  autoStart: false,
  sound: true,
  unit: "min",
};

export const DEFAULT_SETTINGS = {
  vibrate: true,
  keepAwake: true,
  dailyGoal: 8,
  notifAsked: false,
  ambience: { kind: "off", volume: 0.5, muted: false },
};

function normalizeAmbience(a) {
  const d = DEFAULT_SETTINGS.ambience;
  if (!isObj(a)) return { ...d };
  return {
    kind: AMBIENCE_IDS.includes(a.kind) ? a.kind : d.kind,
    volume: clamp(a.volume, 0, 1, d.volume),
    muted: bool(a.muted, false),
  };
}

export function defaultStore(now = Date.now()) {
  return {
    pomodoro: { config: { ...DEFAULT_CONFIG }, run: null, pomosSinceLongBreak: 0, taskId: null, phaseEnd: null },
    tasks: { items: {}, run: null },
    reminders: {
      items: {
        posture: { id: "posture", label: "Posture check", intervalMin: 30, enabled: true, nextDueAt: now + 30 * 60000 },
        stretch: { id: "stretch", label: "Stand up and stretch", intervalMin: 60, enabled: true, nextDueAt: now + 60 * 60000 },
      },
      banners: [],
    },
    logs: { days: {}, sessions: [] },
    settings: { ...DEFAULT_SETTINGS, ambience: { ...DEFAULT_SETTINGS.ambience } },
  };
}

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const fin = (v) => typeof v === "number" && Number.isFinite(v);
const num = (v, d) => (fin(v) ? v : d);
const clamp = (v, lo, hi, d) => Math.min(hi, Math.max(lo, num(v, d)));
const bool = (v, d) => (typeof v === "boolean" ? v : d);
const numMap = (m) => (isObj(m) ? Object.fromEntries(Object.entries(m).filter(([, v]) => fin(v))) : {});

function normalizeConfig(c) {
  const config = { ...DEFAULT_CONFIG, ...(isObj(c) ? c : {}) };
  const unit = import.meta.env.DEV && config.unit === "sec" ? "sec" : "min";
  return {
    ...config,
    workMin: clamp(config.workMin, 1, 600, 25),
    shortBreakMin: clamp(config.shortBreakMin, 1, 600, 5),
    longBreakMin: clamp(config.longBreakMin, 1, 600, 15),
    longBreakEvery: Math.round(clamp(config.longBreakEvery, 2, 12, 4)),
    autoStart: bool(config.autoStart, false),
    sound: bool(config.sound, true),
    unit,
  };
}

function normalizeRun(run, config, taskIds) {
  if (!isObj(run) || !PHASES.includes(run.phase) || !fin(run.phaseEndsAt)) return null;
  const durationMs = fin(run.durationMs) && run.durationMs > 0 ? run.durationMs : phaseDurationMs(config, run.phase);
  const paused = run.pausedRemainingMs == null ? null : clamp(run.pausedRemainingMs, 0, durationMs, durationMs);
  const startedAt = fin(run.startedAt) ? run.startedAt : paused === durationMs ? null : run.phaseEndsAt - durationMs;
  const routine = isObj(run.routine) && typeof run.routine.id === "string" && fin(run.routine.startedAt) ? run.routine : null;
  return {
    ...run,
    durationMs,
    startedAt,
    pausedRemainingMs: paused,
    taskId: run.phase === "work" && taskIds.has(run.taskId) ? run.taskId : null,
    routine,
    routineShift: Math.max(0, Math.round(num(run.routineShift, 0))),
    breakRoutine: typeof run.breakRoutine === "string" ? run.breakRoutine : null,
    distractions: Array.isArray(run.distractions)
      ? run.distractions
          .filter((d) => isObj(d) && fin(d.at))
          .map((d) => (typeof d.text === "string" && d.text ? { at: d.at, text: d.text } : { at: d.at }))
      : [],
  };
}

export function normalize(store) {
  const sec = (v) => (isObj(v) ? v : {});
  const p = sec(store.pomodoro);
  const tk = sec(store.tasks);
  const rm = sec(store.reminders);
  const lg = sec(store.logs);
  const config = normalizeConfig(p.config);

  const items = {};
  for (const [id, t] of Object.entries(isObj(tk.items) ? tk.items : {})) {
    if (!isObj(t)) continue;
    items[id] = { ...t, id, name: String(t.name ?? "Untitled"), archived: !!t.archived, createdAt: num(t.createdAt, 0) };
  }
  const taskIds = new Set(Object.keys(items));
  const tr = tk.run;
  const taskRun =
    isObj(tr) && taskIds.has(tr.taskId) && fin(tr.startedAt)
      ? { ...tr, sessionStart: num(tr.sessionStart, tr.startedAt) }
      : null;

  const reminders = {};
  const now = Date.now();
  for (const [id, r] of Object.entries(isObj(rm.items) ? rm.items : {})) {
    if (!isObj(r)) continue;
    const intervalMin = clamp(r.intervalMin, 0.1, 1440, 30);
    reminders[id] = {
      ...r,
      id,
      label: String(r.label ?? "Reminder"),
      intervalMin,
      enabled: !!r.enabled,
      nextDueAt: num(r.nextDueAt, now + intervalMin * 60000),
    };
  }
  const banners = Array.isArray(rm.banners)
    ? [...new Set(rm.banners.filter((b) => reminders[b]))]
    : [];

  const days = {};
  for (const [key, d] of Object.entries(isObj(lg.days) ? lg.days : {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !isObj(d)) continue;
    days[key] = {
      pomodoroCount: num(d.pomodoroCount, 0),
      pomodoroMinutes: num(d.pomodoroMinutes, 0),
      tasks: numMap(d.tasks),
      pomoTasks: numMap(d.pomoTasks),
    };
  }
  const sessions = Array.isArray(lg.sessions)
    ? lg.sessions.filter((s) => isObj(s) && fin(s.start) && fin(s.end) && typeof s.kind === "string")
    : [];

  const pe = p.phaseEnd;
  const phaseEnd = isObj(pe) && PHASES.includes(pe.finished) && PHASES.includes(pe.next) ? pe : null;

  const s = sec(store.settings);
  return {
    ...store,
    pomodoro: {
      ...p,
      config,
      run: normalizeRun(p.run, config, taskIds),
      pomosSinceLongBreak: Math.max(0, Math.round(num(p.pomosSinceLongBreak, 0))),
      taskId: taskIds.has(p.taskId) ? p.taskId : null,
      phaseEnd,
    },
    tasks: { ...tk, items, run: taskRun },
    reminders: { ...rm, items: reminders, banners },
    logs: { ...lg, days, sessions },
    settings: {
      ...s,
      vibrate: bool(s.vibrate, true),
      keepAwake: bool(s.keepAwake, true),
      dailyGoal: Math.round(clamp(s.dailyGoal, 1, 30, 8)),
      notifAsked: bool(s.notifAsked, false),
      ambience: normalizeAmbience(s.ambience),
    },
  };
}

export const focusStore = createStore({ key: STORAGE_KEY, version: 1, defaults: defaultStore, normalize });

export function validateBackup(obj) {
  return isObj(obj) && isObj(obj.pomodoro) && isObj(obj.tasks) && isObj(obj.reminders) && isObj(obj.logs);
}
