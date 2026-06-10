import { useState, useEffect } from "react";
import { plannedSession, todayKey, WEEKDAYS, GYMS, SHOW_UP_RULE, OVERLOAD_RULE } from "../system/constants.js";
import { exercisesFor, WARMUPS, CARDIO, CALL_DAY_CIRCUIT, SETS, REPS, SHOULDER_CONSTRAINT } from "../system/exercises.js";
import { evaluateSession, defaultProgress } from "../data/overloadGate.js";
import { saveWorkoutLog, getWorkoutLog } from "../data/logs.js";
import { PROTOCOLS as COMPLIANCE } from "../system/protocols.js";

const weekdayOf = (d = new Date()) => WEEKDAYS[(d.getDay() + 6) % 7];

export default function Train({ user, liftProgress, saveLiftProgress, pplOffset, slidePPL, onSessionLogged, awardXP }) {
  const today = todayKey();
  const weekday = weekdayOf();
  const planned = plannedSession(new Date(), pplOffset);
  const [session, setSession] = useState(planned === "REST" ? "Push" : planned);
  const [gym, setGym] = useState("titan");
  const [mode, setMode] = useState("session"); // session | callday | minimum
  const [entries, setEntries] = useState({});
  const [cardioMin, setCardioMin] = useState("");
  const [notes, setNotes] = useState("");
  const [gateResults, setGateResults] = useState(null);
  const [todayLog, setTodayLog] = useState(null);

  useEffect(() => { getWorkoutLog(user.uid, today).then(setTodayLog); }, [user.uid, today]);

  const exercises = exercisesFor(session, weekday);

  const setField = (exId, setIdx, field, val) => {
    setEntries(prev => {
      const ex = prev[exId] || { sets: Array.from({ length: SETS }, () => null) };
      const sets = [...ex.sets];
      const cur = sets[setIdx] || { reps: REPS, weightKg: currentWeight(exId), clean: true, painFree: true, done: false };
      sets[setIdx] = { ...cur, [field]: val };
      return { ...prev, [exId]: { ...ex, sets } };
    });
  };
  const currentWeight = (exId) => (liftProgress[exId] || defaultProgress(exId)).currentWeightKg;

  const markSetDone = (exId, setIdx) => {
    const cur = (entries[exId]?.sets || [])[setIdx];
    if (cur?.done) setField(exId, setIdx, "done", false);
    else {
      setEntries(prev => {
        const ex = prev[exId] || { sets: Array.from({ length: SETS }, () => null) };
        const sets = [...ex.sets];
        sets[setIdx] = { reps: REPS, weightKg: currentWeight(exId), clean: true, painFree: true, ...(sets[setIdx] || {}), done: true };
        return { ...prev, [exId]: { ...ex, sets } };
      });
    }
  };

  const save = async () => {
    const logged = exercises
      .map(ex => {
        const sets = (entries[ex.id]?.sets || []).filter(s => s && s.done);
        return sets.length ? { id: ex.id, name: ex.name, sets: sets.map(({ done, ...s }) => ({ ...s, reps: +s.reps || 0, weightKg: +s.weightKg || 0 })) } : null;
      })
      .filter(Boolean);
    if (!logged.length && mode === "session") return;

    const log = {
      date: today, session: mode === "callday" ? "CallDay" : session, gym, missed: false, slidPPL: false,
      minimum: mode === "minimum",
      exercises: mode === "session" ? logged : [],
      circuit: mode === "callday",
      cardioMin: +cardioMin || 0, notes,
    };

    let results = null;
    if (mode === "session") {
      const ev = evaluateSession(liftProgress, logged, today);
      await saveLiftProgress(ev.progress);
      results = ev.results;
      setGateResults(ev);
      if (ev.advances > 0) awardXP(ev.advances * 50);
      log.gate = ev.results.map(r => ({ exId: r.exId, action: r.action }));
    }
    await saveWorkoutLog(user.uid, log);
    setTodayLog(log);
    onSessionLogged(); // auto-completes hf_gym
    if (mode !== "session") setGateResults(results ? { results } : { results: [] });
  };

  const logMissed = async () => {
    const log = { date: today, session, gym: null, missed: true, slidPPL: true, exercises: [], cardioMin: 0, notes: "Missed — PPL slides forward." };
    await saveWorkoutLog(user.uid, log);
    setTodayLog(log);
    await slidePPL();
  };

  if (todayLog && !gateResults) {
    return (
      <>
        <Header planned={planned} weekday={weekday} />
        <div className={"callout " + (todayLog.missed ? "cr" : "cgr")}>
          <div className="ct">
            {todayLog.missed
              ? <><strong>Missed session logged.</strong> {COMPLIANCE.find(p => p.id === "miss_gym").action}</>
              : <><strong>{todayLog.session} logged for today{todayLog.minimum ? " (show-up minimum)" : ""}.</strong> {todayLog.exercises?.length || 0} lifts · {todayLog.cardioMin || 0} min cardio. Training quest auto-completed.</>}
          </div>
        </div>
        {(todayLog.gate || []).length > 0 && <GateSummary results={todayLog.gate.map(g => ({ ...g, name: g.exId, reason: "" }))} terse />}
        <button className="bs" onClick={() => setTodayLog(null)}>Log again / edit</button>
      </>
    );
  }

  return (
    <>
      <Header planned={planned} weekday={weekday} />
      {gateResults && (
        <div className="card">
          <div className="card-t">Overload gate — session result</div>
          <GateSummary results={gateResults.results} />
          {gateResults.advances > 0 && <div className="callout cgr" style={{ marginTop: 10 }}><div className="ct"><strong>+{gateResults.advances * 50} XP</strong> — {gateResults.advances} lift{gateResults.advances > 1 ? "s" : ""} advanced.</div></div>}
          <button className="bs" onClick={() => setGateResults(null)} style={{ marginTop: 6 }}>Done</button>
        </div>
      )}
      {!gateResults && <>
        <div className="frow">
          {["Push", "Pull", "Legs"].map(s => <div key={s} className={"chip" + (session === s && mode === "session" ? " active" : "")} onClick={() => { setSession(s); setMode("session"); }}>{s}{planned === s ? " (planned)" : ""}</div>)}
          <div className={"chip" + (mode === "callday" ? " active" : "")} onClick={() => setMode("callday")}>Call-day circuit</div>
          <div className={"chip" + (mode === "minimum" ? " active" : "")} onClick={() => setMode("minimum")}>Show-up minimum</div>
          <div style={{ marginLeft: "auto" }}>
            <select className="fsel" style={{ width: "auto", fontSize: 11 }} value={gym} onChange={e => setGym(e.target.value)}>
              {GYMS.filter(g => g.id !== "hospital" || mode === "callday").map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>

        {mode === "session" && <>
          {weekday === "Wednesday" && session === "Legs" &&
            <div className="callout cr"><div className="ct"><strong>TIME CAP:</strong> end by 14:00, leave by 14:15. Rest 60–75s max. Back extension dropped → Saturday. No cardio.</div></div>}
          <div className="card">
            <div className="card-t">Warm-up</div>
            {WARMUPS[session].map((w, i) => <div key={i} style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>· {w}</div>)}
          </div>
          {session === "Push" && <div className="callout cg"><div className="ct"><strong>Shoulder constraint — </strong>{SHOULDER_CONSTRAINT}</div></div>}
          {exercises.map(ex => {
            const w = currentWeight(ex.id);
            const p = liftProgress[ex.id];
            return (
              <div className="ex-card" key={ex.id}>
                <div className="ex-hd">
                  <span className="ex-nm">{ex.name}</span>
                  <span className="ex-wt">{ex.incrementKg == null ? "BW" : `${w}kg`}{p?.cleanStreak === 1 && ex.incrementKg != null ? " · clean 1/2 → advance next" : ""}</span>
                  {ex.note && <span className="ex-nt">{ex.note}</span>}
                </div>
                {Array.from({ length: SETS }, (_, i) => {
                  const s = entries[ex.id]?.sets?.[i];
                  return (
                    <div className="set-row" key={i}>
                      <span className="set-n">SET {i + 1}</span>
                      <button className={"tgl" + (s?.done ? " on" : "")} onClick={() => markSetDone(ex.id, i)}>{s?.done ? "✓ DONE" : "MARK"}</button>
                      <input className="fi sm" type="number" placeholder={String(REPS)} value={s?.reps ?? ""} onChange={e => setField(ex.id, i, "reps", e.target.value)} title="reps" />
                      <input className="fi sm" type="number" step="0.5" placeholder={ex.incrementKg == null ? "BW" : String(w)} value={s?.weightKg ?? ""} onChange={e => setField(ex.id, i, "weightKg", e.target.value)} title="kg" />
                      <button className={"tgl" + (s ? (s.clean !== false ? " on" : " bad") : "")} onClick={() => s?.done && setField(ex.id, i, "clean", !(s.clean !== false))}>CLEAN</button>
                      <button className={"tgl" + (s ? (s.painFree !== false ? " on" : " bad") : "")} onClick={() => s?.done && setField(ex.id, i, "painFree", !(s.painFree !== false))}>PAIN-FREE</button>
                    </div>
                  );
                })}
              </div>
            );
          })}
          <div className="card">
            <div className="card-t">Cardio — {weekday === "Wednesday" ? CARDIO.Wednesday : CARDIO[session]}</div>
            <input className="fi" style={{ maxWidth: 180 }} type="number" placeholder="minutes" value={cardioMin} onChange={e => setCardioMin(e.target.value)} disabled={weekday === "Wednesday" && session === "Legs"} />
          </div>
        </>}

        {mode === "callday" && (
          <div className="card">
            <div className="card-t">Call-day circuit — 3–5 rounds, band for pull</div>
            {CALL_DAY_CIRCUIT.map(c => <div key={c.name} style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>· {c.name} × {c.reps}{c.note ? ` — ${c.note}` : ""}</div>)}
            <div className="callout cg" style={{ marginTop: 10 }}><div className="ct">PPL slides forward by one day. Do not leave the hospital for a gym session.</div></div>
          </div>
        )}

        {mode === "minimum" && (
          <div className="callout cgr"><div className="ct"><strong>The Show-Up Rule — </strong>{SHOW_UP_RULE}</div></div>
        )}

        <div className="fg"><input className="fi" placeholder="Notes (soreness, sleep, anything for the deload screen)" value={notes} onChange={e => setNotes(e.target.value)} /></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="bp green" onClick={save}>{mode === "minimum" ? "Log show-up (10-min bike)" : mode === "callday" ? "Log circuit" : `Save ${session} session`}</button>
          <button className="bp amber" onClick={logMissed}>Missed session → slide PPL</button>
        </div>
        <div className="callout cn" style={{ marginTop: 16 }}><div className="ct"><strong>Overload rule — </strong>{OVERLOAD_RULE}</div></div>
      </>}
    </>
  );
}

function Header({ planned, weekday }) {
  return (
    <>
      <div className="pg-title">TRAIN</div>
      <div className="pg-sub">{weekday} · planned: <b style={{ color: planned === "REST" ? "#94a3b8" : "#f59e0b" }}>{planned}</b>{planned === "REST" ? " — no gym today. VMO + mobility still non-negotiable." : " @ Titan Park"}</div>
    </>
  );
}

function GateSummary({ results, terse }) {
  return results.map(r => (
    <div className={"gate " + r.action} key={r.exId}>
      <b>{r.name || r.exId}</b> — {r.action.toUpperCase().replace("_", " ")}{!terse && r.reason ? ` · ${r.reason}` : ""}
    </div>
  ));
}
