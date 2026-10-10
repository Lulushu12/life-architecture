import { describe, it, expect } from "vitest";
import { outcomeOf, filterGames, saveAnalysis, ANALYSIS_CAP } from "../../src/archive.js";

const games = [
  { id: "a", mode: "bot", playerColor: "w", result: "1-0", favourite: true },
  { id: "b", mode: "bot", playerColor: "b", result: "1-0" },
  { id: "c", mode: "import", playerColor: "w", result: "1/2-1/2" },
  { id: "d", mode: "pass", result: "0-1" },
];

describe("archive (plan item 12)", () => {
  it("reads the outcome from your side", () => {
    expect(games.map(outcomeOf)).toEqual(["w", "l", "d", null]);
  });

  it("filters by tab and result", () => {
    const ids = (tab, r) => filterGames(games, tab, r).map((g) => g.id);
    expect(ids("all")).toEqual(["a", "b", "c", "d"]);
    expect(ids("starred")).toEqual(["a"]);
    expect(ids("bots")).toEqual(["a", "b"]);
    expect(ids("imported")).toEqual(["c"]);
    expect(ids("all", "l")).toEqual(["b"]);
    expect(ids("bots", "d")).toEqual([]);
  });

  it("saves analyses newest first, updates in place, and caps the list", () => {
    let n = 0;
    const id = () => "n" + n++;
    let { store, id: first } = saveAnalysis({}, { name: "Italian", sans: ["e4"] }, id, 1);
    ({ store } = saveAnalysis(store, { name: "Sicilian", sans: ["e4", "c5"] }, id, 2));
    expect(store.analyses.map((a) => a.name)).toEqual(["Sicilian", "Italian"]);
    ({ store } = saveAnalysis(store, { id: first, name: "Italian", sans: ["e4", "e5"] }, id, 3));
    expect(store.analyses).toHaveLength(2);
    expect(store.analyses[0]).toMatchObject({ id: first, sans: ["e4", "e5"], date: 3 });
    for (let i = 0; i < ANALYSIS_CAP + 5; i++) ({ store } = saveAnalysis(store, { sans: [] }, id, 10 + i));
    expect(store.analyses).toHaveLength(ANALYSIS_CAP);
    expect(store.analyses.some((a) => a.id === first)).toBe(false);
  });
});
