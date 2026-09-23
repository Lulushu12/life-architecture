import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconButton } from "@shared/ui.jsx";
import { audio } from "@shared/audio.js";
import { vibrate } from "@shared/haptics.js";
import { DIFFICULTIES, PEERS, candidatesAt, findConflicts, isPeer } from "./sudokuGen.js";
import { requestPuzzle } from "./sudokuClient.js";
import { dailySudokuSeed } from "./daily.js";
import { elapsedOf, fmtElapsed, fmtSeconds, stopTimer, useActiveTimer, useTicker } from "./timing.js";
import { summarize } from "./stats.js";

const UNDO_CAP = 200;
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function freshSudoku(difficulty, { puzzle, solution, clueCount }, prev = null, daily = null) {
  const now = Date.now();
  return {
    difficulty,
    daily,
    givens: puzzle.slice(),
    solution: solution.slice(),
    entries: puzzle.slice(),
    pencil: Array.from({ length: 81 }, () => []),
    undo: [],
    selected: null,
    mode: "digit",
    showConflicts: prev ? prev.showConflicts !== false : true,
    showMistakes: prev ? !!prev.showMistakes : false,
    autoCandidates: prev ? !!prev.autoCandidates : false,
    paused: false,
    elapsedMs: 0,
    resumedAt: null,
    mistakes: 0,
    hints: 0,
    solved: false,
    solvedAt: null,
    recorded: false,
    clueCount: clueCount ?? puzzle.filter(Boolean).length,
    createdAt: now,
    updatedAt: now,
  };
}

function withUndo(prev, next) {
  const step = [];
  for (let i = 0; i < 81; i++) {
    if (prev.entries[i] !== next.entries[i] || prev.pencil[i] !== next.pencil[i]) {
      step.push([i, prev.entries[i], prev.pencil[i]]);
    }
  }
  if (!step.length) return prev;
  return { ...next, undo: [...(prev.undo || []), step].slice(-UNDO_CAP) };
}

function isComplete(entries, solution) {
  for (let i = 0; i < 81; i++) if (entries[i] !== solution[i]) return false;
  return true;
}

function finish(g, entries) {
  if (!isComplete(entries, g.solution)) return g;
  const now = Date.now();
  return { ...stopTimer(g, now), solved: true, solvedAt: now, selected: null, paused: false };
}

function tierLine(stats, key) {
  const s = summarize(
    (stats?.sudoku || []).filter((r) => !r.daily),
    (r) => r.difficulty
  )[key];
  if (!s) return null;
  return `best ${fmtSeconds(s.best)} · avg ${fmtSeconds(s.avg)} · ${s.count} solved`;
}

export function SudokuSetup({ onCreate, onCancel, existing, queued, stats, confirm }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const tokenRef = useRef(0);

  useEffect(() => () => {
    tokenRef.current++;
  }, []);

  const pick = async (key) => {
    if (existing && !existing.solved && confirm) {
      const ok = await confirm({
        title: "Start a new game?",
        message: "Your current puzzle will be lost.",
        confirmLabel: "New game",
        danger: true,
      });
      if (!ok) return;
    }
    audio.ensure();
    if (queued?.[key]) {
      onCreate(key, queued[key], { fromQueue: true });
      return;
    }
    const token = ++tokenRef.current;
    setBusy(key);
    setError("");
    try {
      const generated = await requestPuzzle(key);
      if (token !== tokenRef.current) return;
      onCreate(key, generated);
    } catch {
      if (token === tokenRef.current) setError("Could not generate a puzzle. Try again.");
    } finally {
      if (token === tokenRef.current) setBusy(null);
    }
  };

  const cancel = () => {
    tokenRef.current++;
    setBusy(null);
  };

  return (
    <div className="page">
      <div className="topbar">
        {!busy && (
          <IconButton label="Back" onClick={onCancel}>
            ←
          </IconButton>
        )}
        <div>
          <div className="tb-title">Sudoku</div>
          <div className="tb-sub">Choose a difficulty</div>
        </div>
      </div>
      {busy ? (
        <div className="card center-card">
          <div className="spinner" />
          <p className="hint">Generating {DIFFICULTIES[busy].label} puzzle…</p>
          <button type="button" className="linkbtn" onClick={cancel}>
            Cancel
          </button>
        </div>
      ) : (
        <div className="diff-list">
          {Object.entries(DIFFICULTIES).map(([key, d]) => {
            const line = tierLine(stats, key);
            return (
              <button key={key} type="button" className="bigbtn sudoku-diff" onClick={() => pick(key)}>
                <span>{d.label}</span>
                <span className="diff-meta">
                  {queued?.[key] ? `${queued[key].clueCount} clues, ready` : `about ${d.clues} clues`}
                </span>
                {line && <span className="diff-meta">{line}</span>}
              </button>
            );
          })}
        </div>
      )}
      {error && <p className="warn">{error}</p>}
    </div>
  );
}

