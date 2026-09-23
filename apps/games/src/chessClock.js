export const DELAY_MODES = ["none", "fischer", "bronstein", "simple"];

export const BONUS_LABELS = {
  none: "None",
  fischer: "Increment",
  bronstein: "Bronstein",
  simple: "Delay",
};

export const PRESETS = [
  { minutes: 1, bonus: "none", bonusSec: 0 },
  { minutes: 3, bonus: "none", bonusSec: 0 },
  { minutes: 3, bonus: "fischer", bonusSec: 2 },
  { minutes: 5, bonus: "none", bonusSec: 0 },
  { minutes: 5, bonus: "fischer", bonusSec: 3 },
  { minutes: 10, bonus: "none", bonusSec: 0 },
  { minutes: 15, bonus: "fischer", bonusSec: 10 },
  { minutes: 30, bonus: "none", bonusSec: 0 },
];

export const LOW_TIME_MS = 20000;
export const BEEP_TIME_MS = 10000;

export function normalizeControl(c) {
  const minutes = Math.min(180, Math.max(1, Math.round(Number(c?.minutes) || 5)));
  const bonus = DELAY_MODES.includes(c?.bonus) ? c.bonus : "none";
  const bonusSec = bonus === "none" ? 0 : Math.min(120, Math.max(0, Math.round(Number(c?.bonusSec) || 0)));
  return { minutes, bonus: bonusSec === 0 ? "none" : bonus, bonusSec };
}

export function controlLabel(c) {
  const { minutes, bonus, bonusSec } = normalizeControl(c);
  if (bonus === "fischer") return `${minutes}+${bonusSec}`;
  if (bonus === "bronstein") return `${minutes} B${bonusSec}`;
  if (bonus === "simple") return `${minutes} d${bonusSec}`;
  return `${minutes}+0`;
}

export function sameControl(a, b) {
  return !!a && !!b && controlLabel(a) === controlLabel(b);
}

export function controlOf(g) {
  if (!g) return null;
  if (g.delayMode === "bronstein" || g.delayMode === "simple") {
    return normalizeControl({ minutes: g.minutesPerSide, bonus: g.delayMode, bonusSec: g.delaySec });
  }
  return normalizeControl({ minutes: g.minutesPerSide, bonus: "fischer", bonusSec: g.incrementSec });
}

export function freshClock(control) {
  const c = normalizeControl(control);
  const ms = c.minutes * 60000;
  const now = Date.now();
  return {
    minutesPerSide: c.minutes,
    incrementSec: c.bonus === "fischer" ? c.bonusSec : 0,
    delaySec: c.bonus === "bronstein" || c.bonus === "simple" ? c.bonusSec : 0,
    delayMode: c.bonus === "bronstein" || c.bonus === "simple" ? c.bonus : "none",
    presetLabel: controlLabel(c),
    timeLeft: [ms, ms],
    moves: [0, 0],
    started: false,
    paused: false,
    activeSide: null,
    turnStartedAt: null,
    turnBase: 0,
    flagged: null,
    recorded: false,
    createdAt: now,
    updatedAt: now,
  };
}

export const other = (side) => (side === 0 ? 1 : 0);

export function isRunning(g) {
  return !!g && g.started && !g.paused && g.flagged == null && g.activeSide != null && g.turnStartedAt != null;
}

function charged(g, elapsed) {
  if (g.delayMode === "simple") return Math.max(0, elapsed - (g.delaySec || 0) * 1000);
  return elapsed;
}

export function turnElapsed(g, now) {
  return (g.turnBase || 0) + (isRunning(g) ? Math.max(0, now - g.turnStartedAt) : 0);
}

export function remainingMs(g, now) {
  const tl = [...g.timeLeft];
  if (g.started && g.flagged == null && g.activeSide != null) {
    tl[g.activeSide] = Math.max(0, tl[g.activeSide] - charged(g, turnElapsed(g, now)));
  }
  return tl;
}

export function delayLeftMs(g, now) {
  if (g.delayMode !== "simple" || !g.started || g.flagged != null || g.activeSide == null) return 0;
  return Math.max(0, (g.delaySec || 0) * 1000 - turnElapsed(g, now));
}

export function pressClock(g, side, now) {
  if (g.flagged != null || g.paused) return g;
  if (!g.started) {
    return { ...g, started: true, activeSide: other(side), turnStartedAt: now, turnBase: 0 };
  }
  if (g.activeSide !== side) return g;
  const elapsed = turnElapsed(g, now);
  const left = g.timeLeft[side] - charged(g, elapsed);
  const timeLeft = [...g.timeLeft];
  if (left <= 0) {
    timeLeft[side] = 0;
    return { ...g, timeLeft, flagged: side, turnStartedAt: null, turnBase: 0 };
  }
  const bonus =
    (g.incrementSec || 0) * 1000 + (g.delayMode === "bronstein" ? Math.min(elapsed, (g.delaySec || 0) * 1000) : 0);
  timeLeft[side] = left + bonus;
  const moves = [...(g.moves || [0, 0])];
  moves[side] += 1;
  return { ...g, timeLeft, moves, activeSide: other(side), turnStartedAt: now, turnBase: 0 };
}

export function flagIfOut(g, now) {
  if (!isRunning(g)) return g;
  if (remainingMs(g, now)[g.activeSide] > 0) return g;
  const timeLeft = [...g.timeLeft];
  timeLeft[g.activeSide] = 0;
  return { ...g, timeLeft, flagged: g.activeSide, turnStartedAt: null, turnBase: 0 };
}

export function togglePause(g, now) {
  if (g.flagged != null || !g.started) return g;
  if (g.paused) return { ...g, paused: false, turnStartedAt: now };
  return { ...g, paused: true, turnBase: turnElapsed(g, now), turnStartedAt: null };
}

export function pauseClock(g, now) {
  return isRunning(g) ? togglePause(g, now) : g;
}

export function resetClock(g) {
  const ms = g.minutesPerSide * 60000;
  return {
    ...g,
    timeLeft: [ms, ms],
    moves: [0, 0],
    started: false,
    paused: false,
    activeSide: null,
    turnStartedAt: null,
    turnBase: 0,
    flagged: null,
    recorded: false,
  };
}

export function fmtClock(ms) {
  if (ms <= 0) return "0:00.0";
  if (ms < LOW_TIME_MS) {
    const tenths = Math.ceil(ms / 100);
    const s = Math.floor(tenths / 10);
    return `0:${String(s).padStart(2, "0")}.${tenths % 10}`;
  }
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export function totalMoves(g) {
  return (g?.moves?.[0] || 0) + (g?.moves?.[1] || 0);
}
