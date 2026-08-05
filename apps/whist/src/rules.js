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

const full = (arr, n) =>
  Array.isArray(arr) && arr.length === n && arr.every((x) => x != null);

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
        if (hit) {
          okStreak[p]++;
          badStreak[p] = 0;
        } else {
          badStreak[p]++;
          okStreak[p] = 0;
        }
        if (cfg.streaksEnabled) {
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
  { id: "totale", name: "Totale", type: "totale", enabled: true },
  { id: "rentz", name: "Rentz", type: "positions", values: [400, 200, 100, 0, 0, 0].slice(0, n), enabled: true },
];

export const resizePositions = (vals, n) => {
  const base = [400, 200, 100, 0, 0, 0];
  const v = vals.slice(0, n);
  while (v.length < n) v.push(base[v.length] ?? 0);
  return v;
};

export function handPoints(def, data, n, defs) {
  const pts = Array(n).fill(0);
  if (!def || !data) return pts;
  const byId = Object.fromEntries(defs.map((d) => [d.id, d]));
  const single = (id, playerIdx) => {
    if (playerIdx != null) pts[playerIdx] += byId[id].value;
  };
  const units = (id, arr) =>
    (arr || []).forEach((u, p) => {
      pts[p] += (u || 0) * byId[id].value;
    });
  switch (def.type) {
    case "single":
      single(def.id, data.playerIdx);
      break;
    case "units":
      units(def.id, data.units);
      break;
    case "positions":
      (data.order || []).forEach((p, pos) => {
        pts[p] += def.values[pos] ?? 0;
      });
      break;
    case "totale":
      // Totale combines the negative games. Old saved games may still carry
      // an "Ultima levată" def — honor it so their history recomputes intact.
      single("king", data.king);
      if (byId.last && data.last != null) single("last", data.last);
      units("queens", data.queens);
      units("tricks", data.tricks);
      units("diamonds", data.diamonds);
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
