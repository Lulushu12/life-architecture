import { createStore } from "@shared/store.js";
import { mergeById } from "@shared/backup.js";
import { WHIST_DEFAULT_CONFIG, whistSequence } from "./rules.js";
import { validColors } from "./players.js";

export const KEY = "whist-rentz-v1";
export const RECENT_MAX = 12;

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isCount = (v) => Number.isInteger(v) && v >= 0;

export const isDefaultName = (name) => /^Player \d+$/.test(name);

function cleanNames(list) {
  const out = [];
  const seen = new Set();
  for (const raw of Array.isArray(list) ? list : []) {
    if (typeof raw !== "string") continue;
    const name = raw.trim();
    const k = name.toLowerCase();
    if (!name || isDefaultName(name) || seen.has(k)) continue;
    seen.add(k);
    out.push(name);
  }
  return out.slice(0, RECENT_MAX);
}

export function rememberPlayers(recent, players) {
  return cleanNames([...players, ...(recent || [])]);
}

function cleanEntries(arr, n, cards) {
  if (!Array.isArray(arr) || arr.length !== n) return undefined;
  if (!arr.every((x) => x == null || (isCount(x) && x <= cards))) return undefined;
  return arr.map((x) => (x == null ? null : x));
}

function repairWhist(g, n) {
  const config = { ...WHIST_DEFAULT_CONFIG(n), ...(isObj(g.config) ? g.config : {}) };
  if (!isCount(config.onesCount) || !isCount(config.eightsCount)) return null;
  const seq = whistSequence(config);
  const rounds = [];
  for (const r of g.rounds) {
    if (rounds.length >= seq.length || !isObj(r)) break;
    const cards = seq[rounds.length];
    const bids = cleanEntries(r.bids, n, cards);
    const taken = r.taken == null ? null : cleanEntries(r.taken, n, cards);
    if (!bids || taken === undefined) break;
    rounds.push(Number.isFinite(r.at) ? { bids, taken, at: r.at } : { bids, taken });
  }
  const firstDealer = isCount(g.firstDealer) && g.firstDealer < n ? g.firstDealer : 0;
  return { ...g, config, rounds, firstDealer };
}

function repairRentz(g, n) {
  if (!isObj(g.config) || !Array.isArray(g.config.games)) return null;
  const defs = g.config.games.filter((d) => isObj(d) && typeof d.id === "string" && typeof d.name === "string");
  if (!defs.length) return null;
  const ids = new Set(defs.map((d) => d.id));
  const hands = g.hands.filter(
    (h) => isObj(h) && ids.has(h.gameId) && isCount(h.chooserIdx) && h.chooserIdx < n && isObj(h.data)
  );
  const pending =
    isObj(g.pending) && ids.has(g.pending.gameId)
      ? { ...g.pending, data: isObj(g.pending.data) ? g.pending.data : {} }
      : null;
  const firstChooser = isCount(g.firstChooser) && g.firstChooser < n ? g.firstChooser : 0;
  return { ...g, config: { ...g.config, games: defs }, hands, pending, firstChooser };
}

export function repairGame(g) {
  if (!isObj(g) || typeof g.id !== "string" || !g.id) return null;
  if (!Array.isArray(g.players) || g.players.length < 2 || g.players.length > 8) return null;
  if (!g.players.every((p) => typeof p === "string")) return null;
  if (!isObj(g.config)) return null;
  const n = g.players.length;
  let fixed = null;
  if (g.type === "whist" && Array.isArray(g.rounds)) fixed = repairWhist(g, n);
  else if (g.type === "rentz" && Array.isArray(g.hands)) fixed = repairRentz(g, n);
  if (fixed && "colors" in fixed && !validColors(fixed.colors, n)) {
    const { colors, ...rest } = fixed;
    return rest;
  }
  return fixed;
}

function cleanGames(games) {
  const out = {};
  let dropped = 0;
  for (const [id, g] of Object.entries(isObj(games) ? games : {})) {
    const fixed = repairGame(g);
    if (fixed && fixed.id === id) out[id] = fixed;
    else dropped++;
  }
  return { games: out, dropped };
}

export function normalize(store) {
  return {
    ...store,
    games: cleanGames(store.games).games,
    recentPlayers: cleanNames(store.recentPlayers),
  };
}

export const storeDef = createStore({
  key: KEY,
  version: 1,
  defaults: () => ({ games: {}, recentPlayers: [] }),
  normalize,
});

export function validateBackup(d) {
  if (!isObj(d) || !isObj(d.games)) return { ok: false };
  const { games, dropped } = cleanGames(d.games);
  return { ok: true, dropped, data: { games, recentPlayers: cleanNames(d.recentPlayers) } };
}

export function mergeImport(store, imported) {
  return {
    ...store,
    games: mergeById(store.games, imported.games),
    recentPlayers: cleanNames([...(store.recentPlayers || []), ...(imported.recentPlayers || [])]),
  };
}
