// "What is the opponent threatening?" from a null-move probe: the engine
// searches the position with the turn handed to the opponent, and a line
// counts as a threat only if letting the opponent play it would cost the
// side to move real winning chances compared with the current evaluation.

import { cpWhite, winPct } from "../engine.js";

export const THREAT_MIN_DROP = 10; // win-chance points; the mistake threshold
const BAND = 120; // only lines close to the opponent's best idea

/**
 * @param lines        engine lines from the null-move position (UCI convention)
 * @param nullFenTurn  side to move in the null-move position (the opponent)
 * @param currentCp    White-perspective eval of the real position, or null
 * @returns up to `max` threats as [from, to] pairs, strongest first
 */
export function threatsFromProbe(lines, nullFenTurn, currentCp, { max = 2, minDrop = THREAT_MIN_DROP } = {}) {
  if (currentCp == null || !lines?.length) return [];
  const mySign = nullFenTurn === "w" ? -1 : 1; // the real side to move is the other one
  const best = cpWhite(lines[0], nullFenTurn);
  const before = winPct(currentCp * mySign);
  return lines
    .filter((l) => {
      const after = cpWhite(l, nullFenTurn);
      if (Math.abs(after - best) >= BAND) return false;
      return before - winPct(after * mySign) >= minDrop;
    })
    .slice(0, max)
    .map((l) => [l.move.slice(0, 2), l.move.slice(2, 4)]);
}
