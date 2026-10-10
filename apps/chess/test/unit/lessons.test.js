import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { LESSONS, categoryCounts } from "../../src/lessons/index.js";
import { boardOrientation, resumeStep, progressPct, completedCount, nextLesson, pathOrder, quizzesLeft, nextAfter } from "../../src/lessonRunner.js";

// Replays every lesson and yields each quiz with its position and the
// arrows the learner saw on that step and the one before it.
function quizzes() {
  const out = [];
  for (const lesson of LESSONS) {
    const c = lesson.startFen ? new Chess(lesson.startFen) : new Chess();
    let prevArrows = [];
    for (const step of lesson.steps) {
      for (const san of step.play || []) c.move(san);
      const arrows = step.arrows || [];
      if (step.quiz) {
        const mv = new Chess(c.fen()).move(step.quiz.answer);
        out.push({ lesson, step, fen: c.fen(), turn: c.turn(), answer: [mv.from, mv.to], shown: [...prevArrows, ...arrows] });
        c.move(step.quiz.answer);
      }
      prevArrows = arrows;
    }
  }
  return out;
}

const answerShown = (q) => q.shown.some(([a, b]) => a === q.answer[0] && b === q.answer[1]);
const wrongSide = (q) => q.turn !== boardOrientation(q.lesson, q.step, q.fen);

describe("lesson content (characterization)", () => {
  it("has 72 lessons across the three categories", () => {
    expect(LESSONS.length).toBe(72);
    expect(categoryCounts()).toMatchInlineSnapshot(`
      [
        {
          "count": 29,
          "key": "openings",
          "label": "Openings",
        },
        {
          "count": 30,
          "key": "concepts",
          "label": "Concepts",
        },
        {
          "count": 13,
          "key": "endgames",
          "label": "Endgames",
        },
      ]
    `);
  });

  it("every quiz answer is legal where it is asked", () => {
    expect(quizzes().length).toBe(205);
  });

  // Audit bug 9, part 1 (fixed in plan item 3): an arrow on the quiz step or
  // the step before used to draw the answer in 7 quizzes.
  it("never draws the quiz answer as an arrow before it is asked", () => {
    expect(quizzes().filter(answerShown).map((q) => q.lesson.id)).toEqual([]);
  });

  // Audit bug 9, part 2 (fixed in plan item 3): 14 quizzes used to ask for a
  // move from the side the board faced away from.
  it("asks every quiz from the side the board is oriented for", () => {
    expect(quizzes().filter(wrongSide).map((q) => q.lesson.id)).toEqual([]);
  });
});

describe("lesson runner rules", () => {
  const lesson = { id: "x", orientation: "b", steps: [{}, {}, {}] };

  it("keeps the lesson's orientation on steps without a quiz", () => {
    expect(boardOrientation(lesson, { text: "hi" }, "8/8/8/8/8/8/8/K6k w - - 0 1")).toBe("b");
    expect(boardOrientation({ steps: [] }, {}, null)).toBe("w");
  });

  // Audit bug 10 (fixed in plan item 3): a saved step beyond a shortened lesson crashed the runner.
  it("clamps the saved step to the lesson's length", () => {
    expect(resumeStep(lesson, { step: 9 })).toBe(2);
    expect(resumeStep(lesson, { step: 1 })).toBe(1);
    expect(resumeStep(lesson, { step: 1, completed: true })).toBe(0);
    expect(resumeStep(lesson, null)).toBe(0);
    // plan item 13: only a completed lesson reads 100
    expect(progressPct(lesson, { step: 9 })).toBe(99);
    expect(progressPct(lesson, { step: 2, completed: true })).toBe(100);
    expect(progressPct(lesson, { step: 0 })).toBe(33);
  });

  it("counts only completed lessons that still exist", () => {
    const real = LESSONS[0].id;
    expect(completedCount({ [real]: { completed: true }, "gone-lesson": { completed: true }, other: {} })).toBe(1);
  });
});

describe("the lesson path (plan item 13)", () => {
  const L = [
    { id: "o1", category: "openings", level: "beginner", steps: [{}] },
    { id: "c1", category: "concepts", level: "beginner", steps: [{}] },
    { id: "c2", category: "concepts", level: "beginner", steps: [{}] },
    { id: "e1", category: "endgames", level: "beginner", steps: [{}] },
    { id: "a1", category: "concepts", level: "advanced", steps: [{}] },
    { id: "i1", category: "openings", level: "intermediate", steps: [{}] },
  ];

  it("goes by level, with the categories taking turns", () => {
    expect(pathOrder(L).map((l) => l.id)).toEqual(["c1", "e1", "o1", "c2", "i1", "a1"]);
  });

  it("covers every real lesson exactly once, easiest first", () => {
    const path = pathOrder(LESSONS);
    expect(path).toHaveLength(LESSONS.length);
    expect(new Set(path.map((l) => l.id)).size).toBe(LESSONS.length);
    const rank = { beginner: 0, intermediate: 1, advanced: 2 };
    const levels = path.map((l) => rank[l.level || "intermediate"]);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });

  it("offers the next lesson along the path, or the one you started", () => {
    expect(nextLesson({}, L)).toMatchObject({ lesson: { id: "c1" }, done: 0, total: 6, index: 0 });
    expect(nextLesson({ c1: { completed: true } }, L).lesson.id).toBe("e1");
    expect(nextLesson({ c2: { step: 1 } }, L).lesson.id).toBe("c2");
    expect(nextAfter("o1", { c2: { completed: true } }, L).id).toBe("i1");
    expect(nextAfter("a1", {}, L).id).toBe("c1"); // wraps to the first unfinished one
  });

  it("counts a quiz as passed only when found without Show me", () => {
    const lesson = { steps: [{ text: "" }, { quiz: { answer: "e4" } }, { text: "" }, { quiz: { answer: "d4" } }] };
    expect(quizzesLeft(lesson, null)).toEqual([1, 3]);
    expect(quizzesLeft(lesson, { passed: [1] })).toEqual([3]);
    expect(quizzesLeft(lesson, { passed: [1, 3] })).toEqual([]);
  });
});

describe("next lesson on the home screen (plan item 10)", () => {
  const L = [
    { id: "a", level: "advanced", category: "concepts", steps: [{}, {}] },
    { id: "b", level: "beginner", category: "concepts", steps: [{}, {}] },
    { id: "c", level: "beginner", category: "concepts", steps: [{}, {}] },
  ];
  it("offers the easiest unfinished lesson", () => {
    expect(nextLesson({}, L)).toMatchObject({ lesson: { id: "b" }, done: 0, total: 3 });
    expect(nextLesson({ b: { completed: true } }, L)).toMatchObject({ lesson: { id: "c" }, done: 1 });
  });
  it("prefers one you started", () => {
    expect(nextLesson({ a: { step: 1 } }, L).lesson.id).toBe("a");
  });
  it("returns null when everything is done", () => {
    expect(nextLesson({ a: { completed: true }, b: { completed: true }, c: { completed: true } }, L)).toBeNull();
  });
});
