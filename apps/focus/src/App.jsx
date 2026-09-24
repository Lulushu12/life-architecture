import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { dayKey, usePersistentStore, useVisibleDate } from "@shared/store.js";
import { useHistoryNav } from "@shared/useHistoryNav.js";
import { useWakeLock } from "@shared/useWakeLock.js";
import { registerSw } from "@shared/swRegister.js";
import { useToast } from "@shared/ui.jsx";
import { audio } from "@shared/audio.js";
import { haptics, vibrate } from "@shared/haptics.js";
import { emitEvent } from "@shared/bridge.js";
import { isNativeNotify, notifyNow } from "@shared/notify.js";
import { STORAGE_KEY, focusStore } from "./storage.js";
import {
  ambienceActive,
  isRunning,
  notificationPlan,
  phaseLabel,
  reconcile,
  reconcileOnLoad,
  startFocus,
  startPomodoro,
} from "./logic.js";
import { useNotificationPlan, useNotifyPermission } from "./notifications.js";
import { setAmbienceVolume, startAmbience, stopAmbience } from "./ambience.js";
import { TabBar, fmtClock, fmtDur } from "./ui.jsx";
import Banners from "./Banners.jsx";
import PomodoroTab from "./PomodoroTab.jsx";
import TasksTab from "./TasksTab.jsx";
import RemindersTab from "./RemindersTab.jsx";
import StatsTab from "./StatsTab.jsx";
import SettingsTab from "./SettingsTab.jsx";

const TABS = [
  { id: "pomodoro", label: "Pomodoro", icon: "⏱" },
  { id: "tasks", label: "Tasks", icon: "✅" },
  { id: "reminders", label: "Reminders", icon: "🔔" },
  { id: "stats", label: "Stats", icon: "📊" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];
const SCREENS = new Set(TABS.map((t) => t.id));
const CUE_WINDOW_MS = 5 * 60000;
const LAUNCH_KEY = "focus:launchUrl";

function actionFromUrl(url) {
  const m = /[?&]action=([a-z]+)/.exec(url || "");
  return m ? m[1] : null;
}

function readSession(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    return;
  }
}

function phaseNotice(kind) {
  return kind === "work"
    ? { title: "Focus complete", body: "Time for a break." }
    : { title: "Break over", body: "Back to focus when you're ready." };
}

