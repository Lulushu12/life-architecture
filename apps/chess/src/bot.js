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

  // Sub-1320: node-starved search plus an explicit human error model.
  //
  // The old version sampled from the top 5 full-strength lines inside a hard
  // tolerance window (~100cp at 1200), which made hanging a piece literally
  // impossible — the bots played like ~1900s with small inaccuracies. Real
  // low-rated players lose games to a handful of large blunders, so:
  //  - the search itself is starved of nodes (misses deep tactics naturally,
  //    the way humans do, instead of curating a 3000-strength engine's list);
  //  - each move rolls a rating-dependent blunder: play something OUTSIDE the
  //    engine's top candidates entirely;
  //  - otherwise sample candidates by a softmax over centipawn loss, with no
  //    hard cap — a 300cp "mistake" in the list stays possible, just unlikely.
  const r = await engine.analyze(fen, { nodes: nodesForElo(elo), multipv: 8 });
  const lines = r.lines;
  if (lines.length === 0) return r.bestmove;

  const legal = new Chess(fen).moves({ verbose: true });
  if (Math.random() < blunderChance(elo) && legal.length > 3) {
    const top = new Set(lines.slice(0, 3).map((l) => l.move));
    const outside = legal
      .map((m) => m.from + m.to + (m.promotion || ""))
      .filter((u) => !top.has(u));
    if (outside.length > 0) return outside[Math.floor(Math.random() * outside.length)];
  }

  if (lines.length === 1) return r.bestmove;
  const bestScore = scoreOf(lines[0]);
  // softmax temperature: ~185cp at 800 down to ~65cp at 1300
  const temp = 60 + (UCI_ELO_MIN - elo) * 0.24;
  const weights = lines.map((l) => {
    let w = Math.exp(-Math.max(0, bestScore - scoreOf(l)) / temp);
    if (style.aggression > 0.5 && isTactical(fen, l.move)) w *= 1 + style.aggression;
    return w;
  });
  let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lines.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return lines[i].move;
  }
  return lines[lines.length - 1].move;
}

// Search budget for the sub-1320 tiers: ~600 nodes at 800 Elo, doubling every
// 125 points (~9,600 at 1300). Node counts, not movetime, so the strength is
// the same on a fast desktop and a throttled phone.
function nodesForElo(elo) {
  return Math.round(600 * Math.pow(2, (elo - 800) / 125));
}

// Chance per move of an outright blunder — a move outside the engine's top
// candidates. ~14% at 800 Elo tapering to ~3% at 1300, in the neighborhood of
// blunder rates in real low-rated online games.
function blunderChance(elo) {
  return 0.03 + Math.max(0, UCI_ELO_MIN - elo) * (0.11 / 520);
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
