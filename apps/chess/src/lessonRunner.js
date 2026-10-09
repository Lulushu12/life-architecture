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

/** Percent through a lesson, 0 to 100. */
export function progressPct(lesson, progress) {
  if (!progress) return 0;
  if (progress.completed) return 100;
  const pct = Math.round((((progress.step || 0) + 1) / lesson.steps.length) * 100);
  return Math.max(0, Math.min(100, pct));
}

/** Completed lessons that still exist (old ids no longer count). */
export function completedCount(progressMap) {
  const ids = new Set(LESSONS.map((l) => l.id));
  return Object.entries(progressMap || {}).filter(([id, p]) => p?.completed && ids.has(id)).length;
}
