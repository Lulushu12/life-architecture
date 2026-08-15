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
  { key: "starter", label: "Starter", blurb: "First tactics — one clear idea", range: "under 1000" },
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

/** Next unsolved puzzle in a tier, optionally filtered by theme. */
export function nextPuzzle(list, solved, theme) {
  const pool = theme ? list.filter((p) => p.t.includes(theme)) : list;
  return pool.find((p) => !solved.has(p.i)) || null;
}

/** Themes actually present in a tier, ordered by THEME_LABELS, with counts. */
export function themesIn(list) {
  const counts = new Map();
  for (const p of list) for (const t of p.t) counts.set(t, (counts.get(t) || 0) + 1);
  return Object.keys(THEME_LABELS)
    .filter((t) => counts.get(t) >= 8) // too few to be worth a filter chip
    .map((t) => ({ key: t, label: THEME_LABELS[t], count: counts.get(t) }));
}
