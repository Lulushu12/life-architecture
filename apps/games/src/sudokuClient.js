import { DIFFICULTIES, generatePuzzle } from "./sudokuGen.js";
import { seededRng } from "./rng.js";

const lanes = {};
let seq = 0;

function spawn() {
  if (typeof Worker === "undefined") return null;
  try {
    return new Worker(new URL("./sudoku.worker.js", import.meta.url), { type: "module" });
  } catch {
    return null;
  }
}

function inline(clueTarget, seed) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(generatePuzzle(clueTarget, seed != null ? seededRng(seed) : Math.random));
      } catch (err) {
        reject(err);
      }
    }, 0);
  });
}

function lane(name) {
  if (lanes[name] !== undefined) return lanes[name];
  const worker = spawn();
  if (!worker) {
    lanes[name] = null;
    return null;
  }
  const entry = { worker, pending: new Map() };
  worker.onmessage = (e) => {
    const { id, result, error } = e.data || {};
    const p = entry.pending.get(id);
    if (!p) return;
    entry.pending.delete(id);
    if (error) p.reject(new Error(error));
    else p.resolve(result);
  };
  worker.onerror = (e) => {
    e.preventDefault?.();
    const waiting = [...entry.pending.values()];
    entry.pending.clear();
    worker.terminate();
    lanes[name] = null;
    for (const p of waiting) inline(p.clueTarget, p.seed).then(p.resolve, p.reject);
  };
  lanes[name] = entry;
  return entry;
}

export function requestPuzzle(difficulty, { seed = null, background = false } = {}) {
  const clueTarget = DIFFICULTIES[difficulty]?.clues ?? DIFFICULTIES.medium.clues;
  const entry = lane(background ? "bg" : "fg");
  if (!entry) return inline(clueTarget, seed);
  const id = ++seq;
  return new Promise((resolve, reject) => {
    entry.pending.set(id, { resolve, reject, clueTarget, seed });
    entry.worker.postMessage({ id, clueTarget, seed });
  });
}

export function whenIdle(fn, timeout = 2000) {
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    const h = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback(h);
  }
  const t = setTimeout(fn, 400);
  return () => clearTimeout(t);
}
