import { createStore, newId as sharedNewId } from "@shared/store.js";

export const STORAGE_KEY = "chess-v1";
export const GAME_CAP = 50;

export const DEFAULT_SETTINGS = {
  theme: "brown", // board theme id
  pieces: "cburnett", // piece set id
  // board/coordinate overrides; null = the theme's (or app's) own default
  boardCustom: { light: null, dark: null, coordColor: null, coordFont: null },
  arrowColors: { hint: "#15803d", plan: "#e58f2a", threat: "#d02a2a" },
  botLang: "ro", // bot roster language: "ro" | "en"
  sounds: true,
  haptics: true,
  evalBar: true, // default for casual games; serious mode always hides it
  animMs: 200, // piece-slide animation duration; 0 = instant, no animation
  reviewMovetime: 400, // ms per position in game review
  ai: { baseUrl: "", apiKey: "", model: "" }, // optional OpenAI-compatible endpoint for live bot banter
};

function freshStore() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    botRecords: {}, // personaId -> {w,l,d}
    current: null, // in-progress game (any mode), see PlayBot/PassPlay for shape
    games: [], // archive entries {id,date,mode,personaId,playerColor,result,sans,startFen,review,favourite}
    puzzles: [], // {id,fen,bestSan,playedSan,personaId,date,solved}
    puzzleProgress: {}, // tierKey -> [solved puzzle ids] for the bundled sets
    lessonProgress: {}, // lessonId -> {step, completed, completedAt}
    editor: null, // last position built in the custom-position editor: {fen}
    capHits: 0, // how many games the 50-game cap has pruned so far
    puzzleRating: { r: 1200, n: 0, history: [] },
    puzzleBests: { rush: 0, streak: 0 },
    puzzleSrs: {},
    drillProgress: {},
  };
}

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

function validGame(g) {
  return isObj(g) && g.id != null && Array.isArray(g.sans) && g.sans.every((s) => typeof s === "string");
}

function validReview(r) {
  return isObj(r) && Array.isArray(r.moves) && Array.isArray(r.evals) && isObj(r.accuracy) && isObj(r.counts);
}

// Pruning order: reviewed games first (their review can be regenerated, the
// player already saw it), oldest first; favourites and protected ids never go.
export function capGames(games, protectedIds = []) {
  if (games.length <= GAME_CAP) return { games, pruned: 0 };
  const keep = new Set(protectedIds.filter((x) => x != null));
  const candidates = games
    .filter((g) => !g.favourite && !keep.has(g.id))
    .sort((a, b) => {
      const ra = a.review ? 0 : 1;
      const rb = b.review ? 0 : 1;
      if (ra !== rb) return ra - rb;
      return (a.date || 0) - (b.date || 0);
    });
  const drop = new Set(candidates.slice(0, games.length - GAME_CAP).map((g) => g.id));
  if (!drop.size) return { games, pruned: 0 };
  return { games: games.filter((g) => !drop.has(g.id)), pruned: drop.size };
}

export function capStore(s, protectedIds = []) {
  if (!Array.isArray(s.games) || s.games.length <= GAME_CAP) return s;
  const newest = s.games.reduce((a, g) => ((g.date || 0) > (a?.date || 0) ? g : a), null);
  const { games, pruned } = capGames(s.games, [...protectedIds, s.current?.id, newest?.id]);
  if (!pruned) return s;
  return { ...s, games, capHits: (s.capHits || 0) + pruned };
}

function normalize(s) {
  const fresh = freshStore();
  const settings = isObj(s.settings) ? s.settings : {};
  const out = {
    ...s,
    settings: {
      ...fresh.settings,
      ...settings,
      ai: { ...fresh.settings.ai, ...(isObj(settings.ai) ? settings.ai : {}) },
      arrowColors: { ...fresh.settings.arrowColors, ...(isObj(settings.arrowColors) ? settings.arrowColors : {}) },
      boardCustom: { ...fresh.settings.boardCustom, ...(isObj(settings.boardCustom) ? settings.boardCustom : {}) },
    },
    botRecords: isObj(s.botRecords) ? s.botRecords : {},
    games: (Array.isArray(s.games) ? s.games : [])
      .filter(validGame)
      .map((g) => (g.review && !validReview(g.review) ? { ...g, review: null } : g)),
    puzzles: (Array.isArray(s.puzzles) ? s.puzzles : []).filter((p) => isObj(p) && typeof p.fen === "string"),
    puzzleProgress: isObj(s.puzzleProgress) ? s.puzzleProgress : {},
    lessonProgress: isObj(s.lessonProgress) ? s.lessonProgress : {},
    current: isObj(s.current) && Array.isArray(s.current.sans) ? s.current : null,
    capHits: Number(s.capHits) || 0,
    puzzleRating: isObj(s.puzzleRating) && Number.isFinite(s.puzzleRating.r) ? s.puzzleRating : fresh.puzzleRating,
    puzzleBests: { ...fresh.puzzleBests, ...(isObj(s.puzzleBests) ? s.puzzleBests : {}) },
    puzzleSrs: isObj(s.puzzleSrs) ? s.puzzleSrs : {},
    drillProgress: isObj(s.drillProgress) ? s.drillProgress : {},
  };
  return capStore(out);
}

export const chessStore = createStore({ key: STORAGE_KEY, version: 1, defaults: freshStore, normalize });

export function validateBackup(d) {
  if (!isObj(d) || !isObj(d.settings) || !Array.isArray(d.games)) return false;
  const games = d.games.filter(validGame);
  return { ok: true, dropped: d.games.length - games.length, data: normalize({ ...freshStore(), ...d, games }) };
}

export const newId = sharedNewId;
