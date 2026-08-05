// Bot move selection: maps a persona's Elo to engine settings, and below
// Stockfish's UCI_Elo floor (~1320) fakes human weakness by sampling from
// the engine's candidate moves (MultiPV) with persona-flavored weighting.

import { Chess } from "chess.js";

const UCI_ELO_MIN = 1320;
const UCI_ELO_MAX = 3190;

export function botMoveTime(elo) {
  if (elo >= 3000) return 900;
  if (elo >= 2200) return 500;
  if (elo >= 1320) return 300;
  return 180;
}

/**
 * Choose the bot's move for `fen`. Returns a UCI string.
 */
export async function chooseBotMove(engine, fen, persona) {
  const { elo, style } = persona;
  await engine.ready;

  if (elo >= 3000) {
    const r = await engine.analyze(fen, { movetime: botMoveTime(elo) });
    return r.bestmove;
  }

  if (elo >= UCI_ELO_MIN) {
    const r = await engine.analyze(fen, {
      movetime: botMoveTime(elo),
      elo: Math.min(UCI_ELO_MAX, elo),
    });
    return r.bestmove;
  }

  // Sub-1320: MultiPV sampling. Get candidates at modest depth, then pick
  // probabilistically — worse moves more likely the lower the Elo, capped
  // by a tolerance window so the bot stays coherent rather than random.
  const r = await engine.analyze(fen, { movetime: botMoveTime(elo), multipv: 5, skill: 5 });
  const lines = r.lines;
  if (lines.length <= 1) return r.bestmove;

  const bestScore = scoreOf(lines[0]);
  // tolerance: at 850 accept up to ~220cp worse, at 1300 only ~60cp.
  const tol = 60 + (UCI_ELO_MIN - elo) * 0.34;
  const candidates = lines.filter((l) => bestScore - scoreOf(l) <= tol);

  const weights = candidates.map((l, i) => {
    let w = 1 / (i + 1.2); // better lines still favored
    if (style.aggression > 0.5 && isTactical(fen, l.move)) w *= 1 + style.aggression;
    return w;
  });
  // low elo flattens the distribution further
  const flat = (UCI_ELO_MIN - elo) / (UCI_ELO_MIN - 700);
  const adj = weights.map((w) => w * (1 - flat) + flat);
  let roll = Math.random() * adj.reduce((a, b) => a + b, 0);
  for (let i = 0; i < candidates.length; i++) {
    roll -= adj[i];
    if (roll <= 0) return candidates[i].move;
  }
  return candidates[candidates.length - 1].move;
}

function scoreOf(line) {
  if (line.mate != null) return line.mate > 0 ? 9000 : -9000;
  return line.cp;
}

function isTactical(fen, uci) {
  try {
    const chess = new Chess(fen);
    const mv = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    return Boolean(mv.captured) || mv.san.includes("+");
  } catch {
    return false;
  }
}
