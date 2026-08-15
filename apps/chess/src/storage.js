// One localStorage key, written through on every state change — killing the
// app never loses a game, a review, or a setting.

const KEY = "chess-v1";

export const DEFAULT_SETTINGS = {
  theme: "brown", // board theme id
  pieces: "cburnett", // piece set id
  arrowColors: { hint: "#15803d", plan: "#e58f2a", threat: "#d02a2a" },
  botLang: "ro", // bot roster language: "ro" | "en"
  sounds: true,
  haptics: true,
  evalBar: true, // default for casual games; serious mode always hides it
  reviewMovetime: 400, // ms per position in game review
  ai: { baseUrl: "", apiKey: "", model: "" }, // optional OpenAI-compatible endpoint for live bot banter
};

function freshStore() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    botRecords: {}, // personaId -> {w,l,d}
    current: null, // in-progress game (any mode), see PlayBot/PassPlay for shape
    games: [], // archive entries {id,date,mode,personaId,playerColor,result,sans,startFen,review}
    puzzles: [], // {id,fen,bestSan,playedSan,personaId,date,solved}
    puzzleProgress: {}, // tierKey -> [solved puzzle ids] for the bundled sets
    lessonProgress: {}, // lessonId -> {step, completed, completedAt}
    editor: null, // last position built in the custom-position editor: {fen}
  };
}

export function loadStore() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === "object" && s.settings) {
      const fresh = freshStore();
      return {
        ...fresh,
        ...s,
        settings: {
          ...fresh.settings,
          ...s.settings,
          ai: { ...fresh.settings.ai, ...(s.settings.ai || {}) },
          arrowColors: { ...fresh.settings.arrowColors, ...(s.settings.arrowColors || {}) },
        },
      };
    }
  } catch {
    /* corrupted store falls through to a fresh one */
  }
  return freshStore();
}

export function saveStore(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* quota exceeded: keep running from memory */
  }
}

export function newId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

