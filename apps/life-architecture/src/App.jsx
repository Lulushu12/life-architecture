import { useState, useEffect, useRef, useCallback } from "react";
import { getLevel, getLevelProgress, todayKey, STREAK_MULT, MACROS, uid, LEVELS } from "./system/constants.js";
import { DEFAULT_LONG, DEFAULT_DAILY_V2 } from "./system/quests.js";
import { migrateUserData, SCHEMA_VERSION } from "./data/migrate.js";
import { lsGet, lsSet, buildSnapshot, applySnapshot, savedAt } from "./data/store.js";
import { getSyncConfig, setSyncConfig, pullSnapshot, schedulePush, onSyncStatus } from "./data/branchSync.js";
import { css, Ring } from "./views/shared.jsx";
import { PIdentity, PHabits, POutputs, PReview, PPrinciples } from "./views/StaticPages.jsx";
import Schedule from "./views/Schedule.jsx";
import Quests, { QModal } from "./views/Quests.jsx";
import Train from "./views/Train.jsx";
import Nutrition from "./views/Nutrition.jsx";
import Coach from "./views/Coach.jsx";
import Setup from "./views/Setup.jsx";

const FONT_LINK = document.createElement("link");
FONT_LINK.rel = "stylesheet";
// Self-hosted from public/fonts (same families and weights Google Fonts served).
// Bundling them keeps the APK genuinely offline and stops every page load from
// announcing itself to fonts.googleapis.com.
FONT_LINK.href = `${import.meta.env.BASE_URL}fonts/fonts.css`;
document.head.appendChild(FONT_LINK);

/** All data is local-first; the uid only namespaces nothing anymore but keeps the views' API. */
const USER = { uid: "local", email: null };

