import { addDays, createStore, todayKey } from "@shared/store.js";
import { DIFFICULTIES } from "./sudokuGen.js";
import { DELAY_MODES, normalizeControl } from "./chessClock.js";
import { isValidPerm } from "./cryptogram.js";
import { isDailyCryptoId, dayOfDailyId } from "./daily.js";
import { MAX_GUESSES, WORD_LEN } from "./word.js";
import { NONO_SIZE } from "./nonogram.js";

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
 *   word         daily | practice: null | { answer, daily, guesses [word], hard, status
 *                ("playing"|"won"|"lost"), recorded, startedAt, finishedAt, updatedAt }
 *   nono         daily | practice: null | { daily, solution [100], rows, cols [[run]], cells [100]
 *                (0 empty, 1 filled, 2 crossed), undo [cells], mode ("fill"|"cross"), elapsedMs,
 *                resumedAt, checks, solved, solvedAt, recorded, createdAt, updatedAt }
 *   settings     sound, haptics, tenthsSec, peerHighlight, sameDigit, autoCandidates,
 *                sudokuCheck ("conflicts"|"mistakes"|"both"|"off"), keepAwake, wordHard
 *   daily        dayKey -> { sudoku?: seconds, crypto?: seconds, word?: guesses, wordFailed? }
 *   stats        sudoku [{ at, difficulty, seconds, mistakes, hints, daily }],
 *                crypto [{ at, id, seconds, hints, daily }], chess [{ at, control, result, moves }],
 *                word [{ at, daily, won, guesses, hard }], nono [{ at, seconds, checks, daily }]
 */

export const VERSION = 2;
export const SUDOKU_CHECKS = ["conflicts", "mistakes", "both", "off"];
export const TENTHS_OPTIONS = [0, 10, 20, 30, 60];

export function defaultSettings() {
  return {
    sound: true,
    haptics: true,
    tenthsSec: 20,
    peerHighlight: true,
    sameDigit: true,
    autoCandidates: false,
    sudokuCheck: "conflicts",
    keepAwake: true,
    wordHard: false,
  };
}

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
    word: { daily: null, practice: null },
    nono: { daily: null, practice: null },
    settings: defaultSettings(),
    daily: {},
    stats: { sudoku: [], crypto: [], chess: [], word: [], nono: [] },
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
  let s = from < 1 ? migrateV0(store) : store;
  if (from < 2) {
    const prefs = isObj(s.chessPrefs) ? s.chessPrefs : {};
    const old = isObj(s.settings) ? s.settings : {};
    s = {
      ...s,
      settings: { ...defaultSettings(), sound: prefs.sound !== false, haptics: prefs.vibrate !== false, ...old },
    };
  }
  return s;
}

function migrateV0(store) {
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

let closeOpenTimers = true;

function closeTimer(rec) {
  if (!isObj(rec) || rec.resumedAt == null || !closeOpenTimers) return rec;
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

function normalizeWord(g) {
  if (!isObj(g) || typeof g.answer !== "string" || !/^[a-z]{5}$/.test(g.answer)) return null;
  const guesses = (Array.isArray(g.guesses) ? g.guesses : [])
    .filter((w) => typeof w === "string" && w.length === WORD_LEN && /^[a-z]+$/.test(w))
    .slice(0, MAX_GUESSES);
  const status = guesses.includes(g.answer) ? "won" : guesses.length >= MAX_GUESSES ? "lost" : "playing";
  return {
    ...g,
    guesses,
    status,
    hard: !!g.hard,
    daily: typeof g.daily === "string" ? g.daily : null,
    recorded: status === "playing" ? false : !!g.recorded,
  };
}

const isClue = (c) => Array.isArray(c) && c.every((n) => Number.isInteger(n) && n > 0 && n <= NONO_SIZE);

function normalizeNono(g) {
  const cellsOk = (a, max) => Array.isArray(a) && a.length === NONO_SIZE * NONO_SIZE && a.every((v) => v === 0 || v === 1 || v === max);
  if (!isObj(g) || !cellsOk(g.solution, 1) || !cellsOk(g.cells, 2)) return null;
  if (!Array.isArray(g.rows) || g.rows.length !== NONO_SIZE || !g.rows.every(isClue)) return null;
  if (!Array.isArray(g.cols) || g.cols.length !== NONO_SIZE || !g.cols.every(isClue)) return null;
  return closeTimer({
    ...g,
    daily: typeof g.daily === "string" ? g.daily : null,
    undo: Array.isArray(g.undo) ? g.undo.filter((u) => cellsOk(u, 2)).slice(-100) : [],
    mode: g.mode === "cross" ? "cross" : "fill",
    elapsedMs: Number(g.elapsedMs) || 0,
    checks: Number(g.checks) || 0,
    solved: !!g.solved,
    recorded: g.solved ? !!g.recorded : false,
  });
}

function normalizeSettings(v) {
  const d = defaultSettings();
  const s = isObj(v) ? v : {};
  const bool = (k) => (typeof s[k] === "boolean" ? s[k] : d[k]);
  return {
    sound: bool("sound"),
    haptics: bool("haptics"),
    tenthsSec: TENTHS_OPTIONS.includes(s.tenthsSec) ? s.tenthsSec : d.tenthsSec,
    peerHighlight: bool("peerHighlight"),
    sameDigit: bool("sameDigit"),
    autoCandidates: bool("autoCandidates"),
    sudokuCheck: SUDOKU_CHECKS.includes(s.sudokuCheck) ? s.sudokuCheck : d.sudokuCheck,
    keepAwake: bool("keepAwake"),
    wordHard: bool("wordHard"),
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

  const word = isObj(s.word) ? s.word : {};
  s.word = { daily: normalizeWord(word.daily), practice: normalizeWord(word.practice) };
  if (s.word.daily && !s.word.daily.daily) s.word.daily = null;
  const nono = isObj(s.nono) ? s.nono : {};
  s.nono = { daily: normalizeNono(nono.daily), practice: normalizeNono(nono.practice) };
  if (s.nono.daily && !s.nono.daily.daily) s.nono.daily = null;
  s.settings = normalizeSettings(s.settings);

  s.daily = isObj(s.daily) ? s.daily : {};
  const stats = isObj(s.stats) ? s.stats : {};
  const list = (k) => (Array.isArray(stats[k]) ? stats[k].filter(isObj) : []);
  s.stats = {
    sudoku: list("sudoku"),
    crypto: list("crypto"),
    chess: list("chess"),
    word: list("word"),
    nono: list("nono"),
  };
  return s;
}

let booted = false;

function normalizeOnLoad(store) {
  closeOpenTimers = !booted;
  booted = true;
  try {
    return normalize(store);
  } finally {
    closeOpenTimers = true;
  }
}

export const gamesStore = createStore({ key: STORE_KEY, version: VERSION, defaults, migrate, normalize: normalizeOnLoad });

export function hydrate(data) {
  const from = typeof data?.version === "number" ? data.version : 0;
  const migrated = from < VERSION ? migrate(data, from) : data;
  const base = defaults();
  const merged = { ...base, ...migrated };
  for (const [k, v] of Object.entries(base)) {
    if (isObj(v) && isObj(merged[k])) merged[k] = { ...v, ...merged[k] };
  }
  return { ...normalize(merged), version: VERSION };
}

export function validateBackup(obj) {
  if (!isObj(obj)) return false;
  return ["chess", "sudoku", "crypto", "word", "nono", "stats", "daily"].some((k) => k in obj);
}
