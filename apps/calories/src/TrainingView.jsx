import { useEffect, useState } from "react";
import { NumInput, IconButton } from "@shared/ui.jsx";
import { newId } from "@shared/store.js";
import { useWakeLock } from "@shared/useWakeLock.js";
import { vibrate, haptics } from "@shared/haptics.js";
import { audio } from "@shared/audio.js";
import { fmtDateHeader, addDays } from "./dateUtils.js";
import { DayNav, TopBar } from "./ui.jsx";

const TYPE_LABEL = { strength: "Strength", cardio: "Cardio" };
const REST_KEY = "calories:rest";
const REST_CHOICES = [60, 90, 120, 180];

function fmtEntry(e) {
  if (Array.isArray(e?.sets) && e.sets.length) return e.sets.map((s) => `${s.reps}×${s.weight}kg`).join(", ");
  if (e?.minutes != null) return `${e.minutes} min${e.km ? ` · ${e.km} km` : ""}`;
  return "No details";
}

function historyFor(training, exerciseId, beforeDate) {
  const rows = [];
  for (const [date, day] of Object.entries(training)) {
    if (date > beforeDate) continue;
    for (const e of day.entries || []) {
      if (e.exerciseId === exerciseId) rows.push({ date, entry: e });
    }
  }
  rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  return rows.slice(0, 5);
}

function readRest() {
  try {
    const v = Number(localStorage.getItem(REST_KEY));
    return REST_CHOICES.includes(v) ? v : 90;
  } catch {
    return 90;
  }
}

