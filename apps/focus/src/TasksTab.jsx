import { useState } from "react";
import { newId } from "./storage.js";
import { startTask, stopRunningTask, taskTodayMinutes } from "./logic.js";

function fmtDur(mins) {
  const totalSec = Math.round(mins * 60);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function TasksTab({ store, setStore, now }) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const items = Object.values(store.tasks.items).sort((a, b) => a.createdAt - b.createdAt);
  const active = items.filter((t) => !t.archived);
  const archived = items.filter((t) => t.archived);
  const runningId = store.tasks.run?.taskId || null;

  const addTask = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = newId();
    setStore((s) => ({
      ...s,
      tasks: { ...s.tasks, items: { ...s.tasks.items, [id]: { id, name: trimmed, archived: false, createdAt: Date.now() } } },
    }));
    setName("");
  };

  const toggleRun = (id) => {
    setStore((s) => {
      if (s.tasks.run?.taskId === id) return stopRunningTask(s, Date.now());
      return startTask(s, id, Date.now());
    });
  };

  const saveRename = (id) => {
    const trimmed = editName.trim();
    setStore((s) => {
      const t = s.tasks.items[id];
      if (!t || !trimmed) return s;
      return { ...s, tasks: { ...s.tasks, items: { ...s.tasks.items, [id]: { ...t, name: trimmed } } } };
    });
    setEditingId(null);
  };

  const archiveTask = (id) => {
    setStore((s) => {
      let s2 = s.tasks.run?.taskId === id ? stopRunningTask(s, Date.now()) : s;
      const t = s2.tasks.items[id];
      if (!t) return s2;
      return { ...s2, tasks: { ...s2.tasks, items: { ...s2.tasks.items, [id]: { ...t, archived: true } } } };
    });
  };

  const unarchiveTask = (id) => {
    setStore((s) => {
      const t = s.tasks.items[id];
      if (!t) return s;
      return { ...s, tasks: { ...s.tasks, items: { ...s.tasks.items, [id]: { ...t, archived: false } } } };
    });
  };

  return (
    <div>
      <div className="card">
        <div className="newrow">
          <input
            className="input"
            placeholder="New task name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
        </div>
        <button className="bigbtn" onClick={addTask} disabled={!name.trim()}>
          + Add task
        </button>
      </div>

      <h2>Today</h2>
      {active.length === 0 && <div className="hint">No tasks yet — add one above.</div>}
      {active.map((t) => {
        const isRunning = runningId === t.id;
        const mins = taskTodayMinutes(store, t.id, now);
        return (
          <div className="card taskrow" key={t.id}>
            {editingId === t.id ? (
              <input
                className="input"
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => saveRename(t.id)}
                onKeyDown={(e) => e.key === "Enter" && saveRename(t.id)}
              />
            ) : (
              <div className="taskrow-main" onClick={() => { setEditingId(t.id); setEditName(t.name); }}>
                <div className="taskrow-name">{t.name}</div>
                <div className="taskrow-sub">{fmtDur(mins)} today{isRunning ? " · running" : ""}</div>
              </div>
            )}
            <div className="taskrow-actions">
              <button
                className={"bigbtn tasktoggle" + (isRunning ? " stop" : "")}
                onClick={() => toggleRun(t.id)}
              >
                {isRunning ? "Stop" : "Start"}
              </button>
              <button className="iconbtn" onClick={() => archiveTask(t.id)} title="Archive">
                🗄
              </button>
            </div>
          </div>
        );
      })}

      {archived.length > 0 && (
        <>
          <h2>Archived</h2>
          {archived.map((t) => (
            <div className="card taskrow" key={t.id}>
              <div className="taskrow-main">
                <div className="taskrow-name">{t.name}</div>
              </div>
              <div className="taskrow-actions">
                <button className="linkbtn" onClick={() => unarchiveTask(t.id)}>
                  Restore
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
