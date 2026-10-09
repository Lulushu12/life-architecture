// A stand-in for src/engine.js's Engine with the same analyze() shape.
// `respond(fen, opts, call)` returns { lines, bestmove } for each search, so
// tests decide exactly what "Stockfish" says and results are deterministic.

export class FakeEngine {
  constructor(respond) {
    this.respond = respond;
    this.calls = [];
    this.cancelled = [];
    this.ready = Promise.resolve();
  }

  async analyze(fen, opts = {}) {
    const call = this.calls.length;
    this.calls.push({ fen, ...opts });
    const out = await this.respond(fen, opts, call);
    const lines = out?.lines || [];
    return { lines, bestmove: out?.bestmove ?? lines[0]?.move ?? null };
  }

  cancel(tag) {
    this.cancelled.push(tag);
  }

  stopCurrent() {}

  destroy() {}
}

// One engine line in UCI convention (score from the side to move).
export function line(move, cp, { mate = null, pv = null, depth = 12 } = {}) {
  return { move, cp: mate == null ? cp : null, mate, pv: pv || [move], depth, multipv: 1 };
}

// Deterministic replacement for Math.random: cycles through `values`.
export function seqRandom(values) {
  let i = 0;
  return () => values[i++ % values.length];
}
