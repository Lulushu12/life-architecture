import { newId } from "./storage.js";
import { isSerious } from "./helpLevels.js";

// A fresh bot game. `assist` records why it isn't clean (null = clean so far).
export function newBotGame({ personaId, playerColor, help, startFen = null }) {
  return {
    id: newId(),
    mode: "bot",
    personaId,
    playerColor,
    serious: isSerious(help),
    help,
    assist: isSerious(help) ? null : "help",
    startFen,
    sans: [],
    chat: [],
    cps: [0],
    status: "playing",
    result: null,
    createdAt: Date.now(),
  };
}

/** The most recent finished game against a bot, or null. */
export function lastBotGame(games) {
  let best = null;
  for (const g of games || []) if (g.mode === "bot" && (!best || (g.date || 0) > (best.date || 0))) best = g;
  return best;
}
