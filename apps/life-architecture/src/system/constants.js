/**
 * Global constants of the Sovereign Health Operating System v2 (May 2026)
 * plus the retained Life Architecture XP engine.
 * Source of truth: sovereign_health_operating_system_v2 + PLAN.md.
 */

import { dayKey } from "@shared/store.js";

export const MAX_LEVEL = 40;
export const TITLES = [
  { level: 1,  name: "Novice Adventurer" },
  { level: 5,  name: "Apprentice" },
  { level: 10, name: "Journeyman" },
  { level: 15, name: "Skilled Practitioner" },
  { level: 20, name: "Expert" },
  { level: 25, name: "Master" },
  { level: 30, name: "Legendary Figure" },
  { level: 40, name: "Life Architect" },
];
export const levelThreshold = (n) => (n <= 1 ? 0 : Math.round(500 * Math.pow(1.35, n - 1)));
export const titleFor = (n) => TITLES.reduce((t, x) => (n >= x.level ? x.name : t), TITLES[0].name);

export function getLevel(xp) {
  let n = 1;
  while (n < MAX_LEVEL && xp >= levelThreshold(n + 1)) n++;
  const min = levelThreshold(n);
  const next = n < MAX_LEVEL ? levelThreshold(n + 1) : null;
  const progress = next == null ? 100 : Math.max(0, Math.min(100, Math.round(((xp - min) / (next - min)) * 100)));
  return { level: n, name: titleFor(n), min, next, progress };
}

export const CATEGORIES = ["Health & Fitness", "Medicine & Surgery", "Trading", "Hobbies & Creativity"];
export const CAT_COLORS = {
  "Health & Fitness":     { accent: "#22c55e", light: "#86efac", text: "var(--green-t)" },
  "Medicine & Surgery":   { accent: "#ef4444", light: "#fca5a5", text: "var(--red-t)" },
  "Trading":              { accent: "#06b6d4", light: "#67e8f9", text: "var(--cyan-t)" },
  "Hobbies & Creativity": { accent: "#f59e0b", light: "#fcd34d", text: "var(--gold)" },
};
export const STREAK_MULT  = (s) => s >= 30 ? 3 : s >= 14 ? 2 : s >= 7 ? 1.5 : 1;
export const STREAK_LABEL = (s) => s >= 30 ? "x3" : s >= 14 ? "x2" : s >= 7 ? "x1.5" : "x1";
export const STREAK_COLOR = (s) => s >= 30 ? "var(--purp-t)" : s >= 14 ? "var(--red-t)" : s >= 7 ? "var(--gold)" : "var(--grey-t)";

export const todayKey = (d = new Date()) => dayKey(d);
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
  "Wrong gym is not an excuse, walk to Bucuresti Mall (3 min).";
export const OVERLOAD_RULE =
  "Advance by the smallest available increment ONLY when 3×10 is clean and pain-free across two consecutive " +
  "sessions. Hard stop at any discomfort on shoulder work, drop back to previous weight, not to zero. " +
  "Progression is gate-controlled by performance, not by a schedule.";

export const XP_AWARDS = { liftAdvance: 50 };
