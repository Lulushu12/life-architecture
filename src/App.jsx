import { useState, useEffect, useRef, useCallback } from "react";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { getLevel, getLevelProgress, todayKey, STREAK_MULT, MACROS, uid } from "./system/constants.js";
import { DEFAULT_LONG, DEFAULT_DAILY_V2 } from "./system/quests.js";
import { migrateUserData, SCHEMA_VERSION } from "./data/migrate.js";
import { css } from "./views/shared.jsx";
import { PIdentity, PHabits, POutputs, PReview, PPrinciples } from "./views/StaticPages.jsx";
import Schedule from "./views/Schedule.jsx";
import Quests, { QModal } from "./views/Quests.jsx";
import Train from "./views/Train.jsx";
import Nutrition from "./views/Nutrition.jsx";
import Coach from "./views/Coach.jsx";

const FONT_LINK = document.createElement("link");
FONT_LINK.rel = "stylesheet";
FONT_LINK.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;700&family=JetBrains+Mono:wght@400;600&display=swap";
document.head.appendChild(FONT_LINK);

const NAV = [
  { id: "train",      icon: "▶", label: "Train" },
  { id: "fuel",       icon: "◍", label: "Fuel" },
  { id: "coach",      icon: "✦", label: "Coach" },
  { id: "quests",     icon: "⬡", label: "Quest Board" },
  { id: "schedule",   icon: "▦", label: "Schedule" },
  { id: "identity",   icon: "◈", label: "Identity" },
  { id: "habits",     icon: "⊕", label: "Atomic Habits" },
  { id: "outputs",    icon: "◎", label: "6-Month Outputs" },
  { id: "review",     icon: "↻", label: "Review Cadence" },
  { id: "principles", icon: "≡", label: "Principles" },
];

