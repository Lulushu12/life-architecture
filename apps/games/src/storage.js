import { addDays, createStore, todayKey } from "@shared/store.js";
import { DIFFICULTIES } from "./sudokuGen.js";
import { DELAY_MODES, normalizeControl } from "./chessClock.js";
import { isValidPerm } from "./cryptogram.js";
import { isDailyCryptoId, dayOfDailyId } from "./daily.js";

export const STORE_KEY = "games-v1";

/*
 * Shape of localStorage["games-v1"], version 1:
 *   chess        null | clock: minutesPerSide, incrementSec, delaySec, delayMode
 *                ("none" | "bronstein" | "simple"), presetLabel, timeLeft [top, bottom] ms at
 *                the start of the running turn, turnStartedAt, turnBase (ms of the turn spent
 *                before a pause), moves [top, bottom], started, paused, activeSide, flagged,
 *                recorded, createdAt, updatedAt
 *   chessPrefs   last control, lastCustom control, favourites [control], sound, vibrate
 *                (a control is { minutes, bonus: "none"|"fischer"|"bronstein"|"simple", bonusSec })
 *   sudoku       null | game: difficulty, daily (dayKey or null), givens/solution/entries [81],
 *                pencil [81][digits], undo [[cell, entry, pencil]...], selected, mode
 *                ("digit"|"pencil"), showConflicts, showMistakes, autoCandidates, paused,
 *                elapsedMs + resumedAt (timer only runs while open), mistakes, hints, clueCount,
 *                solved, solvedAt, recorded, createdAt, updatedAt
 *   dailySudoku  null | same shape as sudoku, for the daily puzzle of `daily`
 *   sudokuNext   { easy, medium, hard }: pre-generated { puzzle, solution, clueCount } or null
 *   crypto       progress: puzzleId -> { perm [26], guesses {cipher: plain}, undo [guesses],
 *                hints, elapsedMs, resumedAt, solved, solvedAt, recorded, startedAt, updatedAt }
 *                (daily ids are "d:YYYY-MM-DD"); custom: [{ id, text, attribution,
 *                custom: true | source: "web" }]
 *   daily        dayKey -> { sudoku?: seconds, crypto?: seconds }
 *   stats        sudoku [{ at, difficulty, seconds, mistakes, hints, daily }],
 *                crypto [{ at, id, seconds, hints, daily }], chess [{ at, control, result, moves }]
 */

export function defaults() {
  return {
    chess: null,
    chessPrefs: {
      last: null,
      lastCustom: { minutes: 5, bonus: "fischer", bonusSec: 3 },
      favourites: [],
      sound: true,
      vibrate: true,
    },
    sudoku: null,
    dailySudoku: null,
    sudokuNext: { easy: null, medium: null, hard: null },
    crypto: { progress: {}, custom: [] },
    daily: {},
    stats: { sudoku: [], crypto: [], chess: [] },
  };
}

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isGrid = (a) => Array.isArray(a) && a.length === 81 && a.every((v) => Number.isInteger(v) && v >= 0 && v <= 9);

function migrateSudoku(g) {
  if (!isObj(g)) return g;
  const out = { ...g };
  if (out.showConflicts === undefined) out.showConflicts = out.showErrors !== false;
  delete out.showErrors;
  if (out.elapsedMs === undefined) {
    const end = out.solved ? out.solvedAt : out.updatedAt;
    out.elapsedMs = out.startedAt && end ? Math.max(0, end - out.startedAt) : 0;
    out.resumedAt = null;
  }
  if (out.solved) out.recorded = true;
  return out;
}

function migrate(store, from) {
  if (from >= 1) return store;
  const s = { ...store, sudoku: migrateSudoku(store.sudoku) };
  if (isObj(s.chess) && s.chess.flagged != null) s.chess = { ...s.chess, recorded: true, paused: false };
  if (isObj(s.crypto) && isObj(s.crypto.progress)) {
    const progress = {};
    for (const [id, p] of Object.entries(s.crypto.progress)) {
      if (!isObj(p)) continue;
      progress[id] = {
        ...p,
        elapsedMs: p.elapsedMs ?? (p.solved && p.solvedAt && p.startedAt ? Math.max(0, p.solvedAt - p.startedAt) : 0),
        resumedAt: null,
        recorded: p.solved ? true : !!p.recorded,
      };
    }
    s.crypto = { ...s.crypto, progress };
  }
  return s;
}

function closeTimer(rec) {
  if (!isObj(rec) || rec.resumedAt == null) return rec;
  const end = Number(rec.updatedAt) || 0;
  const extra = end > rec.resumedAt ? Math.min(end - rec.resumedAt, 6 * 3600 * 1000) : 0;
  return { ...rec, elapsedMs: (Number(rec.elapsedMs) || 0) + extra, resumedAt: null };
}

