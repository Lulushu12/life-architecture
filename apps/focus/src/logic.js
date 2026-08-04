// Pure state-transition helpers for the pomodoro timer, task stopwatches
// and reminders. Every function takes (store, now) and returns a new
// store — no side effects, no reads of Date.now() inside — so React
// StrictMode's double-invocation of updaters is always safe.
import { addPomodoroCompletion, addTaskElapsed, dayKey } from "./storage.js";

const unitMs = (unit) => (unit === "sec" ? 1000 : 60000);

export function phaseDurationMs(config, phase) {
  const mins =
    phase === "work" ? config.workMin : phase === "short" ? config.shortBreakMin : config.longBreakMin;
  return Math.round(mins * unitMs(config.unit));
}

export function phaseMinutes(config, phase) {
  const mins =
    phase === "work" ? config.workMin : phase === "short" ? config.shortBreakMin : config.longBreakMin;
  // Always express logged/displayed durations in real minutes, even when
  // the debug "sec" unit is active (1 unit-minute == 1 second == 1/60 min).
  return config.unit === "sec" ? mins / 60 : mins;
}

function nextPhase(prevPhase, pomosSinceLongBreak, config) {
  if (prevPhase === "work") {
    const count = pomosSinceLongBreak + 1;
    if (count >= config.longBreakEvery) return { phase: "long", pomosSinceLongBreak: 0 };
    return { phase: "short", pomosSinceLongBreak: count };
  }
  return { phase: "work", pomosSinceLongBreak };
}

export function startPomodoro(store, now) {
  const p = store.pomodoro;
  const phase = p.run?.phase || "work";
  const durationMs = p.run?.pausedRemainingMs ?? phaseDurationMs(p.config, phase);
  return { ...store, pomodoro: { ...p, run: { phase, phaseEndsAt: now + durationMs, pausedRemainingMs: null } } };
}

export function pausePomodoro(store, now) {
  const p = store.pomodoro;
  if (!p.run || p.run.pausedRemainingMs != null) return store;
  const remaining = Math.max(0, p.run.phaseEndsAt - now);
  return { ...store, pomodoro: { ...p, run: { ...p.run, pausedRemainingMs: remaining } } };
}

export function resetPomodoro(store) {
  const p = store.pomodoro;
  return { ...store, pomodoro: { ...p, run: null } };
}

// Skip moves to the next phase without logging a completion (bailing out
// of a phase early shouldn't count as finishing it).
export function skipPomodoro(store, now) {
  const p = store.pomodoro;
  const curPhase = p.run?.phase || "work";
  const { phase, pomosSinceLongBreak } = nextPhase(curPhase, p.pomosSinceLongBreak, p.config);
  const run = p.config.autoStart
    ? { phase, phaseEndsAt: now + phaseDurationMs(p.config, phase), pausedRemainingMs: null }
    : { phase, phaseEndsAt: now, pausedRemainingMs: phaseDurationMs(p.config, phase) };
  return { ...store, pomodoro: { ...p, run, pomosSinceLongBreak } };
}

// Called on load and on every tick. If the running phase's end time has
// already passed — including while the app was fully closed — count it as
// completed, log it, and advance. Bounded loop guards against runaway
// advancement if the device clock jumped.
export function advancePomodoroIfDue(store, now) {
  let p = store.pomodoro;
  let logs = store.logs;
  let guard = 0;
  while (p.run && p.run.pausedRemainingMs == null && p.run.phaseEndsAt <= now && guard < 200) {
    guard++;
    const { phase, phaseEndsAt } = p.run;
    if (phase === "work") {
      logs = addPomodoroCompletion(logs, phaseEndsAt, phaseMinutes(p.config, "work"));
    }
    const { phase: next, pomosSinceLongBreak } = nextPhase(phase, p.pomosSinceLongBreak, p.config);
    const run = p.config.autoStart
      ? { phase: next, phaseEndsAt: phaseEndsAt + phaseDurationMs(p.config, next), pausedRemainingMs: null }
      : { phase: next, phaseEndsAt, pausedRemainingMs: phaseDurationMs(p.config, next) };
    p = { ...p, run, pomosSinceLongBreak };
  }
  if (p === store.pomodoro && logs === store.logs) return store;
  return { ...store, pomodoro: p, logs };
}

export function pomodoroRemainingMs(store, now) {
  const p = store.pomodoro;
  if (!p.run) return phaseDurationMs(p.config, "work");
  if (p.run.pausedRemainingMs != null) return p.run.pausedRemainingMs;
  return Math.max(0, p.run.phaseEndsAt - now);
}

// ---- tasks ----

export function startTask(store, taskId, now) {
  let s = stopRunningTask(store, now);
  return { ...s, tasks: { ...s.tasks, run: { taskId, startedAt: now } } };
}

export function stopRunningTask(store, now) {
  const t = store.tasks;
  if (!t.run) return store;
  const logs = addTaskElapsed(store.logs, t.run.taskId, t.run.startedAt, now);
  return { ...store, tasks: { ...t, run: null }, logs };
}

// On load: if a task was left running (possibly across midnight, possibly
// while the app was fully killed), fold the elapsed time into the day
// logs up to now, then keep it running from "now" so the stopwatch
// continues live without double-counting the already-attributed time.
export function reconcileTasksOnLoad(store, now) {
  const t = store.tasks;
  if (!t.run) return store;
  const logs = addTaskElapsed(store.logs, t.run.taskId, t.run.startedAt, now);
  return { ...store, tasks: { ...t, run: { ...t.run, startedAt: now } }, logs };
}

export function taskTodayMinutes(store, taskId, now) {
  const day = store.logs.days[dayKey(now)];
  let mins = day?.tasks?.[taskId] || 0;
  if (store.tasks.run?.taskId === taskId) {
    mins += (now - store.tasks.run.startedAt) / 60000;
  }
  return mins;
}

// ---- reminders ----

export function reconcileRemindersOnLoad(store, now) {
  const items = store.reminders.items;
  const banners = new Set(store.reminders.banners || []);
  for (const r of Object.values(items)) {
    if (r.enabled && r.nextDueAt <= now) banners.add(r.id);
  }
  return { ...store, reminders: { ...store.reminders, banners: [...banners] } };
}

export function checkRemindersDue(store, now) {
  const items = store.reminders.items;
  const banners = new Set(store.reminders.banners || []);
  let changed = false;
  for (const r of Object.values(items)) {
    if (r.enabled && r.nextDueAt <= now && !banners.has(r.id)) {
      banners.add(r.id);
      changed = true;
    }
  }
  if (!changed) return store;
  return { ...store, reminders: { ...store.reminders, banners: [...banners] } };
}

export function dismissReminder(store, id, now) {
  const items = store.reminders.items;
  const r = items[id];
  if (!r) return store;
  const banners = (store.reminders.banners || []).filter((b) => b !== id);
  return {
    ...store,
    reminders: {
      ...store.reminders,
      items: { ...items, [id]: { ...r, nextDueAt: now + r.intervalMin * 60000 } },
      banners,
    },
  };
}
