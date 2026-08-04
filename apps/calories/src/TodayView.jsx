import { useState } from "react";
import { fmtDateHeader, addDays } from "./dateUtils.js";
import { macrosForGrams } from "./food.js";
import { ProgressBar, Modal, NumInput, fmtNum } from "./ui.jsx";
import { MEALS } from "./storage.js";

const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snacks: "Snacks" };

export default function TodayView({ date, setDate, dayLogs, targets, onAddFood, onUpdateEntry, onDeleteEntry }) {
  const [editing, setEditing] = useState(null); // { meal, entry }

  const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const meal of MEALS) {
    for (const e of dayLogs[meal] || []) {
      const m = macrosForGrams(e, e.grams);
      totals.kcal += m.kcal;
      totals.protein += m.protein;
      totals.carbs += m.carbs;
      totals.fat += m.fat;
    }
  }

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

      <div className="card">
        <ProgressBar label="Calories" value={totals.kcal} target={targets.kcal} unit=" kcal" />
        <ProgressBar label="Protein" value={totals.protein} target={targets.protein} unit="g" />
        <ProgressBar label="Carbs" value={totals.carbs} target={targets.carbs} unit="g" />
        <ProgressBar label="Fat" value={totals.fat} target={targets.fat} unit="g" />
        {targets.kcal <= 0 && targets.protein <= 0 && targets.carbs <= 0 && targets.fat <= 0 && (
          <p className="hint small">
            Totals: {fmtNum(totals.kcal)} kcal · P {fmtNum(totals.protein)}g · C {fmtNum(totals.carbs)}g · F{" "}
            {fmtNum(totals.fat)}g. Set targets in Settings to see progress bars.
          </p>
        )}
      </div>

      {MEALS.map((meal) => (
        <div key={meal} className={`mealblock meal-${meal}`}>
          <h2>{MEAL_LABELS[meal]}</h2>
          <div className="card">
            {(dayLogs[meal] || []).length === 0 && <p className="hint small" style={{ margin: "4px 2px" }}>No entries yet.</p>}
            {(dayLogs[meal] || []).map((e) => {
              const m = macrosForGrams(e, e.grams);
              return (
                <div key={e.id} className="logrow" onClick={() => setEditing({ meal, entry: e })}>
                  <div className="logrow-main">
                    <div className="logrow-name">{e.name}</div>
                    <div className="logrow-sub">
                      {Math.round(e.grams)} g · {Math.round(m.kcal)} kcal · P {fmtNum(m.protein)}g
                    </div>
                  </div>
                </div>
              );
            })}
            <button className="linkbtn addfoodbtn" onClick={() => onAddFood(meal)}>
              + Add food
            </button>
          </div>
        </div>
      ))}

      {editing && (
        <EditEntryModal
          entry={editing.entry}
          onClose={() => setEditing(null)}
          onSave={(grams) => {
            onUpdateEntry(editing.meal, editing.entry.id, grams);
            setEditing(null);
          }}
          onDelete={() => {
            onDeleteEntry(editing.meal, editing.entry.id);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditEntryModal({ entry, onClose, onSave, onDelete }) {
  const [grams, setGrams] = useState(entry.grams);
  const m = macrosForGrams(entry, grams);
  return (
    <Modal onClose={onClose}>
      <h3>{entry.name}</h3>
      <div className="field">
        <div className="flabel">Grams</div>
        <NumInput value={grams} onChange={setGrams} min={0} max={5000} step={5} />
      </div>
      <p className="hint small">
        {Math.round(m.kcal)} kcal · P {fmtNum(m.protein)}g · C {fmtNum(m.carbs)}g · F {fmtNum(m.fat)}g
      </p>
      <div className="btnrow" style={{ justifyContent: "space-between" }}>
        <button className="linkbtn" style={{ color: "var(--danger)" }} onClick={onDelete}>
          Delete
        </button>
        <button className="bigbtn" style={{ width: "auto", padding: "12px 26px" }} onClick={() => onSave(grams)}>
          Save
        </button>
      </div>
    </Modal>
  );
}
