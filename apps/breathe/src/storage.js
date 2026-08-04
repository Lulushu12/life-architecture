// Everything lives in one localStorage key, written through on every state
// change — killing the app or rebooting the phone never loses a session.

const KEY = "breathe-v1";

const DEFAULT_STORE = {
  settings: {
    rounds: 3,
    breathsPerRound: 30,
    secondsPerBreath: 3.5,
    recoverySeconds: 15,
    soundOn: true,
  },
  meditationSettings: {
    durationMinutes: 10,
    bellIntervalMinutes: 0,
  },
  history: [],
};

export function loadStore() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === "object" && Array.isArray(s.history)) {
      return {
        settings: { ...DEFAULT_STORE.settings, ...s.settings },
        meditationSettings: { ...DEFAULT_STORE.meditationSettings, ...s.meditationSettings },
        history: s.history,
      };
    }
  } catch {
    /* corrupted store falls through to a fresh one */
  }
  return { ...DEFAULT_STORE };
}

export function saveStore(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* quota errors: nothing sensible to do, data stays in memory */
  }
}

export function newId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
