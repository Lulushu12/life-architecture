import { useState } from "react";
import { newId } from "@shared/store.js";
import { IconButton, NumInput, Toggle, useToast } from "@shared/ui.jsx";
import { isNativeNotify } from "@shared/notify.js";
import {
  addReminder,
  deleteReminder,
  effectiveDueAt,
  restoreReminder,
  setReminderEnabled,
  setReminderInterval,
} from "./logic.js";

function fmtInterval(mins) {
  if (mins < 1) return `${Math.round(mins * 60)}s`;
  if (mins % 60 === 0) return `${mins / 60}h`;
  return `${mins}m`;
}

function fmtDue(ms) {
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 1) return "now";
  if (mins < 60) return `in ${mins}m`;
  return `in ${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function RemindersTab({ store, setStore, now }) {
  const toast = useToast();
  const [label, setLabel] = useState("");
  const [interval, setInterval_] = useState(30);

  const items = Object.values(store.reminders.items).sort((a, b) => a.label.localeCompare(b.label));

  const add = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const id = newId();
    setStore((s) => addReminder(s, id, trimmed, interval, Date.now()));
    setLabel("");
  };

  const remove = (r) => {
    setStore((s) => deleteReminder(s, r.id));
    toast.undo(`Deleted ${r.label}`, () => setStore((s) => restoreReminder(s, r)));
  };

  return (
    <div>
      <div className="card">
        <input
          className="input"
          placeholder="Reminder label (e.g. Drink water)"
          aria-label="Reminder label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <div className="setrow">
          <span className="setlabel">Every (min)</span>
          <NumInput value={interval} min={1} max={480} step={5} label="Interval in minutes" onChange={setInterval_} />
        </div>
        <button type="button" className="bigbtn" onClick={add} disabled={!label.trim()}>
          + Add reminder
        </button>
      </div>

      <h2>Reminders</h2>
      {items.length === 0 && <p className="hint">No reminders. Add one above.</p>}
      {items.map((r) => (
        <div className="card reminderrow" key={r.id}>
          <div className="reminderrow-top">
            <div className="reminderrow-main">
              <div className="taskrow-name">{r.label}</div>
              <div className="taskrow-sub">
                every {fmtInterval(r.intervalMin)}
                {r.enabled ? ` · next ${fmtDue(effectiveDueAt(store, r) - now)}` : " · off"}
              </div>
            </div>
            <Toggle
              checked={r.enabled}
              label={`${r.label} enabled`}
              onChange={(v) => setStore((s) => setReminderEnabled(s, r.id, v, Date.now()))}
            />
            <IconButton label={`Delete ${r.label}`} onClick={() => remove(r)}>
              ✕
            </IconButton>
          </div>
          <div className="setrow">
            <span className="setlabel">Every (min)</span>
            <NumInput
              value={r.intervalMin}
              min={1}
              max={480}
              step={5}
              label={`${r.label} interval in minutes`}
              onChange={(v) => setStore((s) => setReminderInterval(s, r.id, v, Date.now()))}
            />
          </div>
        </div>
      ))}

      <p className="hint small">
        Reminders stay quiet during pomodoro breaks.{" "}
        {isNativeNotify()
          ? "They arrive as notifications even when the app is closed."
          : "In the browser they only fire while the app is open."}
      </p>
    </div>
  );
}
