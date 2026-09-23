// Pure state transitions: every exported transition is (store, ...args, now) => store,
// never reads the clock and never touches storage, so StrictMode's double
// invocation of updaters is always safe. Side effects live in App.jsx.
import { addDays, dayKey } from "@shared/store.js";

export const PHASES = ["work", "short", "long"];
export const EXTEND_MIN = 5;
export const SESSION_CAP = 5000;
export const NOTIFY_PHASE_ID = 1001;
export const NOTIFY_REMINDER_BASE = 1100;
export const NOTIFY_REMINDER_BLOCK = 20;
export const NOTIFY_REMINDER_REPEATS = 12;
const NOTIFY_RANGE_END = 2000;

export const PRESETS = [
  { label: "25/5", workMin: 25, shortBreakMin: 5 },
  { label: "50/10", workMin: 50, shortBreakMin: 10 },
  { label: "90/20", workMin: 90, shortBreakMin: 20 },
];

export const isBreak = (phase) => phase === "short" || phase === "long";

const unitMs = (unit) => (unit === "sec" ? 1000 : 60000);

function phaseMins(config, phase) {
  if (phase === "work") return config.workMin;
  if (phase === "short") return config.shortBreakMin;
  return config.longBreakMin;
}

export function phaseDurationMs(config, phase) {
  return Math.round(phaseMins(config, phase) * unitMs(config.unit));
}

export function phaseLabel(phase) {
  if (phase === "short") return "Short break";
  if (phase === "long") return "Long break";
  return "Focus";
}

function nextPhase(prevPhase, pomosSinceLongBreak, config) {
  if (prevPhase === "work") {
    const count = pomosSinceLongBreak + 1;
    if (count >= config.longBreakEvery) return { phase: "long", pomosSinceLongBreak: 0 };
    return { phase: "short", pomosSinceLongBreak: count };
  }
  return { phase: "work", pomosSinceLongBreak };
}

function followingPhase(run, pomosSinceLongBreak, config) {
  if (run.extension) return { phase: run.nextPhase || (run.phase === "work" ? "short" : "work"), pomosSinceLongBreak };
  return nextPhase(run.phase, pomosSinceLongBreak, config);
}

export const isRunning = (run) => !!run && run.pausedRemainingMs == null;
export const isWorkRunning = (store) => isRunning(store.pomodoro.run) && store.pomodoro.run.phase === "work";

function readyRun(phase, durationMs, now, taskId) {
  return { phase, durationMs, startedAt: null, phaseEndsAt: now, pausedRemainingMs: durationMs, taskId: phase === "work" ? taskId : null };
}

function runningRun(phase, durationMs, now, taskId) {
  return { phase, durationMs, startedAt: now, phaseEndsAt: now + durationMs, pausedRemainingMs: null, taskId: phase === "work" ? taskId : null };
}

// ---- logs ----

function emptyDay() {
  return { pomodoroCount: 0, pomodoroMinutes: 0, tasks: {}, pomoTasks: {} };
}

export function sessionId(s) {
  return `${s.kind}-${s.start}-${s.end}`;
}

export function addSession(logs, session) {
  const s = { ...session, id: sessionId(session) };
  const sessions = [...logs.sessions, s];
  return { ...logs, sessions: sessions.length > SESSION_CAP ? sessions.slice(-SESSION_CAP) : sessions };
}

export function addPomodoroCompletion(logs, endedAt, minutes, taskId, { count = true } = {}) {
  const key = dayKey(new Date(endedAt));
  const day = { ...emptyDay(), ...logs.days[key] };
  const pomoTasks = taskId ? { ...day.pomoTasks, [taskId]: (day.pomoTasks[taskId] || 0) + minutes } : day.pomoTasks;
  return {
    ...logs,
    days: {
      ...logs.days,
      [key]: {
        ...day,
        pomodoroCount: day.pomodoroCount + (count ? 1 : 0),
        pomodoroMinutes: day.pomodoroMinutes + minutes,
        pomoTasks,
      },
    },
  };
}

