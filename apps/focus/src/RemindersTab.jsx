import { useState } from "react";
import { newId } from "./storage.js";
import { NumInput, Toggle } from "./ui.jsx";

function fmtInterval(mins) {
  if (mins < 1) return `${Math.round(mins * 60)}s`;
  if (mins % 60 === 0) return `${mins / 60}h`;
  return `${mins}m`;
}

export default function RemindersTab({ store, setStore }) {
  const [label, setLabel] = useState("");
  const [interval, setInterval_] = useState(30);

  const items = Object.values(store.reminders.items).sort((a, b) => a.label.localeCompare(b.label));

  const addReminder = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const id = newId();
    const now = Date.now();
    setStore((s) => ({
      ...s,
      reminders: {
        ...s.reminders,
        items: {
          ...s.reminders.items,
          [id]: { id, label: trimmed, intervalMin: interval, enabled: true, nextDueAt: now + interval * 60000 },
        },
      },
    }));
    setLabel("");
  };

  const toggleEnabled = (id, enabled) => {
    setStore((s) => {
      const r = s.reminders.items[id];
      if (!r) return s;
      const next = { ...r, enabled, nextDueAt: enabled ? Date.now() + r.intervalMin * 60000 : r.nextDueAt };
      const banners = enabled ? s.reminders.banners : (s.reminders.banners || []).filter((b) => b !== id);
      return { ...s, reminders: { ...s.reminders, items: { ...s.reminders.items, [id]: next }, banners } };
    });
  };

  const setIntervalFor = (id, mins) => {
    setStore((s) => {
      const r = s.reminders.items[id];
      if (!r) return s;
      return {
        ...s,
        reminders: {
          ...s.reminders,
          items: { ...s.reminders.items, [id]: { ...r, intervalMin: mins, nextDueAt: Date.now() + mins * 60000 } },
        },
      };
    });
  };

  const deleteReminder = (id) => {
    setStore((s) => {
      const items = { ...s.reminders.items };
      delete items[id];
      const banners = (s.reminders.banners || []).filter((b) => b !== id);
      return { ...s, reminders: { ...s.reminders, items, banners } };
    });
  };

  return (
    <div>
      <div className="card">
        <div className="field">
          <input
            className="input"
            placeholder="Reminder label (e.g. Drink water)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addReminder()}
          />
        </div>
        <div className="unitrow">
          <span className="setlabel">Every (min)</span>
          <NumInput value={interval} min={0.1} max={480} step={5} onChange={setInterval_} />
        </div>
        <button className="bigbtn" onClick={addReminder} disabled={!label.trim()}>
          + Add reminder
        </button>
      </div>

      <h2>Reminders</h2>
      {items.length === 0 && <div className="hint">No reminders — add one above.</div>}
      {items.map((r) => (
        <div className="card reminderrow" key={r.id}>
          <div className="reminderrow-main">
            <div className="taskrow-name">{r.label}</div>
            <div className="taskrow-sub">every {fmtInterval(r.intervalMin)}</div>
          </div>
          <NumInput value={r.intervalMin} min={0.1} max={480} step={5} onChange={(v) => setIntervalFor(r.id, v)} />
          <Toggle checked={r.enabled} onChange={(v) => toggleEnabled(r.id, v)} />
          <button className="iconbtn" onClick={() => deleteReminder(r.id)} title="Delete">
            ✕
          </button>
        </div>
      ))}

      <div className="hint small">
        Reminders fire while the app is open — Android may silence them when the app is fully closed.
      </div>
    </div>
  );
}
