// One localStorage key, written through on every state change — killing the
// app never loses a game, a review, or a setting.

const KEY = "chess-v1";

export const DEFAULT_SETTINGS = {
  theme: "brown", // board theme id
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
        settings: { ...fresh.settings, ...s.settings, ai: { ...fresh.settings.ai, ...(s.settings.ai || {}) } },
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

export function exportStore(store) {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `chess-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