export default function App() {
  const [store, setStore, status] = usePersistentStore(focusStore);
  const { view, nav, replace } = useHistoryNav({ screen: "pomodoro" }, { persistKey: "focus:view" });
  const screen = SCREENS.has(view?.screen) ? view.screen : "pomodoro";
  const [now, setNow] = useState(Date.now);
  const today = useVisibleDate();
  const toast = useToast();
  const notify = useNotifyPermission();
  const skipCues = useRef(false);

  useEffect(() => {
    registerSw({
      onUpdate: (reload) => toast("Update available", { action: { label: "Reload", onClick: reload }, duration: 0 }),
    });
  }, [toast]);

  const runAction = useCallback(
    (action) => {
      if (action === "start") {
        replace({ screen: "pomodoro" });
        setStore((s) => startFocus(s, Date.now()));
      } else if (action === "stats") {
        replace({ screen: "stats" });
      }
    },
    [setStore, replace]
  );

  useEffect(() => {
    const t = Date.now();
    setStore((s) => reconcileOnLoad(s, t));
    setNow(t);
    const action = new URLSearchParams(window.location.search).get("action");
    if (action) {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.hash);
      runAction(action);
    }
  }, [setStore, runAction]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    let cancelled = false;
    let handle = null;
    import("@capacitor/app")
      .then(async ({ App: CapApp }) => {
        const launch = await CapApp.getLaunchUrl();
        const url = launch?.url;
        if (!cancelled && url && readSession(LAUNCH_KEY) !== url) {
          writeSession(LAUNCH_KEY, url);
          runAction(actionFromUrl(url));
        }
        const h = await CapApp.addListener("appUrlOpen", (e) => runAction(actionFromUrl(e?.url)));
        if (cancelled) h.remove();
        else handle = h;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (handle) handle.remove();
    };
  }, [runAction]);

  const pr = store.pomodoro.run;
  const pomoRunning = isRunning(pr);
  const running = pomoRunning || !!store.tasks.run;
  const anyReminder = Object.values(store.reminders.items).some((r) => r.enabled);
  const tickMs = running ? 250 : anyReminder ? 1000 : 0;

  useEffect(() => {
    if (!tickMs) return undefined;
    const id = setInterval(() => {
      const t = Date.now();
      setStore((s) => reconcile(s, t));
      setNow(t);
    }, tickMs);
    return () => clearInterval(id);
  }, [tickMs, setStore]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      audio.ensure();
      const t = Date.now();
      setStore((s) => reconcile(s, t));
      setNow(t);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [setStore]);

  useWakeLock(store.settings.keepAwake && running);

  const amb = store.settings.ambience;
  const ambOn = ambienceActive(store);
  const ambVolume = useRef(amb.volume);
  ambVolume.current = amb.volume;
  useEffect(() => {
    if (ambOn) startAmbience(amb.kind, ambVolume.current);
    else stopAmbience();
  }, [ambOn, amb.kind]);
  useEffect(() => {
    setAmbienceVolume(amb.volume);
  }, [amb.volume]);
  useEffect(() => stopAmbience, []);

  const plan = useMemo(() => notificationPlan(store), [store]);
  useNotificationPlan(plan);

  // Cues and bridge events are derived from committed state, so each finished
  // phase or new reminder banner fires exactly once however many ticks saw it.
  const prevRef = useRef(store);
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = store;
    if (prev === store) return;
    if (skipCues.current) {
      skipCues.current = false;
      return;
    }
    const t = Date.now();
    const hidden = document.visibilityState !== "visible";
    const webNotify = !isNativeNotify() && hidden;
    const { sound } = store.pomodoro.config;
    const vib = store.settings.vibrate;
    const nameOf = (id) => (id && store.tasks.items[id]?.name) || null;

    const seen = new Set(prev.logs.sessions.map((s) => s.id));
    let phaseCue = false;
    for (const s of store.logs.sessions) {
      if (seen.has(s.id)) continue;
      const minutes = Math.round(((s.end - s.start) / 60000) * 10) / 10;
      if (s.kind === "task") {
        emitEvent({ app: "focus", type: "focus.task", dayKey: dayKey(new Date(s.end)), value: { minutes, taskName: nameOf(s.taskId) } });
        continue;
      }
      if (!s.completed) continue;
      if (s.kind === "work") {
        const value = { minutes, taskId: s.taskId || null, taskName: nameOf(s.taskId) };
        if (s.extension) value.extension = true;
        emitEvent({ app: "focus", type: "focus.pomodoro", dayKey: dayKey(new Date(s.end)), value });
      }
      if (t - s.end < CUE_WINDOW_MS) {
        phaseCue = true;
        if (webNotify) notifyNow({ ...phaseNotice(s.kind), tag: "focus-phase" });
      }
    }
    if (phaseCue) {
      audio.play("chime", { enabled: sound });
      vibrate(haptics.success, { enabled: vib });
    }

    const shown = new Set(prev.reminders.banners);
    const fresh = store.reminders.banners.filter((id) => !shown.has(id));
    if (fresh.length) {
      if (!phaseCue) audio.play("bell", { enabled: sound });
      vibrate(haptics.warn, { enabled: vib });
      if (webNotify) {
        for (const id of fresh) {
          const r = store.reminders.items[id];
          if (r) notifyNow({ title: r.label, body: "Reminder due", tag: `focus-reminder-${id}` });
        }
      }
    }
  }, [store]);

  const { permission, request } = notify;
  const markAsked = useCallback(() => {
    setStore((s) => (s.settings.notifAsked ? s : { ...s, settings: { ...s.settings, notifAsked: true } }));
  }, [setStore]);

  const onStartGesture = useCallback(() => {
    audio.ensure();
    if (!store.settings.notifAsked) {
      markAsked();
      if (permission === "prompt") request();
    }
  }, [store.settings.notifAsked, permission, request, markAsked]);

  const restore = useCallback(
    (data) => {
      skipCues.current = true;
      focusStore.save(data);
      setStore(reconcileOnLoad(focusStore.load(), Date.now()));
    },
    [setStore]
  );

  const go = (id) => {
    if (id !== screen) nav({ screen: id });
  };

  let pill = null;
  if (pomoRunning && screen !== "pomodoro") {
    pill = (
      <button type="button" className="runpill" onClick={() => go("pomodoro")}>
        <span aria-hidden="true">🍅</span> {phaseLabel(pr.phase)} {fmtClock(pr.phaseEndsAt - now)}
      </button>
    );
  } else if (store.tasks.run && screen !== "tasks") {
    const tr = store.tasks.run;
    pill = (
      <button type="button" className="runpill" onClick={() => go("tasks")}>
        <span aria-hidden="true">⏱</span> {store.tasks.items[tr.taskId]?.name || "Task"}{" "}
        {fmtDur(Math.max(0, now - (tr.sessionStart ?? tr.startedAt)) / 60000)}
      </button>
    );
  }

  const hasPill = pill != null;
  useEffect(() => {
    document.body.classList.toggle("has-pill", hasPill);
    return () => document.body.classList.remove("has-pill");
  }, [hasPill]);

  const tabProps = { store, setStore, now, today };

  return (
    <div className="page focus-page">
      <div className="apptitle">
        Focus<span>.</span>
      </div>
      {!status.ok && (
        <p className="warn storagewarn" role="alert">
          Storage full: changes are not being saved.
        </p>
      )}
      {store._recovered && (
        <p className="warn storagewarn" role="alert">
          Saved data was unreadable and has been reset; the raw copy is under {STORAGE_KEY}.corrupt
        </p>
      )}
      <Banners store={store} setStore={setStore} />
      <div className="tabcontent">
        {screen === "pomodoro" && (
          <PomodoroTab
            {...tabProps}
            onStartGesture={onStartGesture}
            onStart={() => setStore((s) => startPomodoro(s, Date.now()))}
          />
        )}
        {screen === "tasks" && <TasksTab {...tabProps} />}
        {screen === "reminders" && <RemindersTab {...tabProps} />}
        {screen === "stats" && <StatsTab {...tabProps} />}
        {screen === "settings" && (
          <SettingsTab
            {...tabProps}
            permission={permission}
            onRequestPermission={async () => {
              markAsked();
              const res = await request();
              if (res === "granted") toast("Notifications enabled");
            }}
            onRestore={restore}
          />
        )}
      </div>
      <TabBar tabs={TABS} active={screen} onChange={go} pill={pill} />
    </div>
  );
}
