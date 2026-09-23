import { useState } from "react";
import { newId } from "@shared/store.js";
import { IconButton, useToast } from "@shared/ui.jsx";
import {
  addTask,
  archiveTask,
  deleteTask,
  isWorkRunning,
  renameTask,
  restoreTask,
  startTask,
  stopRunningTask,
  taskTodayMinutes,
  unarchiveTask,
} from "./logic.js";
import { fmtDur } from "./ui.jsx";

export default function TasksTab({ store, setStore, now }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const items = Object.values(store.tasks.items).sort((a, b) => a.createdAt - b.createdAt);
  const active = items.filter((t) => !t.archived);
  const archived = items.filter((t) => t.archived);
  const runningId = store.tasks.run?.taskId || null;
  const pomoTaskId = isWorkRunning(store) ? store.pomodoro.run.taskId : null;

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = newId();
    setStore((s) => addTask(s, id, trimmed, Date.now()));
    setName("");
  };

  const toggleRun = (t) => {
    if (runningId === t.id) {
      setStore((s) => stopRunningTask(s, Date.now()));
      return;
    }
    if (isWorkRunning(store)) toast(`The running pomodoro now counts toward ${t.name}`);
    setStore((s) => startTask(s, t.id, Date.now()));
  };

  const beginRename = (t) => {
    setEditingId(t.id);
    setEditName(t.name);
  };

  const saveRename = () => {
    const trimmed = editName.trim();
    const id = editingId;
    if (trimmed) setStore((s) => renameTask(s, id, trimmed));
    setEditingId(null);
  };

  const archive = (t) => {
    setStore((s) => archiveTask(s, t.id, Date.now()));
    toast.undo(`Archived ${t.name}`, () => setStore((s) => unarchiveTask(s, t.id)));
  };

  const remove = (t) => {
    const snapshot = store.tasks.items[t.id];
    setStore((s) => deleteTask(s, t.id, Date.now()));
    toast.undo(`Deleted ${t.name}`, () => setStore((s) => restoreTask(s, snapshot)));
  };

  return (
    <div>
      <div className="card">
        <input
          className="input"
          placeholder="New task name"
          aria-label="New task name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button type="button" className="bigbtn" onClick={add} disabled={!name.trim()}>
          + Add task
        </button>
      </div>

      <h2>Today</h2>
      {active.length === 0 && <p className="hint">No tasks yet. Add one above.</p>}
      {active.map((t) => {
        const isRunning = runningId === t.id;
        const mins = taskTodayMinutes(store, t.id, now);
        if (editingId === t.id) {
          return (
            <div className="card taskrow" key={t.id}>
              <input
                className="input renameinput"
                autoFocus
                aria-label="Task name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveRename();
                  if (e.key === "Escape") setEditingId(null);
                }}
              />
              <div className="taskrow-actions">
                <IconButton label="Save name" onClick={saveRename}>
                  ✓
                </IconButton>
                <IconButton label="Cancel rename" onClick={() => setEditingId(null)}>
                  ✕
                </IconButton>
                <IconButton
                  label={`Delete ${t.name}`}
                  onClick={() => {
                    setEditingId(null);
                    remove(t);
                  }}
                >
                  🗑
                </IconButton>
              </div>
            </div>
          );
        }
        return (
          <div className={"card taskrow" + (isRunning || pomoTaskId === t.id ? " live" : "")} key={t.id}>
            <div className="taskrow-main">
              <div className="taskrow-name">{t.name}</div>
              <div className="taskrow-sub">
                {fmtDur(mins)} today
                {isRunning ? " · running" : pomoTaskId === t.id ? " · in pomodoro" : ""}
              </div>
            </div>
            <div className="taskrow-actions">
              <button
                type="button"
                className={"bigbtn tasktoggle" + (isRunning ? " stop" : "")}
                onClick={() => toggleRun(t)}
              >
                {isRunning ? "Stop" : "Start"}
              </button>
              <IconButton label={`Rename ${t.name}`} onClick={() => beginRename(t)}>
                ✎
              </IconButton>
              <IconButton label={`Archive ${t.name}`} onClick={() => archive(t)}>
                🗄
              </IconButton>
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
                <button type="button" className="linkbtn" onClick={() => setStore((s) => unarchiveTask(s, t.id))}>
                  Restore
                </button>
                <IconButton label={`Delete ${t.name}`} onClick={() => remove(t)}>
                  🗑
                </IconButton>
              </div>
            </div>
          ))}
        </>
      )}
      <p className="hint small">
        Starting a task while a pomodoro runs links the pomodoro to it instead, so no minute is counted twice.
      </p>
    </div>
  );
}
