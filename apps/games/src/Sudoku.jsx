import { useEffect, useState } from "react";
import { DIFFICULTIES, findConflicts, generatePuzzleAsync } from "./sudokuGen.js";

export function freshSudoku(difficulty, puzzle, solution, clueCount) {
  const now = Date.now();
  return {
    difficulty,
    givens: puzzle.slice(),
    solution: solution.slice(),
    entries: puzzle.map((v) => (v === 0 ? 0 : v)),
    pencil: Array.from({ length: 81 }, () => []),
    selected: null,
    mode: "digit",
    showErrors: true,
    startedAt: now,
    solved: false,
    solvedAt: null,
    clueCount,
    createdAt: now,
    updatedAt: now,
  };
}

export function fmtElapsed(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function SudokuSetup({ onCreate, onCancel, existing }) {
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("");

  const pick = async (key) => {
    if (existing && !existing.solved) {
      if (!confirm("Start a new game? Your current puzzle will be lost.")) return;
    }
    setBusy(true);
    setBusyLabel(DIFFICULTIES[key].label);
    const { puzzle, solution, clueCount } = await generatePuzzleAsync(DIFFICULTIES[key].clues);
    onCreate(freshSudoku(key, puzzle, solution, clueCount));
    setBusy(false);
  };

  return (
    <div className="page">
      <div className="topbar">
        <button className="iconbtn" onClick={onCancel}>
          ←
        </button>
        <div>
          <div className="tb-title">Sudoku</div>
          <div className="tb-sub">Choose a difficulty</div>
        </div>
      </div>
      {busy ? (
        <div className="card" style={{ textAlign: "center", padding: "40px 14px" }}>
          <div className="spinner" />
          <p className="hint">Generating {busyLabel} puzzle…</p>
        </div>
      ) : (
        <div className="chips" style={{ flexDirection: "column" }}>
          {Object.entries(DIFFICULTIES).map(([key, d]) => (
            <button key={key} className="bigbtn sudoku-diff" onClick={() => pick(key)}>
              {d.label} <span className="hint small" style={{ margin: 0 }}>~{d.clues} clues</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sudoku({ game, onChange, onNewGame, onHome }) {
  const [, setTick] = useState(0);
  const [pickingNew, setPickingNew] = useState(false);

  useEffect(() => {
    if (game.solved) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [game.solved]);

  const values = game.entries;
  const conflicts = game.showErrors ? findConflicts(values) : new Set();
  const selVal = game.selected != null ? values[game.selected] : 0;

  const select = (i) => {
    if (game.givens[i] !== 0) {
      onChange((g) => ({ ...g, selected: i }));
      return;
    }
    onChange((g) => ({ ...g, selected: i }));
  };

  const checkWin = (entries) => {
    for (let i = 0; i < 81; i++) if (entries[i] !== game.solution[i]) return false;
    return true;
  };

  const place = (digit) => {
    if (game.selected == null || game.givens[game.selected] !== 0 || game.solved) return;
    onChange((g) => {
      const i = g.selected;
      if (g.mode === "pencil") {
        const pencil = g.pencil.map((p) => p.slice());
        const set = new Set(pencil[i]);
        if (set.has(digit)) set.delete(digit);
        else set.add(digit);
        pencil[i] = [...set].sort();
        return { ...g, pencil };
      }
      const entries = g.entries.slice();
      entries[i] = entries[i] === digit ? 0 : digit;
      const pencil = g.pencil.map((p, idx) => (idx === i ? [] : p));
      const solved = checkWin(entries);
      return {
        ...g,
        entries,
        pencil,
        solved,
        solvedAt: solved ? Date.now() : null,
      };
    });
  };

  const erase = () => {
    if (game.selected == null || game.givens[game.selected] !== 0) return;
    onChange((g) => {
      const i = g.selected;
      const entries = g.entries.slice();
      entries[i] = 0;
      const pencil = g.pencil.map((p, idx) => (idx === i ? [] : p));
      return { ...g, entries, pencil };
    });
  };

  const toggleMode = () => onChange((g) => ({ ...g, mode: g.mode === "pencil" ? "digit" : "pencil" }));
  const toggleErrors = () => onChange((g) => ({ ...g, showErrors: !g.showErrors }));

  const elapsed = (game.solved ? game.solvedAt : Date.now()) - game.startedAt;

  if (pickingNew) {
    return (
      <SudokuSetup
        existing={game}
        onCreate={(g) => {
          setPickingNew(false);
          onNewGame(g);
        }}
        onCancel={() => setPickingNew(false)}
      />
    );
  }

  if (game.solved) {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: "center", padding: "40px 14px" }}>
          <div style={{ fontSize: 46 }}>🎉</div>
          <h3>Solved!</h3>
          <p className="hint">
            {DIFFICULTIES[game.difficulty].label} · {fmtElapsed(elapsed)}
          </p>
          <div className="newrow">
            <button className="bigbtn" onClick={() => setPickingNew(true)}>
              New game
            </button>
            <button className="bigbtn sudoku-ghost" onClick={onHome}>
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="topbar">
        <button className="iconbtn" onClick={onHome}>
          ←
        </button>
        <div>
          <div className="tb-title">Sudoku · {DIFFICULTIES[game.difficulty].label}</div>
          <div className="tb-sub">{fmtElapsed(elapsed)}</div>
        </div>
        <button className="iconbtn" onClick={() => setPickingNew(true)}>
          ⚙
        </button>
      </div>

      <div className="sudoku-grid">
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
          if (game.selected === i) classes.push("selected");
          if (conflicts.has(i)) classes.push("conflict");
          if (selVal && val === selVal) classes.push("samedigit");
          return (
            <div key={i} className={classes.join(" ")} onClick={() => select(i)}>
              {val ? (
                val
              ) : game.pencil[i].length ? (
                <div className="sd-pencil">
                  {Array.from({ length: 9 }, (_, k) => (
                    <span key={k}>{game.pencil[i].includes(k + 1) ? k + 1 : ""}</span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="sudoku-toolbar">
        <button className={`toolbtn ${game.mode === "pencil" ? "on" : ""}`} onClick={toggleMode}>
          ✏︎ Pencil
        </button>
        <button className={`toolbtn ${game.showErrors ? "on" : ""}`} onClick={toggleErrors}>
          ⚠ Errors
        </button>
        <button className="toolbtn" onClick={erase}>
          ⌫ Erase
        </button>
      </div>

      <div className="digitpad">
        {Array.from({ length: 9 }, (_, k) => k + 1).map((d) => (
          <button key={d} className="numbtn" onClick={() => place(d)}>
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}