const Icon = ({ children, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const ICONS = {
  train:    <><path d="M6.5 6.5v11M17.5 6.5v11" /><path d="M3.5 9.5v5M20.5 9.5v5" /><path d="M6.5 12h11" /></>,
  fuel:     <path d="M12 3c0.5 3.2-4 5-4 8.9a4 4 0 0 0 8 0C16 8 12.5 6.2 12 3z" />,
  coach:    <><path d="M12 4l1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7L12 4z" /><path d="M18.6 15.6l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" /></>,
  quests:   <><path d="M5.5 21V4" /><path d="M5.5 4.5h12l-3 4 3 4h-12" /></>,
  schedule: <><rect x="4" y="5.5" width="16" height="15" rx="2.5" /><path d="M8 3.5v4M16 3.5v4M4 10.5h16" /></>,
  more:     <><circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none" /></>,
};

const NAV_DAILY = [
  { id: "train",    label: "Train" },
  { id: "fuel",     label: "Fuel" },
  { id: "coach",    label: "Coach" },
  { id: "quests",   label: "Quests" },
  { id: "schedule", label: "Schedule" },
];
const NAV_LIBRARY = [
  { id: "identity",   glyph: "◈", label: "Identity" },
  { id: "habits",     glyph: "⊕", label: "Atomic Habits" },
  { id: "outputs",    glyph: "◎", label: "6-Month Outputs" },
  { id: "review",     glyph: "↻", label: "Review Cadence" },
  { id: "principles", glyph: "≡", label: "Principles" },
];
const TABS = [
  { id: "train",  label: "Train" },
  { id: "fuel",   label: "Fuel" },
  { id: "coach",  label: "Coach" },
  { id: "quests", label: "Quests" },
  { id: "more",   label: "More" },
];
const MORE_IDS = ["schedule", ...NAV_LIBRARY.map(n => n.id), "more"];

const SYNC_LABEL = {
  off:     { dot: "var(--dim)",     text: "Device only" },
  syncing: { dot: "#f59e0b",        text: "Syncing…" },
  synced:  { dot: "#22c55e",        text: "Synced to branch" },
  error:   { dot: "#ef4444",        text: "Sync error — retrying on next change" },
};

export default function App() {
  const [page, setPage] = useState("train");
  const [longQ, setLongQ] = useState(DEFAULT_LONG);
  const [dailyQ, setDailyQ] = useState(DEFAULT_DAILY_V2);
  const [cumulativeDailyXP, setCumulativeDailyXP] = useState(0);
  const [liftProgress, setLiftProgress] = useState({});
  const [pplOffset, setPplOffset] = useState(0);
  const [modal, setModal] = useState(null);
  const [schedDay, setSchedDay] = useState("Monday");
  const [filter, setFilter] = useState("All");
  const [loaded, setLoaded] = useState(false);
  const [syncCfg, setSyncCfg] = useState(() => {
    const cfg = getSyncConfig();
    if (cfg) return cfg;
    if (new URLSearchParams(location.search).has("demo")) { const c = { mode: "local" }; setSyncConfig(c); return c; }
    return null;
  });
  const [showSetup, setShowSetup] = useState(false);
  const [syncStatus, setSyncStatus] = useState(() => (getSyncConfig()?.mode === "github" ? "syncing" : "off"));
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem("la3_theme") || "dark"; } catch { return "dark"; } });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("la3_theme", theme); } catch { /* blocked */ }
  }, [theme]);

  useEffect(() => { onSyncStatus(setSyncStatus); return () => onSyncStatus(null); }, []);

  const dailyRef = useRef(dailyQ);  dailyRef.current = dailyQ;
  const xpRef = useRef(cumulativeDailyXP); xpRef.current = cumulativeDailyXP;

  const applyData = (d) => {
    if (!d) return;
    if (d.longQ) setLongQ(d.longQ);
    if (d.dailyQ) setDailyQ(d.dailyQ);
    if (d.cumulativeDailyXP != null) setCumulativeDailyXP(d.cumulativeDailyXP);
    if (d.liftProgress) setLiftProgress(d.liftProgress);
    if (d.pplOffset != null) setPplOffset(d.pplOffset);
  };

  useEffect(() => {
    // Local first (instant), then the branch snapshot if it's newer.
    let seed = { longQ: DEFAULT_LONG, dailyQ: DEFAULT_DAILY_V2, cumulativeDailyXP: 0, liftProgress: {}, pplOffset: 0, schemaVersion: SCHEMA_VERSION };
    try {
      const stored = lsGet("user", null);
      if (stored) {
        const { data, changed } = migrateUserData(stored);
        seed = { ...seed, ...data };
        if (changed) lsSet("user", { ...seed });
      } else {
        // pick up pre-v3 localStorage if it exists (migration path)
        const lr = localStorage.getItem("la_long_v8"), dr = localStorage.getItem("la_daily_v8"), cr = localStorage.getItem("la_cdxp_v8");
        if (lr || dr || cr) {
          const m = migrateUserData({ longQ: lr ? JSON.parse(lr) : DEFAULT_LONG, dailyQ: dr ? JSON.parse(dr) : [], cumulativeDailyXP: cr ? JSON.parse(cr) : 0 });
          seed = { ...seed, ...m.data };
          lsSet("user", seed);
        }
      }
    } catch { /* corrupted local state — fall through to defaults */ }
    applyData(seed);
    setLoaded(true);

    if (getSyncConfig()?.mode === "github") {
      pullSnapshot().then(snap => {
        if (snap && (snap.savedAt || 0) > savedAt()) {
          applySnapshot(snap);
          const { data } = migrateUserData(snap.user || seed);
          applyData(data);
        } else if (snap === null) {
          schedulePush(); // branch has no data file yet — create it from local state
        }
        setSyncStatus("synced");
      }).catch(() => setSyncStatus("error"));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback((patch) => {
    const cur = lsGet("user", {});
    lsSet("user", { ...cur, ...patch, schemaVersion: SCHEMA_VERSION });
    schedulePush();
  }, []);

  const saveLong = (q) => { setLongQ(q); persist({ longQ: q }); };
  const saveDaily = (q) => { setDailyQ(q); persist({ dailyQ: q }); };
  const saveXP = (xp) => { setCumulativeDailyXP(xp); persist({ cumulativeDailyXP: xp }); };
  const saveLiftProgress = async (p) => { setLiftProgress(p); persist({ liftProgress: p }); };
  const slidePPL = async () => { const n = (pplOffset + 1) % 7; setPplOffset(n); persist({ pplOffset: n }); };
  const awardXP = (n) => saveXP(xpRef.current + n);

  // ── Daily quest engine ───────────────────────────────────────────────
  const toggleDaily = (id) => {
    const t = todayKey();
    let xpDelta = 0;
    const newQ = dailyRef.current.map(q => {
      if (q.id !== id) return q;
      if (q.lastDone === t) {
        xpDelta = -Math.round(q.baseXp * STREAK_MULT(q.streak));
        return { ...q, lastDone: "", streak: Math.max(0, q.streak - 1) };
      }
      const yest = new Date(); yest.setDate(yest.getDate() - 1);
      const yk = todayKey(yest);
      const newStreak = q.lastDone === yk ? q.streak + 1 : 1;
      xpDelta = Math.round(q.baseXp * STREAK_MULT(newStreak));
      return { ...q, lastDone: t, streak: newStreak };
    });
    saveDaily(newQ);
    saveXP(xpRef.current + xpDelta);
  };

  /** Idempotent auto-completion for tracker-driven quests (hf_gym, hf_protein, hf_kcal). */
  const setDailyAuto = useCallback((id, done) => {
    const t = todayKey();
    const q = dailyRef.current.find(x => x.id === id);
    if (!q) return;
    const isDone = q.lastDone === t;
    if (done === isDone) return;
    // reuse toggle math exactly so XP accounting stays consistent
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    const yk = todayKey(yest);
    let xpDelta;
    const newQ = dailyRef.current.map(x => {
      if (x.id !== id) return x;
      if (done) {
        const newStreak = x.lastDone === yk ? x.streak + 1 : 1;
        xpDelta = Math.round(x.baseXp * STREAK_MULT(newStreak));
        return { ...x, lastDone: t, streak: newStreak };
      }
      xpDelta = -Math.round(x.baseXp * STREAK_MULT(x.streak));
      return { ...x, lastDone: "", streak: Math.max(0, x.streak - 1) };
    });
    saveDaily(newQ);
    saveXP(xpRef.current + xpDelta);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSessionLogged = useCallback(() => setDailyAuto("hf_gym", true), [setDailyAuto]);
  const onMacrosChanged = useCallback((totals) => {
    setDailyAuto("hf_protein", totals.protein >= MACROS.protein);
    setDailyAuto("hf_kcal", totals.kcal >= MACROS.kcalFloor && totals.kcal <= MACROS.kcalCeil);
  }, [setDailyAuto]);

  // ── Long quests ──────────────────────────────────────────────────────
  const onLongSave = (data) => {
    if (modal.mode === "add") saveLong([...longQ, { id: uid(), status: "Active", ...data }]);
    else saveLong(longQ.map(q => q.id === modal.quest.id ? { ...q, ...data } : q));
    setModal(null);
  };
  const delLong = (id) => saveLong(longQ.filter(q => q.id !== id));
  const toggleLong = (id) => saveLong(longQ.map(q => q.id === id ? { ...q, status: q.status === "Completed" ? "Active" : "Completed" } : q));

  const longXP = longQ.filter(q => q.status === "Completed").reduce((s, q) => s + q.xp, 0);
  const totalXP = longXP + cumulativeDailyXP;
  const level = getLevel(totalXP);
  const progress = getLevelProgress(totalXP);
  const nextLevel = LEVELS[level.index + 1];

  const saveSetup = (cfg) => {
    setSyncConfig(cfg);
    setSyncCfg(cfg);
    setShowSetup(false);
    if (cfg.mode === "github") {
      setSyncStatus("syncing");
      pullSnapshot().then(snap => {
        if (snap && (snap.savedAt || 0) > savedAt()) { applySnapshot(snap); applyData(migrateUserData(snap.user || {}).data); }
        else schedulePush();
        setSyncStatus("synced");
      }).catch(() => setSyncStatus("error"));
    } else setSyncStatus("off");
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(buildSnapshot(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `life-architecture-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!syncCfg || showSetup) {
    return <><style>{css}</style><Setup initial={syncCfg} onDone={saveSetup} onCancel={syncCfg ? () => setShowSetup(false) : null} /></>;
  }
  if (!loaded) return <><style>{css}</style><div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "var(--mut)" }}>Loading…</div></>;

  const trackerProps = { user: USER, liftProgress, saveLiftProgress, pplOffset, slidePPL, onSessionLogged, onMacrosChanged, awardXP };
  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");
  const sync = SYNC_LABEL[syncStatus] || SYNC_LABEL.off;
  const syncWhere = syncCfg.mode === "github" ? `${syncCfg.repo}@${syncCfg.branch}` : "this device";

  const navItem = (n, glyph) => (
    <div key={n.id} className={"nav-i" + (page === n.id ? " active" : "")} onClick={() => setPage(n.id)}>
      <span className="nav-ic">{glyph}</span>{n.label}
    </div>
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
          <div className="nav-s">Daily</div>
          {NAV_DAILY.map(n => navItem(n, <Icon size={19}>{ICONS[n.id]}</Icon>))}
          <div className="nav-s">Library</div>
          {NAV_LIBRARY.map(n => navItem(n, <span style={{ fontSize: 15 }}>{n.glyph}</span>))}
          <div className="side-foot">
            <div className="side-mail" title={syncWhere}>
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: sync.dot, marginRight: 6 }} />{sync.text}
            </div>
            <button className="side-btn" onClick={toggleTheme}>{theme === "dark" ? "◐ Light mode" : "◑ Dark mode"}</button>
            <button className="side-btn" onClick={() => setShowSetup(true)}>Data & sync</button>
          </div>
        </aside>

        <div className="content">
          <header className="topbar">
            <div className="topbar-t">Life Architecture</div>
            <div className="top-chip">Lv {level.index + 1} · {totalXP.toLocaleString()} XP</div>
            <button className="top-btn" onClick={toggleTheme} aria-label="Toggle theme">{theme === "dark" ? "◐" : "◑"}</button>
          </header>

          <main className="main">
            {page !== "more" && (
              <div className="xp-card">
                <Ring size={62} stroke={6} pct={progress}>
                  <span className="ring-lv">{level.index + 1}</span>
                  <span className="ring-lv-s">LV</span>
                </Ring>
                <div className="xp-w">
                  <div className="xp-lv">{level.name}</div>
                  <div className="xp-n">{totalXP.toLocaleString()} XP{nextLevel ? ` · ${(nextLevel.min - totalXP).toLocaleString()} to ${nextLevel.name}` : " · max level"}</div>
                  <div className="xp-meta" style={{ marginTop: 7 }}>
                    <span style={{ color: "var(--mut)" }}>Level {level.index + 1}</span>
                    <span style={{ color: "var(--acc)" }}>{progress}%</span>
                  </div>
                  <div className="xp-bg"><div className="xp-f" style={{ width: progress + "%" }} /></div>
                </div>
              </div>
            )}
            <div className="fi-anim" key={page}>
              {page === "train" && <Train {...trackerProps} />}
              {page === "fuel" && <Nutrition user={USER} onMacrosChanged={onMacrosChanged} />}
              {page === "coach" && <Coach {...trackerProps} />}
              {page === "quests" && <Quests longQ={longQ} dailyQ={dailyQ} toggleLong={toggleLong} toggleDaily={toggleDaily} delLong={delLong} openAdd={cat => setModal({ mode: "add", category: cat })} openEdit={q => setModal({ mode: "edit", quest: q })} filter={filter} setFilter={setFilter} />}
              {page === "schedule" && <Schedule schedDay={schedDay} setSchedDay={setSchedDay} />}
              {page === "identity" && <PIdentity />}
              {page === "habits" && <PHabits />}
              {page === "outputs" && <POutputs longQ={longQ} />}
              {page === "review" && <PReview />}
              {page === "principles" && <PPrinciples />}
              {page === "more" && <More setPage={setPage} theme={theme} toggleTheme={toggleTheme} sync={sync} syncWhere={syncWhere} openSetup={() => setShowSetup(true)} exportData={exportData} />}
            </div>
          </main>

          <nav className="tabbar">
            {TABS.map(t => {
              const active = t.id === page || (t.id === "more" && MORE_IDS.includes(page));
              return (
                <div key={t.id} className={"tab-i" + (active ? " active" : "")} onClick={() => setPage(t.id)}>
                  <Icon size={23}>{ICONS[t.id]}</Icon>
                  {t.label}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
      {modal && <QModal modal={modal} onSave={onLongSave} onClose={() => setModal(null)} />}
    </>
  );
}

function More({ setPage, theme, toggleTheme, sync, syncWhere, openSetup, exportData }) {
  const rows = [
    { id: "schedule", glyph: <Icon size={19}>{ICONS.schedule}</Icon>, label: "Schedule" },
    ...NAV_LIBRARY.map(n => ({ id: n.id, glyph: <span style={{ fontSize: 16 }}>{n.glyph}</span>, label: n.label })),
  ];
  return (
    <>
      <div className="pg-title">More</div>
      <div className="pg-sub">Schedule, system reference and data</div>
      {rows.map(r => (
        <div key={r.id} className="mr-row" onClick={() => setPage(r.id)}>
          <span className="nav-ic" style={{ color: "var(--acc)" }}>{r.glyph}</span>
          <span className="mr-t">{r.label}</span>
          <span className="mr-a">›</span>
        </div>
      ))}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-t">Data & sync</div>
        <div style={{ fontSize: 13, color: "var(--mut)", marginBottom: 12 }}>
          <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: sync.dot, marginRight: 6 }} />
          {sync.text} · {syncWhere}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="bs" onClick={openSetup}>Sync settings</button>
          <button className="bs" onClick={exportData}>Export data</button>
          <button className="bs" onClick={toggleTheme}>{theme === "dark" ? "◐ Light mode" : "◑ Dark mode"}</button>
        </div>
      </div>
    </>
  );
}
