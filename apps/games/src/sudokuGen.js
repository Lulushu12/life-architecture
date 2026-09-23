import { shuffle } from "./rng.js";

export const DIFFICULTIES = {
  easy: { label: "Easy", clues: 40 },
  medium: { label: "Medium", clues: 32 },
  hard: { label: "Hard", clues: 26 },
};

export const CARVE_ATTEMPTS = 8;

const ROW = new Array(81);
const COL = new Array(81);
const BOX = new Array(81);
for (let i = 0; i < 81; i++) {
  ROW[i] = Math.floor(i / 9);
  COL[i] = i % 9;
  BOX[i] = Math.floor(ROW[i] / 3) * 3 + Math.floor(COL[i] / 3);
}

export const PEERS = Array.from({ length: 81 }, (_, i) => {
  const out = [];
  for (let j = 0; j < 81; j++) {
    if (j !== i && (ROW[j] === ROW[i] || COL[j] === COL[i] || BOX[j] === BOX[i])) out.push(j);
  }
  return out;
});

export function isPeer(a, b) {
  return a !== b && (ROW[a] === ROW[b] || COL[a] === COL[b] || BOX[a] === BOX[b]);
}

function masksOf(g) {
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);
  for (let i = 0; i < 81; i++) {
    const v = g[i];
    if (!v) continue;
    const bit = 1 << v;
    rows[ROW[i]] |= bit;
    cols[COL[i]] |= bit;
    boxes[BOX[i]] |= bit;
  }
  return { rows, cols, boxes };
}

function digitsOf(mask) {
  const out = [];
  for (let n = 1; n <= 9; n++) if (!(mask & (1 << n))) out.push(n);
  return out;
}

export function candidatesAt(values, i) {
  if (values[i]) return [];
  let used = 0;
  for (const p of PEERS[i]) if (values[p]) used |= 1 << values[p];
  return digitsOf(used);
}

export function generateFullSolution(rng = Math.random) {
  const g = new Array(81).fill(0);
  const { rows, cols, boxes } = masksOf(g);
  function fill(pos) {
    if (pos === 81) return true;
    const used = rows[ROW[pos]] | cols[COL[pos]] | boxes[BOX[pos]];
    for (const n of shuffle(digitsOf(used), rng)) {
      const bit = 1 << n;
      g[pos] = n;
      rows[ROW[pos]] |= bit;
      cols[COL[pos]] |= bit;
      boxes[BOX[pos]] |= bit;
      if (fill(pos + 1)) return true;
      rows[ROW[pos]] &= ~bit;
      cols[COL[pos]] &= ~bit;
      boxes[BOX[pos]] &= ~bit;
      g[pos] = 0;
    }
    return false;
  }
  fill(0);
  return g;
}

export function countSolutions(grid, limit = 2) {
  const g = grid.slice();
  const { rows, cols, boxes } = masksOf(g);
  function rec() {
    let best = -1;
    let bestUsed = 0;
    let bestCount = 10;
    for (let pos = 0; pos < 81; pos++) {
      if (g[pos] !== 0) continue;
      const used = rows[ROW[pos]] | cols[COL[pos]] | boxes[BOX[pos]];
      let count = 0;
      for (let n = 1; n <= 9; n++) if (!(used & (1 << n))) count++;
      if (count === 0) return 0;
      if (count < bestCount) {
        best = pos;
        bestUsed = used;
        bestCount = count;
        if (count === 1) break;
      }
    }
    if (best === -1) return 1;
    let total = 0;
    for (let n = 1; n <= 9; n++) {
      const bit = 1 << n;
      if (bestUsed & bit) continue;
      g[best] = n;
      rows[ROW[best]] |= bit;
      cols[COL[best]] |= bit;
      boxes[BOX[best]] |= bit;
      total += rec();
      rows[ROW[best]] &= ~bit;
      cols[COL[best]] &= ~bit;
      boxes[BOX[best]] &= ~bit;
      g[best] = 0;
      if (total >= limit) return total;
    }
    return total;
  }
  return rec();
}

function carve(solution, clueTarget, rng) {
  const puzzle = solution.slice();
  let clues = 81;
  for (const cell of shuffle([...Array(81).keys()], rng)) {
    if (clues <= clueTarget) break;
    const backup = puzzle[cell];
    puzzle[cell] = 0;
    if (countSolutions(puzzle, 2) !== 1) puzzle[cell] = backup;
    else clues--;
  }
  return { puzzle, clues };
}

export function generatePuzzle(clueTarget, rng = Math.random, attempts = CARVE_ATTEMPTS) {
  let best = null;
  for (let a = 0; a < attempts; a++) {
    const solution = generateFullSolution(rng);
    const { puzzle, clues } = carve(solution, clueTarget, rng);
    if (!best || clues < best.clueCount) best = { puzzle, solution, clueCount: clues, attempts: a + 1 };
    if (clues <= clueTarget) break;
  }
  return best;
}

export function findConflicts(values) {
  const bad = new Set();
  for (let i = 0; i < 81; i++) {
    const v = values[i];
    if (!v) continue;
    for (const p of PEERS[i]) {
      if (values[p] === v) {
        bad.add(i);
        break;
      }
    }
  }
  return bad;
}
