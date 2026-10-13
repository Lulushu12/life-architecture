// App look: the accent colour and the display face (headings and big
// numbers). Board themes and piece sets are separate and live in Board.jsx.

export const ACCENTS = [
  { id: "teal", name: "Teal", hex: "#3fb3a4", ink: "#071d1a" },
  { id: "plum", name: "Plum", hex: "#a58be0", ink: "#15110f" },
  { id: "copper", name: "Copper", hex: "#d98a4e", ink: "#1a0f07" },
  { id: "brass", name: "Brass", hex: "#e0b34a", ink: "#1a1406" },
];
export const DEFAULT_ACCENT = "teal";

const SYSTEM_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const BUILTIN_FONTS = [
  { id: "sora", name: "Sora", family: `"Sora", ${SYSTEM_STACK}` },
  { id: "system", name: "System", family: SYSTEM_STACK },
];
export const DEFAULT_FONT = "sora";

// A font file the user added is registered under its own family name.
export const customFamily = (id) => `chess-user-font-${id}`;

export function accentOf(id) {
  return ACCENTS.find((a) => a.id === id) || ACCENTS.find((a) => a.id === DEFAULT_ACCENT);
}

export function fontFamilyOf(id, customFonts = []) {
  if (typeof id === "string" && id.startsWith("custom:")) {
    const f = customFonts.find((c) => `custom:${c.id}` === id);
    if (f) return `"${customFamily(f.id)}", ${SYSTEM_STACK}`;
  }
  return (BUILTIN_FONTS.find((f) => f.id === id) || BUILTIN_FONTS[0]).family;
}

function rgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** CSS custom properties for the chosen look. */
export function appearanceVars(settings, customFonts = []) {
  const a = accentOf(settings?.accent);
  return {
    "--accent": a.hex,
    "--accent-ink": a.ink,
    "--accent-tint": rgba(a.hex, 0.16),
    "--accent-line": rgba(a.hex, 0.55),
    "--display": fontFamilyOf(settings?.displayFont || DEFAULT_FONT, customFonts),
  };
}

export function applyAppearance(settings, customFonts = [], root = document.documentElement) {
  for (const [k, v] of Object.entries(appearanceVars(settings, customFonts))) root.style.setProperty(k, v);
}

// WCAG 2 contrast ratio between two #rrggbb colours.
export function contrast(a, b) {
  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
