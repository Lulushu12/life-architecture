import { addDays } from "@shared/store.js";
import { seededRng } from "./rng.js";
import { PUZZLES } from "./cryptogramPuzzles.js";
import { randomDerangement } from "./cryptogram.js";

export const DAILY_SUDOKU_DIFFICULTY = "medium";
export const DAILY_PREFIX = "d:";

export const dailySudokuSeed = (day) => `sudoku:${day}`;
export const dailyCryptoId = (day) => `${DAILY_PREFIX}${day}`;
export const isDailyCryptoId = (id) => typeof id === "string" && id.startsWith(DAILY_PREFIX);
export const dayOfDailyId = (id) => id.slice(DAILY_PREFIX.length);

export function dailyCryptoPuzzle(day) {
  const rng = seededRng(`crypto-pick:${day}`);
  const p = PUZZLES[Math.floor(rng() * PUZZLES.length)];
  return { id: dailyCryptoId(day), text: p.text, attribution: p.attribution, daily: day };
}

export function dailyCryptoPerm(day) {
  return randomDerangement(seededRng(`crypto:${day}`));
}

export function dayState(entry) {
  const n = (entry?.sudoku != null ? 1 : 0) + (entry?.crypto != null ? 1 : 0);
  return n === 2 ? "full" : n === 1 ? "half" : "none";
}

export function dailyStreak(daily, today) {
  let day = dayState(daily[today]) === "full" ? today : addDays(today, -1);
  let n = 0;
  while (dayState(daily[day]) === "full") {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

export function lastDays(today, count) {
  const out = [];
  for (let i = count - 1; i >= 0; i--) out.push(addDays(today, -i));
  return out;
}
