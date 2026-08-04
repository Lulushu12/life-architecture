// Everything lives in one localStorage key, written through on every state
// change — killing the app or rebooting the phone never loses anything.

const KEY = "focus-v1";

export function defaultStore() {
  const now = Date.now();
  return {
    pomodoro: {
      config: {
        workMin: 25,
        shortBreakMin: 5,
        longBreakMin: 15,
        longBreakEvery: 4,
        autoStart: false,
        sound: true,
        unit: "min", // "min" | "sec" — "sec" is a debug/testing toggle
      },
      run: null, // { phase: 'work'|'short'|'long', phaseEndsAt, pausedRemainingMs }
      pomosSinceLongBreak: 0,
    },
    tasks: {
      items: {}, // id -> { id, name, archived, createdAt }
      run: null, // { taskId, startedAt }
    },
    reminders: {
      items: {
        posture: {
          id: "posture",
          label: "Posture check",
          intervalMin: 30,
          enabled: true,
          nextDueAt: now + 30 * 60000,
        },
        stretch: {
          id: "stretch",
          label: "Stand up & stretch",
          intervalMin: 60,
          enabled: true,
          nextDueAt: now + 60 * 60000,
        },
      },
      banners: [], // ids of reminders currently overdue/showing a banner
    },
    logs: {
      days: {}, // 'YYYY-MM-DD' -> { pomodoroCount, pomodoroMinutes, tasks: { taskId: minutes } }
    },
  };
}

export function loadStore() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === "object" && s.pomodoro && s.tasks && s.reminders && s.logs) {
      return s;
    }
  } catch {
    /* corrupted store falls through to a fresh one */
  }
  return defaultStore();
}

export function saveStore(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* quota errors: nothing sensible to do, data stays in memory */
  }
}

export function newId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Local-date key, e.g. "2026-08-04" — matches the user's wall-clock day,
// not UTC, so stats line up with when the user actually worked.
export function dayKey(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfNextLocalDay(ts) {
  const d = new Date(ts);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

function ensureDay(logs, key) {
  if (!logs.days[key]) logs.days[key] = { pomodoroCount: 0, pomodoroMinutes: 0, tasks: {} };
  return logs.days[key];
}

export function addPomodoroCompletion(logs, endedAt, minutes) {
  const key = dayKey(endedAt);
  const days = { ...logs.days };
  const day = ensureDay({ days }, key);
  days[key] = {
    ...day,
    pomodoroCount: day.pomodoroCount + 1,
    pomodoroMinutes: day.pomodoroMinutes + minutes,
  };
  return { ...logs, days };
}

// Splits [startedAt, endedAt) into per-local-day segments and adds the
// elapsed minutes of each segment to that day's task total — this is what
// makes a task left running across midnight (or across an app kill) get
// attributed correctly instead of dumping everything into one day.
export function addTaskElapsed(logs, taskId, startedAt, endedAt) {
  if (endedAt <= startedAt) return logs;
  const days = { ...logs.days };
  let cursor = startedAt;
  let guard = 0;
  while (cursor < endedAt && guard < 3650) {
    guard++;
    const segEnd = Math.min(endedAt, startOfNextLocalDay(cursor));
    const key = dayKey(cursor);
    const day = ensureDay({ days }, key);
    const minutes = (segEnd - cursor) / 60000;
    days[key] = {
      ...day,
      tasks: { ...day.tasks, [taskId]: (day.tasks[taskId] || 0) + minutes },
    };
    cursor = segEnd;
  }
  return { ...logs, days };
}

export function last7DayKeys(now = Date.now()) {
  const keys = [];
  for (let i = 6; i >= 0; i--) keys.push(dayKey(now - i * 86400000));
  return keys;
}
