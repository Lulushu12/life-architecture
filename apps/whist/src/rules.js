// Rules & scoring for Romanian Whist and Rentz.
// Everything that varies between tables lives in a game's `config`,
// captured at game creation from these editable defaults.

export const WHIST_DEFAULT_CONFIG = (playerCount) => ({
  order: "ones", // "ones" = 1..8..1, "eights" = 8..1..8
  onesCount: playerCount,
  eightsCount: playerCount,
  successBase: 5,
  successPerTrick: 1,
  failBase: 0,
  failPerTrick: 1,
  streaksEnabled: true,
  streakLen: 5,
  streakBonus: 10,
  streakMalus: 10,
  streakSkipOnes: false,
  forbidEqualSum: true, // last bidder cannot make the bid sum equal the cards
});

export function whistSequence(cfg) {
  const up = [2, 3, 4, 5, 6, 7];
  const down = [7, 6, 5, 4, 3, 2];
  const ones = Array(cfg.onesCount).fill(1);
  const eights = Array(cfg.eightsCount).fill(8);
  return cfg.order === "eights"
    ? [...eights, ...down, ...ones, ...up, ...eights]
    : [...ones, ...up, ...eights, ...down, ...ones];
}

const full = (arr, n) => Array.isArray(arr) && arr.length === n && arr.every((x) => x != null);

// Derives the whole score sheet from config + raw round entries, so editing
// any past round automatically recomputes everything after it.
export function computeWhist(game) {
  const n = game.players.length;
  const cfg = game.config;
  const seq = whistSequence(cfg);
  const cum = Array(n).fill(0);
  const okStreak = Array(n).fill(0);
  const badStreak = Array(n).fill(0);
  const rows = game.rounds.map((r, i) => {
    const cards = seq[i];
    const dealer = (game.firstDealer + i) % n;
    const row = {
      cards,
      dealer,
      bids: r.bids || null,
      taken: r.taken || null,
      pts: Array(n).fill(null),
      bonus: Array(n).fill(0),
      ok: Array(n).fill(null),
      cum: null,
    };
    if (full(row.bids, n) && full(row.taken, n)) {
      for (let p = 0; p < n; p++) {
        const hit = row.bids[p] === row.taken[p];
        row.ok[p] = hit;
        let pts = hit
          ? cfg.successBase + row.bids[p] * cfg.successPerTrick
          : -(cfg.failBase + Math.abs(row.taken[p] - row.bids[p]) * cfg.failPerTrick);
        const counts = !(cfg.streakSkipOnes && cards === 1);
        if (counts && hit) {
          okStreak[p]++;
          badStreak[p] = 0;
        } else if (counts) {
          badStreak[p]++;
          okStreak[p] = 0;
        }
        if (cfg.streaksEnabled && counts) {
          if (okStreak[p] === cfg.streakLen) {
            row.bonus[p] = cfg.streakBonus;
            okStreak[p] = 0;
          } else if (badStreak[p] === cfg.streakLen) {
            row.bonus[p] = -cfg.streakMalus;
            badStreak[p] = 0;
          }
        }
        pts += row.bonus[p];
        row.pts[p] = pts;
        cum[p] += pts;
      }
      row.cum = [...cum];
    }
    return row;
  });
  const completeRounds = rows.filter((r) => r.cum).length;
  return {
    seq,
    rows,
    totals: cum,
    okStreak,
    badStreak,
    completeRounds,
    done: completeRounds === seq.length,
  };
}

// ---------------------------------------------------------------- Rentz ----

// The deck holds 2N cards per suit (8 cards per player → 8 tricks per hand).
// Default values follow the standard Romanian Rentz scoring.
export const RENTZ_GAME_DEFS = (n) => [
  { id: "whist", name: "Whist", type: "units", units: 8, value: 50, enabled: true },
  { id: "king", name: "Popa de roșu", type: "single", value: -200, enabled: true },
  { id: "tenclubs", name: "10 de treflă", type: "single", value: 200, enabled: true },
  { id: "queens", name: "Damele", type: "units", units: 4, value: -40, enabled: true },
  { id: "diamonds", name: "Caro", type: "units", units: 2 * n, value: -30, enabled: true },
  { id: "tricks", name: "Levata", type: "units", units: 8, value: -50, enabled: true },
  { id: "totale", name: "Totale", type: "totale", members: ["king", "queens", "diamonds", "tricks"], enabled: true },
  { id: "rentz", name: "Rentz", type: "positions", values: [400, 200, 100, 0, 0, 0].slice(0, n), enabled: true },
];

