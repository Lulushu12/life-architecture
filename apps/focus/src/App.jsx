import { useEffect, useRef, useState } from "react";
import { loadStore, saveStore } from "./storage.js";
import {
  advancePomodoroIfDue,
  reconcileTasksOnLoad,
  reconcileRemindersOnLoad,
  checkRemindersDue,
} from "./logic.js";
import { playChime } from "./audio.js";
import { sendNotification } from "./notify.js";
import { TabBar } from "./ui.jsx";
import Banners from "./Banners.jsx";
import PomodoroTab from "./PomodoroTab.jsx";
import TasksTab from "./TasksTab.jsx";
import RemindersTab from "./RemindersTab.jsx";
import StatsTab from "./StatsTab.jsx";

const TABS = [
  { id: "pomodoro", label: "Pomodoro", icon: "⏱" },
  { id: "tasks", label: "Tasks", icon: "✅" },
  { id: "reminders", label: "Reminders", icon: "🔔" },
  { id: "stats", label: "Stats", icon: "📊" },
];

function phaseLabel(phase) {
  if (phase === "short") return "Short break";
  if (phase === "long") return "Long break";
  return "Focus";
}

export default function App() {
  const [store, setStore] = useState(loadStore);
  const [tab, setTab] = useState("pomodoro");
  const [now, setNow] = useState(Date.now());

  // Write-through persistence: every state change hits localStorage
  // immediately, so closing or killing the app never loses anything.
  useEffect(() => {
    saveStore(store);
  }, [store]);

  const storeRef = useRef(store);
  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  // Reconcile on load: a phase that finished while the app was closed
  // counts as completed, a task left running attributes its elapsed time
  // correctly (even across midnight), and overdue reminders surface their
  // banner instead of being silently skipped.
  useEffect(() => {
    const t = Date.now();
    setStore((s) => {
      let s2 = advancePomodoroIfDue(s, t);
      s2 = reconcileTasksOnLoad(s2, t);
      s2 = reconcileRemindersOnLoad(s2, t);
      return s2;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // How fast does the clock below actually need to run?
  //   250ms — a countdown or elapsed timer is on screen and should look smooth
  //   1000ms — only reminders are live; they are minute-granularity, so a
  //            quarter-second poll was three quarters wasted work
  //   0      — nothing moves until the user acts, so don't run a timer at all
  // Two reminders ship enabled, so the middle case is the resting state of the
  // app: it used to re-render four times a second for as long as it was open.
  const running =
    (store.pomodoro.run != null && store.pomodoro.run.pausedRemainingMs == null) ||
    store.tasks.run != null;
  const anyReminder = Object.values(store.reminders.items).some((r) => r.enabled);
  const tickMs = running ? 250 : anyReminder ? 1000 : 0;

  // Ticking clock: drives the visible countdown/elapsed displays and
  // periodically reconciles absolute-timestamp state. Side effects (chime
  // + notification) are fired here, outside the pure state updaters, by
  // comparing against the previous tick's snapshot.
  useEffect(() => {
    if (!tickMs) return;
    const id = setInterval(() => {
      const t = Date.now();
      const cur = storeRef.current;

      const pr = cur.pomodoro.run;
      if (pr && pr.pausedRemainingMs == null && pr.phaseEndsAt <= t) {
        const finishedPhase = pr.phase;
        if (cur.pomodoro.config.sound) playChime();
        sendNotification(
          finishedPhase === "work" ? "Focus session complete" : "Break's over",
          finishedPhase === "work" ? "Time for a break." : "Back to focus when you're ready."
        );
      }

      for (const r of Object.values(cur.reminders.items)) {
        if (r.enabled && r.nextDueAt <= t && !(cur.reminders.banners || []).includes(r.id)) {
          if (cur.pomodoro.config.sound) playChime();
          sendNotification(r.label, "Reminder due");
        }
      }

      setStore((s) => {
        let s2 = advancePomodoroIfDue(s, t);
        s2 = checkRemindersDue(s2, t);
        return s2;
      });
      setNow(t);
    }, tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  const activeTab = TABS.find((t) => t.id === tab);

  return (
    <div className="page focus-page">
      <div className="apptitle">
        Focus<span>.</span>
      </div>
      <Banners store={store} setStore={setStore} />
      <div className="tabcontent">
        {tab === "pomodoro" && <PomodoroTab store={store} setStore={setStore} now={now} phaseLabel={phaseLabel} />}
        {tab === "tasks" && <TasksTab store={store} setStore={setStore} now={now} />}
        {tab === "reminders" && <RemindersTab store={store} setStore={setStore} now={now} />}
        {tab === "stats" && <StatsTab store={store} now={now} />}
      </div>
      <TabBar tabs={TABS} active={activeTab.id} onChange={setTab} />
    </div>
  );
}
