/**
 * Seven-day schedule — Sovereign Health OS v2 (replaces the v8 swim/Gym-A-B SCHEDULE).
 * Blocks reuse the v8 renderer shape: { time, type, label, detail, twoMin }.
 */

const EVENING = (wednesday = false) => [
  { time: wednesday ? "~20:30-21:00" : "19:30-21:00", type: "sacred",   label: "Despina time", detail: "Phone down, no screens, no work. I am a present partner." + (wednesday ? " Starts ~20:30 on arrival home — still non-negotiable." : ""), twoMin: null },
  { time: "21:00",       type: "wildcard", label: "Phone docked",        detail: "Physical distance. No screens after this point.", twoMin: null },
  { time: "21:45",       type: "mobility", label: "VMO + bedtime mobility", detail: "VMO every single day including Sunday. The mat being out is the trigger.", twoMin: "1 set of 10 deep VMO squats. Get up if you're already in bed." },
  { time: "22:00-22:30", type: "sleep",    label: "Lights out",          detail: "Non-negotiable sleep window.", twoMin: null },
];

const BREAKFAST = (time = "~06:30") =>
  ({ time, type: "meal", label: "Breakfast at home", detail: "Cooked same day. Any of the 4 options — swap freely. Creatine 5g with water right after brushing teeth.", twoMin: null });

export const SCHEDULE_V2 = {
  Monday: {
    type: "Clinic Day — Pallady", subtitle: "Subway · PUSH @ Titan Park · Wake 05:00",
    blocks: [
      { time: "05:00", type: "wildcard", label: "Wake", detail: "Creatine 5g immediately after brushing teeth.", twoMin: null },
      BREAKFAST(),
      { time: "~11:30-12:00", type: "meal", label: "Pre-workout (packed)", detail: "Eat at Pallady BEFORE leaving. Low-fat rule applies. Do not leave the workplace without eating this.", twoMin: null },
      { time: "after clinic", type: "gym_push", label: "PUSH — Titan Park", detail: "19 min subway from Pallady. Bench, incline DB, pec deck, lateral raises, tricep press, pushdown. Cardio 30–60 min after.", twoMin: "Show-up rule: 10 min on the bike still counts." },
      { time: "~15:00-15:30", type: "meal", label: "Dinner (adjustment valve)", detail: "Cook with Despina. The remaining macro gap is the dinner target.", twoMin: null },
      { time: "~16:00-17:30", type: "joker", label: "Joker slot (choose ONE)", detail: "Trading session · FemGuide/patent work · Life admin.", twoMin: null },
      ...EVENING(),
    ],
    routing: "Consult before 16:00, not trained: Pallady → Sun Plaza consult → Sudului → home. Consult after 16:00: Pallady → Titan Park → home → consult. Already home, missed gym: Bucuresti Mall, 3 min.",
  },
  Tuesday: {
    type: "Clinic Day — Pallady", subtitle: "Subway · PULL @ Titan Park · Wake 05:00",
    blocks: [
      { time: "05:00", type: "wildcard", label: "Wake", detail: "Creatine 5g immediately after brushing teeth.", twoMin: null },
      BREAKFAST(),
      { time: "~11:30-12:00", type: "meal", label: "Pre-workout (packed)", detail: "Eat at Pallady before leaving. Low-fat rule.", twoMin: null },
      { time: "after clinic", type: "gym_pull", label: "PULL — Titan Park", detail: "Lat pulldown, low row, neutral grip, rear delt fly (rehab — do not skip), curls. Cardio 30–60 min.", twoMin: "10 min bike. Counts." },
      { time: "~15:00-15:30", type: "meal", label: "Dinner", detail: "Cook with Despina. Fill the gap.", twoMin: null },
      { time: "~16:00-17:30", type: "joker", label: "Joker slot (choose ONE)", detail: "German (Duolingo + Anki + grammar) · Research reading · Trading journal.", twoMin: null },
      { time: "after dinner", type: "task", label: "CAR KEYS ON GYM BAG", detail: "Wednesday requires the car. Do it now, not in the morning.", twoMin: null },
      ...EVENING(),
    ],
    routing: "Same routing logic as Monday.",
  },
  Wednesday: {
    type: "Full Consulting Day — Pallady + Sun Plaza", subtitle: "CAR · LEGS @ Titan Park (TIME-CAPPED) · Wake 05:30",
    blocks: [
      { time: "05:30-06:30", type: "joker", label: "Joker slot (low-decision only)", detail: "Trading journal review (no live trades) · Reading · German audio/Anki.", twoMin: null },
      BREAKFAST(),
      { time: "~11:30-12:00", type: "meal", label: "Pre-workout — MANDATORY LOW FAT", detail: "Options 1, 2 or 4 only (no ON bar + branza). Eat at Pallady before leaving.", twoMin: null },
      { time: "by 14:00", type: "gym_legs", label: "LEGS — Titan Park (TIME CAP)", detail: "SESSION MUST END BY 14:00. Shower 10–12 min, leave by 14:15. Rest 60–75s max. Back extension DROPPED → carries to Saturday. No cardio.", twoMin: "Left Pallady 13:20–14:00 → Sudului 30-min capped session instead." },
      { time: "~14:30", type: "meal", label: "Recovery container — NON-OPTIONAL", detail: "In car or at Sun Plaza entrance. Recovery bridge across the 6-hour gap to dinner.", twoMin: null },
      { time: "~20:45", type: "meal", label: "Dinner (lighter)", detail: "No heavy fat-laden meals this late. Check the remaining gap.", twoMin: null },
      ...EVENING(true),
    ],
    routing: "Left Pallady after 13:20 but before 14:00: skip Titan Park → Sudului 30-min. Genuine emergency past 14:00: force-skip, never train after 20:00, slide PPL, move on.",
  },
  Thursday: {
    type: "OR Day — Foisor", subtitle: "CAR · PUSH @ Titan Park · Wake 05:00 · Gym bag in car from morning",
    blocks: [
      { time: "05:00", type: "wildcard", label: "Wake", detail: "Creatine. Gym bag in the car.", twoMin: null },
      BREAKFAST(),
      { time: "~12:00-12:30", type: "meal", label: "Pre-workout (packed)", detail: "Eat at Foisor during break.", twoMin: null },
      { time: "after OR", type: "gym_push", label: "PUSH — Titan Park", detail: "~14 min drive from Foisor. Cardio 30–60 min.", twoMin: "10 min bike. Counts." },
      { time: "~16:00-16:30", type: "meal", label: "Dinner", detail: "Cook with Despina. Fill the gap.", twoMin: null },
      { time: "~17:00-18:30", type: "joker", label: "Joker slot (choose ONE)", detail: "FemGuide/patent · Trading system review · Research/case prep.", twoMin: null },
      ...EVENING(),
    ],
    routing: null,
  },
  Friday: {
    type: "OR Day — Foisor", subtitle: "CAR · PULL @ Titan Park · Wake 05:00",
    blocks: [
      { time: "05:00", type: "wildcard", label: "Wake", detail: "Creatine. Gym bag in the car.", twoMin: null },
      BREAKFAST(),
      { time: "~12:00-12:30", type: "meal", label: "Pre-workout (packed)", detail: "Eat at Foisor during break.", twoMin: null },
      { time: "after OR", type: "gym_pull", label: "PULL — Titan Park", detail: "~14 min drive. Rear delt fly is rehab — full ROM, controlled. Cardio 30–60 min.", twoMin: "10 min bike. Counts." },
      { time: "~16:00-16:30", type: "meal", label: "Dinner", detail: "Cook with Despina.", twoMin: null },
      { time: "~17:00-18:30", type: "joker", label: "Joker slot (choose ONE)", detail: "German structured study · Creative hobby (chess, puzzle, reading) · Errands.", twoMin: null },
      ...EVENING(),
    ],
    routing: null,
  },
  Saturday: {
    type: "Free Day", subtitle: "CAR · LEGS (full, no time cap) @ Titan Park · Wake 06:30",
    blocks: [
      { time: "06:30", type: "wildcard", label: "Wake", detail: "Creatine.", twoMin: null },
      { time: "~07:00", type: "meal", label: "Breakfast as pre-workout", detail: "Any of the 4 options at home.", twoMin: null },
      { time: "~09:00-10:00", type: "joker", label: "Joker slot (choose ONE)", detail: "Trading deep work / weekly journaling · FemGuide sprint · Personal/social/admin.", twoMin: null },
      { time: "morning", type: "gym_legs", label: "LEGS — Titan Park (FULL)", detail: "No time pressure. Full protocol INCLUDING back extension (carried from Wednesday). Cardio 20–30 min.", twoMin: "10 min bike. Counts." },
      { time: "~12:30-13:00", type: "meal", label: "Post-workout lunch", detail: "Most relaxed eating window of the week. Full cooked meal.", twoMin: null },
      { time: "evening", type: "meal", label: "Dinner with Despina", detail: "Best ribeye day — the whole day to balance the fat budget.", twoMin: null },
      ...EVENING(),
    ],
    routing: null,
  },
  Sunday: {
    type: "Recovery Day", subtitle: "No gym. VMO + mobility still non-negotiable. Wake 06:30 or natural.",
    blocks: [
      { time: "morning", type: "metric", label: "Waist measurement (every 2nd Sunday)", detail: "First thing, before eating or drinking. Soft tape, narrowest point between ribs and hips. Log it.", twoMin: null },
      { time: "all day", type: "meal", label: "Meals — no structure", detail: "Eat when hungry. Keep the log open and hit the macro targets. Cook whatever you want.", twoMin: null },
      { time: "flex", type: "joker", label: "Joker slot (extended 2–3h)", detail: "Deep work · Social time with Despina · Chess, reading, puzzle, German — anything.", twoMin: null },
      ...EVENING(),
    ],
    routing: null,
  },
};

