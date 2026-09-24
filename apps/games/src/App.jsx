import { useCallback, useEffect, useMemo, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { addDays, usePersistentStore, useVisibleDate } from "@shared/store.js";
import { useHistoryNav } from "@shared/useHistoryNav.js";
import { useWakeLock } from "@shared/useWakeLock.js";
import { useConfirm, useToast } from "@shared/ui.jsx";
import { registerSw } from "@shared/swRegister.js";
import { emitEvent } from "@shared/bridge.js";
import { audio } from "@shared/audio.js";
import { gamesStore, hydrate, STORE_KEY } from "./storage.js";
import Home from "./Home.jsx";
import ChessSetup from "./ChessSetup.jsx";
import ChessClock from "./ChessClock.jsx";
import Sudoku, { SudokuSetup, DailySudokuLoader, freshSudoku } from "./Sudoku.jsx";
import CryptogramList from "./CryptogramList.jsx";
import CryptogramPlay from "./CryptogramPlay.jsx";
import Word from "./Word.jsx";
import Settings from "./Settings.jsx";
import Nonogram, { freshNono } from "./Nonogram.jsx";
import { generateNonogram } from "./nonogram.js";
import { seededRng } from "./rng.js";
import { dailyWordAnswer, freshWord, randomWordAnswer, wordStats } from "./word.js";
import { PUZZLES } from "./cryptogramPuzzles.js";
import { randomDerangement } from "./cryptogram.js";
import { DIFFICULTIES } from "./sudokuGen.js";
import { requestPuzzle, whenIdle } from "./sudokuClient.js";
import { freshClock, isRunning, resetClock, sameControl, totalMoves } from "./chessClock.js";
import {
  DAILY_SUDOKU_DIFFICULTY,
  dailyCryptoId,
  dailyNonoSeed,
  dailyCryptoPerm,
  dailyCryptoPuzzle,
  dayOfDailyId,
  isDailyCryptoId,
} from "./daily.js";
import { pushStat } from "./stats.js";
import { useFocused, usePageVisible } from "./timing.js";

const HOME = { screen: "home" };
const emitted = new Set();
let historySeeded = false;

function cryptoEntry(perm) {
  const now = Date.now();
  return {
    perm,
    guesses: {},
    undo: [],
    hints: 0,
    elapsedMs: 0,
    resumedAt: null,
    solved: false,
    solvedAt: null,
    recorded: false,
    startedAt: now,
    updatedAt: now,
  };
}

function chessStat(game, result) {
  return { control: game.presetLabel, result, moves: totalMoves(game) };
}

export default function App() {
  const toast = useToast();
  const [confirm, confirmSheet] = useConfirm();
  const [store, setStore, status] = usePersistentStore(gamesStore);
  const { view, nav, back, replace } = useHistoryNav(HOME, { persistKey: "games:view" });
  const today = useVisibleDate();
  const visible = usePageVisible();
  const focused = useFocused();
  const native = useMemo(() => Capacitor.isNativePlatform(), []);

  useEffect(() => {
    registerSw({
      onUpdate: (reload) =>
        toast("Update available", { action: { label: "Reload", onClick: reload }, duration: 0 }),
    });
  }, [toast]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") audio.ensure();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const customPuzzles = store.crypto.custom;
  const allPuzzles = useMemo(() => [...PUZZLES, ...customPuzzles], [customPuzzles]);

  const findPuzzle = useCallback(
    (id) => (isDailyCryptoId(id) ? dailyCryptoPuzzle(dayOfDailyId(id)) : allPuzzles.find((p) => p.id === id)),
    [allPuzzles]
  );

  const openCrypto = useCallback(
    (id, { replaceView = false } = {}) => {
      setStore((s) => {
        if (s.crypto.progress[id]) return s;
        const perm = isDailyCryptoId(id) ? dailyCryptoPerm(dayOfDailyId(id)) : randomDerangement();
        return {
          ...s,
          crypto: { ...s.crypto, progress: { ...s.crypto.progress, [id]: cryptoEntry(perm) } },
        };
      });
      (replaceView ? replace : nav)({ screen: "crypto-play", id });
    },
    [setStore, nav, replace]
  );

  const ensureWord = useCallback(
    (daily, { fresh = false } = {}) =>
      setStore((s) => {
        const slot = daily ? "daily" : "practice";
        const cur = s.word[slot];
        if (daily && cur && cur.daily === daily) return s;
        if (!daily && cur && !fresh) return s;
        let stats = s.stats;
        if (!daily && fresh && cur && cur.status === "playing" && cur.guesses.length) {
          stats = pushStat(stats, "word", { daily: null, won: false, guesses: cur.guesses.length, hard: cur.hard });
        }
        const answer = daily ? dailyWordAnswer(daily) : randomWordAnswer([cur?.answer, s.word.daily?.answer]);
        const game = freshWord(answer, { daily, hard: s.settings.wordHard });
        return { ...s, stats, word: { ...s.word, [slot]: game } };
      }),
    [setStore]
  );

  const openWord = useCallback(
    (daily = null, { fresh = false, replaceView = false } = {}) => {
      ensureWord(daily, { fresh });
      (replaceView ? replace : nav)(daily ? { screen: "word", daily } : { screen: "word" });
    },
    [ensureWord, nav, replace]
  );

  const ensureNono = useCallback(
    (daily, { fresh = false } = {}) =>
      setStore((s) => {
        const slot = daily ? "daily" : "practice";
        const cur = s.nono[slot];
        if (daily && cur && cur.daily === daily) return s;
        if (!daily && cur && !fresh) return s;
        const puzzle = generateNonogram(daily ? seededRng(dailyNonoSeed(daily)) : Math.random);
        return { ...s, nono: { ...s.nono, [slot]: freshNono(puzzle, daily) } };
      }),
    [setStore]
  );

  const openNono = useCallback(
    (daily = null, { fresh = false } = {}) => {
      ensureNono(daily, { fresh });
      nav(daily ? { screen: "nono", daily } : { screen: "nono" });
    },
    [ensureNono, nav]
  );

  const openDaily = useCallback(
    (which, day = today) => {
      if (which === "sudoku") nav({ screen: "sudoku", daily: day });
      else if (which === "word") openWord(day);
      else if (which === "nono") openNono(day);
      else openCrypto(dailyCryptoId(day));
    },
    [nav, openCrypto, openWord, openNono, today]
  );

  useEffect(() => {
    if (historySeeded) return;
    historySeeded = true;
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    if (action) {
      const url = window.location.pathname + window.location.hash;
      window.history.replaceState({ view: HOME }, "", url);
      if (action === "chess") nav({ screen: "chess" });
      else if (action === "sudoku") nav({ screen: "sudoku" });
      else if (action === "crypto") nav({ screen: "crypto-list" });
      else if (action === "word") openWord(null);
      else if (action === "nono") openNono(null);
      else if (action === "daily") {
        const done = store.daily[today] || {};
        if (done.sudoku == null) nav({ screen: "sudoku", daily: today });
        else if (done.crypto == null) openCrypto(dailyCryptoId(today));
        else if (done.word == null && !done.wordFailed) openWord(today);
        else if (done.nono == null) openNono(today);
        else replace(HOME);
      } else replace(HOME);
      return;
    }
    if (view.screen === "home") return;
    const current = view;
    window.history.replaceState({ view: HOME }, "");
    if (current.screen === "crypto-play" && !isDailyCryptoId(current.id)) {
      window.history.pushState({ view: { screen: "crypto-list" } }, "");
    }
    if (current.screen === "chess-setup") {
      window.history.pushState({ view: { screen: "chess" } }, "");
    }
    window.history.pushState({ view: current }, "");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!focused) return;
    const jobs = [];
    for (const slot of ["sudoku", "dailySudoku"]) {
      const g = store[slot];
      if (g?.solved && !g.recorded) jobs.push({ kind: "sudoku", slot, key: `s:${slot}:${g.createdAt}`, g });
    }
    for (const [id, p] of Object.entries(store.crypto.progress)) {
      if (p.solved && !p.recorded) jobs.push({ kind: "crypto", id, key: `c:${id}:${p.solvedAt}`, p });
    }
    for (const slot of ["daily", "practice"]) {
      const w = store.word[slot];
      if (w && w.status !== "playing" && !w.recorded) jobs.push({ kind: "word", slot, key: `w:${slot}:${w.startedAt}`, w });
    }
    for (const slot of ["daily", "practice"]) {
      const n = store.nono[slot];
      if (n?.solved && !n.recorded) jobs.push({ kind: "nono", slot, key: `n:${slot}:${n.createdAt}`, n });
    }
    if (store.chess && store.chess.flagged != null && !store.chess.recorded) {
      jobs.push({ kind: "chess", key: `h:${store.chess.createdAt}:${store.chess.updatedAt}` });
    }
    if (!jobs.length) return;

    for (const job of jobs) {
      if (emitted.has(job.key)) continue;
      emitted.add(job.key);
      if (job.kind === "sudoku") {
        emitEvent({
          app: "games",
          type: "games.solved",
          dayKey: job.g.daily || undefined,
          value: {
            game: "sudoku",
            difficulty: job.g.difficulty,
            seconds: Math.round((job.g.elapsedMs || 0) / 1000),
          },
        });
      } else if (job.kind === "crypto") {
        emitEvent({
          app: "games",
          type: "games.solved",
          dayKey: isDailyCryptoId(job.id) ? dayOfDailyId(job.id) : undefined,
          value: {
            game: "cryptogram",
            difficulty: isDailyCryptoId(job.id) ? "daily" : undefined,
            seconds: Math.round((job.p.elapsedMs || 0) / 1000),
          },
        });
      } else if (job.kind === "nono") {
        emitEvent({
          app: "games",
          type: "games.solved",
          dayKey: job.n.daily || undefined,
          value: {
            game: "nonogram",
            difficulty: job.n.daily ? "daily" : undefined,
            seconds: Math.round((job.n.elapsedMs || 0) / 1000),
          },
        });
      } else if (job.kind === "word" && job.w.status === "won") {
        emitEvent({
          app: "games",
          type: "games.solved",
          dayKey: job.w.daily || undefined,
          value: {
            game: "word",
            difficulty: job.w.daily ? "daily" : undefined,
            guesses: job.w.guesses.length,
            hard: job.w.hard,
          },
        });
      }
    }

    setStore((s) => {
      let next = s;
      for (const slot of ["sudoku", "dailySudoku"]) {
        const g = next[slot];
        if (!g?.solved || g.recorded) continue;
        const seconds = Math.round((g.elapsedMs || 0) / 1000);
        next = {
          ...next,
          [slot]: { ...g, recorded: true },
          stats: pushStat(next.stats, "sudoku", {
            difficulty: g.difficulty,
            seconds,
            mistakes: g.mistakes || 0,
            hints: g.hints || 0,
            daily: g.daily || null,
          }),
        };
        if (g.daily) next.daily = { ...next.daily, [g.daily]: { ...next.daily[g.daily], sudoku: seconds } };
      }
      let progress = next.crypto.progress;
      for (const [id, p] of Object.entries(progress)) {
        if (!p.solved || p.recorded) continue;
        const seconds = Math.round((p.elapsedMs || 0) / 1000);
        const day = isDailyCryptoId(id) ? dayOfDailyId(id) : null;
        progress = { ...progress, [id]: { ...p, recorded: true } };
        next = {
          ...next,
          stats: pushStat(next.stats, "crypto", { id, seconds, hints: p.hints || 0, daily: day }),
        };
        if (day) next.daily = { ...next.daily, [day]: { ...next.daily[day], crypto: seconds } };
      }
      if (progress !== next.crypto.progress) next = { ...next, crypto: { ...next.crypto, progress } };
      for (const slot of ["daily", "practice"]) {
        const n = next.nono[slot];
        if (!n?.solved || n.recorded) continue;
        const seconds = Math.round((n.elapsedMs || 0) / 1000);
        next = {
          ...next,
          nono: { ...next.nono, [slot]: { ...n, recorded: true } },
          stats: pushStat(next.stats, "nono", { seconds, checks: n.checks || 0, daily: n.daily }),
        };
        if (n.daily) next.daily = { ...next.daily, [n.daily]: { ...next.daily[n.daily], nono: seconds } };
      }
      for (const slot of ["daily", "practice"]) {
        const w = next.word[slot];
        if (!w || w.status === "playing" || w.recorded) continue;
        const won = w.status === "won";
        next = {
          ...next,
          word: { ...next.word, [slot]: { ...w, recorded: true } },
          stats: pushStat(next.stats, "word", { daily: w.daily, won, guesses: w.guesses.length, hard: w.hard }),
        };
        if (w.daily) {
          const entry = { ...next.daily[w.daily] };
          if (won) entry.word = w.guesses.length;
          else entry.wordFailed = true;
          next.daily = { ...next.daily, [w.daily]: entry };
        }
      }
      const c = next.chess;
      if (c && c.flagged != null && !c.recorded) {
        next = {
          ...next,
          chess: { ...c, recorded: true },
          stats: pushStat(next.stats, "chess", chessStat(c, c.flagged === 0 ? "Top flagged" : "Bottom flagged")),
        };
      }
      return next;
    });
  }, [store, setStore, focused]);

  const inflight = useRef(new Set());
  useEffect(() => {
    const missing = Object.keys(DIFFICULTIES).filter((k) => !store.sudokuNext[k] && !inflight.current.has(k));
    if (!missing.length) return undefined;
    const k = missing[0];
    return whenIdle(() => {
      inflight.current.add(k);
      requestPuzzle(k, { background: true })
        .then((res) => setStore((s) => ({ ...s, sudokuNext: { ...s.sudokuNext, [k]: res } })))
        .catch(() => {})
        .finally(() => inflight.current.delete(k));
    });
  }, [store.sudokuNext, setStore]);

  const updateChess = useCallback(
    (fn) =>
      setStore((s) => {
        if (!s.chess) return s;
        const next = fn(s.chess);
        return next === s.chess ? s : { ...s, chess: { ...next, updatedAt: Date.now() } };
      }),
    [setStore]
  );

  const updateChessPrefs = useCallback(
    (fn) =>
      setStore((s) => {
        const { sound, vibrate, tenthsSec, ...prefs } = fn({
          ...s.chessPrefs,
          sound: s.settings.sound,
          vibrate: s.settings.haptics,
          tenthsSec: s.settings.tenthsSec,
        });
        return {
          ...s,
          chessPrefs: { ...prefs, sound, vibrate },
          settings: { ...s.settings, sound, haptics: vibrate, tenthsSec },
        };
      }),
    [setStore]
  );

  const updateSettings = useCallback(
    (fn) =>
      setStore((s) => {
        const settings = fn(s.settings);
        return {
          ...s,
          settings,
          chessPrefs: { ...s.chessPrefs, sound: settings.sound, vibrate: settings.haptics },
        };
      }),
    [setStore]
  );

  const clockPrefs = useMemo(
    () => ({
      ...store.chessPrefs,
      sound: store.settings.sound,
      vibrate: store.settings.haptics,
      tenthsSec: store.settings.tenthsSec,
    }),
    [store.chessPrefs, store.settings]
  );

  const stopChess = useCallback(
    (s) => {
      const c = s.chess;
      if (!c || c.recorded || !c.started || totalMoves(c) === 0) return s.stats;
      return pushStat(s.stats, "chess", chessStat(c, "Stopped"));
    },
    []
  );

  const resetChess = useCallback(
    () => setStore((s) => (s.chess ? { ...s, stats: stopChess(s), chess: resetClock(s.chess) } : s)),
    [setStore, stopChess]
  );

  const startChess = useCallback(
    async (control, { custom, fromClock }) => {
      const cur = store.chess;
      if (cur && cur.started && cur.flagged == null) {
        const ok = await confirm({
          title: "Start a new clock?",
          message: "The current clock will be discarded.",
          confirmLabel: "New clock",
          danger: true,
        });
        if (!ok) return;
      }
      setStore((s) => ({
        ...s,
        stats: stopChess(s),
        chess: freshClock(control),
        chessPrefs: {
          ...s.chessPrefs,
          last: control,
          lastCustom: custom ? control : s.chessPrefs.lastCustom,
        },
      }));
      if (fromClock) back();
    },
    [store.chess, confirm, setStore, stopChess, back]
  );

  const sudokuSlot = view.screen === "sudoku" && view.daily ? "dailySudoku" : "sudoku";
  const updateSudoku = useCallback(
    (fn) =>
      setStore((s) => {
        const g = s[sudokuSlot];
        if (!g) return s;
        const next = fn(g);
        return next === g ? s : { ...s, [sudokuSlot]: { ...next, updatedAt: Date.now() } };
      }),
    [setStore, sudokuSlot]
  );

  const createSudoku = useCallback(
    (key, generated, { fromQueue = false, daily = null } = {}) =>
      setStore((s) => {
        const game = freshSudoku(key, generated, s.settings, daily);
        const next = { ...s, [daily ? "dailySudoku" : "sudoku"]: game };
        if (fromQueue) next.sudokuNext = { ...s.sudokuNext, [key]: null };
        return next;
      }),
    [setStore]
  );

  const updateCryptoProgress = useCallback(
    (id, fn) =>
      setStore((s) => {
        const p = s.crypto.progress[id];
        if (!p) return s;
        const next = fn(p);
        if (next === p) return s;
        return {
          ...s,
          crypto: { ...s.crypto, progress: { ...s.crypto.progress, [id]: { ...next, updatedAt: Date.now() } } },
        };
      }),
    [setStore]
  );

  const addCustomPuzzles = useCallback(
    (entries, source) =>
      setStore((s) => {
        const base = Date.now();
        const added = entries.map((e, i) => ({
          id: `${source === "web" ? "w" : "c"}${base}-${i}`,
          text: e.text,
          attribution: e.attribution,
          ...(source === "web" ? { source: "web" } : { custom: true }),
        }));
        return { ...s, crypto: { ...s.crypto, custom: [...s.crypto.custom, ...added] } };
      }),
    [setStore]
  );

  const deleteCustomPuzzle = useCallback(
    (id) => {
      const index = store.crypto.custom.findIndex((p) => p.id === id);
      if (index === -1) return;
      const puzzle = store.crypto.custom[index];
      const prog = store.crypto.progress[id];
      setStore((s) => {
        const progress = { ...s.crypto.progress };
        delete progress[id];
        return { ...s, crypto: { ...s.crypto, custom: s.crypto.custom.filter((p) => p.id !== id), progress } };
      });
      toast.undo("Puzzle deleted", () =>
        setStore((s) => {
          if (s.crypto.custom.some((p) => p.id === id)) return s;
          const custom = [...s.crypto.custom];
          custom.splice(Math.min(index, custom.length), 0, puzzle);
          const progress = prog ? { ...s.crypto.progress, [id]: prog } : s.crypto.progress;
          return { ...s, crypto: { ...s.crypto, custom, progress } };
        })
      );
    },
    [store.crypto, setStore, toast]
  );

  const shuffleFromBundle = useCallback(() => {
    const unsolved = PUZZLES.filter((p) => !store.crypto.progress[p.id]?.solved);
    const pool = unsolved.length ? unsolved : PUZZLES;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!unsolved.length) {
      setStore((s) => ({
        ...s,
        crypto: {
          ...s.crypto,
          progress: { ...s.crypto.progress, [pick.id]: cryptoEntry(randomDerangement()) },
        },
      }));
    }
    openCrypto(pick.id);
  }, [store.crypto.progress, setStore, openCrypto]);

  const restoreBackup = useCallback((data) => setStore(hydrate(data)), [setStore]);

  const wordSlot = view.screen === "word" && view.daily ? "daily" : "practice";
  const wordGame = store.word[wordSlot];
  const wordReady = view.screen === "word" && !!wordGame && (!view.daily || wordGame.daily === view.daily);
  useEffect(() => {
    if (view.screen === "word" && !wordReady) ensureWord(view.daily || null);
  }, [view, wordReady, ensureWord]);

  const nonoSlot = view.screen === "nono" && view.daily ? "daily" : "practice";
  const nonoGame = store.nono[nonoSlot];
  const nonoReady = view.screen === "nono" && !!nonoGame && (!view.daily || nonoGame.daily === view.daily);
  useEffect(() => {
    if (view.screen === "nono" && !nonoReady) ensureNono(view.daily || null);
  }, [view, nonoReady, ensureNono]);

  const updateNono = useCallback(
    (fn) =>
      setStore((s) => {
        const g = s.nono[nonoSlot];
        if (!g) return s;
        const next = fn(g);
        return next === g ? s : { ...s, nono: { ...s.nono, [nonoSlot]: { ...next, updatedAt: Date.now() } } };
      }),
    [setStore, nonoSlot]
  );

  const updateWord = useCallback(
    (fn) =>
      setStore((s) => {
        const g = s.word[wordSlot];
        if (!g) return s;
        const next = fn(g);
        return next === g ? s : { ...s, word: { ...s.word, [wordSlot]: { ...next, updatedAt: Date.now() } } };
      }),
    [setStore, wordSlot]
  );

  const setWordHard = useCallback(
    (v) =>
      setStore((s) => {
        const g = s.word[wordSlot];
        const word = g && !g.guesses.length ? { ...s.word, [wordSlot]: { ...g, hard: v } } : s.word;
        return { ...s, word, settings: { ...s.settings, wordHard: v } };
      }),
    [setStore, wordSlot]
  );

  const wordSummary = useMemo(
    () => wordStats(store.stats.word, store.daily, today, addDays),
    [store.stats.word, store.daily, today]
  );

  const chessGame = store.chess;
  const sudokuGame = store[sudokuSlot];
  const cryptoProgress = view.screen === "crypto-play" ? store.crypto.progress[view.id] : null;
  const wake =
    (view.screen === "chess" && isRunning(chessGame)) ||
    (view.screen === "sudoku" && !!sudokuGame && !sudokuGame.solved && !sudokuGame.paused) ||
    (view.screen === "crypto-play" && !!cryptoProgress && !cryptoProgress.solved) ||
    (view.screen === "word" && wordReady && wordGame.status === "playing") ||
    (view.screen === "nono" && nonoReady && !nonoGame.solved);
  useWakeLock(wake && visible && store.settings.keepAwake);

  const banner =
    status.ok === false ? (
      <p className="warn banner" role="alert">
        Storage full: changes are not being saved.
      </p>
    ) : store._recovered ? (
      <p className="warn banner" role="alert">
        Saved data was unreadable and has been reset; the raw copy is under {STORE_KEY}.corrupt
      </p>
    ) : null;

  let screen = null;

  if (view.screen === "chess" || view.screen === "chess-setup") {
    const fromClock = view.screen === "chess-setup";
    if (!chessGame || fromClock) {
      screen = (
        <ChessSetup
          prefs={clockPrefs}
          native={native}
          onPrefs={updateChessPrefs}
          onStart={(control, opts) => startChess(control, { ...opts, fromClock: fromClock && !!chessGame })}
          onCancel={back}
          isFavourite={(c) => store.chessPrefs.favourites.some((f) => sameControl(f, c))}
        />
      );
    } else {
      screen = (
        <ChessClock
          game={chessGame}
          prefs={clockPrefs}
          onChange={updateChess}
          onReset={resetChess}
          onSettings={() => nav({ screen: "chess-setup" })}
          onHome={back}
          confirm={confirm}
        />
      );
    }
  } else if (view.screen === "sudoku") {
    if (view.daily) {
      const game = store.dailySudoku;
      screen =
        game && game.daily === view.daily ? (
          <Sudoku key={`daily-${view.daily}`} game={game} onChange={updateSudoku} onHome={back} visible={visible} stats={store.stats} confirm={confirm} settings={store.settings} />
        ) : (
          <DailySudokuLoader
            day={view.daily}
            difficulty={DAILY_SUDOKU_DIFFICULTY}
            onReady={(generated) => createSudoku(DAILY_SUDOKU_DIFFICULTY, generated, { daily: view.daily })}
            onCancel={back}
          />
        );
    } else if (!sudokuGame) {
      screen = (
        <SudokuSetup
          queued={store.sudokuNext}
          onCreate={createSudoku}
          onCancel={back}
          stats={store.stats}
        />
      );
    } else {
      screen = (
        <Sudoku
          key={`game-${sudokuGame.createdAt}`}
          game={sudokuGame}
          onChange={updateSudoku}
          onHome={back}
          visible={visible}
          stats={store.stats}
          queued={store.sudokuNext}
          onCreate={createSudoku}
          confirm={confirm}
          settings={store.settings}
        />
      );
    }
  } else if (view.screen === "crypto-list") {
    screen = (
      <CryptogramList
        puzzles={allPuzzles}
        progress={store.crypto.progress}
        onOpen={(id) => openCrypto(id)}
        onAdd={addCustomPuzzles}
        onDeleteCustom={deleteCustomPuzzle}
        onShuffle={shuffleFromBundle}
        onHome={back}
      />
    );
  } else if (view.screen === "settings") {
    screen = (
      <Settings
        store={store}
        settings={store.settings}
        onSettings={updateSettings}
        onRestore={restoreBackup}
        onHome={back}
      />
    );
  } else if (view.screen === "word") {
    screen = wordReady ? (
      <Word
        key={`${wordSlot}-${wordGame.startedAt}`}
        game={wordGame}
        settings={store.settings}
        summary={wordSummary}
        onChange={updateWord}
        onHard={setWordHard}
        onNewRandom={() => (view.daily ? openWord(null, { fresh: !!store.word.practice && store.word.practice.status !== "playing" }) : ensureWord(null, { fresh: true }))}
        onDaily={() => openWord(today, { replaceView: true })}
        onHome={back}
        confirm={confirm}
      />
    ) : (
      <div className="page" />
    );
  } else if (view.screen === "nono") {
    screen = nonoReady ? (
      <Nonogram
        key={`${nonoSlot}-${nonoGame.createdAt}`}
        game={nonoGame}
        settings={store.settings}
        visible={visible}
        stats={store.stats.nono}
        onChange={updateNono}
        onNew={() => (view.daily ? openNono(null, { fresh: !!store.nono.practice?.solved }) : ensureNono(null, { fresh: true }))}
        onHome={back}
        confirm={confirm}
      />
    ) : (
      <div className="page" />
    );
  } else if (view.screen === "crypto-play") {
    const puzzle = findPuzzle(view.id);
    if (puzzle && cryptoProgress) {
      screen = (
        <CryptogramPlay
          key={view.id}
          puzzle={puzzle}
          progress={cryptoProgress}
          visible={visible}
          settings={store.settings}
          onChange={(fn) => updateCryptoProgress(view.id, fn)}
          onHome={back}
        />
      );
    }
  }

  if (!screen) {
    screen = (
      <Home
        store={store}
        today={today}
        puzzles={allPuzzles}
        onChess={() => nav({ screen: "chess" })}
        onSudoku={() => nav({ screen: "sudoku" })}
        onCrypto={() => nav({ screen: "crypto-list" })}
        onWord={() => openWord(null)}
        onNono={() => openNono(null)}
        onSettings={() => nav({ screen: "settings" })}
        wordSummary={wordSummary}
        onDaily={openDaily}
      />
    );
  }

  return (
    <>
      {banner}
      {screen}
      {confirmSheet}
    </>
  );
}
