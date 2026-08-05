/**
 * Global constants of the Sovereign Health Operating System v2 (May 2026)
 * plus the retained Life Architecture XP engine.
 * Source of truth: sovereign_health_operating_system_v2 + PLAN.md.
 */

// ── XP engine (retained from v8) ─────────────────────────────────────────
export const LEVELS = [
  { name: "Novice Adventurer",    min: 0 },
  { name: "Apprentice",           min: 1000 },
  { name: "Journeyman",           min: 3000 },
  { name: "Skilled Practitioner", min: 6000 },
  { name: "Expert",               min: 10000 },
  { name: "Master",               min: 15000 },
  { name: "Legendary Figure",     min: 22000 },
];
export const CATEGORIES = ["Health & Fitness", "Medicine & Surgery", "Trading", "Hobbies & Creativity"];
export const CAT_COLORS = {
  "Health & Fitness":     { accent: "#22c55e", light: "#86efac" },
  "Medicine & Surgery":   { accent: "#ef4444", light: "#fca5a5" },
  "Trading":              { accent: "#06b6d4", light: "#67e8f9" },
  "Hobbies & Creativity": { accent: "#f59e0b", light: "#fcd34d" },
};
export const STREAK_MULT  = (s) => s >= 30 ? 3 : s >= 14 ? 2 : s >= 7 ? 1.5 : 1;
export const STREAK_LABEL = (s) => s >= 30 ? "3x" : s >= 14 ? "2x" : s >= 7 ? "1.5x" : "1x";
export const STREAK_COLOR = (s) => s >= 30 ? "#a855f7" : s >= 14 ? "#ef4444" : s >= 7 ? "#f59e0b" : "#64748b";

export function getLevel(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) if (xp >= LEVELS[i].min) return { ...LEVELS[i], index: i };
  return { ...LEVELS[0], index: 0 };
}
export function getLevelProgress(xp) {
  const l = getLevel(xp), n = LEVELS[l.index + 1];
  if (!n) return 100;
  return Math.round(((xp - l.min) / (n.min - l.min)) * 100);
}
export const todayKey = (d = new Date()) => {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
};
export const uid = () => "q" + Date.now() + Math.random().toString(36).slice(2, 7);

// ── v2: Macro targets (daily, flat) ──────────────────────────────────────
export const MACROS = {
  kcal: 2100, protein: 160, fat: 65, carbs: 210,
  // auto-quest evaluation tolerances:
  kcalFloor: 1900,   // below this the day isn't "within budget", it's under-logged
  kcalCeil: 2150,    // small logging tolerance above target
};

// ── v2: PPL rotation (Mon..Sun) ──────────────────────────────────────────
export const ROTATION = ["Push", "Pull", "Legs", "Push", "Pull", "Legs", "REST"];
export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Planned session for a date, honoring PPL slide offset (missed sessions slide forward). */
export function plannedSession(date = new Date(), pplOffset = 0) {
  const dayIdx = (date.getDay() + 6) % 7; // Mon=0
  const idx = ((dayIdx - (pplOffset % 7)) % 7 + 7) % 7;
  return ROTATION[idx];
}

// ── v2: Non-negotiables ──────────────────────────────────────────────────
export const NON_NEGOTIABLES = [
  { id: "creatine",  label: "Creatine 5g with water", detail: "Every morning immediately after brushing teeth." },
  { id: "vmo",       label: "VMO exercises",          detail: "Every single day, including Sunday. In bed and remembered? Get up." },
  { id: "despina",   label: "Despina time 19:30–21:00", detail: "Wednesday from ~20:30. Phone down, no screens, no work." },
  { id: "phone",     label: "Phone dock 21:00",       detail: "Every night. Physical distance." },
  { id: "mobility",  label: "Bedtime mobility 21:45", detail: "The mat being out is the trigger." },
  { id: "lights",    label: "Lights out 22:00–22:30", detail: "Non-negotiable sleep window." },
];

// ── v2: Gym network ──────────────────────────────────────────────────────
export const GYMS = [
  { id: "titan",     name: "Titan Park",     role: "Primary. Mon–Sat by default.",                       travel: "19 min subway from Pallady · 12 min drive from home · 14 min from Foisor" },
  { id: "mall",      name: "Bucuresti Mall", role: "Backup only. Missed session rescue.",                travel: "3 min walk from home" },
  { id: "sudului",   name: "Sudului",        role: "Backup only. Wed emergency + Mon/Tue late consult.", travel: "Next to Sun Plaza" },
  { id: "hospital",  name: "Hospital (call day)", role: "Circuit with resistance band + mat.",           travel: "On site" },
];

// ── v2: Identity anchors ─────────────────────────────────────────────────
export const IDENTITY_ANCHORS = [
  "I am someone who trains.",
  "I am someone who fuels properly.",
  "I am a present partner.",
  "I am someone who recovers deliberately.",
];

// ── v2: The Show-Up Rule / overload rule (display copy) ──────────────────
export const SHOW_UP_RULE =
  "The habit is walking through the gym door, not the workout. On every training day, regardless of energy, " +
  "motivation, or mood, you go. Minimum viable session: 10 minutes on the stationary bike. That counts. " +
  "Wrong gym is not an excuse — walk to Bucuresti Mall (3 min).";
export const OVERLOAD_RULE =
  "Advance by the smallest available increment ONLY when 3×10 is clean and pain-free across two consecutive " +
  "sessions. Hard stop at any discomfort on shoulder work — drop back to previous weight, not to zero. " +
  "Progression is gate-controlled by performance, not by a schedule.";

// XP awards for tracker-driven events
export const XP_AWARDS = {
  liftAdvance: 50,       // overload gate advances a lift
  sessionMinimum: 0,     // show-up minimum still completes the gym quest; no bonus
};