export const BLOCK_META_V2 = {
  meal:      { color: "#22c55e", bg: "rgba(34,197,94,0.08)",   label: "FUEL" },
  gym_push:  { color: "#f59e0b", bg: "rgba(245,158,11,0.10)",  label: "PUSH" },
  gym_pull:  { color: "#f59e0b", bg: "rgba(245,158,11,0.10)",  label: "PULL" },
  gym_legs:  { color: "#f59e0b", bg: "rgba(245,158,11,0.10)",  label: "LEGS" },
  joker:     { color: "#3b82f6", bg: "rgba(59,130,246,0.10)",  label: "JOKER" },
  sacred:    { color: "#fbbf24", bg: "rgba(251,191,36,0.10)",  label: "PROTECTED" },
  mobility:  { color: "#a855f7", bg: "rgba(168,85,247,0.08)",  label: "VMO+MOBILITY" },
  sleep:     { color: "#1d4ed8", bg: "rgba(29,78,216,0.10)",   label: "SLEEP" },
  metric:    { color: "#06b6d4", bg: "rgba(6,182,212,0.08)",   label: "MEASURE" },
  task:      { color: "#ef4444", bg: "rgba(239,68,68,0.08)",   label: "TASK" },
  wildcard:  { color: "#334155", bg: "rgba(51,65,85,0.06)",    label: "FREE" },
};
