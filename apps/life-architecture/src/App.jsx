import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useHistoryNav, useBackGuard } from "@shared/useHistoryNav.js";
import { useToast } from "@shared/ui.jsx";
import { registerSw } from "@shared/swRegister.js";
import { useVisibleDate, addDays } from "@shared/store.js";
import { getLevel, uid, WEEKDAYS, todayKey } from "./system/constants.js";
import { DEFAULT_LONG, DEFAULT_DAILY_V2 } from "./system/quests.js";
import { completeQuest, uncompleteQuest, isSkipped, isPlanned as isPlannedToday } from "./system/streak.js";
import { migrateUserData, SCHEMA_VERSION } from "./data/migrate.js";
import { lsSet, loadUserRaw, applySnapshot, savedAt, onStorageStatus } from "./data/store.js";
import { getSyncConfig, setSyncConfig, pullSnapshot, schedulePush, onSyncStatus, isGithubMode } from "./data/branchSync.js";
import { getWorkoutLogSync } from "./data/logs.js";
import { pendingEvents, applyEvents, subscribeEvents } from "./data/bridge.js";
import { effectiveMacros } from "./data/macros.js";
import { getSettings, setSettings, rescheduleReminders, enableReminders, cancelReminders } from "./data/reminders.js";
import { buzz } from "./data/feedback.js";
import { css } from "./views/shared.jsx";
import { PIdentity, PHabits, POutputs, PPrinciples } from "./views/StaticPages.jsx";
import Schedule from "./views/Schedule.jsx";
import Quests, { QModal } from "./views/Quests.jsx";
import Train from "./views/Train.jsx";
import Nutrition from "./views/Nutrition.jsx";
import Coach from "./views/Coach.jsx";
import Setup from "./views/Setup.jsx";
import Today from "./views/Today.jsx";
import Review from "./views/Review.jsx";
import Stats from "./views/Stats.jsx";
import { resolveTargets, proteinHit, kcalInWindow, autoQuestTitle } from "./system/targets.js";
import Settings from "./views/Settings.jsx";
import { longEarned, milestonesOf } from "./system/milestones.js";

const USER = { uid: "local", email: null };
const THEME_COLORS = { dark: "#12151a", light: "#f2f4f8" };

