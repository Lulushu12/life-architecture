// Bundled puzzle sets, loaded on demand from public/puzzles.json (~1MB) so the
// figure never lands in the JS bundle. The file ships inside the APK, so this
// resolves from local assets with no network.
//
// Lichess convention, preserved from the source data: `f` is the position
// *before* the opponent's move, and `m[0]` is that move. It is played
// automatically to reach the position the solver actually sees; the solver
// then answers with m[1], the opponent replies m[2], and so on.

let cache = null;
let inflight = null;

export async function loadPuzzleDb() {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetch(`${import.meta.env.BASE_URL}puzzles.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`puzzles.json: ${r.status}`);
        return r.json();
      })
      .then((db) => {
        cache = db;
        inflight = null;
        return db;
      })
      .catch((e) => {
        inflight = null;
        throw e;
      });
  }
  return inflight;
}

// Tier metadata is needed to render the hub before the (larger) puzzle payload
// has loaded, so it is duplicated here rather than read from the JSON.
export const TIERS = [
  { key: "starter", label: "Starter", blurb: "First tactics, one clear idea", range: "under 1000" },
  { key: "easy", label: "Easy", blurb: "Forks, pins, back rank", range: "1000–1300" },
  { key: "medium", label: "Medium", blurb: "Two-move combinations", range: "1300–1600" },
  { key: "hard", label: "Hard", blurb: "Quiet moves and deflections", range: "1600–1900" },
  { key: "brutal", label: "Brutal", blurb: "Deep or counter-intuitive", range: "1900–2200" },
  { key: "expert", label: "Expert", blurb: "Master-level calculation", range: "2200+" },
];

// Themes worth offering as a filter, in the order they should be listed.
export const THEME_LABELS = {
  mateIn1: "Mate in 1",
  mateIn2: "Mate in 2",
  mateIn3: "Mate in 3",
  fork: "Fork",
  pin: "Pin",
  skewer: "Skewer",
  discoveredAttack: "Discovered attack",
  doubleCheck: "Double check",
  sacrifice: "Sacrifice",
  deflection: "Deflection",
  attraction: "Attraction",
  clearance: "Clearance",
  interference: "Interference",
  xRayAttack: "X-ray",
  zugzwang: "Zugzwang",
  trappedPiece: "Trapped piece",
  hangingPiece: "Hanging piece",
  backRankMate: "Back rank mate",
  smotheredMate: "Smothered mate",
  promotion: "Promotion",
  underPromotion: "Underpromotion",
  enPassant: "En passant",
  capturingDefender: "Remove the defender",
  quietMove: "Quiet move",
  defensiveMove: "Defensive move",
  intermezzo: "In-between move",
  advancedPawn: "Advanced pawn",
  endgame: "Endgame",
  middlegame: "Middlegame",
  rookEndgame: "Rook endgame",
  pawnEndgame: "Pawn endgame",
  queenEndgame: "Queen endgame",
  bishopEndgame: "Bishop endgame",
  knightEndgame: "Knight endgame",
};

/** Solved ids for a tier, as a Set. */
export function solvedSet(store, tierKey) {
  return new Set(store.puzzleProgress?.[tierKey] || []);
}

export const RATING_START = 1200;
const DAY = 86400000;
export const SRS_DAYS = [1, 3, 7, 21];

export function getRating(store) {
  const pr = store.puzzleRating;
  return { r: Math.round(pr?.r ?? RATING_START), n: pr?.n ?? 0 };
}

export function rateResult(pr, puzzleRating, ok) {
  const r = pr?.r ?? RATING_START;
  const n = pr?.n ?? 0;
  const k = n < 30 ? 32 : 16;
  const expected = 1 / (1 + Math.pow(10, (puzzleRating - r) / 400));
  const delta = Math.round(k * ((ok ? 1 : 0) - expected));
  const history = [...(pr?.history || []), r + delta].slice(-60);
  return { next: { r: r + delta, n: n + 1, history }, delta };
}

export function nextPuzzle(list, excluded, theme, target = RATING_START) {
  const pool = (theme ? list.filter((p) => p.t.includes(theme)) : list).filter((p) => !excluded.has(p.i));
  if (!pool.length) return null;
  for (const w of [150, 300, 600]) {
    const near = pool.filter((p) => Math.abs(p.r - target) <= w);
    if (near.length) return near[Math.floor(Math.random() * near.length)];
  }
  const closest = [...pool].sort((a, b) => Math.abs(a.r - target) - Math.abs(b.r - target)).slice(0, 20);
  return closest[Math.floor(Math.random() * closest.length)];
}

const flatCache = new WeakMap();
export function allPuzzles(db) {
  if (!flatCache.has(db)) {
    const out = [];
    for (const t of TIERS) for (const p of db.puzzles[t.key] || []) out.push({ ...p, k: t.key });
    flatCache.set(db, out);
  }
  return flatCache.get(db);
}

export function allSolved(store) {
  const out = new Set();
  for (const ids of Object.values(store.puzzleProgress || {})) for (const id of ids) out.add(id);
  return out;
}

export function srsNext(entry, ok, now = Date.now()) {
  if (!ok) return { step: 0, due: now + SRS_DAYS[0] * DAY };
  if (!entry) return null;
  const step = (entry.step ?? 0) + 1;
  if (step >= SRS_DAYS.length) return null;
  return { step, due: now + SRS_DAYS[step] * DAY };
}

export function dueItems(store, now = Date.now()) {
  const tier = Object.entries(store.puzzleSrs || {})
    .filter(([, e]) => e.due <= now)
    .map(([key, e]) => ({ kind: "tier", key, ...e }));
  const blunders = store.puzzles
    .filter((p) => p.srs && p.srs.due <= now)
    .map((p) => ({ kind: "blunder", key: `b:${p.id}`, id: p.id, due: p.srs.due }));
  return [...tier, ...blunders].sort((a, b) => a.due - b.due);
}

function lineScore(l) {
  if (l.mate != null) return l.mate > 0 ? 10000 - l.mate : -10000 - l.mate;
  return l.cp ?? 0;
}

export async function moveIsGoodEnough(engine, fen, playedUci, margin = 30) {
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 4000));
  const r = await Promise.race([engine.analyze(fen, { movetime: 200, multipv: 3, tag: "puzzle-check" }), timeout]);
  if (!r) {
    engine.cancel("puzzle-check");
    return false;
  }
  if (!r.lines?.length) return false;
  const best = lineScore(r.lines[0]);
  const hit = r.lines.find((l) => l.move === playedUci);
  return !!hit && best - lineScore(hit) <= margin;
}

/** Themes actually present in a tier, ordered by THEME_LABELS, with counts. */
export function themesIn(list) {
  const counts = new Map();
  for (const p of list) for (const t of p.t) counts.set(t, (counts.get(t) || 0) + 1);
  return Object.keys(THEME_LABELS)
    .filter((t) => counts.get(t) >= 8) // too few to be worth a filter chip
    .map((t) => ({ key: t, label: THEME_LABELS[t], count: counts.get(t) }));
}
