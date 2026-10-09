import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { LESSONS, categoryCounts } from "../../src/lessons/index.js";

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
        out.push({ lesson, step, turn: c.turn(), answer: [mv.from, mv.to], shown: [...prevArrows, ...arrows] });
        c.move(step.quiz.answer);
      }
      prevArrows = arrows;
    }
  }
  return out;
}

const answerShown = (q) => q.shown.some(([a, b]) => a === q.answer[0] && b === q.answer[1]);
const wrongSide = (q) => q.turn !== (q.lesson.orientation || "w");

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

  it("current counts of the two content problems", () => {
    const qs = quizzes();
    expect(qs.filter(answerShown).length).toMatchInlineSnapshot(`7`);
    expect(qs.filter(wrongSide).length).toMatchInlineSnapshot(`14`);
  });

  // Audit bug 9, part 1: an arrow on the quiz step or the step before draws the answer.
  it.fails("never draws the quiz answer as an arrow before it is asked", () => {
    expect(quizzes().filter(answerShown).map((q) => q.lesson.id)).toEqual([]);
  });

  // Audit bug 9, part 2: the learner is asked to play the side the board is not oriented for.
  it.fails("asks every quiz from the side the board is oriented for", () => {
    expect(quizzes().filter(wrongSide).map((q) => q.lesson.id)).toEqual([]);
  });
});