const Icon = ({ children, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const ICONS = {
  today:    <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" /></>,
  train:    <><path d="M6.5 6.5v11M17.5 6.5v11" /><path d="M3.5 9.5v5M20.5 9.5v5" /><path d="M6.5 12h11" /></>,
  fuel:     <path d="M12 3c0.5 3.2-4 5-4 8.9a4 4 0 0 0 8 0C16 8 12.5 6.2 12 3z" />,
  coach:    <><path d="M12 4l1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7L12 4z" /><path d="M18.6 15.6l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" /></>,
  quests:   <><path d="M5.5 21V4" /><path d="M5.5 4.5h12l-3 4 3 4h-12" /></>,
  schedule: <><rect x="4" y="5.5" width="16" height="15" rx="2.5" /><path d="M8 3.5v4M16 3.5v4M4 10.5h16" /></>,
  review:   <><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4v4h4" /><path d="M12 8v4l3 2" /></>,
  stats:    <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  more:     <><circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none" /></>,
};

const NAV_DAILY = [
  { id: "today",    label: "Today" },
  { id: "train",    label: "Train" },
  { id: "fuel",     label: "Fuel" },
  { id: "coach",    label: "Coach" },
  { id: "quests",   label: "Quests" },
  { id: "schedule", label: "Schedule" },
  { id: "review",   label: "Weekly review" },
  { id: "stats",    label: "Stats" },
];
const NAV_LIBRARY = [
  { id: "identity",   glyph: "◈", label: "Identity" },
  { id: "habits",     glyph: "⊕", label: "Atomic Habits" },
  { id: "outputs",    glyph: "◎", label: "6-Month Outputs" },
  { id: "principles", glyph: "≡", label: "Principles" },
];
const TABS = [
  { id: "today",  label: "Today" },
  { id: "train",  label: "Train" },
  { id: "fuel",   label: "Fuel" },
  { id: "quests", label: "Quests" },
  { id: "more",   label: "More" },
];
const PAGES = new Set([...NAV_DAILY.map(n => n.id), ...NAV_LIBRARY.map(n => n.id), "more", "sync", "settings"]);
const MORE_IDS = ["coach", "schedule", "review", "stats", "settings", "sync", ...NAV_LIBRARY.map(n => n.id), "more"];

const SYNC_LABEL = {
  off:     { dot: "var(--dim)", text: "Device only" },
  syncing: { dot: "#f59e0b",    text: "Syncing…" },
  synced:  { dot: "#22c55e",    text: "Synced to branch" },
  error:   { dot: "#ef4444",    text: "Sync error: local data kept, nothing pushed" },
};

const FRESH = () => ({ longQ: DEFAULT_LONG, dailyQ: DEFAULT_DAILY_V2, cumulativeDailyXP: 0, liftProgress: {}, pplOffset: 0, schemaVersion: 0 });

function loadInitial() {
  const { data: stored, recovered } = loadUserRaw();
  let seed = null;
  let dirty = false;
  if (stored) {
    const m = migrateUserData(stored);
    seed = m.data;
    dirty = m.changed;
  } else {
    try {
      const lr = localStorage.getItem("la_long_v8"), dr = localStorage.getItem("la_daily_v8"), cr = localStorage.getItem("la_cdxp_v8");
      if (lr || dr || cr) {
        seed = migrateUserData({ longQ: lr ? JSON.parse(lr) : DEFAULT_LONG, dailyQ: dr ? JSON.parse(dr) : [], cumulativeDailyXP: cr ? JSON.parse(cr) : 0 }).data;
        dirty = true;
      }
    } catch { /* unreadable legacy keys */ }
  }
  if (!seed) { seed = migrateUserData(FRESH()).data; dirty = !recovered; }
  if (dirty) lsSet("user", seed);
  return { seed, recovered };
}

const totalOf = (d) => (d.longQ || []).reduce((s, q) => s + longEarned(q), 0) + (+d.cumulativeDailyXP || 0);

function pruneDayLog(dayLog, today) {
  const cutoff = addDays(today, -120);
  const out = {};
  for (const [k, v] of Object.entries(dayLog || {})) if (k >= cutoff) out[k] = v;
  return out;
}

export default function App() {
  const toast = useToast();
  const today = useVisibleDate();
  const initial = useMemo(loadInitial, []);
  const [data, setData] = useState(initial.seed);
  const dataRef = useRef(initial.seed);
  const [recovered] = useState(initial.recovered);
  const [storage, setStorage] = useState({ ok: true, error: null });
  const { view, nav, replace } = useHistoryNav({ page: "today" }, { persistKey: "la:page" });
  const page = PAGES.has(view?.page) ? view.page : "today";
  const [modal, setModal] = useState(null);
  const [questMenu, setQuestMenu] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [syncCfg, setSyncCfg] = useState(() => getSyncConfig() || { mode: "local" });
  const [syncStatus, setSyncStatus] = useState(() => (isGithubMode() ? "syncing" : "off"));
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem("la3_theme") || "dark"; } catch { return "dark"; } });
  const [settings, setSettingsState] = useState(getSettings);
  const [schedDay, setSchedDay] = useState(() => WEEKDAYS[(new Date().getDay() + 6) % 7]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme] || THEME_COLORS.dark);
    try { localStorage.setItem("la3_theme", theme); } catch { /* blocked */ }
  }, [theme]);

  useEffect(() => onStorageStatus(setStorage), []);
  useEffect(() => { onSyncStatus(setSyncStatus); return () => onSyncStatus(null); }, []);

  useEffect(() => {
    registerSw({ onUpdate: (reload) => toast("Update available", { action: { label: "Reload", onClick: reload }, duration: 0 }) });
  }, [toast]);

  useEffect(() => {
    const action = new URLSearchParams(window.location.search).get("action");
    if (action === "today") replace({ page: "today" });
  }, [replace]);

  const commit = useCallback((fn, { push = true, celebrate = true } = {}) => {
    const prev = dataRef.current;
    const next = fn(prev);
    if (!next || next === prev) return prev;
    dataRef.current = next;
    setData(next);
    lsSet("user", { ...next, schemaVersion: SCHEMA_VERSION });
    if (push) schedulePush();
    if (celebrate) {
      const a = getLevel(totalOf(prev)), b = getLevel(totalOf(next));
      if (b.level > a.level) { setLevelUp(b); buzz("success"); }
    }
    return next;
  }, []);

  const replaceData = useCallback((userData) => {
    commit(() => migrateUserData(userData || FRESH()).data, { push: false, celebrate: false });
  }, [commit]);

  const xpToast = useCallback((q, xp, mult, graceUsed) => {
    const parts = [`+${xp} XP`];
    if (mult > 1) parts.push(`(x${mult} streak)`);
    toast(`${q.title}: ${parts.join(" ")}${graceUsed ? ", streak held" : ""}`, { duration: 2600 });
    buzz("success");
  }, [toast]);

  const withQuest = (d, nextQ, xpDelta, day, logXp) => {
    const dayLog = { ...(d.dayLog || {}) };
    const entry = { ...(dayLog[day] || {}) };
    if (logXp == null) delete entry[nextQ.id]; else entry[nextQ.id] = logXp;
    dayLog[day] = entry;
    return {
      ...d,
      dailyQ: d.dailyQ.map(q => (q.id === nextQ.id ? nextQ : q)),
      cumulativeDailyXP: Math.max(0, (+d.cumulativeDailyXP || 0) + xpDelta),
      dayLog: pruneDayLog(dayLog, day),
    };
  };

  const toggleDaily = useCallback((id) => {
    const t = today;
    let out = null;
    commit(d => {
      const q = d.dailyQ.find(x => x.id === id);
      if (!q) return d;
      if (q.lastDone !== t && isSkipped(q, t)) return d;
      if (q.lastDone === t) {
        const r = uncompleteQuest(q);
        out = { undo: true, q, xp: r.xp };
        return withQuest(d, r.next, r.xp, t, null);
      }
      const r = completeQuest(q, t);
      out = { q, xp: r.xp, mult: r.mult, grace: r.next.graceUsed };
      return withQuest(d, r.next, r.xp, t, r.xp);
    });
    if (!out) return;
    if (out.undo) { toast(`${out.q.title}: ${out.xp} XP`, { duration: 2000 }); buzz("tap"); }
    else xpToast(out.q, out.xp, out.mult, out.grace);
  }, [commit, today, toast, xpToast]);

  const setDailyAuto = useCallback((id, done, { quiet = false } = {}) => {
    const t = todayKey();
    let out = null;
    commit(d => {
      const q = d.dailyQ.find(x => x.id === id);
      if (!q) return d;
      const isDone = q.lastDone === t;
      if (done === isDone) return d;
      if (done && isSkipped(q, t)) return d;
      if (done) {
        const r = completeQuest(q, t);
        out = { q, xp: r.xp, mult: r.mult, grace: r.next.graceUsed };
        return withQuest(d, r.next, r.xp, t, r.xp);
      }
      const r = uncompleteQuest(q);
      return withQuest(d, r.next, r.xp, t, null);
    });
    if (out && !quiet) xpToast(out.q, out.xp, out.mult, out.grace);
  }, [commit, xpToast]);

  const skipDaily = useCallback((id, on) => {
    const t = todayKey();
    let q0 = null;
    commit(d => {
      const q = d.dailyQ.find(x => x.id === id);
      if (!q || q.lastDone === t) return d;
      q0 = q;
      const cutoff = addDays(t, -120);
      const rest = (Array.isArray(q.skips) ? q.skips : []).filter(k => k !== t && k >= cutoff);
      const next = { ...q, skips: on ? [...rest, t] : rest };
      return { ...d, dailyQ: d.dailyQ.map(x => (x.id === id ? next : x)) };
    });
    if (!q0) return;
    buzz("tap");
    if (on) toast.undo(`${q0.title}: skipped today, streak paused`, () => skipDaily(id, false));
    else toast(`${q0.title}: back on today`, { duration: 2000 });
  }, [commit, toast]);

  const evaluateMacros = useCallback(() => {
    const t = todayKey();
    const { totals, source } = effectiveMacros(dataRef.current, t);
    if (!source) return;
    const tg = resolveTargets(dataRef.current);
    setDailyAuto("hf_protein", proteinHit(totals, tg));
    setDailyAuto("hf_kcal", kcalInWindow(totals, tg));
  }, [setDailyAuto]);

  const onSessionLogged = useCallback(() => setDailyAuto("hf_gym", true), [setDailyAuto]);
  const onMacrosChanged = useCallback(() => evaluateMacros(), [evaluateMacros]);
  const awardXP = useCallback((n) => commit(d => ({ ...d, cumulativeDailyXP: (+d.cumulativeDailyXP || 0) + n })), [commit]);

  const ingest = useCallback(() => {
    const events = pendingEvents(dataRef.current.consumedEvents);
    if (!events.length) return;
    const t = todayKey();
    const res = applyEvents(dataRef.current, events, t);
    commit(() => res.data, { celebrate: false });
    for (const qid of res.completions) setDailyAuto(qid, true);
    if (res.trainingToday) {
      const log = getWorkoutLogSync(t);
      if (!log || log.missed) setDailyAuto("hf_gym", true);
    }
    if (res.macrosToday) evaluateMacros();
  }, [commit, setDailyAuto, evaluateMacros]);

  useEffect(() => {
    ingest();
    evaluateMacros();
    const unsub = subscribeEvents(() => ingest());
    const onVis = () => { if (document.visibilityState === "visible") { ingest(); evaluateMacros(); } };
    document.addEventListener("visibilitychange", onVis);
    return () => { unsub(); document.removeEventListener("visibilitychange", onVis); };
  }, [ingest, evaluateMacros]);

  useEffect(() => {
    if (getSettings().reminders) rescheduleReminders(true);
  }, []);

  const pullRemote = useCallback(() => {
    if (!isGithubMode()) { setSyncStatus("off"); return; }
    setSyncStatus("syncing");
    pullSnapshot().then(snap => {
      if (snap && (snap.savedAt || 0) > savedAt()) {
        applySnapshot(snap);
        replaceData(snap.user);
      } else if (snap === null) {
        schedulePush();
      }
      setSyncStatus("synced");
    }).catch(() => setSyncStatus("error"));
  }, [replaceData]);

  useEffect(() => { pullRemote(); }, [pullRemote]);

  const saveLiftProgress = useCallback(async (p) => { commit(d => ({ ...d, liftProgress: p })); }, [commit]);
  const slidePPL = useCallback(async () => { commit(d => ({ ...d, pplOffset: ((+d.pplOffset || 0) + 1) % 7 })); }, [commit]);

  const saveLong = (fn) => commit(d => ({ ...d, longQ: fn(d.longQ) }));
  const onLongSave = (fields) => {
    if (modal.mode === "daily") {
      const id = modal.quest.id;
      commit(d => ({ ...d, dailyQ: d.dailyQ.map(q => (q.id === id ? { ...q, ...fields } : q)) }));
      setModal(null);
      return;
    }
    if (modal.mode === "add") saveLong(list => [...list, { id: uid(), status: "Active", ...fields }]);
    else saveLong(list => list.map(q => (q.id === modal.quest.id ? { ...q, ...fields } : q)));
    setModal(null);
  };
  const delLong = (id) => {
    const list = dataRef.current.longQ;
    const idx = list.findIndex(q => q.id === id);
    if (idx < 0) return;
    const removed = list[idx];
    saveLong(l => l.filter(q => q.id !== id));
    toast.undo(`Deleted "${removed.title}"`, () => saveLong(l => (l.some(q => q.id === id) ? l : [...l.slice(0, idx), removed, ...l.slice(idx)])));
  };
  const toggleLong = (id) => {
    let q0 = null;
    saveLong(list => list.map(q => {
      if (q.id !== id) return q;
      q0 = q;
      return { ...q, status: q.status === "Completed" ? "Active" : "Completed" };
    }));
    if (q0 && q0.status !== "Completed") { toast(`${q0.title}: +${Math.max(0, (+q0.xp || 0) - longEarned(q0)).toLocaleString()} XP`); buzz("success"); }
  };
  const toggleMilestone = (qid, mid) => {
    let out = null;
    saveLong(list => list.map(q => {
      if (q.id !== qid) return q;
      const ms = milestonesOf(q);
      const idx = ms.findIndex(m => m.id === mid);
      if (idx < 0) return q;
      const nextMs = ms.map(m => (m.id === mid ? { ...m, done: !m.done } : m));
      const allDone = nextMs.every(m => m.done);
      const status = allDone ? "Completed" : q.status === "Completed" ? "Active" : q.status === "Pending" ? "Active" : q.status;
      const next = { ...q, milestones: nextMs, status };
      out = { q: next, m: nextMs[idx], delta: longEarned(next) - longEarned(q), allDone };
      return next;
    }));
    if (!out) return;
    if (out.m.done) {
      toast(`${out.m.title}: +${out.delta.toLocaleString()} XP${out.allDone ? ", quest complete" : ""}`, { duration: 2600 });
      buzz("success");
    } else {
      toast(`${out.m.title}: ${out.delta.toLocaleString()} XP`, { duration: 2000 });
      buzz("tap");
    }
  };

  const saveSetup = (cfg) => {
    setSyncConfig(cfg);
    setSyncCfg(cfg);
    nav({ page: "settings" });
    if (cfg.mode === "github") pullRemote();
    else setSyncStatus("off");
  };

  const restoreData = (snap) => {
    applySnapshot(snap, { stamp: Date.now() });
    replaceData(snap.user || dataRef.current);
    schedulePush();
    toast("Backup restored");
  };

  const toggleReminders = async (on) => {
    if (on) {
      const res = await enableReminders();
      if (!res.ok) {
        toast(res.perm === "denied" ? "Notifications are blocked for this app" : "Reminders only fire in the Android app");
        if (res.perm === "denied") return;
      } else toast(`Reminders set for the next 7 days (${res.count})`);
    } else {
      await cancelReminders();
    }
    setSettingsState(setSettings({ reminders: on }));
  };

  const openQuestMenu = useCallback((q) => setQuestMenu(q.id), []);
  const closeQuestMenu = useCallback(() => setQuestMenu(null), []);
  useBackGuard(!!questMenu, closeQuestMenu);
  const menuQuest = questMenu ? viewData.dailyQ.find(q => q.id === questMenu) : null;

  const total = totalOf(data);
  const level = getLevel(total);
  const macros = effectiveMacros(data, today);
  const targets = resolveTargets(data);
  const viewData = useMemo(
    () => ({ ...data, dailyQ: data.dailyQ.map(q => (q.auto ? { ...q, title: autoQuestTitle(q, targets) } : q)) }),
    [data, targets.protein, targets.kcalFloor, targets.kcalCeil]
  );

  const trackerProps = { user: USER, liftProgress: data.liftProgress, saveLiftProgress, pplOffset: data.pplOffset, slidePPL, onSessionLogged, onMacrosChanged, awardXP };
  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));
  const onSettings = (patch) => setSettingsState(setSettings(patch));
  const sync = SYNC_LABEL[syncStatus] || SYNC_LABEL.off;
  const syncWhere = syncCfg.mode === "github" ? `${syncCfg.repo}@${syncCfg.branch}` : "this device";
  const go = (id) => nav({ page: id });

  const xpBar = (
    <button type="button" className="xpbar" onClick={() => go("quests")} aria-label={`Level ${level.level}, ${level.name}, ${total.toLocaleString()} XP`}>
      <span className="xpbar-l"><span>Lv {level.level} · {level.name}</span><span>{level.next ? `${(level.next - total).toLocaleString()} to go` : "max"}</span></span>
      <span className="xp-bg" style={{ display: "block" }}><span className="xp-f" style={{ display: "block", width: level.progress + "%" }} /></span>
    </button>
  );

  const navItem = (n, glyph) => (
    <button type="button" key={n.id} className={"nav-i" + (page === n.id ? " active" : "")} onClick={() => go(n.id)} style={{ width: "100%", border: "none", fontFamily: "inherit", textAlign: "left", background: page === n.id ? undefined : "transparent" }}>
      <span className="nav-ic">{glyph}</span>{n.label}
    </button>
  );

  return (
    <>
      <style>{css}</style>
      <div className="shell">
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-t">Life Architecture</div>
            <div className="logo-s">v3 · Sovereign Health OS</div>
          </div>
          <div className="side-xp">{xpBar}</div>
          <div className="nav-s">Daily</div>
          {NAV_DAILY.map(n => navItem(n, <Icon size={19}>{ICONS[n.id]}</Icon>))}
          <div className="nav-s">Library</div>
          {NAV_LIBRARY.map(n => navItem(n, <span style={{ fontSize: 15 }}>{n.glyph}</span>))}
          {navItem({ id: "settings", label: "Settings & data" }, <Icon size={19}>{ICONS.settings}</Icon>)}
          <div className="side-foot">
            <div className="side-mail" title={syncWhere}>
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: sync.dot, marginRight: 6 }} />{sync.text}
            </div>
            <button className="side-btn" onClick={toggleTheme}>{theme === "dark" ? "◐ Light mode" : "◑ Dark mode"}</button>
          </div>
        </aside>

        <div className="content">
          <header className="la-top">
            <div className="la-top-t">LA</div>
            {xpBar}
            <button className="top-btn" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>{theme === "dark" ? "◐" : "◑"}</button>
          </header>

          <main className="main">
            {!storage.ok && <div className="banner" role="alert"><strong>{storage.error || "Storage full: changes are not being saved."}</strong> Export a backup from More before closing the app.</div>}
            {recovered && <div className="banner" role="alert">Saved data was unreadable and has been reset; the raw copy is under la3_local_user.corrupt.</div>}
            <div className="fi-anim" key={page}>
              {page === "today" && <Today data={viewData} today={today} toggleDaily={toggleDaily} onQuestMenu={openQuestMenu} nav={nav} macros={macros} targets={targets} pplOffset={data.pplOffset} />}
              {page === "train" && <Train {...trackerProps} initialMode={view?.mode} />}
              {page === "fuel" && <Nutrition user={USER} onMacrosChanged={onMacrosChanged} bridgeMacros={data.bridgeMacros} targets={targets} />}
              {page === "coach" && <Coach {...trackerProps} bridgeMacros={data.bridgeMacros} targets={targets} />}
              {page === "quests" && <Quests data={viewData} today={today} level={level} total={total} toggleLong={toggleLong} toggleMilestone={toggleMilestone} toggleDaily={toggleDaily} onQuestMenu={openQuestMenu} delLong={delLong} openAdd={cat => setModal({ mode: "add", category: cat })} openEdit={q => setModal({ mode: "edit", quest: q })} />}
              {page === "schedule" && <Schedule schedDay={schedDay} setSchedDay={setSchedDay} />}
              {page === "stats" && <Stats data={viewData} today={today} targets={targets} />}
              {page === "review" && <Review data={viewData} today={today} commit={commit} setDailyAuto={setDailyAuto} targets={targets} />}
              {page === "identity" && <PIdentity />}
              {page === "habits" && <PHabits />}
              {page === "outputs" && <POutputs longQ={data.longQ} />}
              {page === "principles" && <PPrinciples />}
              {page === "sync" && <Setup initial={syncCfg} onDone={saveSetup} onCancel={() => nav({ page: "settings" })} />}
              {page === "settings" && (
                <Settings data={data} commit={commit} targets={targets} theme={theme} setTheme={setTheme} settings={settings} onSettings={onSettings}
                  reminders={!!settings.reminders} toggleReminders={toggleReminders} sync={sync} syncWhere={syncWhere} go={go}
                  onRestore={restoreData} onTargetsChanged={evaluateMacros} />
              )}
              {page === "more" && (
                <More go={go} sync={sync} syncWhere={syncWhere} />
              )}
            </div>
          </main>

          <nav className="la-tabs" aria-label="Main">
            {TABS.map(t => {
              const active = t.id === page || (t.id === "more" && MORE_IDS.includes(page));
              return (
                <button type="button" key={t.id} className={"tab-i" + (active ? " active" : "")} aria-current={active ? "page" : undefined} onClick={() => go(t.id)}>
                  <Icon size={23}>{ICONS[t.id]}</Icon>
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      {modal && <QModal modal={modal} onSave={onLongSave} onClose={() => setModal(null)} />}
      {menuQuest && (
        <QuestSheet q={menuQuest} today={today} onClose={closeQuestMenu}
          onSkip={(on) => { closeQuestMenu(); skipDaily(menuQuest.id, on); }}
          onToggle={() => { closeQuestMenu(); toggleDaily(menuQuest.id); }}
          onEdit={() => { closeQuestMenu(); setModal({ mode: "daily", quest: menuQuest }); }} />
      )}
      {levelUp && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setLevelUp(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="lvlup-t">
            <h3 id="lvlup-t" style={{ textAlign: "center" }}>Level up</h3>
            <div className="lvl-big">{levelUp.level}</div>
            <div className="lvl-t">{levelUp.name}</div>
            <div className="sheet-actions">
              <button type="button" className="bigbtn" autoFocus onClick={() => setLevelUp(null)}>Keep going</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


function QuestSheet({ q, today, onClose, onSkip, onToggle, onEdit }) {
  const done = q.lastDone === today;
  const skipped = !done && isSkipped(q, today);
  const scheduled = isPlannedToday(q, today);
  const openedAt = useRef(Date.now());
  return (
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && Date.now() - openedAt.current > 450 && onClose()} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="qsheet-t">
        <h3 id="qsheet-t">Quest actions</h3>
        <div className="qsheet-q">{q.title}</div>
        {skipped ? (
          <button type="button" className="qsheet-a" autoFocus onClick={() => onSkip(false)}>Undo skip<small>Put it back on today's list</small></button>
        ) : (
          <button type="button" className="qsheet-a" autoFocus disabled={done || !scheduled} onClick={() => onSkip(true)}>
            Skip today (not applicable)
            <small>{done ? "Already done today. Untick it first to skip." : !scheduled ? "Not scheduled today, nothing to skip." : "The streak neither breaks nor grows, no XP."}</small>
          </button>
        )}
        {!q.auto && !skipped && <button type="button" className="qsheet-a" onClick={onToggle}>{done ? "Mark not done" : "Mark done"}</button>}
        <button type="button" className="qsheet-a" onClick={onEdit}>Edit quest<small>Title, base XP, note</small></button>
        <div className="sheet-actions"><button type="button" className="bigbtn secondary" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

function More({ go, sync, syncWhere }) {
  const rows = [
    { id: "coach", glyph: <Icon size={19}>{ICONS.coach}</Icon>, label: "Coach" },
    { id: "schedule", glyph: <Icon size={19}>{ICONS.schedule}</Icon>, label: "Schedule" },
    { id: "review", glyph: <Icon size={19}>{ICONS.review}</Icon>, label: "Weekly review" },
    { id: "stats", glyph: <Icon size={19}>{ICONS.stats}</Icon>, label: "Stats" },
    ...NAV_LIBRARY.map(n => ({ id: n.id, glyph: <span style={{ fontSize: 16 }}>{n.glyph}</span>, label: n.label })),
    { id: "settings", glyph: <Icon size={19}>{ICONS.settings}</Icon>, label: "Settings & data", sub: `${sync.text} · ${syncWhere}` },
  ];
  return (
    <>
      <div className="pg-title">More</div>
      <div className="pg-sub">Coach, schedule, stats, system reference and settings</div>
      {rows.map(r => (
        <button type="button" key={r.id} className="mr-row" onClick={() => go(r.id)} style={{ width: "100%", fontFamily: "inherit", color: "var(--tx)", textAlign: "left" }}>
          <span className="nav-ic" style={{ color: "var(--acc)" }}>{r.glyph}</span>
          <span className="mr-t">{r.label}{r.sub && <span className="qhint" style={{ display: "block", fontWeight: 500 }}>{r.sub}</span>}</span>
          <span className="mr-a">›</span>
        </button>
      ))}
    </>
  );
}
