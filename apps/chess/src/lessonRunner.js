// Small rules the lesson runner follows, kept apart from the screen so they
// can be tested.

import { LESSONS } from "./lessons/index.js";

/**
 * Which side the board faces. A quiz always faces the side asked to move
 * (bug 9: 14 quizzes asked the learner to play from the far side of the
 * board); other steps keep the lesson's own orientation.
 */
export function boardOrientation(lesson, step, fenAfterPlay) {
  if (step?.quiz && fenAfterPlay) return fenAfterPlay.split(" ")[1];
  return lesson.orientation || "w";
}

/** The step to resume at, clamped to the lesson's current length (bug 10). */
export function resumeStep(lesson, saved) {
  if (!saved || saved.completed) return 0;
  const n = Number.isInteger(saved.step) ? saved.step : 0;
  return Math.max(0, Math.min(n, lesson.steps.length - 1));
}

/**
 * Percent through a lesson, 0 to 100. Only a completed lesson reads 100: one
 * sitting on its last step with quizzes still unsolved shows 99 (plan item 13).
 */
export function progressPct(lesson, progress) {
  if (!progress) return 0;
  if (progress.completed) return 100;
  const pct = Math.round((((progress.step || 0) + 1) / lesson.steps.length) * 100);
  return Math.max(0, Math.min(99, pct));
}

/** Completed lessons that still exist (old ids no longer count). */
export function completedCount(progressMap) {
  const ids = new Set(LESSONS.map((l) => l.id));
  return Object.entries(progressMap || {}).filter(([id, p]) => p?.completed && ids.has(id)).length;
}

// ── The path (plan item 13) ────────────────────────────────────────────────

const CATEGORY_TURN = ["concepts", "endgames", "openings"];

// Inside a category, which topics come first (lower first; unlisted topics
// after, in file order). Tactics before strategy, since hanging pieces lose
// more games under 1000 than anything else; the openings you'll meet most
// before offbeat gambits.
const GROUP_RANK = {
  "Tactical Motifs": 0,
  "Mating Patterns": 1,
  "Attacking Patterns": 2,
  "Piece Play": 10,
  "Positional Play": 11,
  "Pawn Structures": 12,
  "Basic Mates": 0,
  "Pawn Endings": 1,
  "Minor Piece Endings": 2,
  "Rook Endings": 3,
  "Italian Game": 0,
  "Open Games": 1,
  "Ruy Lopez": 2,
  "Sicilian": 3,
  "Queen's Gambit": 4,
  "d4 Systems": 5,
  "Semi-Open": 6,
  "Indian Defences": 7,
  "Offbeat Gambits": 8,
};
const groupRank = (l) => GROUP_RANK[l.group] ?? 50;

/**
 * One order through every lesson: beginner, then intermediate, then
 * advanced. Inside a level the categories take turns (a concept, an ending,
 * an opening, ...), each ordered by topic (GROUP_RANK), so the path mixes them.
 * New lesson files join the path on their own.
 */
export function pathOrder(lessons = LESSONS) {
  const out = [];
  for (const level of ["beginner", "intermediate", "advanced"]) {
    const queues = CATEGORY_TURN.map((cat) =>
      lessons
        .map((l, i) => [l, i])
        .filter(([l]) => (l.level || "intermediate") === level && l.category === cat)
        .sort(([a, i], [b, j]) => groupRank(a) - groupRank(b) || i - j)
        .map(([l]) => l)
    );
    const others = lessons.filter((l) => (l.level || "intermediate") === level && !CATEGORY_TURN.includes(l.category));
    while (queues.some((q) => q.length)) for (const q of queues) if (q.length) out.push(q.shift());
    out.push(...others);
  }
  return out;
}

/** Step indices of a lesson's quizzes. */
export const quizSteps = (lesson) => lesson.steps.map((s, i) => (s.quiz ? i : -1)).filter((i) => i >= 0);

/** Quizzes not yet passed (found without "Show me"). */
export function quizzesLeft(lesson, progress) {
  const passed = new Set(progress?.passed || []);
  return quizSteps(lesson).filter((i) => !passed.has(i));
}

/**
 * The lesson to do next: one you started and didn't finish (earliest on the
 * path), else the first unfinished one on the path. Returns
 * {lesson, done, total, index} or null when everything is done.
 */
export function nextLesson(progressMap, lessons = LESSONS) {
  const prog = progressMap || {};
  const path = pathOrder(lessons);
  const open = path.filter((l) => !prog[l.id]?.completed);
  const lesson = open.find((l) => (prog[l.id]?.step || 0) > 0 || prog[l.id]?.passed?.length) || open[0] || null;
  return lesson ? { lesson, done: lessons.length - open.length, total: lessons.length, index: path.indexOf(lesson) } : null;
}

/** The next unfinished lesson on the path after `id` (wrapping round), or null. */
export function nextAfter(id, progressMap, lessons = LESSONS) {
  const prog = progressMap || {};
  const path = pathOrder(lessons);
  const at = path.findIndex((l) => l.id === id);
  const rest = [...path.slice(at + 1), ...path.slice(0, Math.max(0, at))];
  return rest.find((l) => !prog[l.id]?.completed) || null;
}
