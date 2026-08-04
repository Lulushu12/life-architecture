import { useState } from "react";
import { newId } from "./storage.js";
import FoodEditor from "./FoodEditor.jsx";

export default function FoodsView({ foods, onSaveFood, onDeleteFood }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(undefined); // undefined = list, null = new, id = editing

  const list = Object.values(foods)
    .filter((f) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return f.name.toLowerCase().includes(q) || (f.brand || "").toLowerCase().includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  if (editing !== undefined) {
    const food = editing === null ? null : foods[editing];
    return (
      <FoodEditor
        food={food}
        onCancel={() => setEditing(undefined)}
        onSave={(draft) => {
          const id = food?.id || newId();
          onSaveFood({ ...draft, id, updatedAt: Date.now() });
          setEditing(undefined);
        }}
        onDelete={
          food
            ? () => {
                onDeleteFood(food.id);
                setEditing(undefined);
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="page">
      <h1 className="apptitle">
        Foods<span>.</span>
      </h1>
      <input
        className="input"
        placeholder="Search your foods…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button className="bigbtn" onClick={() => setEditing(null)}>
        + New custom food
      </button>
      <p className="hint small">
        Foods used from Today (search, barcode, or picked from this list) are cached here automatically so
        re-logging is instant, even offline.
      </p>
      {list.length === 0 && <p className="hint">No foods saved yet.</p>}
      {list.map((f) => (
        <div key={f.id} className="card foodrow" onClick={() => setEditing(f.id)}>
          <div className="foodrow-main">
            <div className="foodrow-name">{f.name}</div>
            <div className="foodrow-sub">
              {f.brand ? `${f.brand} · ` : ""}
              {Math.round(f.kcal100)} kcal · P {Math.round(f.protein100)}g · C {Math.round(f.carbs100)}g · F{" "}
              {Math.round(f.fat100)}g <span className="tag">{f.source === "off" ? "OFF" : "custom"}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
