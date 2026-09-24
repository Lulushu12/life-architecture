export const PALETTE = [
  { bg: "#3987e5", ink: "#ffffff" },
  { bg: "#d95926", ink: "#ffffff" },
  { bg: "#199e70", ink: "#ffffff" },
  { bg: "#c98500", ink: "#1a1204" },
  { bg: "#d55181", ink: "#ffffff" },
  { bg: "#008300", ink: "#ffffff" },
  { bg: "#9085e9", ink: "#12102a" },
  { bg: "#e66767", ink: "#1d0808" },
];

export const defaultColors = (n) => Array.from({ length: n }, (_, i) => i % PALETTE.length);

export function colorIdx(game, i) {
  const c = game?.colors?.[i];
  return Number.isInteger(c) && c >= 0 && c < PALETTE.length ? c : i % PALETTE.length;
}

export const colorOf = (game, i) => PALETTE[colorIdx(game, i)].bg;

export function initials(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return Array.from(words[0])[0].toUpperCase();
  return (Array.from(words[0])[0] + Array.from(words[1])[0]).toUpperCase();
}

export function resizeColors(colors, n) {
  const out = colors.slice(0, n);
  while (out.length < n) {
    const free = PALETTE.findIndex((_, k) => !out.includes(k));
    out.push(free === -1 ? out.length % PALETTE.length : free);
  }
  return out;
}

export function cycleColor(colors, i) {
  const out = [...colors];
  for (let step = 1; step <= PALETTE.length; step++) {
    const c = (out[i] + step) % PALETTE.length;
    if (!out.some((x, j) => j !== i && x === c)) {
      out[i] = c;
      return out;
    }
  }
  return out;
}

export function validColors(colors, n) {
  return (
    Array.isArray(colors) &&
    colors.length === n &&
    colors.every((c) => Number.isInteger(c) && c >= 0 && c < PALETTE.length)
  );
}
