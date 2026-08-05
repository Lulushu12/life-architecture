/** Identity / Habits / Outputs / Review / Principles — copy updated onto v2. */
import { IDENTITY_ANCHORS, SHOW_UP_RULE } from "../system/constants.js";

export function PIdentity() {
  return (
    <>
      <div className="pg-title">Identity</div>
      <div className="pg-sub">Who you are becoming, not what you want to achieve</div>
      <div className="callout cg"><div className="ct"><strong>Core Belief: </strong>"You do not rise to the level of your goals. You fall to the level of your systems." — James Clear</div></div>
      <div className="card">
        <div className="card-t">Identity Anchors — Sovereign Health OS v2</div>
        {IDENTITY_ANCHORS.map(a => (
          <div key={a} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
            <span style={{ color: "#22c55e", fontFamily: "JetBrains Mono", fontSize: 11, marginTop: 3, flexShrink: 0 }}>◆</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--tx)" }}>{a}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-t">Four Pillars</div>
        {[["Surgeon", "Clinical excellence, continuous learning, evidence-based decisions"],
          ["Trader", "Systematic, data-driven, emotionally regulated — compounding edge over time"],
          ["Builder", "CAD patents complete; technical skill applied selectively and with purpose"],
          ["Partner", "Despina time 19:30–21:00 is a non-negotiable boundary. I am a present partner."]].map(([t, d]) => (
          <div key={t} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
            <span style={{ fontFamily: "Space Grotesk", fontSize: 12, letterSpacing: 2, color: "#3b82f6", width: 64, flexShrink: 0, paddingTop: 2 }}>{t}</span>
            <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{d}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-t">Identity Shift</div>
        <table className="tbl">
          <thead><tr><th>OLD (Reactive)</th><th>NEW (Intentional)</th></tr></thead>
          <tbody>
            {[["Inconsistent sleep, drifting bedtime", "Lights out 22:00–22:30 — non-negotiable"],
              ["Scrolling instead of doing", "Phone docked at 21:00; evenings protected"],
              ["Exercise when motivation strikes", "PPL Mon–Sat. The habit is walking through the gym door."],
              ["Guessing at food", "Every meal logged. A tracked bad day beats an untracked one."],
              ["Progression by feel", "Progression is gate-controlled by performance, not by a schedule"]].map(([o, n], i) => <tr key={i}><td className="old">{o}</td><td className="nw">{n}</td></tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function PHabits() {
  return (
    <>
      <div className="pg-title">Atomic Habits</div>
      <div className="pg-sub">The framework powering the entire system</div>
      <div className="card">
        <div className="card-t">The Four Laws</div>
        <table className="tbl">
          <thead><tr><th>LAW</th><th>CUE</th><th>BUILD</th><th>BREAK</th></tr></thead>
          <tbody>
            {[["1st", "Cue", "Obvious", "Invisible"], ["2nd", "Craving", "Attractive", "Unattractive"], ["3rd", "Response", "Easy", "Difficult"], ["4th", "Reward", "Satisfying", "Unsatisfying"]].map(([l, c, b, r]) => (
              <tr key={l}><td><span className="law-n">{l} Law</span></td><td style={{ color: "#94a3b8" }}>{c}</td><td><span className="bld">{b}</span></td><td><span className="brk">{r}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <div className="card-t">Habit Stacking — v2 anchors</div>
        <div className="callout cg" style={{ marginBottom: 12 }}><div className="ct"><em>"After I [CURRENT HABIT], I will [NEW HABIT]."</em></div></div>
        {["After I brush my teeth in the morning: creatine, 5g, water. Done before thinking.",
          "After I pack tomorrow's pre-workout meal: gym bag by the door (Tuesday night: car keys ON the bag).",
          "After I eat the pre-workout meal at work: I am already going to Titan Park — no decision needed.",
          "After dinner logging: check the remaining macro gap — that number decides the late-night snack.",
          "After the mat comes out at 21:45: VMO + mobility. The mat being out IS the trigger.",
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
            <span style={{ color: "#3b82f6", fontFamily: "JetBrains Mono", fontSize: 11, marginTop: 2, flexShrink: 0 }}>→</span>
            <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{s}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-t">The Show-Up Rule</div>
        <div className="tm"><span className="tm-l">RULE</span><span className="tm-t">{SHOW_UP_RULE}</span></div>
      </div>
      <div className="card">
        <div className="card-t">Environment Design</div>
        {["Gym bag pre-packed the night before — removes all morning decision fatigue",
          "Pre-workout meal packed with the bag — the FAT RULE is decided at 21:00, not at noon",
          "Tuesday night: car keys on top of the gym bag — Wednesday requires the car",
          "Phone dock in hallway by 21:00 — physical distance reduces the pull",
          "Yoga mat visible in the bedroom — bedtime mobility happens because it is already there",
          "Resistance band + 4–6mm mat live in the hospital bag — call days have no excuse path"].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
            <span style={{ color: "#f59e0b", fontSize: 11, marginTop: 2, flexShrink: 0 }}>◆</span>
            <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{s}</span>
          </div>
        ))}
      </div>
    </>
  );
}

const OUTPUTS = [
  { num: "01", qid: "l14", title: "Documented Trading System", done: "Written rules for entries, exits, position sizing, risk management, and review cadence", pri: "PRIMARY", pc: "#22c55e", pb: "rgba(34,197,94,0.12)" },
  { num: "02", qid: "l5",  title: "Lose 15kg by end of summer", done: "Hard deadline: end of September 2026. PPL 6x/week + 2,100 kcal flat, tracked in-app. Waist is the primary indicator.", pri: "PRIMARY", pc: "#22c55e", pb: "rgba(34,197,94,0.12)" },
  { num: "03", qid: "l8",  title: "Patent Approvals x2", done: "Both CAD patents approved — monitoring only, no new design work required", pri: "MEDICINE", pc: "#ef4444", pb: "rgba(239,68,68,0.12)" },
  { num: "04", qid: "l7",  title: "SRATS Conference Presentation", done: "Slide deck + speaker script finalized and rehearsed for submission deadline", pri: "MEDICINE", pc: "#ef4444", pb: "rgba(239,68,68,0.12)" },
];

export function POutputs({ longQ = [] }) {
  const completed = OUTPUTS.filter(o => longQ.find(q => q.id === o.qid)?.status === "Completed").length;
  return (
    <>
      <div className="pg-title">6-Month Outputs</div>
      <div className="pg-sub">Concrete evidence the system is working · {completed}/{OUTPUTS.length} complete · status syncs from the Quest Board</div>
      {OUTPUTS.map(o => {
        const isDone = longQ.find(q => q.id === o.qid)?.status === "Completed";
        return (
          <div className={"oc" + (isDone ? " done" : "")} key={o.num}>
            <div className="on">{isDone ? "✓" : o.num}</div>
            <div style={{ flex: 1 }}>
              <div className="ot" style={isDone ? { textDecoration: "line-through", color: "var(--dim)" } : {}}>{o.title}</div>
              <div className="od">{o.done}</div>
            </div>
            <div className="op" style={isDone
              ? { color: "#22c55e", background: "rgba(34,197,94,0.12)", border: "1px solid #22c55e" }
              : { color: o.pc, background: o.pb, border: "1px solid " + o.pc }}>{isDone ? "COMPLETE" : o.pri}</div>
          </div>
        );
      })}
    </>
  );
}

export function PReview() {
  return (
    <>
      <div className="pg-title">Review Cadence</div>
      <div className="pg-sub">The feedback loop that keeps the system calibrated</div>
      {[
        { title: "Daily Log — 5 minutes", items: ["Log every meal. A tracked bad day beats an untracked one.", "Training: log the session (or the miss — PPL slides, no doubling up)", "Did the non-negotiables hold? Creatine, VMO, Despina time, phone dock, mobility, lights out"] },
        { title: "Weekly Review — Sunday", items: ["Trading: review all trades against documented rules", "Quests: update XP, mark completed, activate next milestones", "Training: any overload-gate advances? Any pain flags? Sessions slid?", "Identity check: what evidence did I generate this week?", "Write 3 priorities for the coming 7 days"] },
        { title: "Bi-weekly — every 2nd Sunday morning", items: ["Waist measurement before eating, before drinking — log it", "4 weeks flat despite compliance → cut 25–38g carbs from the Meal 3 rice portion", "Performance degrading → intake too low: add one planned snack"] },
        { title: "Monthly Review — First Sunday", items: ["Six-month output progress: where are the four outputs tracking?", "Deload screen review: any 2+ co-occurring fatigue signals this month?", "Sleep check: is the wake / 22:00–22:30 lights-out window holding?", "Trading P&L review and system adjustments"] },
      ].map(s => (
        <div className="card" key={s.title}>
          <div className="card-t">{s.title}</div>
          {s.items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <span style={{ color: "#3b82f6", fontFamily: "JetBrains Mono", fontSize: 11, marginTop: 2, flexShrink: 0 }}>□</span>
              <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{item}</span>
            </div>
          ))}
        </div>
      ))}
      <div className="callout cn"><div className="ct"><strong>The Plateau of Latent Potential — </strong>Results lag behind habits. The system is working even when it does not feel like it. There is no restart. The system is continuous.</div></div>
    </>
  );
}

export function PPrinciples() {
  return (
    <>
      <div className="pg-title">Principles</div>
      <div className="pg-sub">The operating rules of the system</div>
      <div className="card">
        {[
          ["Never miss twice.", "Missing once is an accident. Missing twice is the start of a new bad habit. Two consecutive missed sessions → the third is mandatory: 10 minutes on the bike counts."],
          ["The habit is walking through the gym door.", "Not the workout. On every training day you go, regardless of energy, motivation, or mood. Wrong gym is not an excuse — Bucuresti Mall is 3 minutes away."],
          ["Progression is gate-controlled.", "Advance by the smallest increment only when 3×10 is clean and pain-free across two consecutive sessions. Shoulder discomfort is a hard stop — drop back, never to zero."],
          ["There is no making up. There is only the next meal.", "Skipped a meal? Protein bar + branza within 60 minutes, log it, move on. Never compensate with larger portions later."],
          ["A tracked bad day beats an untracked one.", "Ate untracked food? Estimate, enter it, continue. Do not restart tomorrow. There is no restart. The system is continuous."],
          ["Protect the evenings.", "Despina time 19:30–21:00, phone docked 21:00, mobility 21:45, lights out 22:00–22:30. I am a present partner. Sleep is the foundation of everything else."],
          ["Do not self-prescribe a deload.", "Two or more co-occurring fatigue signals is the trigger to discuss — weights regressing, soreness past 48h, sleep dropping, motivation gone for days."],
          ["Vote for your identity.", "Every action is a vote. Each logged session, each hit macro target, each protected evening is a cast vote for who you are becoming."],
        ].map(([t, d]) => (
          <div className="pr" key={t}>
            <div className="pt">{t}</div>
            <div className="pd">{d}</div>
          </div>
        ))}
      </div>
    </>
  );
}