function fmtClock(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function ExerciseEditor({ exercise, onSave, onCancel, onDelete }) {
  const [name, setName] = useState(exercise?.name || "");
  const [type, setType] = useState(exercise?.type || "strength");
  return (
    <div className="page">
      <TopBar title={exercise ? "Edit exercise" : "New exercise"} onBack={onCancel} />
      <div className="field">
        <label className="flabel" htmlFor="ex-name">
          Name
        </label>
        <input
          id="ex-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bench press"
          maxLength={80}
        />
      </div>
      <div className="field">
        <div className="flabel">Type</div>
        <div className="chips" role="radiogroup" aria-label="Type">
          {["strength", "cardio"].map((t) => (
            <button
              type="button"
              key={t}
              role="radio"
              aria-checked={type === t}
              className={"chip" + (type === t ? " sel" : "")}
              onClick={() => setType(t)}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>
      <div className="btnrow" style={{ justifyContent: onDelete ? "space-between" : "flex-end" }}>
        {onDelete && (
          <button type="button" className="linkbtn danger-text" onClick={onDelete}>
            Delete
          </button>
        )}
        <button type="button" className="bigbtn" disabled={!name.trim()} onClick={() => onSave({ name: name.trim(), type })}>
          Save
        </button>
      </div>
    </div>
  );
}

function toDraft(s) {
  return { reps: String(s?.reps ?? 10), weight: String(s?.weight ?? 20), done: false };
}

function parseNum(v) {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function RestTimer({ endsAt, total, onSkip, onAdd }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const left = (endsAt - now) / 1000;
  return (
    <div className="resttimer" role="timer" aria-live="off">
      <div className="rest-bar" style={{ width: `${Math.max(0, Math.min(100, (left / total) * 100))}%` }} />
      <span className="rest-label">Rest</span>
      <span className="rest-clock">{fmtClock(left)}</span>
      <button type="button" className="linkbtn" onClick={() => onAdd(30)}>
        +30s
      </button>
      <button type="button" className="linkbtn" onClick={onSkip}>
        Skip
      </button>
    </div>
  );
}

function LogForm({ exercise, training, date, today, existing, onSave, onCancel }) {
  const history = historyFor(training, exercise.id, addDays(date, -1));
  const lastSets = history.find((h) => Array.isArray(h.entry.sets) && h.entry.sets.length)?.entry.sets;
  const [sets, setSets] = useState(() => {
    if (Array.isArray(existing?.sets) && existing.sets.length) return existing.sets.map(toDraft);
    if (exercise.type !== "strength") return [];
    return lastSets ? lastSets.map(toDraft) : [toDraft()];
  });
  const [minutes, setMinutes] = useState(existing?.minutes ?? 30);
  const [km, setKm] = useState(existing?.km ?? 0);
  const [rest, setRest] = useState(readRest);
  const [timer, setTimer] = useState(null);

  useWakeLock(!!timer);

  useEffect(() => {
    if (!timer) return undefined;
    const ms = timer.endsAt - Date.now();
    const t = setTimeout(() => {
      vibrate(haptics.warn);
      audio.play("bell");
      setTimer(null);
    }, Math.max(0, ms));
    return () => clearTimeout(t);
  }, [timer]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") audio.ensure();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const chooseRest = (sec) => {
    setRest(sec);
    try {
      localStorage.setItem(REST_KEY, String(sec));
    } catch {
      /* preference only */
    }
  };

  const startRest = (sec = rest) => setTimer({ endsAt: Date.now() + sec * 1000, total: sec });

  const addSet = () => {
    const last = sets[sets.length - 1];
    setSets([...sets, { ...(last || toDraft()), done: false }]);
  };
  const updateSet = (i, patch) => setSets((list) => list.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const removeSet = (i) => setSets((list) => list.filter((_, j) => j !== i));
  const toggleDone = (i) => {
    audio.ensure();
    const nowDone = !sets[i].done;
    updateSet(i, { done: nowDone });
    if (nowDone) {
      vibrate(haptics.tap);
      if (sets.some((s, j) => j !== i && !s.done)) startRest();
    }
  };

  const canSave = exercise.type === "strength" ? sets.length > 0 : Number(minutes) > 0;
  const doneCount = sets.filter((s) => s.done).length;

  return (
    <div className="page">
      <TopBar title={exercise.name} sub={`${TYPE_LABEL[exercise.type]} · ${fmtDateHeader(date, today)}`} onBack={onCancel} />

      {exercise.type === "strength" ? (
        <>
          <div className="card">
            <div className="setgrid-head">
              <span>Set</span>
              <span>Reps</span>
              <span>kg</span>
              <span>Done</span>
              <span />
            </div>
            {sets.map((s, i) => (
              <div className={"setgrid-row" + (s.done ? " done" : "")} key={i}>
                <span className="setgrid-n">{i + 1}</span>
                <input
                  className="input setgrid-input"
                  type="text"
                  inputMode="numeric"
                  aria-label={`Set ${i + 1} reps`}
                  value={s.reps}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => /^\d{0,4}$/.test(e.target.value) && updateSet(i, { reps: e.target.value })}
                />
                <input
                  className="input setgrid-input"
                  type="text"
                  inputMode="decimal"
                  aria-label={`Set ${i + 1} weight in kg`}
                  value={s.weight}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => /^\d{0,4}([.,]\d{0,2})?$/.test(e.target.value) && updateSet(i, { weight: e.target.value })}
                />
                <button
                  type="button"
                  className={"iconbtn check" + (s.done ? " on" : "")}
                  aria-label={`Set ${i + 1} done`}
                  aria-pressed={!!s.done}
                  onClick={() => toggleDone(i)}
                >
                  ✓
                </button>
                <IconButton label={`Remove set ${i + 1}`} onClick={() => removeSet(i)}>
                  ✕
                </IconButton>
              </div>
            ))}
            <button type="button" className="linkbtn" onClick={addSet}>
              + Add set {sets.length > 0 ? "(repeat last)" : ""}
            </button>
            {sets.length > 0 && (
              <p className="hint small">
                {doneCount}/{sets.length} sets done
                {!existing && lastSets ? ". Prefilled from your last session." : "."}
              </p>
            )}
          </div>
          <div className="restrow">
            <span className="flabel">Rest timer</span>
            <div className="chips">
              {REST_CHOICES.map((sec) => (
                <button
                  type="button"
                  key={sec}
                  className={"chip small" + (rest === sec ? " sel" : "")}
                  onClick={() => chooseRest(sec)}
                >
                  {fmtClock(sec)}
                </button>
              ))}
              <button type="button" className="chip small" onClick={() => startRest()}>
                Start
              </button>
            </div>
          </div>
          {timer && (
            <RestTimer
              endsAt={timer.endsAt}
              total={timer.total}
              onSkip={() => setTimer(null)}
              onAdd={(sec) => setTimer((t) => (t ? { ...t, endsAt: t.endsAt + sec * 1000, total: t.total + sec } : t))}
            />
          )}
        </>
      ) : (
        <div className="card">
          <div className="setrow">
            <span className="setlabel">Minutes</span>
            <NumInput value={minutes} onChange={setMinutes} min={0} max={600} step={5} label="Minutes" />
          </div>
          <div className="setrow">
            <span className="setlabel">Distance (km, optional)</span>
            <NumInput value={km} onChange={setKm} min={0} max={500} step={0.5} decimals={2} label="Distance in km" />
          </div>
        </div>
      )}

      {history.length > 0 && (
        <>
          <h2>Last {history.length} sessions</h2>
          <div className="card">
            {history.map((h) => (
              <div className="histrow" key={h.entry.id || h.date}>
                <span className="histrow-date">{fmtDateHeader(h.date, today)}</span>
                <span className="histrow-detail">{fmtEntry(h.entry)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <button
        type="button"
        className="bigbtn start"
        disabled={!canSave}
        onClick={() =>
          onSave(
            exercise.type === "strength"
              ? { type: "strength", sets: sets.map((s) => ({ reps: Math.round(parseNum(s.reps)), weight: parseNum(s.weight) })) }
              : { type: "cardio", minutes: Number(minutes) || 0, km: km > 0 ? km : undefined }
          )
        }
      >
        Save
      </button>
    </div>
  );
}

export default function TrainingView({
  view,
  nav,
  replace,
  back,
  close,
  date,
  today,
  onStepDate,
  exercises,
  training,
  dayEntries,
  onSaveExercise,
  onDeleteExercise,
  onLogEntry,
  onUpdateEntry,
  onDeleteEntry,
}) {
  const exList = Object.values(exercises).sort((a, b) => a.name.localeCompare(b.name));
  const screen = view.screen;

  if (screen === "editExercise") {
    const ex = view.exerciseId ? exercises[view.exerciseId] : null;
    return (
      <ExerciseEditor
        key={view.exerciseId || "new"}
        exercise={ex}
        onCancel={back}
        onSave={(draft) => {
          const id = ex?.id || newId();
          onSaveExercise({ ...draft, id, updatedAt: Date.now() });
          if (!ex) replace({ tab: "training", screen: "log", exerciseId: id, d: view.d || 2 });
          else back();
        }}
        onDelete={
          ex
            ? () => {
                onDeleteExercise(ex.id);
                back();
              }
            : undefined
        }
      />
    );
  }

  if (screen === "library") {
    return (
      <div className="page">
        <TopBar title="Exercise library" onBack={back} />
        <button type="button" className="bigbtn" onClick={() => nav({ tab: "training", screen: "editExercise", exerciseId: null, d: 2 })}>
          + New exercise
        </button>
        {exList.length === 0 && <p className="hint">No exercises yet.</p>}
        {exList.map((ex) => (
          <div key={ex.id} className="card foodrow">
            <button
              type="button"
              className="foodrow-main"
              onClick={() => nav({ tab: "training", screen: "editExercise", exerciseId: ex.id, d: 2 })}
            >
              <span className="foodrow-name">{ex.name}</span>
              <span className="foodrow-sub">{TYPE_LABEL[ex.type]}</span>
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (screen === "pick") {
    return (
      <div className="page">
        <TopBar title="Log exercise" onBack={back} />
        {exList.length === 0 && <p className="hint">No exercises in your library yet. Add one first.</p>}
        {exList.map((ex) => (
          <div key={ex.id} className="card foodrow">
            <button
              type="button"
              className="foodrow-main"
              onClick={() => nav({ tab: "training", screen: "log", exerciseId: ex.id, d: 2 })}
            >
              <span className="foodrow-name">{ex.name}</span>
              <span className="foodrow-sub">{TYPE_LABEL[ex.type]}</span>
            </button>
          </div>
        ))}
        <button type="button" className="linkbtn" onClick={() => nav({ tab: "training", screen: "editExercise", exerciseId: null, d: 2 })}>
          + New exercise
        </button>
      </div>
    );
  }

  if (screen === "log") {
    const existing = view.entryId ? dayEntries.find((e) => e.id === view.entryId) : null;
    const stored = exercises[view.exerciseId];
    const exercise =
      stored ||
      (existing
        ? { id: view.exerciseId, name: "(deleted exercise)", type: Array.isArray(existing.sets) ? "strength" : "cardio" }
        : null);
    if (exercise) {
      return (
        <LogForm
          key={`${exercise.id}-${view.entryId || "new"}`}
          exercise={exercise}
          training={training}
          date={date}
          today={today}
          existing={existing}
          onCancel={back}
          onSave={(payload) => {
            if (existing) onUpdateEntry(existing.id, payload);
            else onLogEntry({ exerciseId: exercise.id, ...payload });
            close(view.d);
          }}
        />
      );
    }
  }

  return (
    <div className="page page-tabs">
      <DayNav date={date} today={today} onDate={onStepDate} label={fmtDateHeader(date, today)} />

      <div className="newrow">
        <button type="button" className="bigbtn" onClick={() => nav({ tab: "training", screen: "pick", d: 1 })}>
          + Log exercise
        </button>
        <button type="button" className="bigbtn alt" onClick={() => nav({ tab: "training", screen: "library", d: 1 })}>
          Library
        </button>
      </div>

      {dayEntries.length === 0 && <p className="hint">Nothing logged for this day yet.</p>}
      {dayEntries.map((e) => {
        const exercise = exercises[e.exerciseId];
        return (
          <div key={e.id} className="card foodrow">
            <button
              type="button"
              className="foodrow-main"
              onClick={() => nav({ tab: "training", screen: "log", exerciseId: e.exerciseId, entryId: e.id, d: 1 })}
            >
              <span className="foodrow-name">{exercise ? exercise.name : "(deleted exercise)"}</span>
              <span className="foodrow-sub">{fmtEntry(e)}</span>
            </button>
            <IconButton label="Delete entry" onClick={() => onDeleteEntry(e.id)}>
              ✕
            </IconButton>
          </div>
        );
      })}
    </div>
  );
}
