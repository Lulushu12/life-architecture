import { generatePuzzle } from "./sudokuGen.js";
import { seededRng } from "./rng.js";

self.onmessage = (e) => {
  const { id, clueTarget, seed } = e.data || {};
  try {
    const rng = seed != null ? seededRng(seed) : Math.random;
    self.postMessage({ id, result: generatePuzzle(clueTarget, rng) });
  } catch (err) {
    self.postMessage({ id, error: String((err && err.message) || err) });
  }
};
