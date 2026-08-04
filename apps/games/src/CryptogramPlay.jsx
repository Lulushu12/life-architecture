import { useMemo, useState } from "react";
import { invert, isSolved, plainLetterOf, tokenize, usedCipherLetters } from "./cryptogram.js";

const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

export default function CryptogramPlay({ puzzle, progress, onChange, onHome }) {
  const [selected, setSelected] = useState(null);
  const [wrongSet, setWrongSet] = useState(new Set());

  const perm = progress.perm;
  const inv = useMemo(() => invert(perm), [perm]);
  const tokens = useMemo(() => tokenize(puzzle.text), [puzzle.text]);
  const used = useMemo(() => usedCipherLetters(puzzle.text, perm), [puzzle.text, perm]);
  const guesses = progress.guesses || {};
  const solved = progress.solved;

  const guessCounts = {};
  for (const cl of Object.keys(guesses)) {
    const gl = guesses[cl];
    if (!gl) continue;
    guessCounts[gl] = (guessCounts[gl] || 0) + 1;
  }
  const conflicting = new Set(Object.keys(guesses).filter((cl) => guesses[cl] && guessCounts[guesses[cl]] > 1));
  const usedGuessLetters = new Set(Object.values(guesses).filter(Boolean));

  const selectLetter = (cl) => {
    setWrongSet(new Set());
    setSelected((cur) => (cur === cl ? null : cl));
  };

  const assign = (letter) => {
    if (!selected || solved) return;
    setWrongSet(new Set());
    onChange((p) => {
      const guesses = { ...p.guesses, [selected]: letter };
      const nowSolved = isSolved(puzzle.text, p.perm, guesses);
      return { ...p, guesses, solved: nowSolved, solvedAt: nowSolved ? Date.now() : p.solvedAt };
    });
  };

  const clearSelected = () => {
    if (!selected) return;
    setWrongSet(new Set());
    onChange((p) => {
      const guesses = { ...p.guesses };
      delete guesses[selected];
      return { ...p, guesses, solved: false, solvedAt: null };
    });
  };

  const check = () => {
    const wrong = new Set();
    for (const cl of used) {
      const g = guesses[cl];
      if (g && g !== plainLetterOf(cl, inv)) wrong.add(cl);
    }
    setWrongSet(wrong);
  };

  const hint = () => {
    const unsolved = [...used].filter((cl) => guesses[cl] !== plainLetterOf(cl, inv));
    if (!unsolved.length) return;
    const cl = unsolved[Math.floor(Math.random() * unsolved.length)];
    setWrongSet(new Set());
    onChange((p) => {
      const guesses = { ...p.guesses, [cl]: plainLetterOf(cl, invert(p.perm)) };
      const nowSolved = isSolved(puzzle.text, p.perm, guesses);
      return { ...p, guesses, solved: nowSolved, solvedAt: nowSolved ? Date.now() : p.solvedAt };
    });
  };

  return (
    <div className="page">
      <div className="topbar">
        <button className="iconbtn" onClick={onHome}>
          ←
        </button>
        <div>
          <div className="tb-title">Cryptogram</div>
          <div className="tb-sub">{solved ? "Solved!" : "Tap a letter, then the keyboard"}</div>
        </div>
      </div>

      <div className="card cg-board">
        {tokens.map((t, i) =>
          t.type === "text" ? (
            <span key={i} className="cg-text">
              {t.value}
            </span>
          ) : (
            <span key={i} className="cg-word">
              {t.letters.map((cipherLetter, j) => {
                const guess = guesses[cipherLetter] || "";
                const classes = ["cg-cell"];
                if (selected === cipherLetter) classes.push("selected");
                if (conflicting.has(cipherLetter)) classes.push("conflict");
                if (wrongSet.has(cipherLetter)) classes.push("wrong");
                return (
                  <span key={j} className={classes.join(" ")} onClick={() => selectLetter(cipherLetter)}>
                    <span className="cg-cipher">{cipherLetter}</span>
                    <span className="cg-guess">{guess}</span>
                  </span>
                );
              })}
            </span>
          )
        )}
      </div>

      {solved && (
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36 }}>🎉</div>
          <p className="hint" style={{ margin: "6px 0 0" }}>
            "{puzzle.text}"
          </p>
          <p className="hint small">— {puzzle.attribution}</p>
        </div>
      )}

      <div className="cg-actions">
        <button className="toolbtn" onClick={clearSelected} disabled={!selected}>
          Clear letter
        </button>
        <button className="toolbtn" onClick={check} disabled={solved}>
          Check
        </button>
        <button className="toolbtn" onClick={hint} disabled={solved}>
          Hint
        </button>
      </div>

      <div className="cg-keyboard">
        {ALPHABET.map((letter) => (
          <button
            key={letter}
            className={`cg-key ${usedGuessLetters.has(letter) ? "used" : ""}`}
            disabled={!selected || solved}
            onClick={() => assign(letter)}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
}
