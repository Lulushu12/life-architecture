import { readEvents } from "@shared/bridge.js";

export const APPS = [
  { id: "focus", name: "Focus", key: "focus-v1", glyph: "◔" },
  { id: "breathe", name: "Breathe", key: "breathe-v1", glyph: "◌" },
  { id: "calories", name: "Calories", key: "calories-v1", glyph: "▦" },
  { id: "games", name: "Games", key: "games-v1", glyph: "▣" },
  { id: "chess", name: "Chess", key: "chess-v1", glyph: "♞" },
  { id: "whist", name: "Whist", key: "whist-rentz-v1", glyph: "♠" },
  { id: "ortho", name: "Ortho", key: "ortho-v1", glyph: "✚" },
];

const TIME_KEY = /(at|time|ts|date|updated|created|started|ended|saved|last)$/i;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function fromDateKey(k) {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d, 12).getTime();
}

function scanTimestamp(root) {
  const now = Date.now() + 86400000;
  const min = Date.UTC(2020, 0, 1);
  let best = 0;
  let budget = 20000;
  const ok = (t) => t >= min && t <= now;
  const visit = (node, key) => {
    if (budget-- <= 0 || node == null) return;
    if (typeof node === "number") {
      if (key && TIME_KEY.test(key) && ok(node) && node > best) best = node;
      return;
    }
    if (typeof node === "string") {
      if (key && TIME_KEY.test(key) && /^\d{4}-\d{2}-\d{2}/.test(node)) {
        const t = node.length === 10 ? fromDateKey(node) : Date.parse(node);
        if (ok(t) && t > best) best = t;
      }
      return;
    }
    if (Array.isArray(node)) { for (const v of node) visit(v, key); return; }
    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        if (DATE_KEY.test(k)) {
          const t = fromDateKey(k);
          if (ok(t) && t > best) best = t;
        }
        visit(v, k);
      }
    }
  };
  visit(root, null);
  return best;
}

export function lastUsed(app, events) {
  let best = 0;
  try {
    const raw = localStorage.getItem(app.key);
    if (raw) best = scanTimestamp(JSON.parse(raw));
  } catch { /* unreadable store */ }
  for (const e of events) if (e.app === app.id && e.at > best) best = e.at;
  return best || null;
}

export function appsWithLastUsed() {
  const events = readEvents();
  return APPS.map(a => ({ ...a, lastUsed: lastUsed(a, events) }));
}

export function relativeTime(ts, now = Date.now()) {
  const diff = Math.max(0, now - ts);
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "yesterday";
  if (d < 14) return `${d} days ago`;
  const w = Math.round(d / 7);
  if (w < 9) return `${w} weeks ago`;
  return `${Math.round(d / 30)} months ago`;
}