export const TOTALE_CANDIDATES = ["king", "queens", "diamonds", "tricks", "tenclubs"];

export function totaleMembers(def, byId) {
  if (Array.isArray(def?.members)) return def.members.filter((id) => byId[id] && byId[id].type !== "totale");
  return ["king", ...(byId.last ? ["last"] : []), "queens", "tricks", "diamonds"].filter((id) => byId[id]);
}

export const resizePositions = (vals, n) => {
  const base = [400, 200, 100, 0, 0, 0, 0, 0];
  const neg = vals.length > 1 && vals[vals.length - 1] < 0;
  const k = neg ? n - 1 : n;
  const v = (neg ? vals.slice(0, -1) : vals).slice(0, k);
  while (v.length < k) v.push(base[v.length] ?? 0);
  if (neg) v.push(vals[vals.length - 1]);
  return v;
};

export const DEALER_OPTIONS = [
  ["right", "Right of chooser"],
  ["left", "Left of chooser"],
];

export function rentzDealer(cfg, chooser, n) {
  if (cfg?.dealer === "right") return (chooser + 1) % n;
  if (cfg?.dealer === "left") return (chooser + n - 1) % n;
  return null;
}

export function handPoints(def, data, n, defs) {
  const pts = Array(n).fill(0);
  if (!def || !data) return pts;
  const byId = Object.fromEntries(defs.map((d) => [d.id, d]));
  const val = (id) => Number(byId[id]?.value) || 0;
  const single = (id, playerIdx) => {
    if (Number.isInteger(playerIdx) && playerIdx >= 0 && playerIdx < n) pts[playerIdx] += val(id);
  };
  const units = (id, arr) =>
    (Array.isArray(arr) ? arr : []).slice(0, n).forEach((u, p) => {
      pts[p] += (Number(u) || 0) * val(id);
    });
  switch (def.type) {
    case "single":
      single(def.id, data.playerIdx);
      break;
    case "units":
      units(def.id, data.units);
      break;
    case "positions":
      (Array.isArray(data.order) ? data.order : []).forEach((p, pos) => {
        if (p >= 0 && p < n) pts[p] += def.values?.[pos] ?? 0;
      });
      break;
    case "totale":
      for (const id of totaleMembers(def, byId)) {
        if (byId[id].type === "single") single(id, data[id]);
        else if (byId[id].type === "units") units(id, data[id]);
      }
      break;
  }
  return pts;
}

export function computeRentz(game) {
  const n = game.players.length;
  const defs = game.config.games;
  const enabled = defs.filter((d) => d.enabled);
  const cum = Array(n).fill(0);
  const rows = game.hands.map((h) => {
    const def = defs.find((d) => d.id === h.gameId);
    const pts = handPoints(def, h.data, n, defs);
    for (let p = 0; p < n; p++) cum[p] += pts[p];
    return { chooser: h.chooserIdx, def, data: h.data, pts, cum: [...cum] };
  });
  const used = new Set(game.hands.map((h) => `${h.chooserIdx}:${h.gameId}`));
  const totalHands = n * enabled.length;
  return {
    rows,
    totals: cum,
    used,
    enabled,
    nextChooser: (game.firstChooser + game.hands.length) % n,
    handsPlayed: game.hands.length,
    totalHands,
    done: game.hands.length === totalHands,
  };
}

export function ranks(totals) {
  return totals.map((t) => 1 + totals.filter((x) => x > t).length);
}

export const ordinal = (k) => {
  const tens = k % 100;
  if (tens >= 11 && tens <= 13) return `${k}th`;
  return k + ({ 1: "st", 2: "nd", 3: "rd" }[k % 10] || "th");
};

export const signed = (v) => (v > 0 ? `+${v}` : `${v}`);
