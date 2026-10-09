import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { LESSONS, categoryCounts } from "../../src/lessons/index.js";
import { boardOrientation, resumeStep, progressPct, completedCount } from "../../src/lessonRunner.js";

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
    expect(progressPct(lesson, { step: 9 })).toBe(100);
    expect(progressPct(lesson, { step: 0 })).toBe(33);
  });

  it("counts only completed lessons that still exist", () => {
    const real = LESSONS[0].id;
    expect(completedCount({ [real]: { completed: true }, "gone-lesson": { completed: true }, other: {} })).toBe(1);
  });
});
