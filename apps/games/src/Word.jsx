import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconButton, SettingRow, Toggle, useToast } from "@shared/ui.jsx";
import { audio } from "@shared/audio.js";
import { vibrate } from "@shared/haptics.js";
import { copyToClipboard } from "@shared/backup.js";
import {
  KEY_ROWS,
  MAX_GUESSES,
  WORD_LEN,
  evaluate,
  hardModeError,
  isAllowed,
  keyStates,
  shareText,
  submitGuess,
} from "./word.js";

export function WordStats({ summary, highlight }) {
  const max = Math.max(1, ...summary.dist);
  return (
    <div className="ws-stats">
      <div className="ws-nums">
        <div>
          <strong>{summary.played}</strong>
          <span>Played</span>
        </div>
        <div>
          <strong>{summary.winRate}%</strong>
          <span>Win rate</span>
        </div>
        <div>
          <strong>{summary.streak}</strong>
          <span>Daily streak</span>
        </div>
        <div>
          <strong>{summary.best}</strong>
          <span>Best streak</span>
        </div>
      </div>
      <div className="ws-dist" aria-label="Guess distribution">
        {summary.dist.map((n, i) => (
          <div key={i} className="ws-dist-row">
            <span className="ws-dist-k">{i + 1}</span>
            <span className="ws-dist-bar-wrap">
              <span
                className={`ws-dist-bar${highlight === i + 1 ? " hl" : ""}`}
                style={{ width: `${Math.max(8, (n / max) * 100)}%` }}
              >
                {n}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Word({ game, settings, summary, onChange, onHard, onNewRandom, onDaily, onHome, confirm }) {
  const toast = useToast();
  const [input, setInput] = useState("");
  const [shake, setShake] = useState(false);
  const [revealRow, setRevealRow] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const stateRef = useRef({});
  stateRef.current = { game, input, settings };

  const done = game.status !== "playing";
  const keys = useMemo(() => keyStates(game.guesses, game.answer), [game.guesses, game.answer]);

  useEffect(() => {
    if (!shake) return undefined;
    const t = setTimeout(() => setShake(false), 450);
    return () => clearTimeout(t);
  }, [shake]);

  const reject = useCallback(
    (message) => {
      setShake(true);
      toast(message, { duration: 1600 });
      vibrate("warn", { enabled: stateRef.current.settings.haptics });
    },
    [toast]
  );

  const submit = useCallback(() => {
    const { game: g, input: word, settings: s } = stateRef.current;
    if (g.status !== "playing") return;
    if (word.length < WORD_LEN) return reject("Not enough letters");
    if (!isAllowed(word)) return reject("Not in word list");
    if (g.hard) {
      const err = hardModeError(word, g.guesses, g.answer);
      if (err) return reject(err);
    }
    audio.ensure();
    const next = submitGuess(g, word);
    setRevealRow(g.guesses.length);
    setInput("");
    onChange((cur) => (cur.status === "playing" && cur.guesses.length === g.guesses.length ? submitGuess(cur, word) : cur));
    if (next.status === "won") {
      audio.play("success", { enabled: s.sound });
      vibrate("success", { enabled: s.haptics });
      setTimeout(() => setShowStats(true), 1300);
    } else if (next.status === "lost") {
      audio.play("fail", { enabled: s.sound });
      vibrate("fail", { enabled: s.haptics });
      setTimeout(() => setShowStats(true), 1300);
    } else {
      vibrate("tap", { enabled: s.haptics });
    }
    return undefined;
  }, [onChange, reject]);

  const typeKey = useCallback(
    (k) => {
      const { game: g } = stateRef.current;
      if (g.status !== "playing") return;
      if (k === "enter") submit();
      else if (k === "back") setInput((v) => v.slice(0, -1));
      else if (/^[a-z]$/.test(k)) setInput((v) => (v.length < WORD_LEN ? v + k : v));
    },
    [submit]
  );

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (document.querySelector(".sheet-backdrop")) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") {
        if (t && t.tagName === "BUTTON") return;
        e.preventDefault();
        typeKey("enter");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        typeKey("back");
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        typeKey(e.key.toLowerCase());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [typeKey]);

  const share = async () => {
    const text = shareText(game);
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
        return;
      } catch (e) {
        if (e?.name === "AbortError") return;
      }
    }
    const ok = await copyToClipboard(text);
    toast(ok ? "Result copied" : "Could not copy the result");
  };

  const newRandom = async () => {
    if (!game.daily && !done && game.guesses.length) {
      const ok = await confirm({
        title: "Start a new word?",
        message: "This word will count as a loss.",
        confirmLabel: "New word",
        danger: true,
      });
      if (!ok) return;
    }
    setInput("");
    setShowStats(false);
    setRevealRow(null);
    onNewRandom();
  };

  const rows = [];
  for (let r = 0; r < MAX_GUESSES; r++) {
    const guess = game.guesses[r];
    const res = guess ? evaluate(guess, game.answer) : null;
    const current = !guess && r === game.guesses.length && !done;
    const letters = guess || (current ? input : "");
    rows.push(
      <div
        key={r}
        className={`ws-row${current && shake ? " shake" : ""}${revealRow === r ? " reveal" : ""}`}
        aria-label={guess ? `Guess ${r + 1}: ${guess}, ${res.join(", ")}` : undefined}
      >
        {Array.from({ length: WORD_LEN }, (_, i) => (
          <span
            key={i}
            className={`ws-tile${res ? ` ${res[i]}` : letters[i] ? " typed" : ""}`}
            style={res ? { animationDelay: `${i * 0.18}s` } : undefined}
          >
            {(letters[i] || "").toUpperCase()}
          </span>
        ))}
      </div>
    );
  }

  const title = game.daily ? "Daily Word" : "Word";
  const sub = game.daily
    ? `${game.daily}${game.hard ? " · hard" : ""}`
    : `Practice${game.hard ? " · hard" : ""}`;

  return (
    <div className="page word-page">
      <div className="topbar">
        <IconButton label="Back" onClick={onHome}>
          ←
        </IconButton>
        <div>
          <div className="tb-title">{title}</div>
          <div className="tb-sub">
            {sub} · {game.guesses.length}/{MAX_GUESSES}
          </div>
        </div>
        <IconButton label="Statistics" onClick={() => setShowStats((v) => !v)} aria-pressed={showStats}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M5 20V11M12 20V4M19 20v-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          </svg>
        </IconButton>
        {!game.daily && (
          <IconButton label="Random word" onClick={newRandom}>
            ↻
          </IconButton>
        )}
      </div>

      {showStats && (
        <div className="card">
          <h3>Word statistics</h3>
          <WordStats summary={summary} highlight={game.status === "won" ? game.guesses.length : null} />
        </div>
      )}

      {game.guesses.length === 0 && !done && (
        <div className="card ws-hard">
          <SettingRow label="Hard mode" hint="Revealed hints must be used in later guesses">
            <Toggle label="Hard mode" checked={game.hard} onChange={onHard} />
          </SettingRow>
        </div>
      )}

      <div className="ws-board" role="grid" aria-label="Guesses">
        {rows}
      </div>

      {done ? (
        <div className="card center-card ws-result">
          <h3>{game.status === "won" ? `Solved in ${game.guesses.length}/${MAX_GUESSES}` : "Out of guesses"}</h3>
          <p className="hint">
            The word was <strong className="ws-answer">{game.answer.toUpperCase()}</strong>
          </p>
          <div className="newrow">
            <button type="button" className="bigbtn" onClick={share}>
              Share
            </button>
            <button type="button" className="bigbtn secondary" onClick={newRandom}>
              {game.daily ? "Random word" : "Next word"}
            </button>
          </div>
          {!game.daily && onDaily && (
            <button type="button" className="linkbtn" onClick={onDaily}>
              Today's daily word
            </button>
          )}
        </div>
      ) : (
        <div className="ws-keyboard" aria-label="Keyboard">
          {KEY_ROWS.map((row, ri) => (
            <div key={ri} className="ws-krow">
              {ri === 2 && (
                <button type="button" className="ws-key wide" onClick={() => typeKey("enter")}>
                  Enter
                </button>
              )}
              {row.split("").map((k) => (
                <button
                  type="button"
                  key={k}
                  className={`ws-key${keys[k] ? ` ${keys[k]}` : ""}`}
                  onClick={() => typeKey(k)}
                  aria-label={keys[k] ? `${k}, ${keys[k]}` : k}
                >
                  {k.toUpperCase()}
                </button>
              ))}
              {ri === 2 && (
                <button type="button" className="ws-key wide" onClick={() => typeKey("back")} aria-label="Delete letter">
                  ⌫
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