function startOfNextLocalDay(ts) {
  const d = new Date(ts);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

// Splits [startedAt, endedAt) at local midnights so a stopwatch left running
// overnight credits each day with its own share.
export function addTaskElapsed(logs, taskId, startedAt, endedAt) {
  if (endedAt <= startedAt) return logs;
  const days = { ...logs.days };
  let cursor = startedAt;
  let guard = 0;
  while (cursor < endedAt && guard < 3650) {
    guard++;
    const segEnd = Math.min(endedAt, startOfNextLocalDay(cursor));
    const key = dayKey(new Date(cursor));
    const day = { ...emptyDay(), ...days[key] };
    days[key] = { ...day, tasks: { ...day.tasks, [taskId]: (day.tasks[taskId] || 0) + (segEnd - cursor) / 60000 } };
    cursor = segEnd;
  }
  return { ...logs, days };
}

function logPartial(logs, run, now) {
  if (!run || run.startedAt == null) return logs;
  const remaining = isRunning(run) ? Math.max(0, run.phaseEndsAt - now) : run.pausedRemainingMs;
  if (run.durationMs - remaining < 1000) return logs;
  return addSession(logs, { start: run.startedAt, end: now, kind: run.phase, taskId: run.taskId || null, completed: false });
}

// ---- pomodoro ----

// A work phase and a task stopwatch never run together, so no minute is
// counted twice: the pomodoro takes over the stopwatch's task.
function absorbStopwatch(store, at) {
  const t = store.tasks.run;
  if (!t) return { store, taskId: null };
  return { store: stopRunningTask(store, Math.max(at, t.startedAt)), taskId: t.taskId };
}

function beginRun(store, run, now) {
  let s = store;
  let taskId = s.pomodoro.taskId;
  if (run.phase === "work") {
    const absorbed = absorbStopwatch(s, now);
    s = absorbed.store;
    if (absorbed.taskId) taskId = absorbed.taskId;
  }
  const p = s.pomodoro;
  return {
    ...s,
    pomodoro: { ...p, taskId, phaseEnd: null, run: { ...run, taskId: run.phase === "work" ? taskId : null } },
  };
}

export function startPomodoro(store, now) {
  const p = store.pomodoro;
  if (isRunning(p.run)) return store;
  const phase = p.run?.phase || "work";
  const durationMs = p.run?.durationMs ?? phaseDurationMs(p.config, phase);
  const remaining = p.run?.pausedRemainingMs ?? durationMs;
  const run = {
    ...(p.run || {}),
    phase,
    durationMs,
    startedAt: p.run?.startedAt ?? now,
    phaseEndsAt: now + remaining,
    pausedRemainingMs: null,
  };
  return beginRun(store, run, now);
}

export function pausePomodoro(store, now) {
  const p = store.pomodoro;
  if (!isRunning(p.run)) return store;
  const remaining = Math.max(0, p.run.phaseEndsAt - now);
  return { ...store, pomodoro: { ...p, run: { ...p.run, pausedRemainingMs: remaining } } };
}

export function resetPomodoro(store, now) {
  const p = store.pomodoro;
  if (!p.run && !p.phaseEnd) return store;
  return { ...store, logs: logPartial(store.logs, p.run, now), pomodoro: { ...p, run: null, phaseEnd: null } };
}

export function skipPomodoro(store, now) {
  const p = store.pomodoro;
  const cur = p.run || readyRun("work", phaseDurationMs(p.config, "work"), now, p.taskId);
  const logs = logPartial(store.logs, p.run, now);
  const { phase, pomosSinceLongBreak } = followingPhase(cur, p.pomosSinceLongBreak, p.config);
  const durationMs = phaseDurationMs(p.config, phase);
  const s = { ...store, logs, pomodoro: { ...p, pomosSinceLongBreak, phaseEnd: null, run: readyRun(phase, durationMs, now, p.taskId) } };
  return p.config.autoStart ? beginRun(s, runningRun(phase, durationMs, now, p.taskId), now) : s;
}

export function skipBreak(store, now) {
  const run = store.pomodoro.run;
  if (run && isBreak(run.phase)) return startPomodoro(skipPomodoro(store, now), now);
  return startPomodoro(store, now);
}

export function startFocus(store, now) {
  const run = store.pomodoro.run;
  if (isRunning(run)) return store;
  if (run && isBreak(run.phase)) return skipBreak(store, now);
  return startPomodoro(store, now);
}

export function extendPhase(store, now) {
  const p = store.pomodoro;
  const pe = p.phaseEnd;
  if (!pe) return store;
  const durationMs = EXTEND_MIN * unitMs(p.config.unit);
  const run = { ...runningRun(pe.finished, durationMs, now, p.taskId), extension: true, nextPhase: pe.next };
  return beginRun(store, run, now);
}

export function dismissPhaseEnd(store) {
  const p = store.pomodoro;
  if (!p.phaseEnd) return store;
  return { ...store, pomodoro: { ...p, phaseEnd: null } };
}

// Runs on load, on every tick and on resume. A phase that ended while the app
// was closed still counts as completed and is logged at its real end time.
export function advancePomodoroIfDue(store, now) {
  let s = store;
  let guard = 0;
  while (guard < 200) {
    const p = s.pomodoro;
    const run = p.run;
    if (!isRunning(run) || run.phaseEndsAt > now) break;
    guard++;
    const end = run.phaseEndsAt;
    let logs = addSession(s.logs, {
      start: run.startedAt ?? end - run.durationMs,
      end,
      kind: run.phase,
      taskId: run.taskId || null,
      completed: true,
      ...(run.extension ? { extension: true } : {}),
    });
    if (run.phase === "work") {
      logs = addPomodoroCompletion(logs, end, run.durationMs / 60000, run.taskId || null, { count: !run.extension });
    }
    const { phase: next, pomosSinceLongBreak } = followingPhase(run, p.pomosSinceLongBreak, p.config);
    const durationMs = phaseDurationMs(p.config, next);
    s = { ...s, logs, pomodoro: { ...p, pomosSinceLongBreak } };
    if (p.config.autoStart) {
      s = beginRun(s, runningRun(next, durationMs, end, p.taskId), end);
    } else {
      s = {
        ...s,
        pomodoro: {
          ...s.pomodoro,
          run: readyRun(next, durationMs, end, p.taskId),
          phaseEnd: { finished: run.phase, next, at: end, extension: !!run.extension },
        },
      };
    }
  }
  return s;
}

export function pomodoroRemainingMs(store, now) {
  const p = store.pomodoro;
  if (!p.run) return phaseDurationMs(p.config, "work");
  if (p.run.pausedRemainingMs != null) return p.run.pausedRemainingMs;
  return Math.max(0, p.run.phaseEndsAt - now);
}

export function pomodoroTotalMs(store) {
  const p = store.pomodoro;
  return p.run?.durationMs ?? phaseDurationMs(p.config, "work");
}

// A phase that is loaded but not yet started follows config edits.
export function applyConfig(store, patch) {
  const p = store.pomodoro;
  const config = { ...p.config, ...patch };
  let run = p.run;
  if (run && run.startedAt == null && !run.extension) {
    const durationMs = phaseDurationMs(config, run.phase);
    run = { ...run, durationMs, pausedRemainingMs: durationMs };
  }
  return { ...store, pomodoro: { ...p, config, run } };
}

export function setPomodoroTask(store, taskId) {
  const p = store.pomodoro;
  const run = p.run && p.run.phase === "work" ? { ...p.run, taskId } : p.run;
  return { ...store, pomodoro: { ...p, taskId, run } };
}

// ---- tasks ----

export function addTask(store, id, name, now) {
  return {
    ...store,
    tasks: { ...store.tasks, items: { ...store.tasks.items, [id]: { id, name, archived: false, createdAt: now } } },
  };
}

export function stopRunningTask(store, now) {
  const t = store.tasks;
  if (!t.run) return store;
  let logs = addTaskElapsed(store.logs, t.run.taskId, t.run.startedAt, now);
  const start = t.run.sessionStart ?? t.run.startedAt;
  if (now - start >= 1000) logs = addSession(logs, { start, end: now, kind: "task", taskId: t.run.taskId, completed: true });
  return { ...store, tasks: { ...t, run: null }, logs };
}

export function startTask(store, taskId, now) {
  if (isWorkRunning(store)) return setPomodoroTask(store, taskId);
  const s = stopRunningTask(store, now);
  return { ...s, tasks: { ...s.tasks, run: { taskId, startedAt: now, sessionStart: now } } };
}

// Folds time elapsed while the app was closed into the day logs and keeps the
// stopwatch running from now; sessionStart keeps the true start for the log.
export function reconcileTasksOnLoad(store, now) {
  const t = store.tasks;
  if (!t.run) return store;
  const logs = addTaskElapsed(store.logs, t.run.taskId, t.run.startedAt, now);
  return { ...store, tasks: { ...t, run: { ...t.run, startedAt: now } }, logs };
}

function patchTask(store, id, patch) {
  const t = store.tasks.items[id];
  if (!t) return store;
  return { ...store, tasks: { ...store.tasks, items: { ...store.tasks.items, [id]: { ...t, ...patch } } } };
}

export function renameTask(store, id, name) {
  return name ? patchTask(store, id, { name }) : store;
}

export function archiveTask(store, id, now) {
  const s = store.tasks.run?.taskId === id ? stopRunningTask(store, now) : store;
  return patchTask(s, id, { archived: true });
}

export function unarchiveTask(store, id) {
  return patchTask(store, id, { archived: false });
}

export function deleteTask(store, id, now) {
  let s = store.tasks.run?.taskId === id ? stopRunningTask(store, now) : store;
  if (!s.tasks.items[id]) return s;
  const items = { ...s.tasks.items };
  delete items[id];
  s = { ...s, tasks: { ...s.tasks, items } };
  if (s.pomodoro.taskId === id) s = setPomodoroTask(s, null);
  if (s.pomodoro.run?.taskId === id) s = { ...s, pomodoro: { ...s.pomodoro, run: { ...s.pomodoro.run, taskId: null } } };
  return s;
}

export function restoreTask(store, task) {
  if (!task || store.tasks.items[task.id]) return store;
  return { ...store, tasks: { ...store.tasks, items: { ...store.tasks.items, [task.id]: task } } };
}

export function taskTodayMinutes(store, taskId, now) {
  const day = store.logs.days[dayKey(new Date(now))];
  let mins = (day?.tasks?.[taskId] || 0) + (day?.pomoTasks?.[taskId] || 0);
  if (store.tasks.run?.taskId === taskId) mins += Math.max(0, now - store.tasks.run.startedAt) / 60000;
  return mins;
}

// ---- reminders ----

export function rollForward(due, intervalMs, after) {
  if (due > after || !(intervalMs > 0)) return due;
  return due + (Math.floor((after - due) / intervalMs) + 1) * intervalMs;
}

function onBreak(store) {
  const run = store.pomodoro.run;
  return isRunning(run) && isBreak(run.phase);
}

// Reminders that come due during a break are covered by the break itself.
export function effectiveDueAt(store, r) {
  const run = store.pomodoro.run;
  if (onBreak(store) && r.nextDueAt < run.phaseEndsAt) {
    return rollForward(r.nextDueAt, r.intervalMin * 60000, run.phaseEndsAt - 1);
  }
  return r.nextDueAt;
}

export function checkRemindersDue(store, now) {
  const { items, banners } = store.reminders;
  const shown = new Set(banners);
  const breakNow = onBreak(store);
  let nextItems = items;
  let nextBanners = banners;
  for (const r of Object.values(items)) {
    if (!r.enabled || r.nextDueAt > now || shown.has(r.id)) continue;
    if (breakNow) {
      nextItems = { ...nextItems, [r.id]: { ...r, nextDueAt: rollForward(r.nextDueAt, r.intervalMin * 60000, now) } };
    } else {
      nextBanners = [...nextBanners, r.id];
    }
  }
  if (nextItems === items && nextBanners === banners) return store;
  return { ...store, reminders: { ...store.reminders, items: nextItems, banners: nextBanners } };
}

export function dismissReminder(store, id, now) {
  const r = store.reminders.items[id];
  const banners = store.reminders.banners.filter((b) => b !== id);
  if (!r) return { ...store, reminders: { ...store.reminders, banners } };
  const nextDueAt = rollForward(r.nextDueAt, r.intervalMin * 60000, now);
  return {
    ...store,
    reminders: { ...store.reminders, items: { ...store.reminders.items, [id]: { ...r, nextDueAt } }, banners },
  };
}

export function addReminder(store, id, label, intervalMin, now) {
  const r = { id, label, intervalMin, enabled: true, nextDueAt: now + intervalMin * 60000 };
  return { ...store, reminders: { ...store.reminders, items: { ...store.reminders.items, [id]: r } } };
}

export function setReminderEnabled(store, id, enabled, now) {
  const r = store.reminders.items[id];
  if (!r) return store;
  const next = { ...r, enabled, nextDueAt: enabled ? now + r.intervalMin * 60000 : r.nextDueAt };
  const banners = enabled ? store.reminders.banners : store.reminders.banners.filter((b) => b !== id);
  return { ...store, reminders: { ...store.reminders, items: { ...store.reminders.items, [id]: next }, banners } };
}

export function setReminderInterval(store, id, intervalMin, now) {
  const r = store.reminders.items[id];
  if (!r) return store;
  const anchor = r.nextDueAt - r.intervalMin * 60000;
  let nextDueAt = anchor + intervalMin * 60000;
  if (nextDueAt <= now) nextDueAt = now + intervalMin * 60000;
  return {
    ...store,
    reminders: { ...store.reminders, items: { ...store.reminders.items, [id]: { ...r, intervalMin, nextDueAt } } },
  };
}

export function deleteReminder(store, id) {
  const items = { ...store.reminders.items };
  delete items[id];
  return { ...store, reminders: { ...store.reminders, items, banners: store.reminders.banners.filter((b) => b !== id) } };
}

export function restoreReminder(store, r) {
  if (!r || store.reminders.items[r.id]) return store;
  return { ...store, reminders: { ...store.reminders, items: { ...store.reminders.items, [r.id]: r } } };
}

// ---- combined ----

export function reconcile(store, now) {
  return checkRemindersDue(advancePomodoroIfDue(store, now), now);
}

export function reconcileOnLoad(store, now) {
  return reconcile(reconcileTasksOnLoad(store, now), now);
}

// ---- notifications ----

function phaseNotice(phase, autoStart) {
  if (phase === "work") return { title: "Focus complete", body: autoStart ? "Break started." : "Time for a break." };
  return { title: "Break over", body: autoStart ? "Focus started." : "Back to focus when you're ready." };
}

// Everything that should be pending as a native local notification right now.
export function notificationPlan(store) {
  const plan = [];
  const p = store.pomodoro;
  if (isRunning(p.run)) {
    let run = p.run;
    let since = p.pomosSinceLongBreak;
    let at = run.phaseEndsAt;
    const chain = p.config.autoStart ? 4 : 1;
    for (let i = 0; i < chain; i++) {
      plan.push({ id: NOTIFY_PHASE_ID + i, at, ...phaseNotice(run.phase, p.config.autoStart) });
      const next = followingPhase(run, since, p.config);
      since = next.pomosSinceLongBreak;
      at += phaseDurationMs(p.config, next.phase);
      run = { phase: next.phase };
    }
  }
  Object.values(store.reminders.items).forEach((r, i) => {
    if (!r.enabled || store.reminders.banners.includes(r.id)) return;
    const id = NOTIFY_REMINDER_BASE + i * NOTIFY_REMINDER_BLOCK;
    if (id + NOTIFY_REMINDER_BLOCK > NOTIFY_RANGE_END) return;
    plan.push({ id, at: effectiveDueAt(store, r), every: r.intervalMin * 60000, title: r.label, body: "Reminder due" });
  });
  return plan;
}

// ---- stats ----

export function dayFocusMinutes(day) {
  if (!day) return 0;
  return (day.pomodoroMinutes || 0) + Object.values(day.tasks || {}).reduce((a, b) => a + b, 0);
}

export function lastNDayKeys(today, n) {
  const keys = [];
  for (let i = n - 1; i >= 0; i--) keys.push(addDays(today, -i));
  return keys;
}

export function goalStreaks(days, goal, today) {
  const met = (k) => (days[k]?.pomodoroCount || 0) >= goal;
  let current = 0;
  let k = met(today) ? today : addDays(today, -1);
  while (met(k) && current < 10000) {
    current++;
    k = addDays(k, -1);
  }
  let best = 0;
  let run = 0;
  let prev = null;
  for (const key of Object.keys(days).filter(met).sort()) {
    run = prev && addDays(prev, 1) === key ? run + 1 : 1;
    best = Math.max(best, run);
    prev = key;
  }
  return { current, best: Math.max(best, current) };
}
