// All three games live in one localStorage key, written through on every
// state change — killing the app or rebooting the phone never loses anything.

const KEY = "games-v1";

function freshStore() {
  return {
    chess: null, // { presetLabel, minutes, incrementSec, running state... } or null
    sudoku: null, // { difficulty, givens, entries, pencil, elapsed, ... } or null
    crypto: {
      progress: {}, // puzzleId -> { mapping, guesses, solved, elapsedMs, startedAt }
    },
  };
}

export function loadStore() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === "object") {
      const fresh = freshStore();
      return { ...fresh, ...s, crypto: { ...fresh.crypto, ...(s.crypto || {}) } };
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
    /* quota errors: nothing sensible to do, data stays in memory */
  }
}
