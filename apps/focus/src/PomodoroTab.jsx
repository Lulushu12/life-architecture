import { useEffect, useRef, useState } from "react";
import { useConfirm } from "@shared/ui.jsx";
import { audio } from "@shared/audio.js";
import { haptics, vibrate } from "@shared/haptics.js";
import {
  EXTEND_MIN,
  PRESETS,
  applyConfig,
  ambienceActive,
  breakRoutineRemainingMs,
  completeBreakRoutine,
  currentBreakRoutine,
  dismissPhaseEnd,
  extendPhase,
  goalStreaks,
  isBreak,
  NOTE_MAX,
  isRunning,
  logDistraction,
  nextBreakRoutine,
  noteDistraction,
  pausePomodoro,
  phaseLabel,
  pomodoroRemainingMs,
  pomodoroTotalMs,
  resetPomodoro,
  setAmbience,
  setPomodoroTask,
  skipBreak,
  skipPomodoro,
  startBreakRoutine,
  startPomodoro,
} from "./logic.js";
import { Ring, Sheet, fmtClock } from "./ui.jsx";
import { AMBIENCE_KINDS } from "./ambience.js";

function BreakRoutineCard({ store, setStore, now, onGesture }) {
  const routine = currentBreakRoutine(store);
  const run = store.pomodoro.run;
  const remaining = breakRoutineRemainingMs(store, now);
  const done = !!run?.breakRoutine;
  const started = remaining != null;
  const cued = useRef(null);
  const startedAt = run?.routine?.startedAt ?? null;

  useEffect(() => {
    if (!started || done || remaining > 0 || cued.current === startedAt) return;
    cued.current = startedAt;
    audio.play("success", { enabled: store.pomodoro.config.sound });
    vibrate(haptics.success, { enabled: store.settings.vibrate });
  }, [started, done, remaining, startedAt, store.pomodoro.config.sound, store.settings.vibrate]);

  if (!routine) return null;
  const act = (fn) => setStore((s) => fn(s, Date.now()));

  return (
    <div className={"card routinecard" + (done ? " done" : "")} aria-live="polite">
      <div className="flabel">Break routine</div>
      <div className="routine-title">{routine.title}</div>
      <p className="routine-text">{routine.text}</p>
      {done ? (
        <p className="okmsg routine-done">✓ Done. Enjoy the rest of your break.</p>
      ) : (
        <>
          {started && (
            <div className={"routine-clock" + (remaining === 0 ? " over" : "")} role="timer">
              {remaining === 0 ? "Time's up" : fmtClock(remaining)}
            </div>
          )}
          <div className="routine-actions">
            {!started ? (
              <button
                type="button"
                className="bigbtn secondary"
                onClick={() => {
                  onGesture();
                  act(startBreakRoutine);
                }}
              >
                Start {fmtClock(routine.seconds * 1000)}
              </button>
            ) : (
              <button type="button" className="bigbtn" onClick={() => act(completeBreakRoutine)}>
                Done
              </button>
            )}
            <div className="phaseend-row">
              {!started && (
                <button type="button" className="linkbtn" onClick={() => act(completeBreakRoutine)}>
                  Done
                </button>
              )}
              <button type="button" className="linkbtn" onClick={() => setStore(nextBreakRoutine)}>
                Another
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DistractionLog({ run, setStore }) {
  const [noteAt, setNoteAt] = useState(null);
  const [text, setText] = useState("");
  const count = run.distractions?.length || 0;

  const log = () => {
    const at = Date.now();
    setStore((s) => logDistraction(s, at));
    setNoteAt(at);
    setText("");
  };
  const close = () => {
    setNoteAt(null);
    setText("");
  };
  const save = (e) => {
    e.preventDefault();
    const at = noteAt;
    const value = text;
    setStore((s) => noteDistraction(s, at, value));
    close();
  };

  return (
    <div className="distract">
      {noteAt == null ? (
        <button type="button" className="chip distract-btn" onClick={log}>
          😵‍💫 I got distracted{count > 0 ? ` (${count})` : ""}
        </button>
      ) : (
        <form className="distract-form" onSubmit={save}>
          <label className="flabel" htmlFor="distract-note">
            Logged. What pulled you away? (optional)
          </label>
          <input
            id="distract-note"
            className="input"
            value={text}
            maxLength={NOTE_MAX}
            autoFocus
            placeholder="e.g. checked messages"
            onChange={(e) => setText(e.target.value)}
          />
          <div className="phaseend-row">
            <button type="submit" className="linkbtn" disabled={!text.trim()}>
              Save note
            </button>
            <button type="button" className="linkbtn" onClick={close}>
              Skip
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function PomodoroTab({ store, setStore, now, today, onStartGesture, onStart }) {
  const [confirm, confirmSheet] = useConfirm();
  const [picker, setPicker] = useState(false);
  const p = store.pomodoro;
  const run = p.run;
  const phase = run?.phase || "work";
  const running = isRunning(run);
  const remainingMs = pomodoroRemainingMs(store, now);
  const totalMs = pomodoroTotalMs(store);
  const pct = totalMs > 0 ? 1 - remainingMs / totalMs : 0;
  const elapsedMs = run && run.startedAt != null ? totalMs - remainingMs : 0;
  const todayCount = store.logs.days[today]?.pomodoroCount || 0;
  const goal = store.settings.dailyGoal;
  const streak = goalStreaks(store.logs.days, goal, today);
  const task = p.taskId ? store.tasks.items[p.taskId] : null;
  const activeTasks = Object.values(store.tasks.items)
    .filter((t) => !t.archived)
    .sort((a, b) => a.createdAt - b.createdAt);
  const pe = running ? null : p.phaseEnd;
  const amb = store.settings.ambience;
  const ambLabel = AMBIENCE_KINDS.find((k) => k.id === amb.kind)?.label || "Ambience";

  const act = (fn) => {
    onStartGesture();
    setStore((s) => fn(s, Date.now()));
  };

  const guardWork = async (title) => {
    if (phase !== "work" || elapsedMs < 60000) return true;
    return confirm({
      title,
      message: `${fmtClock(elapsedMs)} of focus so far will not count as a pomodoro.`,
      confirmLabel: title.startsWith("Skip") ? "Skip" : "Reset",
      danger: true,
    });
  };

  const handleSkip = async () => {
    if (await guardWork("Skip this focus session?")) setStore((s) => skipPomodoro(s, Date.now()));
  };
  const handleReset = async () => {
    if (await guardWork("Reset this focus session?")) setStore((s) => resetPomodoro(s, Date.now()));
  };

  const pickTask = (id) => {
    setStore((s) => setPomodoroTask(s, id));
    setPicker(false);
  };

  return (
    <div>
      {pe && (
        <div className="card phaseend" role="status">
          <div className="phaseend-title">{pe.finished === "work" ? "Focus complete" : "Break over"}</div>
          <p className="hint small">
            {pe.finished === "work"
              ? `Up next: ${phaseLabel(pe.next).toLowerCase()}.`
              : "Ready for the next focus session?"}
          </p>
          {pe.finished === "work" ? (
            <>
              <button type="button" className="bigbtn" onClick={() => act(startPomodoro)}>
                Start break
              </button>
              <div className="phaseend-row">
                <button type="button" className="linkbtn" onClick={() => act(skipBreak)}>
                  Skip break
                </button>
                <button type="button" className="linkbtn" onClick={() => act(extendPhase)}>
                  +{EXTEND_MIN} min
                </button>
              </div>
            </>
          ) : (
            <>
              <button type="button" className="bigbtn" onClick={() => act(startPomodoro)}>
                Start focus
              </button>
              <div className="phaseend-row">
                <button type="button" className="linkbtn" onClick={() => act(extendPhase)}>
                  +{EXTEND_MIN} min break
                </button>
                <button type="button" className="linkbtn" onClick={() => setStore(dismissPhaseEnd)}>
                  Later
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className={"card pomo-card" + (isBreak(phase) ? " onbreak" : "")}>
        <div className="pomo-phase">
          {phaseLabel(phase)}
          {run?.extension ? " (extra)" : ""}
        </div>
        <Ring pct={pct} className="pomo-ring">
          <div className="pomo-time" role="timer" aria-live="off">
            {fmtClock(remainingMs)}
          </div>
        </Ring>
        <button
          type="button"
          className={"chip taskchip" + (task ? " sel" : "")}
          onClick={() => setPicker(true)}
          aria-label={task ? `Focus task: ${task.name}. Change` : "Link a task"}
        >
          {task ? `🎯 ${task.name}` : "+ Link a task"}
        </button>
        {amb.kind !== "off" && (
          <button
            type="button"
            className={"chip ambmute" + (amb.muted ? "" : " on")}
            aria-pressed={!amb.muted}
            aria-label={amb.muted ? `Unmute ${ambLabel}` : `Mute ${ambLabel}`}
            onClick={() => {
              onStartGesture();
              setStore((s) => setAmbience(s, { muted: !s.settings.ambience.muted }));
            }}
          >
            {amb.muted ? "🔇" : ambienceActive(store) ? "🔊" : "🔈"} {ambLabel}
          </button>
        )}

        {!pe && (
          <div className="pomo-controls">
            {running ? (
              <button type="button" className="bigbtn" onClick={() => setStore((s) => pausePomodoro(s, Date.now()))}>
                Pause
              </button>
            ) : (
              <button
                type="button"
                className="bigbtn"
                onClick={() => {
                  onStartGesture();
                  onStart();
                }}
              >
                {run?.startedAt != null ? "Resume" : phase === "work" ? "Start" : `Start ${phaseLabel(phase).toLowerCase()}`}
              </button>
            )}
            <div className="pomo-subbtns">
              <button type="button" className="linkbtn" onClick={handleSkip}>
                Skip
              </button>
              <button type="button" className="linkbtn" onClick={handleReset} disabled={!run}>
                Reset
              </button>
            </div>
          </div>
        )}
        {phase === "work" && run?.startedAt != null && <DistractionLog run={run} setStore={setStore} />}
      </div>

      {isBreak(phase) && run?.startedAt != null && (
        <BreakRoutineCard store={store} setStore={setStore} now={now} onGesture={onStartGesture} />
      )}

      <div className="card goalcard">
        <Ring pct={todayCount / goal} size={64} stroke={7} className="goal-ring">
          <span className="goal-num">{todayCount}</span>
        </Ring>
        <div className="goal-text">
          <div className="goal-main">
            🍅 {todayCount} / {goal} today
          </div>
          <div className="hint small goal-sub">
            Streak {streak.current} {streak.current === 1 ? "day" : "days"} · best {streak.best}
          </div>
        </div>
      </div>

      <h2>Presets</h2>
      <div className="chips">
        {PRESETS.map((pre) => {
          const sel = p.config.workMin === pre.workMin && p.config.shortBreakMin === pre.shortBreakMin;
          return (
            <button
              key={pre.label}
              type="button"
              className={"chip" + (sel ? " sel" : "")}
              aria-pressed={sel}
              onClick={() => setStore((s) => applyConfig(s, { workMin: pre.workMin, shortBreakMin: pre.shortBreakMin }))}
            >
              {pre.label}
            </button>
          );
        })}
      </div>
      <p className="hint small">Presets apply from the next phase. Fine-tune durations in Settings.</p>

      <Sheet open={picker} title="Focus on" onClose={() => setPicker(false)}>
        <div className="pickerlist">
          <button type="button" className={"pickrow" + (!p.taskId ? " sel" : "")} onClick={() => pickTask(null)}>
            No task
          </button>
          {activeTasks.map((t) => (
            <button
              key={t.id}
              type="button"
              className={"pickrow" + (p.taskId === t.id ? " sel" : "")}
              onClick={() => pickTask(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
        {activeTasks.length === 0 && <p className="hint small">Add tasks on the Tasks tab to link them here.</p>}
        <button type="button" className="bigbtn secondary" onClick={() => setPicker(false)}>
          Close
        </button>
      </Sheet>
      {confirmSheet}
    </div>
  );
}
