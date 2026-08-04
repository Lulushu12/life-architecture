// Sudoku generator: randomized backtracking to build a full solved grid,
// then carve cells out one at a time while a solution-counting backtracker
// confirms the puzzle still has exactly one solution.

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function candidatesFor(g, pos) {
  const r = Math.floor(pos / 9);
  const c = pos % 9;
  const used = new Set();
  for (let i = 0; i < 9; i++) {
    used.add(g[r * 9 + i]);
    used.add(g[i * 9 + c]);
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      used.add(g[(br + i) * 9 + (bc + j)]);
    }
  }
  const out = [];
  for (let n = 1; n <= 9; n++) if (!used.has(n)) out.push(n);
  return out;
}

// Builds one fully-solved, randomized grid via backtracking.
export function generateFullSolution() {
  const g = new Array(81).fill(0);
  function fill(pos) {
    if (pos === 81) return true;
    for (const n of shuffle(candidatesFor(g, pos))) {
      g[pos] = n;
      if (fill(pos + 1)) return true;
      g[pos] = 0;
    }
    return false;
  }
  fill(0);
  return g;
}

// Counts solutions up to `limit` (early exit) using an MRV backtracker.
export function countSolutions(grid, limit = 2) {
  const g = grid.slice();
  function rec() {
    let best = -1;
    let bestCands = null;
    for (let pos = 0; pos < 81; pos++) {
      if (g[pos] !== 0) continue;
      const c = candidatesFor(g, pos);
      if (c.length === 0) return 0;
      if (!bestCands || c.length < bestCands.length) {
        best = pos;
        bestCands = c;
        if (c.length === 1) break;
      }
    }
    if (best === -1) return 1;
    let total = 0;
    for (const n of bestCands) {
      g[best] = n;
      total += rec();
      g[best] = 0;
      if (total >= limit) return total;
    }
    return total;
  }
  return rec();
}

// Carves a full solution down to `clueTarget` givens while a
// uniqueness check runs after every removal. Yields to the event loop
// periodically so the UI can show a spinner on slow (hard) puzzles.
export async function generatePuzzleAsync(clueTarget, onProgress) {
  const solution = generateFullSolution();
  const puzzle = solution.slice();
  const order = shuffle([...Array(81).keys()]);
  let clues = 81;
  let i = 0;
  while (i < order.length && clues > clueTarget) {
    const chunkEnd = Math.min(i + 5, order.length);
    for (; i < chunkEnd && clues > clueTarget; i++) {
      const cell = order[i];
      if (puzzle[cell] === 0) continue;
      const backup = puzzle[cell];
      puzzle[cell] = 0;
      if (countSolutions(puzzle, 2) !== 1) {
        puzzle[cell] = backup;
      } else {
        clues--;
      }
    }
    onProgress?.(clues);
    // Yield to the UI thread between chunks.
    await new Promise((res) => setTimeout(res, 0));
  }
  return { puzzle, solution, clueCount: clues };
}

export const DIFFICULTIES = {
  easy: { label: "Easy", clues: 40 },
  medium: { label: "Medium", clues: 32 },
  hard: { label: "Hard", clues: 26 },
};

// Conflict check used by the play screen for error highlighting.
export function findConflicts(values) {
  // values: length-81 array of 0-9 (0 = empty). Returns a Set of
  // conflicting cell indices (same row/col/box, same nonzero value).
  const bad = new Set();
  const lines = [];
  for (let r = 0; r < 9; r++) lines.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) lines.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const box = [];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) box.push((br * 3 + i) * 9 + (bc * 3 + j));
      lines.push(box);
    }
  }
  for (const line of lines) {
    const seen = new Map();
    for (const pos of line) {
      const v = values[pos];
      if (!v) continue;
      if (!seen.has(v)) seen.set(v, []);
      seen.get(v).push(pos);
    }
    for (const positions of seen.values()) {
      if (positions.length > 1) positions.forEach((p) => bad.add(p));
    }
  }
  return bad;
}
