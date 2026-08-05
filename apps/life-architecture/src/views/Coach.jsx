import { useState } from "react";
import { parseLog, askCoach, deloadCheck, explainCoachError, coachConfigured, CONFIDENCE_FLOOR } from "../coach/client.js";
import { plannedSession, todayKey, WEEKDAYS } from "../system/constants.js";
import { recentWorkoutLogs, getMealLog, macroTotals, saveWorkoutLog, getWorkoutLog, saveMealLog, saveBodyMetric, recentBodyMetrics } from "../data/logs.js";
import { evaluateSession } from "../data/overloadGate.js";
import { uid } from "../system/constants.js";

const weekdayOf = (d = new Date()) => WEEKDAYS[(d.getDay() + 6) % 7];

export default function Coach({ user, liftProgress, saveLiftProgress, pplOffset, onSessionLogged, onMacrosChanged, awardXP }) {
  const today = todayKey();
  const [logText, setLogText] = useState("");
  const [situation, setSituation] = useState("");
  const [proposal, setProposal] = useState(null);   // parseLog result awaiting confirm
  const [directive, setDirective] = useState(null); // coach result
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null);

  const baseCtx = async () => {
    const [recent, meals] = await Promise.all([recentWorkoutLogs(user.uid, 10), getMealLog(user.uid, today)]);
    return {
      date: today, weekday: weekdayOf(), plannedSession: plannedSession(new Date(), pplOffset),
      todayMacros: macroTotals(meals),
      liftWeights: Object.fromEntries(Object.entries(liftProgress).map(([k, v]) => [k, v.currentWeightKg])),
      recentWorkouts: recent.map(w => ({
        date: w.date, session: w.session, missed: !!w.missed, minimum: !!w.minimum, notes: w.notes || "",
        tops: (w.exercises || []).map(e => ({ id: e.id, top: Math.max(0, ...(e.sets || []).map(s => s.weightKg || 0)), pain: (e.sets || []).some(s => s.painFree === false) })),
      })),
    };
  };

  const run = (kind) => async () => {
    setError(null); setSaved(null); setBusy(kind);
    try {
      const ctx = await baseCtx();
      if (kind === "parse") {
        if (!logText.trim()) return;
        setProposal(await parseLog(logText.trim(), ctx));
      } else if (kind === "ask") {
        if (!situation.trim()) return;
        setDirective(await askCoach(situation.trim(), ctx));
      } else if (kind === "deload") {
        const metrics = await recentBodyMetrics(user.uid);
        setDirective(await deloadCheck({ ...ctx, bodyMetrics: metrics }));
      }
    } catch (e) {
      setError(explainCoachError(e));
    } finally {
      setBusy(null);
    }
  };

  /** User confirmed the parse proposal — NOW the client writes. */
  const confirmProposal = async () => {
    const p = proposal;
    setProposal(null); setLogText("");
    if (p.kind === "workout" && p.workout) {
      const exId = (e) => e.id || e.name.toLowerCase().replace(/[^a-z]+/g, "_");
      const logged = p.workout.exercises.map(e => ({ id: exId(e), name: e.name, sets: e.sets }));
      const existing = await getWorkoutLog(user.uid, today);
      const log = {
        ...(existing && !existing.missed ? existing : {}), date: today,
        session: p.workout.session, gym: existing?.gym || "titan", missed: false,
        exercises: [...(existing && !existing.missed ? existing.exercises || [] : []), ...logged],
        cardioMin: p.workout.cardioMin || existing?.cardioMin || 0,
        notes: [existing?.notes, p.workout.notes].filter(Boolean).join(" · "),
      };
      const ev = evaluateSession(liftProgress, logged, today);
      await saveLiftProgress(ev.progress);
      if (ev.advances > 0) awardXP(ev.advances * 50);
      log.gate = ev.results.map(r => ({ exId: r.exId, action: r.action }));
      await saveWorkoutLog(user.uid, log);
      onSessionLogged();
      setSaved({ kind: "workout", gate: ev.results, flags: p.flags || [] });
    } else if (p.kind === "meal" && p.meal) {
      const entries = await getMealLog(user.uid, today);
      const next = [...entries, { id: uid(), slot: p.meal.slot, description: p.meal.description, kcal: p.meal.kcal, protein: p.meal.protein, fat: p.meal.fat, carbs: p.meal.carbs }];
      await saveMealLog(user.uid, today, next);
      onMacrosChanged(macroTotals(next));
      setSaved({ kind: "meal", flags: p.flags || [] });
    } else if (p.kind === "metric" && p.metric) {
      await saveBodyMetric(user.uid, today, p.metric);
      setSaved({ kind: "metric", flags: p.flags || [] });
    }
  };

  return (
    <>
      <div className="pg-title">Coach</div>
      <div className="pg-sub">Action only — no motivation, no pep talks. The coach proposes; you confirm; the app writes.</div>

      {!coachConfigured() && (
        <div className="callout cn"><div className="ct">
          <strong>Coach is off.</strong> Connect any OpenAI-compatible model — a free local one via Ollama works well — under
          {" "}<b>Data &amp; sync → AI Coach</b>. The rest of the tracker doesn't need it.
        </div></div>
      )}
      {error && <div className="callout cr"><div className="ct">{error}</div></div>}

      <div className="card">
        <div className="card-t">Log in plain language</div>
        <textarea className="fta" placeholder={'e.g. "bench 3x10 at 42.5 clean, laterals tweaked my shoulder on set 2, 40 min bike" or "dinner: sirloin 250g with rice and salad"'} value={logText} onChange={e => setLogText(e.target.value)} />
        <div className="mf" style={{ justifyContent: "flex-start" }}>
          <button className="bp" onClick={run("parse")} disabled={busy === "parse" || !logText.trim()}>{busy === "parse" ? "Parsing…" : "Parse log"}</button>
        </div>
      </div>

      {proposal && (
        <div className="coach-card" style={{ borderColor: "#3b82f6" }}>
          <div className="coach-pid">PROPOSAL · kind={proposal.kind} · confidence {(proposal.confidence * 100 | 0)}%{(proposal.flags || []).map(f => ` · ⚑${f}`)}</div>
          {proposal.kind === "unclear" || proposal.confidence < CONFIDENCE_FLOOR ? (
            <div className="coach-act">Could not parse confidently. Rephrase with exercise, sets × reps, weight — or log manually in Train/Fuel.</div>
          ) : (
            <>
              <pre style={{ fontSize: 11, color: "#94a3b8", fontFamily: "JetBrains Mono", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {proposal.kind === "workout" && proposal.workout && proposal.workout.exercises.map(e =>
                  `${e.name}: ${e.sets.map(s => `${s.reps}×${s.weightKg}kg${s.clean === false ? " ✗clean" : ""}${s.painFree === false ? " ⚠PAIN" : ""}`).join(", ")}`).join("\n")}
                {proposal.kind === "meal" && proposal.meal && `${proposal.meal.slot}: ${proposal.meal.description}\n${proposal.meal.kcal} kcal · ${proposal.meal.protein}P / ${proposal.meal.fat}F / ${proposal.meal.carbs}C (estimate)`}
                {proposal.kind === "metric" && proposal.metric && `waist ${proposal.metric.waistCm ?? "—"} cm · weight ${proposal.metric.weightKg ?? "—"} kg`}
              </pre>
              {(proposal.flags || []).includes("shoulder_hardstop") &&
                <div className="callout cr" style={{ margin: "8px 0" }}><div className="ct"><strong>Shoulder hard stop flagged.</strong> The gate will drop this lift back — not to zero.</div></div>}
              <div className="mf" style={{ justifyContent: "flex-start" }}>
                <button className="bp green" onClick={confirmProposal}>Confirm & save</button>
                <button className="bs" onClick={() => setProposal(null)}>Discard</button>
              </div>
            </>
          )}
        </div>
      )}

      {saved && (
        <div className="callout cgr"><div className="ct">
          <strong>Saved.</strong>{" "}
          {saved.kind === "workout" && <>Gate: {saved.gate.map(g => `${g.exId} ${g.action}`).join(" · ")}. Training quest auto-completed.</>}
          {saved.kind === "meal" && "Macro totals updated."}
          {saved.kind === "metric" && "Measurement logged."}
        </div></div>
      )}

      <div className="card">
        <div className="card-t">Situation → protocol</div>
        <textarea className="fta" placeholder={'e.g. "left Pallady at 13:40, no training yet" or "I skipped lunch and just realized" or "what closes my macro gap tonight?"'} value={situation} onChange={e => setSituation(e.target.value)} />
        <div className="mf" style={{ justifyContent: "flex-start" }}>
          <button className="bp" onClick={run("ask")} disabled={busy === "ask" || !situation.trim()}>{busy === "ask" ? "Consulting…" : "Get the action"}</button>
          <button className="bs" onClick={run("deload")} disabled={busy === "deload"}>{busy === "deload" ? "Screening…" : "Run deload screen"}</button>
        </div>
      </div>

      {directive && <Directive d={directive} onClose={() => setDirective(null)} />}
    </>
  );
}

function Directive({ d, onClose }) {
  const border = { directive: "#f59e0b", deload_signal: "#ef4444", macro_fill: "#22c55e", review_trigger: "#06b6d4", none: "#334155" }[d.type] || "#334155";
  return (
    <div className="coach-card" style={{ borderColor: border }}>
      <div className="coach-pid">{d.type.toUpperCase()}{d.protocol_id ? ` · per protocol: ${d.protocol_id}` : ""}</div>
      <div className="coach-act">
        {d.type === "none" ? "No protocol applies. Nothing to do." : d.action}
        {d.macro_fill && <div style={{ marginTop: 8, fontFamily: "JetBrains Mono", fontSize: 12, color: "#4ade80" }}>→ {d.macro_fill.item} (closes {d.macro_fill.closes})</div>}
        {d.signals?.length > 0 && <div style={{ marginTop: 8, fontSize: 11, color: "#f87171" }}>Signals: {d.signals.join(" · ")} — flag for discussion. Do not self-prescribe.</div>}
      </div>
      <div className="mf" style={{ justifyContent: "flex-start" }}><button className="bs" onClick={onClose}>Dismiss</button></div>
    </div>
  );
}