export function DailySudokuLoader({ day, difficulty, onReady, onCancel }) {
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => {
    let cancelled = false;
    setError("");
    requestPuzzle(difficulty, { seed: dailySudokuSeed(day) })
      .then((generated) => {
        if (!cancelled) readyRef.current(generated);
      })
      .catch(() => {
        if (!cancelled) setError("Could not build today's puzzle.");
      });
    return () => {
      cancelled = true;
    };
  }, [day, difficulty, attempt]);

  return (
    <div className="page">
      <div className="topbar">
        <IconButton label="Back" onClick={onCancel}>
          ←
        </IconButton>
        <div>
          <div className="tb-title">Daily Sudoku</div>
          <div className="tb-sub">{day}</div>
        </div>
      </div>
      <div className="card center-card">
        {error ? (
          <>
            <p className="warn">{error}</p>
            <button type="button" className="bigbtn" onClick={() => setAttempt((a) => a + 1)}>
              Try again
            </button>
          </>
        ) : (
          <>
            <div className="spinner" />
            <p className="hint">Preparing today's puzzle…</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function Sudoku({ game, onChange, onHome, visible, stats, queued, onCreate, confirm }) {
  const [pickingNew, setPickingNew] = useState(false);
  const running = !game.solved && !game.paused && visible && !pickingNew;
  useActiveTimer(onChange, running);
  useTicker(running, 1000);

  const gameRef = useRef(game);
  gameRef.current = game;

  const values = game.entries;
  const conflicts = useMemo(() => (game.showConflicts ? findConflicts(values) : new Set()), [values, game.showConflicts]);
  const sel = game.selected;
  const selVal = sel != null ? values[sel] : 0;

  const remaining = useMemo(() => {
    const counts = new Array(10).fill(9);
    for (const v of values) if (v) counts[v]--;
    return counts;
  }, [values]);

  const select = useCallback((i) => onChange((g) => (g.selected === i ? g : { ...g, selected: i })), [onChange]);

  const place = useCallback(
    (digit) => {
      const g0 = gameRef.current;
      if (g0.solved || g0.paused) return;
      if (g0.selected == null || g0.givens[g0.selected] !== 0) return;
      const pencilMode = g0.mode === "pencil" && !g0.autoCandidates;
      const i = g0.selected;
      const wrong = !pencilMode && g0.entries[i] !== digit && digit !== g0.solution[i];
      vibrate(wrong && g0.showMistakes ? "warn" : "tap");
      onChange((g) => {
        if (g.selected !== i || g.givens[i] !== 0 || g.solved) return g;
        if (pencilMode) {
          if (g.entries[i]) return g;
          const marks = new Set(g.pencil[i]);
          if (marks.has(digit)) marks.delete(digit);
          else marks.add(digit);
          const pencil = g.pencil.slice();
          pencil[i] = [...marks].sort((a, b) => a - b);
          return withUndo(g, { ...g, pencil });
        }
        const entries = g.entries.slice();
        const pencil = g.pencil.slice();
        let mistakes = g.mistakes || 0;
        if (entries[i] === digit) {
          entries[i] = 0;
        } else {
          entries[i] = digit;
          if (digit !== g.solution[i]) mistakes++;
          if (pencil[i].length) pencil[i] = [];
          for (const p of PEERS[i]) {
            if (pencil[p].includes(digit)) pencil[p] = pencil[p].filter((d) => d !== digit);
          }
        }
        const next = withUndo(g, { ...g, entries, pencil, mistakes });
        return finish(next, entries);
      });
    },
    [onChange]
  );

  const erase = useCallback(() => {
    onChange((g) => {
      const i = g.selected;
      if (i == null || g.givens[i] !== 0 || g.solved || g.paused) return g;
      if (!g.entries[i] && !g.pencil[i].length) return g;
      const entries = g.entries.slice();
      const pencil = g.pencil.slice();
      entries[i] = 0;
      pencil[i] = [];
      return withUndo(g, { ...g, entries, pencil });
    });
  }, [onChange]);

  const undo = useCallback(() => {
    onChange((g) => {
      if (g.solved || g.paused || !g.undo?.length) return g;
      const step = g.undo[g.undo.length - 1];
      const entries = g.entries.slice();
      const pencil = g.pencil.slice();
      for (const [i, entry, marks] of step) {
        entries[i] = entry;
        pencil[i] = marks;
      }
      return { ...g, entries, pencil, undo: g.undo.slice(0, -1), selected: step[0][0] };
    });
  }, [onChange]);

  const hint = useCallback(() => {
    onChange((g) => {
      if (g.solved || g.paused) return g;
      let i = g.selected;
      if (i == null || g.givens[i] !== 0 || g.entries[i] === g.solution[i]) {
        i = g.entries.findIndex((v, k) => v !== g.solution[k]);
      }
      if (i < 0) return g;
      const digit = g.solution[i];
      const entries = g.entries.slice();
      const pencil = g.pencil.slice();
      entries[i] = digit;
      pencil[i] = [];
      for (const p of PEERS[i]) {
        if (pencil[p].includes(digit)) pencil[p] = pencil[p].filter((d) => d !== digit);
      }
      const next = withUndo(g, { ...g, entries, pencil, selected: i, hints: (g.hints || 0) + 1 });
      return finish(next, entries);
    });
  }, [onChange]);

  const setFlag = (key) => onChange((g) => ({ ...g, [key]: !g[key] }));
  const toggleMode = useCallback(
    () => onChange((g) => (g.autoCandidates ? g : { ...g, mode: g.mode === "pencil" ? "digit" : "pencil" })),
    [onChange]
  );
  const togglePause = useCallback(
    () => onChange((g) => (g.solved ? g : { ...g, paused: !g.paused })),
    [onChange]
  );

  useEffect(() => {
    if (pickingNew) return undefined;
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (document.querySelector(".sheet-backdrop")) return;
      const g = gameRef.current;
      if (g.solved) return;
      const k = e.key;
      if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (k === "p" || k === "P") {
        togglePause();
        return;
      }
      if (g.paused) return;
      if (/^[1-9]$/.test(k)) {
        e.preventDefault();
        place(Number(k));
      } else if (k === "Backspace" || k === "Delete" || k === "0") {
        e.preventDefault();
        erase();
      } else if (k === "n" || k === "N") {
        toggleMode();
      } else if (k.startsWith("Arrow")) {
        e.preventDefault();
        const cur = g.selected ?? 40;
        let r = Math.floor(cur / 9);
        let c = cur % 9;
        if (g.selected != null) {
          if (k === "ArrowUp") r = (r + 8) % 9;
          if (k === "ArrowDown") r = (r + 1) % 9;
          if (k === "ArrowLeft") c = (c + 8) % 9;
          if (k === "ArrowRight") c = (c + 1) % 9;
        }
        select(r * 9 + c);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickingNew, place, erase, undo, toggleMode, togglePause, select]);

  const elapsed = elapsedOf(game);
  const label = DIFFICULTIES[game.difficulty].label;
  const title = game.daily ? "Daily Sudoku" : `Sudoku · ${label}`;

  if (pickingNew) {
    return (
      <SudokuSetup
        existing={game}
        queued={queued}
        stats={stats}
        confirm={confirm}
        onCreate={(...args) => {
          setPickingNew(false);
          onCreate(...args);
        }}
        onCancel={() => setPickingNew(false)}
      />
    );
  }

  if (game.solved) {
    const line = game.daily ? null : tierLine(stats, game.difficulty);
    return (
      <div className="page">
        <div className="card center-card solved-card">
          <div className="solved-mark" aria-hidden="true">
            ✓
          </div>
          <h3>{game.daily ? "Daily puzzle solved" : "Solved!"}</h3>
          <p className="hint">
            {label} · {fmtElapsed(elapsed)} · {game.clueCount} clues
          </p>
          <p className="hint small">
            {plural(game.mistakes || 0, "mistake")} · {plural(game.hints || 0, "hint")}
            {line ? ` · ${line}` : ""}
          </p>
          <div className="newrow">
            {!game.daily && (
              <button type="button" className="bigbtn" onClick={() => setPickingNew(true)}>
                New game
              </button>
            )}
            <button type="button" className="bigbtn secondary" onClick={onHome}>
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pencilMode = game.mode === "pencil" && !game.autoCandidates;

  return (
    <div className="page sudoku-page">
      <div className="topbar">
        <IconButton label="Back" onClick={onHome}>
          ←
        </IconButton>
        <div>
          <div className="tb-title">{title}</div>
          <div className="tb-sub">
            {game.daily ? `${label} · ` : ""}
            {game.clueCount} clues · <span className="mono">{fmtElapsed(elapsed)}</span>
            {game.mistakes ? ` · ${plural(game.mistakes, "mistake")}` : ""}
          </div>
        </div>
        <IconButton label={game.paused ? "Resume" : "Pause"} onClick={togglePause} aria-pressed={!!game.paused}>
          {game.paused ? "▶" : "⏸"}
        </IconButton>
        {!game.daily && (
          <IconButton label="New game" onClick={() => setPickingNew(true)}>
            ⚙
          </IconButton>
        )}
      </div>

      <div className="sudoku-wrap">
        <div className={`sudoku-grid${game.paused ? " blurred" : ""}`} role="grid" aria-label="Sudoku grid">
          {Array.from({ length: 81 }, (_, i) => {
            const r = Math.floor(i / 9);
            const c = i % 9;
            const given = game.givens[i] !== 0;
            const val = values[i];
            const classes = ["sd-cell"];
            if (c % 3 === 0) classes.push("bl");
            if (r % 3 === 0) classes.push("bt");
            if (c === 8) classes.push("br");
            if (r === 8) classes.push("bb");
            if (given) classes.push("given");
            if (sel === i) classes.push("selected");
            else if (sel != null && isPeer(sel, i)) classes.push("peer");
            if (selVal && val === selVal && sel !== i) classes.push("samedigit");
            if (!given && val && conflicts.has(i)) classes.push("conflict");
            if (!given && val && game.showMistakes && val !== game.solution[i]) classes.push("mistake");
            const marks = !val ? (game.autoCandidates ? candidatesAt(values, i) : game.pencil[i]) : [];
            return (
              <button
                type="button"
                key={i}
                className={classes.join(" ")}
                onClick={() => select(i)}
                disabled={game.paused}
                aria-label={`Row ${r + 1} column ${c + 1}${val ? `, ${val}` : ", empty"}`}
              >
                {val ? (
                  val
                ) : marks.length ? (
                  <span className={`sd-pencil${game.autoCandidates ? " auto" : ""}`}>
                    {DIGITS.map((d) => (
                      <span key={d} className={selVal === d ? "hl" : undefined}>
                        {marks.includes(d) ? d : ""}
                      </span>
                    ))}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {game.paused && (
          <div className="sudoku-paused">
            <button type="button" className="bigbtn" onClick={togglePause}>
              ▶ Resume
            </button>
          </div>
        )}
      </div>

      <div className="sudoku-toolbar">
        <button type="button" className="toolbtn" onClick={undo} disabled={game.paused || !game.undo?.length}>
          ↶ Undo
        </button>
        <button
          type="button"
          className={`toolbtn ${pencilMode ? "on" : ""}`}
          onClick={toggleMode}
          disabled={game.paused || game.autoCandidates}
          aria-pressed={pencilMode}
        >
          ✏︎ Notes
        </button>
        <button type="button" className="toolbtn" onClick={erase} disabled={game.paused}>
          ⌫ Erase
        </button>
        <button type="button" className="toolbtn" onClick={hint} disabled={game.paused}>
          💡 Hint
        </button>
      </div>
      <div className="sudoku-toolbar small">
        <button
          type="button"
          className={`toolbtn ${game.autoCandidates ? "on" : ""}`}
          onClick={() => setFlag("autoCandidates")}
          aria-pressed={!!game.autoCandidates}
        >
          Auto notes
        </button>
        <button
          type="button"
          className={`toolbtn ${game.showConflicts ? "on" : ""}`}
          onClick={() => setFlag("showConflicts")}
          aria-pressed={!!game.showConflicts}
        >
          Conflicts
        </button>
        <button
          type="button"
          className={`toolbtn ${game.showMistakes ? "on" : ""}`}
          onClick={() => setFlag("showMistakes")}
          aria-pressed={!!game.showMistakes}
        >
          Mistakes
        </button>
      </div>

      <div className="digitpad">
        {DIGITS.map((d) => (
          <button
            type="button"
            key={d}
            className={`numbtn${remaining[d] <= 0 ? " done" : ""}${selVal === d ? " hl" : ""}`}
            onClick={() => place(d)}
            disabled={game.paused}
            aria-label={`${d}, ${Math.max(0, remaining[d])} left`}
          >
            <span className="numbtn-d">{d}</span>
            <span className="numbtn-left">{Math.max(0, remaining[d])}</span>
          </button>
        ))}
      </div>
      <p className="hint small kbd-hint">Keys: 1 to 9, arrows, Backspace, N for notes, P to pause.</p>
    </div>
  );
}
