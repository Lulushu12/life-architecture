// UCI wrapper around the Stockfish 16 NNUE single-threaded WASM worker.
// One Engine instance = one worker. All requests are serialized through a
// queue: only one `go` runs at a time.
//
// Engine files live in public/engine/ (GPLv3 — see LICENSE-GPL3.txt there);
// the ~39MB NNUE net is fetched once and then served from the SW cache.

const ENGINE_URL = import.meta.env.BASE_URL + "engine/stockfish-nnue-16-single.js";

export class Engine {
  constructor() {
    this.worker = new Worker(ENGINE_URL);
    this.listeners = new Set();
    this.queue = Promise.resolve();
    this.worker.onmessage = (e) => {
      const line = String(e.data);
      for (const fn of this.listeners) fn(line);
    };
    this.ready = this._init();
  }

  _init() {
    return new Promise((resolve) => {
      const onLine = (line) => {
        if (line === "readyok") {
          this.listeners.delete(onLine);
          resolve();
        }
      };
      this.listeners.add(onLine);
      this.send("uci");
      this.send("setoption name Use NNUE value true");
      this.send("setoption name EvalFile value nn-5af11540bbfe.nnue");
      this.send("isready");
    });
  }

  send(cmd) {
    this.worker.postMessage(cmd);
  }

  // Serialize engine jobs; each job gets exclusive use of the worker.
  _run(job) {
    const next = this.queue.then(job, job);
    // keep the chain alive even if a job rejects
    this.queue = next.catch(() => {});
    return next;
  }

  /**
   * Analyze a position. Returns { lines, bestmove } where lines is an array
   * (index 0 = best) of { move, cp, mate, pv } with scores from the
   * side-to-move's perspective (UCI convention).
   */
  analyze(fen, { movetime = 400, depth = null, multipv = 1, elo = null, skill = null } = {}) {
    return this._run(
      () =>
        new Promise((resolve) => {
          const lines = new Array(multipv).fill(null);
          const onLine = (raw) => {
            if (raw.startsWith("info ") && raw.includes(" pv ")) {
              const info = parseInfo(raw);
              if (info && info.multipv >= 1 && info.multipv <= multipv)
                lines[info.multipv - 1] = info;
            } else if (raw.startsWith("bestmove")) {
              this.listeners.delete(onLine);
              const bestmove = raw.split(" ")[1];
              resolve({ bestmove, lines: lines.filter(Boolean) });
            }
          };
          this.listeners.add(onLine);
          this.send("setoption name MultiPV value " + multipv);
          if (elo != null) {
            this.send("setoption name UCI_LimitStrength value true");
            this.send("setoption name UCI_Elo value " + elo);
          } else {
            this.send("setoption name UCI_LimitStrength value false");
          }
          this.send("setoption name Skill Level value " + (skill != null ? skill : 20));
          this.send("position fen " + fen);
          this.send(depth ? "go depth " + depth : "go movetime " + movetime);
        })
    );
  }

  stopCurrent() {
    this.send("stop");
  }

  destroy() {
    this.worker.terminate();
  }
}

function parseInfo(raw) {
  const t = raw.split(" ");
  const info = { multipv: 1, cp: null, mate: null, depth: 0, pv: [] };
  for (let i = 0; i < t.length; i++) {
    if (t[i] === "multipv") info.multipv = parseInt(t[i + 1], 10);
    else if (t[i] === "depth") info.depth = parseInt(t[i + 1], 10);
    else if (t[i] === "score") {
      if (t[i + 1] === "cp") info.cp = parseInt(t[i + 2], 10);
      else if (t[i + 1] === "mate") info.mate = parseInt(t[i + 2], 10);
    } else if (t[i] === "pv") {
      info.pv = t.slice(i + 1);
      break;
    }
  }
  if (info.pv.length === 0) return null;
  info.move = info.pv[0];
  return info;
}

// ---- shared score helpers ----

// Score (side-to-move perspective) → centipawns from WHITE's perspective.
export function cpWhite(info, fenTurn) {
  const raw = info.mate != null ? (info.mate > 0 ? 10000 - info.mate : -10000 - info.mate) : info.cp;
  return fenTurn === "w" ? raw : -raw;
}

// Win probability (0..100) for white from a white-perspective cp score.
// Same logistic model lichess publishes.
export function winPct(cp) {
  const clamped = Math.max(-10000, Math.min(10000, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * clamped)) - 1);
}

let sharedEngine = null;
export function getEngine() {
  if (!sharedEngine) sharedEngine = new Engine();
  return sharedEngine;
}