function normalizeSudoku(g) {
  if (!isObj(g) || !DIFFICULTIES[g.difficulty]) return null;
  if (!isGrid(g.givens) || !isGrid(g.solution) || !isGrid(g.entries)) return null;
  const pencil = Array.isArray(g.pencil) && g.pencil.length === 81
    ? g.pencil.map((p) => (Array.isArray(p) ? p.filter((d) => Number.isInteger(d) && d >= 1 && d <= 9) : []))
    : Array.from({ length: 81 }, () => []);
  const selected = Number.isInteger(g.selected) && g.selected >= 0 && g.selected < 81 ? g.selected : null;
  return closeTimer({
    ...g,
    pencil,
    selected,
    mode: g.mode === "pencil" ? "pencil" : "digit",
    undo: Array.isArray(g.undo) ? g.undo.filter(Array.isArray).slice(-200) : [],
    elapsedMs: Number(g.elapsedMs) || 0,
    mistakes: Number(g.mistakes) || 0,
    hints: Number(g.hints) || 0,
    showConflicts: g.showConflicts !== false,
    showMistakes: !!g.showMistakes,
    autoCandidates: !!g.autoCandidates,
    paused: !!g.paused && !g.solved,
    daily: typeof g.daily === "string" ? g.daily : null,
    clueCount: Number(g.clueCount) || g.givens.filter(Boolean).length,
  });
}

function normalizeChess(g) {
  if (!isObj(g)) return null;
  if (!Array.isArray(g.timeLeft) || g.timeLeft.length !== 2 || !g.timeLeft.every(Number.isFinite)) return null;
  const minutes = Number(g.minutesPerSide);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  const delayMode = DELAY_MODES.includes(g.delayMode) && g.delayMode !== "fischer" ? g.delayMode : "none";
  const activeSide = g.activeSide === 0 || g.activeSide === 1 ? g.activeSide : null;
  return {
    ...g,
    incrementSec: Number(g.incrementSec) || 0,
    delaySec: Number(g.delaySec) || 0,
    delayMode,
    moves: Array.isArray(g.moves) && g.moves.length === 2 ? g.moves.map((n) => Number(n) || 0) : [0, 0],
    turnBase: Number(g.turnBase) || 0,
    activeSide,
    flagged: g.flagged === 0 || g.flagged === 1 ? g.flagged : null,
    presetLabel: String(g.presetLabel || `${minutes}+${Number(g.incrementSec) || 0}`),
  };
}

function normalizePuzzleNext(p) {
  return isObj(p) && isGrid(p.puzzle) && isGrid(p.solution) ? p : null;
}

export function normalize(store) {
  const s = { ...store };
  s.chess = normalizeChess(s.chess);
  s.sudoku = normalizeSudoku(s.sudoku);
  s.dailySudoku = normalizeSudoku(s.dailySudoku);
  if (s.dailySudoku && !s.dailySudoku.daily) s.dailySudoku = null;

  const prefs = isObj(s.chessPrefs) ? s.chessPrefs : defaults().chessPrefs;
  s.chessPrefs = {
    ...prefs,
    last: prefs.last ? normalizeControl(prefs.last) : null,
    lastCustom: normalizeControl(prefs.lastCustom),
    favourites: Array.isArray(prefs.favourites) ? prefs.favourites.filter(isObj).map(normalizeControl) : [],
    sound: prefs.sound !== false,
    vibrate: prefs.vibrate !== false,
  };

  const next = isObj(s.sudokuNext) ? s.sudokuNext : {};
  s.sudokuNext = {};
  for (const k of Object.keys(DIFFICULTIES)) s.sudokuNext[k] = normalizePuzzleNext(next[k]);

  const crypto = isObj(s.crypto) ? s.crypto : {};
  const progress = {};
  const cutoff = addDays(todayKey(), -45);
  for (const [id, p] of Object.entries(isObj(crypto.progress) ? crypto.progress : {})) {
    if (!isObj(p) || !isValidPerm(p.perm)) continue;
    if (isDailyCryptoId(id) && dayOfDailyId(id) < cutoff) continue;
    progress[id] = closeTimer({
      ...p,
      guesses: isObj(p.guesses) ? p.guesses : {},
      undo: Array.isArray(p.undo) ? p.undo.filter(isObj).slice(-100) : [],
      hints: Number(p.hints) || 0,
      elapsedMs: Number(p.elapsedMs) || 0,
    });
  }
  const custom = (Array.isArray(crypto.custom) ? crypto.custom : []).filter(
    (p) => isObj(p) && typeof p.id === "string" && typeof p.text === "string" && p.text.trim()
  );
  s.crypto = { ...crypto, progress, custom };

  s.daily = isObj(s.daily) ? s.daily : {};
  const stats = isObj(s.stats) ? s.stats : {};
  s.stats = {
    sudoku: Array.isArray(stats.sudoku) ? stats.sudoku.filter(isObj) : [],
    crypto: Array.isArray(stats.crypto) ? stats.crypto.filter(isObj) : [],
    chess: Array.isArray(stats.chess) ? stats.chess.filter(isObj) : [],
  };
  return s;
}

export const gamesStore = createStore({ key: STORE_KEY, version: 1, defaults, migrate, normalize });

export function hydrate(data) {
  const base = defaults();
  const merged = { ...base, ...data };
  for (const [k, v] of Object.entries(base)) {
    if (isObj(v) && isObj(merged[k])) merged[k] = { ...v, ...merged[k] };
  }
  const from = typeof data?.version === "number" ? data.version : 0;
  return { ...normalize(from < 1 ? migrate(merged, from) : merged), version: 1 };
}

export function validateBackup(obj) {
  if (!isObj(obj)) return false;
  return ["chess", "sudoku", "crypto", "stats", "daily"].some((k) => k in obj);
}
