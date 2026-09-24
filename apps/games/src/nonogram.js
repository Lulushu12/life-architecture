export const NONO_SIZE = 10;
export const EMPTY = 0;
export const FILLED = 1;
export const CROSSED = 2;

export function cluesOf(line) {
  const out = [];
  let run = 0;
  for (const v of line) {
    if (v === FILLED) run++;
    else if (run) {
      out.push(run);
      run = 0;
    }
  }
  if (run) out.push(run);
  return out;
}

export const rowOf = (cells, r, n = NONO_SIZE) => cells.slice(r * n, r * n + n);
export const colOf = (cells, c, n = NONO_SIZE) => Array.from({ length: n }, (_, r) => cells[r * n + c]);

function solveLine(clue, line) {
  const n = line.length;
  const canFill = new Array(n).fill(false);
  const canEmpty = new Array(n).fill(false);
  const cur = new Array(n).fill(0);
  let found = false;
  const place = (k, start) => {
    if (k === clue.length) {
      for (let i = start; i < n; i++) if (line[i] === 1) return;
      for (let i = 0; i < n; i++) {
        const v = i < start ? cur[i] : 0;
        if (v) canFill[i] = true;
        else canEmpty[i] = true;
      }
      found = true;
      return;
    }
    let rest = 0;
    for (let j = k + 1; j < clue.length; j++) rest += clue[j] + 1;
    const len = clue[k];
    for (let s = start; s + len + rest <= n; s++) {
      if (s > start && line[s - 1] === 1) break;
      let ok = true;
      for (let i = s; i < s + len; i++) if (line[i] === 0) ok = false;
      if (!ok) continue;
      if (s + len < n && line[s + len] === 1) continue;
      for (let i = start; i < s; i++) cur[i] = 0;
      for (let i = s; i < s + len; i++) cur[i] = 1;
      if (s + len < n) cur[s + len] = 0;
      place(k + 1, Math.min(n, s + len + 1));
    }
  };
  place(0, 0);
  if (!found) return null;
  return line.map((v, i) => (v !== -1 ? v : canFill[i] && !canEmpty[i] ? 1 : canEmpty[i] && !canFill[i] ? 0 : -1));
}

export function lineSolve(rows, cols) {
  const h = rows.length;
  const w = cols.length;
  const g = new Array(w * h).fill(-1);
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < h; r++) {
      const line = g.slice(r * w, r * w + w);
      const res = solveLine(rows[r], line);
      if (!res) return null;
      for (let c = 0; c < w; c++) {
        if (res[c] !== line[c]) {
          g[r * w + c] = res[c];
          changed = true;
        }
      }
    }
    for (let c = 0; c < w; c++) {
      const line = Array.from({ length: h }, (_, r) => g[r * w + c]);
      const res = solveLine(cols[c], line);
      if (!res) return null;
      for (let r = 0; r < h; r++) {
        if (res[r] !== line[r]) {
          g[r * w + c] = res[r];
          changed = true;
        }
      }
    }
  }
  return g.includes(-1) ? null : g;
}

export function cluesFor(solution, n = NONO_SIZE) {
  return {
    rows: Array.from({ length: n }, (_, r) => cluesOf(rowOf(solution, r, n))),
    cols: Array.from({ length: n }, (_, c) => cluesOf(colOf(solution, c, n))),
  };
}

export function generateNonogram(rng = Math.random, n = NONO_SIZE, attempts = 400) {
  let last = null;
  for (let a = 0; a < attempts; a++) {
    const density = 0.52 + rng() * 0.12;
    const solution = Array.from({ length: n * n }, () => (rng() < density ? 1 : 0));
    const { rows, cols } = cluesFor(solution, n);
    if (rows.some((c) => !c.length) || cols.some((c) => !c.length)) continue;
    last = { solution, rows, cols, unique: false };
    if (lineSolve(rows, cols)) return { ...last, unique: true };
  }
  return last;
}

const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

export function isNonoSolved(cells, rows, cols) {
  const n = rows.length;
  for (let r = 0; r < n; r++) if (!same(cluesOf(rowOf(cells, r, n)), rows[r])) return false;
  for (let c = 0; c < n; c++) if (!same(cluesOf(colOf(cells, c, n)), cols[c])) return false;
  return true;
}

export function lineDone(cells, clue, which, i, n = NONO_SIZE) {
  const line = which === "row" ? rowOf(cells, i, n) : colOf(cells, i, n);
  return same(cluesOf(line), clue);
}
