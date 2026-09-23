import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconButton } from "@shared/ui.jsx";
import { vibrate } from "@shared/haptics.js";
import {
  cipherFrequency,
  cipherSequence,
  invert,
  isSolved,
  plainLetterOf,
  tokenize,
  usedCipherLetters,
} from "./cryptogram.js";
import { elapsedOf, fmtElapsed, stopTimer, useActiveTimer, useTicker } from "./timing.js";

const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const UNDO_CAP = 100;

function nextUnfilled(sequence, guesses, from) {
  const n = sequence.length;
  const start = from == null ? -1 : sequence.indexOf(from);
  for (let k = 1; k <= n; k++) {
    const cl = sequence[(start + k + n) % n];
    if (!guesses[cl]) return cl;
  }
  return null;
}

function applyGuesses(p, guesses, text, extra = {}) {
  const solved = isSolved(text, p.perm, guesses);
  const undo = [...(p.undo || []), p.guesses || {}].slice(-UNDO_CAP);
  const base = { ...p, ...extra, guesses, undo, solved };
  if (!solved) return { ...base, solvedAt: null };
  const now = Date.now();
  return { ...stopTimer(base, now), solvedAt: now };
}

export default function CryptogramPlay({ puzzle, progress, visible, onChange, onHome }) {
  const perm = progress.perm;
  const inv = useMemo(() => invert(perm), [perm]);
  const tokens = useMemo(() => tokenize(puzzle.text), [puzzle.text]);
  const used = useMemo(() => usedCipherLetters(puzzle.text, perm), [puzzle.text, perm]);
  const sequence = useMemo(() => [...new Set(cipherSequence(puzzle.text, perm))], [puzzle.text, perm]);
  const frequency = useMemo(() => cipherFrequency(puzzle.text, perm), [puzzle.text, perm]);
  const guesses = progress.guesses || {};
  const solved = progress.solved;

  const [selected, setSelected] = useState(() => nextUnfilled(sequence, guesses, null));
  const [wrongSet, setWrongSet] = useState(() => new Set());

  const running = !solved && visible;
  useActiveTimer(onChange, running);
  useTicker(running, 1000);

  const guessCounts = {};
  for (const cl of Object.keys(guesses)) {
    const gl = guesses[cl];
    if (gl) guessCounts[gl] = (guessCounts[gl] || 0) + 1;
  }
  const conflicting = new Set(Object.keys(guesses).filter((cl) => guesses[cl] && guessCounts[guesses[cl]] > 1));
  const usedGuessLetters = new Set(Object.values(guesses).filter(Boolean));

  const stateRef = useRef({});
  stateRef.current = { selected, guesses, solved };

  const selectLetter = (cl) => {
    setWrongSet(new Set());
    setSelected((cur) => (cur === cl ? null : cl));
  };

  const assign = useCallback(
    (letter) => {
      const { selected: cur, guesses: g, solved: done } = stateRef.current;
      if (done) return;
      const target = cur || nextUnfilled(sequence, g, null);
      if (!target) return;
      vibrate("tap");
      setWrongSet(new Set());
      const nextGuesses = { ...g, [target]: letter };
      onChange((p) => applyGuesses(p, { ...(p.guesses || {}), [target]: letter }, puzzle.text));
      setSelected(nextUnfilled(sequence, nextGuesses, target) || target);
    },
    [onChange, puzzle.text, sequence]
  );

  const clearSelected = useCallback(() => {
    const { selected: cur, guesses: g, solved: done } = stateRef.current;
    if (!cur || done || !g[cur]) return;
    setWrongSet(new Set());
    onChange((p) => {
      const next = { ...(p.guesses || {}) };
      delete next[cur];
      return applyGuesses(p, next, puzzle.text);
    });
  }, [onChange, puzzle.text]);

  const undo = useCallback(() => {
    setWrongSet(new Set());
    onChange((p) => {
      if (p.solved || !p.undo?.length) return p;
      return { ...p, guesses: p.undo[p.undo.length - 1], undo: p.undo.slice(0, -1) };
    });
  }, [onChange]);

  const check = () => {
    const wrong = new Set();
    for (const cl of used) {
      const g = guesses[cl];
      if (g && g !== plainLetterOf(cl, inv)) wrong.add(cl);
    }
    setWrongSet(wrong);
    if (!wrong.size) setWrongSet(new Set(["__ok"]));
    vibrate(wrong.size ? "warn" : "success");
  };

  const hint = () => {
    const unsolved = sequence.filter((cl) => guesses[cl] !== plainLetterOf(cl, inv));
    if (!unsolved.length) return;
    const cl = selected && unsolved.includes(selected) ? selected : unsolved[0];
    const letter = plainLetterOf(cl, inv);
    setWrongSet(new Set());
    const nextGuesses = { ...guesses, [cl]: letter };
    onChange((p) =>
      applyGuesses(p, { ...(p.guesses || {}), [cl]: letter }, puzzle.text, { hints: (p.hints || 0) + 1 })
    );
    setSelected(nextUnfilled(sequence, nextGuesses, cl));
  };

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (document.querySelector(".sheet-backdrop")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        assign(e.key.toUpperCase());
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        clearSelected();
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const cur = stateRef.current.selected;
        const i = cur ? sequence.indexOf(cur) : -1;
        const n = sequence.length;
        const step = e.key === "ArrowRight" ? 1 : -1;
        setSelected(sequence[(i + step + n) % n]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assign, clearSelected, undo, sequence]);

  const elapsed = elapsedOf(progress);
  const title = puzzle.daily ? "Daily Cryptogram" : "Cryptogram";
  const allChecked = wrongSet.has("__ok");

  return (
    <div className="page">
      <div className="topbar">
        <IconButton label="Back" onClick={onHome}>
          ←
        </IconButton>
        <div>
          <div className="tb-title">{title}</div>
          <div className="tb-sub">
            {solved ? "Solved!" : "Tap a letter, then the keyboard"} ·{" "}
            <span className="mono">{fmtElapsed(elapsed)}</span>
          </div>
        </div>
      </div>

      <div className="card cg-board">
        {tokens.map((t, i) =>
          t.type === "text" ? (
            <span key={i} className="cg-sep">
              {/^\s/.test(t.value) && <span className="cg-space" />}
              {t.value.trim() && <span className="cg-text">{t.value.trim()}</span>}
              {/\s$/.test(t.value) && t.value.trim() && <span className="cg-space" />}
            </span>
          ) : (
            <span key={i} className="cg-word">
              {t.letters.map((plain, j) => {
                const cipherLetter = String.fromCharCode(65 + perm[plain.charCodeAt(0) - 65]);
                const guess = guesses[cipherLetter] || "";
                const classes = ["cg-cell"];
                if (selected === cipherLetter) classes.push("selected");
                if (conflicting.has(cipherLetter)) classes.push("conflict");
                if (wrongSet.has(cipherLetter)) classes.push("wrong");
                return (
                  <button
                    type="button"
                    key={j}
                    className={classes.join(" ")}
                    onClick={() => selectLetter(cipherLetter)}
                    aria-label={`Cipher ${cipherLetter}${guess ? `, guess ${guess}` : ""}`}
                    aria-pressed={selected === cipherLetter}
                  >
                    <span className="cg-guess">{guess}</span>
                    <span className="cg-cipher">{cipherLetter}</span>
                  </button>
                );
              })}
            </span>
          )
        )}
      </div>

      {solved ? (
        <div className="card center-card">
          <div className="solved-mark" aria-hidden="true">
            ✓
          </div>
          <p className="hint quote">"{puzzle.text}"</p>
          <p className="hint small">{puzzle.attribution}</p>
          <p className="hint small">
            Solved in {fmtElapsed(elapsed)} · {progress.hints || 0} {progress.hints === 1 ? "hint" : "hints"}
          </p>
        </div>
      ) : (
        <>
          <div className="cg-freq" aria-label="Cipher letter frequency">
            {frequency.map(([cl, count]) => (
              <button
                type="button"
                key={cl}
                className={`cg-freq-item${selected === cl ? " selected" : ""}${guesses[cl] ? " filled" : ""}`}
                onClick={() => selectLetter(cl)}
                aria-label={`${cl} appears ${count} times`}
              >
                <span className="cg-freq-l">{cl}</span>
                <span className="cg-freq-n">{count}</span>
                <span className="cg-freq-g">{guesses[cl] || "·"}</span>
              </button>
            ))}
          </div>

          <div className="cg-actions">
            <button type="button" className="toolbtn" onClick={undo} disabled={!progress.undo?.length}>
              ↶ Undo
            </button>
            <button type="button" className="toolbtn" onClick={clearSelected} disabled={!selected || !guesses[selected]}>
              Clear
            </button>
            <button type="button" className="toolbtn" onClick={check}>
              Check
            </button>
            <button type="button" className="toolbtn" onClick={hint}>
              Hint{progress.hints ? ` (${progress.hints})` : ""}
            </button>
          </div>
          {allChecked && <p className="okmsg center">No wrong letters so far.</p>}

          <div className="cg-keyboard">
            {ALPHABET.map((letter) => (
              <button
                type="button"
                key={letter}
                className={`cg-key ${usedGuessLetters.has(letter) ? "used" : ""}`}
                onClick={() => assign(letter)}
              >
                {letter}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
