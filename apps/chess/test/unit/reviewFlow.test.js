import { describe, it, expect } from "vitest";
import { reviewStops, nextStop, prevStop, graphMarks } from "../../src/reviewFlow.js";

const review = {
  moves: [
    { color: "w", class: "book" },
    { color: "b", class: "book" },
    { color: "w", class: "best" },
    { color: "b", class: "blunder" },
    { color: "w", class: "miss" },
    { color: "b", class: "great" },
    { color: "w", class: "inaccuracy" },
  ],
};

describe("review key moments", () => {
  it("stops at the last book move, then the player's mistakes and standout moves", () => {
    expect(reviewStops(review, "w")).toEqual([1, 4, 6]);
    expect(reviewStops(review, "b")).toEqual([1, 3, 5]);
    expect(reviewStops(review, null)).toEqual([1, 3, 4, 5, 6]);
    expect(reviewStops({ moves: [] })).toEqual([]);
  });

  it("steps forward and back between stops", () => {
    const stops = [1, 4, 6];
    expect(nextStop(stops, -1)).toBe(1);
    expect(nextStop(stops, 1)).toBe(4);
    expect(nextStop(stops, 6)).toBeNull();
    expect(prevStop(stops, 6)).toBe(4);
    expect(prevStop(stops, 1)).toBeNull();
  });

  it("marks the player's mistakes, blunders and misses on the graph", () => {
    expect(graphMarks(review, "w").map((m) => m.i)).toEqual([4]);
    expect(graphMarks(review, null).map((m) => m.i)).toEqual([3, 4]);
  });
});
