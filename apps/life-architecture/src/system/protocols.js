/**
 * Compliance protocols — Sovereign Health OS v2.
 * "No motivation. No pep talks. Just the recovery action."
 * These are injected into every coach call; the coach matches + adapts + CITES,
 * it never invents advice. Keep ids stable — they are the audit trail.
 */

export const PROTOCOLS = [
  {
    id: "skip_meal",
    trigger: "A scheduled meal was skipped.",
    action: "Eat a protein bar (ON Nutty) and 150g branza de vaci within 60 minutes of realizing. Log both. " +
            "Move on to the next scheduled meal. Do not make up missed calories with a larger portion later. " +
            "There is no making up. There is only the next meal.",
    routing: null,
  },
  {
    id: "miss_gym",
    trigger: "A scheduled training session was missed.",
    action: "Go the next day. Do not double up. Slide the PPL rotation forward by one day. " +
            "Two consecutive missed days → the third is MANDATORY: walk in, do 10 minutes on the bike, or the full session. Either counts.",
    routing: null,
  },
  {
    id: "sleep_drift",
    trigger: "Sleep drifted past 23:00.",
    action: "Next night is a forced 22:00 lights-out. No joker slot that day — joker time becomes pre-sleep wind-down. " +
            "One bad night is noise. Two consecutive bad nights is a pattern.",
    routing: null,
  },
  {
    id: "untracked_food",
    trigger: "Food was eaten without being tracked.",
    action: "Open the log, estimate, enter it. A tracked bad day is infinitely more useful than an untracked one. " +
            "Do not restart tomorrow. There is no restart. The system is continuous.",
    routing: null,
  },
  {
    id: "skip_vmo",
    trigger: "VMO exercises were skipped.",
    action: "Do them before bed. Already in bed and remembered? Get up. Five minutes. Non-negotiable.",
    routing: null,
  },
  {
    id: "wednesday_collapse",
    trigger: "Wednesday Titan Park leg slot is at risk (left Pallady late or emergency).",
    action: "Recovery routing depends on the time you left Pallady.",
    routing: [
      { if: "left Pallady after 13:20 but before 14:00", then: "Skip Titan Park. Drive toward Sun Plaza, stop at Sudului for a 30-min time-capped session." },
      { if: "genuine emergency past 14:00",              then: "Force-skip. Do not train after 20:00. Mark it. Slide PPL. Move on. Despina time starts ~20:30 on arrival home — still non-negotiable." },
    ],
  },
  {
    id: "surprise_consult",
    trigger: "An unexpected Mon/Tue afternoon consult appeared.",
    action: "Routing depends on training state and consult time.",
    routing: [
      { if: "not yet trained, consult before 16:00", then: "Sun Plaza consult first, then Sudului (next door), then home." },
      { if: "not yet trained, consult after 16:00",  then: "Titan Park first (default route), consult after." },
      { if: "already trained",                        then: "Just go to Sun Plaza." },
      { if: "already home, missed gym",               then: "Walk to Bucuresti Mall. 3 minutes. Full session or 10-min bike. Either counts." },
    ],
  },
  {
    id: "call_day",
    trigger: "It is a hospital call day.",
    action: "Pack all meals the night before (4–5 containers, full-day macros, cold-friendly). Train at the hospital " +
            "with the circuit + resistance bands. No bands available → rest day, PPL slides. " +
            "Do not leave the hospital for a gym session during a call shift.",
    routing: null,
  },
  {
    id: "deload_suspicion",
    trigger: "Fatigue suggests a deload might be needed.",
    action: "Do NOT self-prescribe. Flag for discussion when 2+ of these co-occur: weights regressing across 2 consecutive " +
            "sessions on the same lift · soreness not clearing in 48h · sleep quality dropping · motivation gone 3–4 consecutive days.",
    routing: null,
  },
  {
    id: "waist_flat",
    trigger: "Waist measurement flat across two consecutive bi-weekly measurements (4 weeks) despite compliance.",
    action: "Reduce carbs by 25–38g from the rice portion in Meal 3 (pre-workout).",
    routing: null,
  },
  {
    id: "performance_degrading",
    trigger: "Training performance degrading — weights stalling, persistent fatigue.",
    action: "Intake too low. Add one planned snack from the pre-approved list.",
    routing: null,
  },
];