export default function App({ user }) {
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
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem("la3_theme") || "dark"; } catch { return "dark"; } });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("la3_theme", theme); } catch { /* blocked */ }
  }, [theme]);

  const userDoc = doc(db, "users", user.uid);
  const dailyRef = useRef(dailyQ);  dailyRef.current = dailyQ;
  const xpRef = useRef(cumulativeDailyXP); xpRef.current = cumulativeDailyXP;

  useEffect(() => {
    // localStorage first (fast), then Firestore (authoritative), migrating either way
    let seed = { longQ: DEFAULT_LONG, dailyQ: DEFAULT_DAILY_V2, cumulativeDailyXP: 0, liftProgress: {}, pplOffset: 0, schemaVersion: SCHEMA_VERSION };
    try {
      const ls = localStorage.getItem(`la3_${user.uid}_user`);
      if (ls) seed = { ...seed, ...JSON.parse(ls) };
      else {
        // pick up pre-v3 localStorage if it exists (migration path)
        const lr = localStorage.getItem("la_long_v8"), dr = localStorage.getItem("la_daily_v8"), cr = localStorage.getItem("la_cdxp_v8");
        if (lr || dr || cr) {
          const m = migrateUserData({ longQ: lr ? JSON.parse(lr) : DEFAULT_LONG, dailyQ: dr ? JSON.parse(dr) : [], cumulativeDailyXP: cr ? JSON.parse(cr) : 0 });
          seed = { ...seed, ...m.data };
        }
      }
    } catch { /* corrupted local state — fall through to defaults */ }
    applyData(seed);

    getDoc(userDoc).then(snap => {
      if (snap.exists()) {
        const { data, changed } = migrateUserData(snap.data());
        applyData(data);
        if (changed) setDoc(userDoc, data, { merge: true }).catch(() => {});
      } else {
        setDoc(userDoc, seed).catch(() => {});
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [user.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyData = (d) => {
    if (d.longQ) setLongQ(d.longQ);
    if (d.dailyQ) setDailyQ(d.dailyQ);
    if (d.cumulativeDailyXP != null) setCumulativeDailyXP(d.cumulativeDailyXP);
    if (d.liftProgress) setLiftProgress(d.liftProgress);
    if (d.pplOffset != null) setPplOffset(d.pplOffset);
  };

  const persist = useCallback((patch) => {
    setDoc(userDoc, patch, { merge: true }).catch(() => {});
    try {
      const cur = JSON.parse(localStorage.getItem(`la3_${user.uid}_user`) || "{}");
      localStorage.setItem(`la3_${user.uid}_user`, JSON.stringify({ ...cur, ...patch, schemaVersion: SCHEMA_VERSION }));
    } catch { /* quota */ }
  }, [user.uid]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (!loaded) return <><style>{css}</style><div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "var(--fnt)", letterSpacing: 1 }}>SYNCING…</div></>;

  const trackerProps = { user, liftProgress, saveLiftProgress, pplOffset, slidePPL, onSessionLogged, onMacrosChanged, awardXP };

  return (
    <>
      <style>{css}</style>
      <div className="shell">
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-t">LIFE<br />ARCHITECTURE</div>
            <div className="logo-s">v3 · SOVEREIGN HEALTH OS</div>
          </div>
          <div className="nav-s">TRACKER</div>
          {NAV.slice(0, 4).map(n => (
            <div key={n.id} className={"nav-i" + (page === n.id ? " active" : "")} onClick={() => setPage(n.id)}>
              <span style={{ fontSize: 13 }}>{n.icon}</span>{n.label}
            </div>
          ))}
          <div className="nav-s">SYSTEM</div>
          {NAV.slice(4).map(n => (
            <div key={n.id} className={"nav-i" + (page === n.id ? " active" : "")} onClick={() => setPage(n.id)}>
              <span style={{ fontSize: 13 }}>{n.icon}</span>{n.label}
            </div>
          ))}
          <div style={{ marginTop: "auto", padding: "16px 16px 0", borderTop: "1px solid var(--bd)" }}>
            <div style={{ fontSize: 10, color: "var(--fnt)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
            <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{ width: "100%", background: "transparent", border: "1px solid var(--bd)", borderRadius: 6, color: "var(--dim)", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, padding: "7px 0", cursor: "pointer", marginBottom: 6 }}>{theme === "dark" ? "◐ LIGHT MODE" : "◑ DARK MODE"}</button>
            <button onClick={() => user.uid === 'demo' ? (location.href = '/') : signOut(auth)} style={{ width: "100%", background: "transparent", border: "1px solid var(--bd)", borderRadius: 6, color: "var(--dim)", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, padding: "7px 0", cursor: "pointer" }}>SIGN OUT</button>
          </div>
        </aside>
        <main className="main">
          <div className="xp-card">
            <div>
              <div className="xp-lv">{level.name}</div>
              <div className="xp-n">{totalXP.toLocaleString()} XP total</div>
            </div>
            <div className="xp-w">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "#475569" }}>Level {level.index + 1}</span>
                <span style={{ fontSize: 10, color: "#3b82f6", fontFamily: "JetBrains Mono" }}>{progress}%</span>
              </div>
              <div className="xp-bg"><div className="xp-f" style={{ width: progress + "%" }} /></div>
            </div>
          </div>
          <div className="fi-anim" key={page}>
            {page === "train" && <Train {...trackerProps} />}
            {page === "fuel" && <Nutrition user={user} onMacrosChanged={onMacrosChanged} />}
            {page === "coach" && <Coach {...trackerProps} />}
            {page === "quests" && <Quests longQ={longQ} dailyQ={dailyQ} toggleLong={toggleLong} toggleDaily={toggleDaily} delLong={delLong} openAdd={cat => setModal({ mode: "add", category: cat })} openEdit={q => setModal({ mode: "edit", quest: q })} filter={filter} setFilter={setFilter} />}
            {page === "schedule" && <Schedule schedDay={schedDay} setSchedDay={setSchedDay} />}
            {page === "identity" && <PIdentity />}
            {page === "habits" && <PHabits />}
            {page === "outputs" && <POutputs longQ={longQ} />}
            {page === "review" && <PReview />}
            {page === "principles" && <PPrinciples />}
          </div>
        </main>
      </div>
      {modal && <QModal modal={modal} onSave={onLongSave} onClose={() => setModal(null)} />}
    </>
  );
}
