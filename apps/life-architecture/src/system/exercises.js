/**
 * Exercise protocols — Sovereign Health OS v2.
 * startWeightKg = doc's starting weight (lower bound where a range is given).
 * incrementKg   = smallest available increment for the overload gate (null = bodyweight, manual).
 * shoulderWork  = pain here is a HARD STOP → drop back to previous weight (never advance).
 */

export const SETS = 3;
export const REPS = 10;

export const WARMUPS = {
  Push: ["5 min stationary bike", "10 shoulder circles each direction", "1 warm-up set bench press @ 20kg (50% working)"],
  Pull: ["5 min stationary bike", "1 light rear delt fly set, minimal weight, full ROM", "1 warm-up set lat pulldown @ 25kg (50% working)"],
  Legs: ["5 min stationary bike", "10 bodyweight squats", "1 warm-up set barbell squat @ 20kg (50% working)"],
};

export const PROTOCOLS = {
  Push: [
    { id: "bench",      name: "Flat barbell bench press", startWeightKg: 40, incrementKg: 2.5, shoulderWork: true,  note: "Warm-up set at 20kg first" },
    { id: "incline_db", name: "Incline DB press",         startWeightKg: 10, incrementKg: 2,   shoulderWork: true,  note: "Per hand" },
    { id: "pec_deck",   name: "Pec deck / cable fly",     startWeightKg: 30, incrementKg: 2.5, shoulderWork: true,  note: "30–35kg. Rep 9–10 should be hard" },
    { id: "lateral",    name: "Lateral raises",           startWeightKg: 4,  incrementKg: 0.5, shoulderWork: true,  note: "Advance 0.5kg when 2 consecutive sessions clean" },
    { id: "tri_press",  name: "Tricep press machine",     startWeightKg: 30, incrementKg: 5,   shoulderWork: false, note: "Pre-fatigued after pressing" },
    { id: "tri_push",   name: "Cable tricep pushdown",    startWeightKg: 20, incrementKg: 2.5, shoulderWork: false, note: "20–25kg" },
  ],
  Pull: [
    { id: "lat_pull",   name: "Cable lat pulldown",       startWeightKg: 50, incrementKg: 2.5, shoulderWork: false, note: "Warm-up set at 25kg first" },
    { id: "low_row",    name: "Low row",                  startWeightKg: 50, incrementKg: 2.5, shoulderWork: false, note: "Do not start aggressively — back strain risk" },
    { id: "ng_pull",    name: "Neutral grip pulldown",    startWeightKg: 45, incrementKg: 2.5, shoulderWork: false, note: "" },
    { id: "rear_delt",  name: "Rear delt fly",            startWeightKg: 8,  incrementKg: 1,   shoulderWork: true,  note: "8–10kg/hand. Training + shoulder rehab. Full ROM, controlled. Do not skip, do not rush the load." },
    { id: "db_curl",    name: "DB bicep curl",            startWeightKg: 10, incrementKg: 2,   shoulderWork: false, note: "Per hand" },
    { id: "hammer",     name: "Hammer curl",              startWeightKg: 10, incrementKg: 2,   shoulderWork: false, note: "Per hand" },
  ],
  Legs: [
    { id: "squat",      name: "Barbell squat",            startWeightKg: 40, incrementKg: 2.5, shoulderWork: false, note: "Warm-up set at 20kg first" },
    { id: "leg_press",  name: "Leg press",                startWeightKg: 60, incrementKg: 5,   shoulderWork: false, note: "Adjust up next session if trivial" },
    { id: "bss",        name: "Bulgarian split squat",    startWeightKg: 0,  incrementKg: null, shoulderWork: false, note: "Bodyweight. Replaces leg extension — harder than it looks" },
    { id: "nordic",     name: "Nordic curl",              startWeightKg: 0,  incrementKg: null, shoulderWork: false, note: "Bodyweight. Replaces leg curl — hands to push back up" },
    { id: "back_ext",   name: "Back extension",           startWeightKg: 0,  incrementKg: null, shoulderWork: false, note: "Add weight when 3×10 BW is easy. DROPS from Wednesday time-capped session → carries to Saturday.", dropOnWednesday: true },
    { id: "rdl",        name: "Romanian deadlift",        startWeightKg: 40, incrementKg: 2.5, shoulderWork: false, note: "Eccentric load will humble you — do not rush" },
    { id: "crunch",     name: "Cable crunch",             startWeightKg: 25, incrementKg: 2.5, shoulderWork: false, note: "Form over weight" },
  ],
};

/** Call-day full-body circuit (hospital). 3–5 rounds, resistance band for pull. */
export const CALL_DAY_CIRCUIT = [
  { name: "Squats", reps: 20 },
  { name: "Alternating lunges", reps: 20 },
  { name: "Push-ups", reps: 10, note: "Any variation" },
  { name: "Supermans", reps: 20 },
  { name: "Plank and kick-throughs", reps: 10 },
  { name: "Body saw planks", reps: 10 },
  { name: "Banded rows", reps: 15, note: "Pull component — resistance band" },
  { name: "Banded face pulls", reps: 15, note: "Shoulder rehab — controlled" },
  { name: "Banded pull-aparts", reps: 15 },
];

export const CARDIO = {
  Push: "30–60 min stationary bike post working sets",
  Pull: "30–60 min stationary bike post working sets",
  Legs: "20–30 min post working sets — legs will be taxed",
  Wednesday: "Skip. Time cap makes cardio non-viable.",
};

/** Exercises for a session on a given weekday (Wednesday drops back extension). */
export function exercisesFor(session, weekday) {
  const list = PROTOCOLS[session] || [];
  if (session === "Legs" && weekday === "Wednesday") return list.filter(e => !e.dropOnWednesday);
  return list;
}

export const SHOULDER_CONSTRAINT =
  "No overhead pressing movements. Lateral raises start at 4kg. Rear delt fly is both training and protective " +
  "rehabilitation — do not skip it and do not rush the load.";
