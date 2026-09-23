function mmss(s) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export const formatElapsed = (seconds) => mmss(Math.max(0, Math.floor(seconds || 0)));

export const formatCountdown = (seconds) => mmss(Math.max(0, Math.ceil((seconds || 0) - 1e-9)));

export const formatMinutes = (seconds) => {
  const m = Math.round((seconds || 0) / 60);
  return `${m} min`;
};

export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
