import { useState } from "react";
import { newId } from "./storage.js";
import { fmtDateHeader, addDays } from "./dateUtils.js";

const TYPE_LABEL = { strength: "Strength", cardio: "Cardio" };

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

function ExerciseEditor({ exercise, onSave, onCancel, onDelete }) {
  const [name, setName] = useState(exercise?.name || "");
  const [type, setType] = useState(exercise?.type || "strength");
  return (
    <div className="page">
      <div className="topbar">
        <button className="iconbtn" onClick={onCancel}>
          ‹
        </button>
        <div className="tb-title">{exercise ? "Edit exercise" : "New exercise"}</div>
      </div>
      <div className="field">
        <div className="flabel">Name</div>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bench press" />
      </div>
      <div className="field">
        <div className="flabel">Type</div>
        <div className="chips">
          {["strength", "cardio"].map((t) => (
            <button key={t} className={"chip" + (type === t ? " sel" : "")} onClick={() => setType(t)}>
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>
      <div className="btnrow" style={{ justifyContent: onDelete ? "space-between" : "flex-end" }}>
        {onDelete && (
          <button
            className="linkbtn"
            style={{ color: "var(--danger)" }}
            onClick={() => {
              if (confirm(`Delete "${exercise.name}"? Logged history stays intact.`)) onDelete();
            }}
          >
            Delete
          </button>
        )}
        <button
          className="bigbtn"
          style={{ width: "auto", padding: "12px 26px" }}
          disabled={!name.trim()}
          onClick={() => onSave({ name: name.trim(), type })}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function LogForm({ exercise, training, date, existing, onSave, onCancel }) {
  const history = historyFor(training, exercise.id, addDays(date, -1));
  const [sets, setSets] = useState(existing?.sets?.length ? existing.sets : exercise.type === "strength" ? [{ reps: 10, weight: 20 }] : []);
  const [minutes, setMinutes] = useState(existing?.minutes ?? 30);
  const [km, setKm] = useState(existing?.km ?? "");

  const addSet = () => {
    const last = sets[sets.length - 1] || { reps: 10, weight: 20 };
    setSets([...sets, { ...last }]);
  };
  const updateSet = (i, patch) => setSets(sets.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const removeSet = (i) => setSets(sets.filter((_, j) => j !== i));

  const canSave = exercise.type === "strength" ? sets.length > 0 : Number(minutes) > 0;

  return (
    <div className="page">
      <div className="topbar">
        <button className="iconbtn" onClick={onCancel}>
          ‹
        </button>
        <div>
          <div className="tb-title">{exercise.name}</div>
          <div className="tb-sub">{TYPE_LABEL[exercise.type]} · {fmtDateHeader(date)}</div>
        </div>
      </div>

      {exercise.type === "strength" ? (
        <div className="card">
          <div className="setgrid-head">
            <span>Set</span>
            <span>Reps</span>
            <span>Weight (kg)</span>
            <span />
          </div>
          {sets.map((s, i) => (
            <div className="setgrid-row" key={i}>
              <span className="setgrid-n">{i + 1}</span>
              <input
                className="input setgrid-input"
                type="number"
                value={s.reps}
                onChange={(e) => updateSet(i, { reps: Number(e.target.value) || 0 })}
              />
              <input
                className="input setgrid-input"
                type="number"
                value={s.weight}
                onChange={(e) => updateSet(i, { weight: Number(e.target.value) || 0 })}
              />
              <button className="iconbtn" onClick={() => removeSet(i)}>
                ✕
              </button>
            </div>
          ))}
          <button className="linkbtn" onClick={addSet}>
            + Add set {sets.length > 0 ? "(repeat last)" : ""}
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="field">
            <div className="flabel">Minutes</div>
            <input className="input" type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </div>
          <div className="field">
            <div className="flabel">Distance (km, optional)</div>
            <input className="input" type="number" step="0.1" value={km} onChange={(e) => setKm(e.target.value)} />
          </div>
        </div>
      )}

      {history.length > 0 && (
        <>
          <h2>Last {history.length} sessions</h2>
          <div className="card">
            {history.map((h, i) => (
              <div className="histrow" key={i}>
                <span className="histrow-date">{h.date}</span>
                <span className="histrow-detail">
                  {exercise.type === "strength"
                    ? h.entry.sets.map((s) => `${s.reps}×${s.weight}kg`).join(", ")
                    : `${h.entry.minutes} min${h.entry.km ? ` · ${h.entry.km} km` : ""}`}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <button
        className="bigbtn start"
        disabled={!canSave}
        onClick={() =>
          onSave(
            exercise.type === "strength"
              ? { sets }
              : { minutes: Number(minutes) || 0, km: km === "" ? undefined : Number(km) }
          )
        }
      >
        Save
      </button>
    </div>
  );
}

export default function TrainingView({
  date,
  setDate,
  exercises,
  training,
  dayEntries,
  onSaveExercise,
  onDeleteExercise,
  onLogEntry,
  onUpdateEntry,
  onDeleteEntry,
}) {
  const [screen, setScreen] = useState("day"); // day | library | editExercise | pick | log
  const [editingExerciseId, setEditingExerciseId] = useState(undefined);
  const [pickedExerciseId, setPickedExerciseId] = useState(null);
  const [editingEntryId, setEditingEntryId] = useState(null);

  const exList = Object.values(exercises).sort((a, b) => a.name.localeCompare(b.name));

  if (screen === "editExercise") {
    const ex = editingExerciseId ? exercises[editingExerciseId] : null;
    return (
      <ExerciseEditor
        exercise={ex}
        onCancel={() => setScreen("library")}
        onSave={(draft) => {
          const isNew = !ex;
          const id = ex?.id || newId();
          onSaveExercise({ ...draft, id, updatedAt: Date.now() });
          if (isNew) {
            // Straight into logging the exercise just created, mirroring
            // the food picker's "new custom food" -> log flow.
            setPickedExerciseId(id);
            setEditingEntryId(null);
            setScreen("log");
          } else {
            setScreen("library");
          }
        }}
        onDelete={ex ? () => { onDeleteExercise(ex.id); setScreen("library"); } : undefined}
      />
    );
  }

  if (screen === "library") {
    return (
      <div className="page">
        <div className="topbar">
          <button className="iconbtn" onClick={() => setScreen("day")}>
            ‹
          </button>
          <div className="tb-title">Exercise library</div>
        </div>
        <button className="bigbtn" onClick={() => { setEditingExerciseId(null); setScreen("editExercise"); }}>
          + New exercise
        </button>
        {exList.length === 0 && <p className="hint">No exercises yet.</p>}
        {exList.map((ex) => (
          <div key={ex.id} className="card foodrow" onClick={() => { setEditingExerciseId(ex.id); setScreen("editExercise"); }}>
            <div className="foodrow-main">
              <div className="foodrow-name">{ex.name}</div>
              <div className="foodrow-sub">{TYPE_LABEL[ex.type]}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (screen === "pick") {
    return (
      <div className="page">
        <div className="topbar">
          <button className="iconbtn" onClick={() => setScreen("day")}>
            ‹
          </button>
          <div className="tb-title">Log exercise</div>
        </div>
        {exList.length === 0 && (
          <p className="hint">
            No exercises in your library yet. Add one first.
          </p>
        )}
        {exList.map((ex) => (
          <div
            key={ex.id}
            className="card foodrow"
            onClick={() => {
              setPickedExerciseId(ex.id);
              setEditingEntryId(null);
              setScreen("log");
            }}
          >
            <div className="foodrow-main">
              <div className="foodrow-name">{ex.name}</div>
              <div className="foodrow-sub">{TYPE_LABEL[ex.type]}</div>
            </div>
          </div>
        ))}
        <button className="linkbtn" onClick={() => { setEditingExerciseId(null); setScreen("editExercise"); }}>
          + New exercise
        </button>
      </div>
    );
  }

  if (screen === "log" && pickedExerciseId) {
    const exercise = exercises[pickedExerciseId];
    const existing = editingEntryId ? dayEntries.find((e) => e.id === editingEntryId) : null;
    return (
      <LogForm
        exercise={exercise}
        training={training}
        date={date}
        existing={existing}
        onCancel={() => setScreen("day")}
        onSave={(payload) => {
          if (existing) onUpdateEntry(existing.id, payload);
          else onLogEntry({ exerciseId: exercise.id, type: exercise.type, ...payload });
          setScreen("day");
        }}
      />
    );
  }

  // screen === "day"
  return (
    <div className="page">
      <div className="daynav">
        <button className="iconbtn" onClick={() => setDate(addDays(date, -1))}>
          ‹
        </button>
        <div className="daynav-label">{fmtDateHeader(date)}</div>
        <button className="iconbtn" onClick={() => setDate(addDays(date, 1))}>
          ›
        </button>
      </div>

      <div className="newrow">
        <button className="bigbtn" style={{ flex: 1 }} onClick={() => setScreen("pick")}>
          + Log exercise
        </button>
        <button className="bigbtn alt" style={{ flex: 1 }} onClick={() => setScreen("library")}>
          Library
        </button>
      </div>

      {dayEntries.length === 0 && <p className="hint">Nothing logged for this day yet.</p>}
      {dayEntries.map((e) => {
        const exercise = exercises[e.exerciseId];
        return (
          <div
            key={e.id}
            className="card foodrow"
            onClick={() => {
              setPickedExerciseId(e.exerciseId);
              setEditingEntryId(e.id);
              setScreen("log");
            }}
          >
            <div className="foodrow-main">
              <div className="foodrow-name">{exercise ? exercise.name : "(deleted exercise)"}</div>
              <div className="foodrow-sub">
                {e.type === "strength"
                  ? e.sets.map((s) => `${s.reps}×${s.weight}kg`).join(", ")
                  : `${e.minutes} min${e.km ? ` · ${e.km} km` : ""}`}
              </div>
            </div>
            <button
              className="iconbtn"
              onClick={(ev) => {
                ev.stopPropagation();
                if (confirm("Delete this entry?")) onDeleteEntry(e.id);
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
