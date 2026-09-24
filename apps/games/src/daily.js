import { addDays } from "@shared/store.js";
import { seededRng } from "./rng.js";
import { PUZZLES } from "./cryptogramPuzzles.js";
import { randomDerangement } from "./cryptogram.js";

export const DAILY_SUDOKU_DIFFICULTY = "medium";
export const DAILY_PREFIX = "d:";

export const DAILY_GAMES = [
  { key: "sudoku", label: "Sudoku", since: "" },
  { key: "crypto", label: "Cryptogram", since: "" },
  { key: "word", label: "Word", since: "2026-09-24" },
  { key: "nono", label: "Nonogram", since: "2026-09-24" },
];

export const dailyNonoSeed = (day) => `nono:${day}`;

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

export const gamesOn = (day) => DAILY_GAMES.filter((g) => day >= g.since);

export function dayProgress(entry, day) {
  const games = gamesOn(day);
  return { done: games.filter((g) => entry?.[g.key] != null).length, total: games.length };
}

export function dayState(entry, day) {
  const { done, total } = dayProgress(entry, day);
  return done === total ? "full" : done > 0 ? "half" : "none";
}

export function dailyStreak(daily, today) {
  let day = dayState(daily[today], today) === "full" ? today : addDays(today, -1);
  let n = 0;
  while (dayState(daily[day], day) === "full") {
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
