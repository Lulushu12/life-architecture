import { ALLOWED, ANSWERS } from "./words.js";
import { seededRng, shuffle } from "./rng.js";

export const WORD_LEN = 5;
export const MAX_GUESSES = 6;
export const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const RANK = { absent: 1, present: 2, correct: 3 };
const EMOJI = { correct: "🟩", present: "🟨", absent: "⬛" };
const ORDINAL = ["1st", "2nd", "3rd", "4th", "5th"];

let order = null;

function dayNumber(day) {
  const [y, m, d] = day.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

export function dailyWordAnswer(day) {
  if (!order) order = shuffle(ANSWERS, seededRng("word-order-v1"));
  const n = dayNumber(day) % order.length;
  return order[(n + order.length) % order.length];
}

export function randomWordAnswer(exclude = []) {
  const skip = new Set(exclude);
  for (let i = 0; i < 20; i++) {
    const w = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
    if (!skip.has(w)) return w;
  }
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
}

export const isAllowed = (w) => ALLOWED.has(w);
export const isAnswer = (w) => typeof w === "string" && ANSWERS.includes(w);

export function evaluate(guess, answer) {
  const res = new Array(WORD_LEN).fill("absent");
  const left = {};
  for (let i = 0; i < WORD_LEN; i++) {
    if (guess[i] === answer[i]) res[i] = "correct";
    else left[answer[i]] = (left[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < WORD_LEN; i++) {
    if (res[i] === "correct") continue;
    const c = guess[i];
    if (left[c] > 0) {
      res[i] = "present";
      left[c]--;
    }
  }
  return res;
}

export function keyStates(guesses, answer) {
  const out = {};
  for (const g of guesses) {
    const res = evaluate(g, answer);
    for (let i = 0; i < WORD_LEN; i++) {
      const c = g[i];
      if (!out[c] || RANK[res[i]] > RANK[out[c]]) out[c] = res[i];
    }
  }
  return out;
}

export function hardModeError(guess, guesses, answer) {
  for (const prev of guesses) {
    const res = evaluate(prev, answer);
    for (let i = 0; i < WORD_LEN; i++) {
      if (res[i] === "correct" && guess[i] !== prev[i]) {
        return `${ORDINAL[i]} letter must be ${prev[i].toUpperCase()}`;
      }
    }
    const need = {};
    for (let i = 0; i < WORD_LEN; i++) {
      if (res[i] !== "absent") need[prev[i]] = (need[prev[i]] || 0) + 1;
    }
    for (const [c, n] of Object.entries(need)) {
      const have = guess.split("").filter((x) => x === c).length;
      if (have < n) return `Guess must contain ${c.toUpperCase()}`;
    }
  }
  return null;
}

export function freshWord(answer, { daily = null, hard = false } = {}) {
  const now = Date.now();
  return {
    answer,
    daily,
    guesses: [],
    hard: !!hard,
    status: "playing",
    recorded: false,
    startedAt: now,
    finishedAt: null,
    updatedAt: now,
  };
}

export function submitGuess(game, guess) {
  if (game.status !== "playing") return game;
  const guesses = [...game.guesses, guess];
  const now = Date.now();
  if (guess === game.answer) return { ...game, guesses, status: "won", finishedAt: now };
  if (guesses.length >= MAX_GUESSES) return { ...game, guesses, status: "lost", finishedAt: now };
  return { ...game, guesses };
}

export function shareText(game) {
  const score = game.status === "won" ? game.guesses.length : "X";
  const head = `Word ${game.daily || "practice"} ${score}/${MAX_GUESSES}${game.hard ? "*" : ""}`;
  const rows = game.guesses.map((g) => evaluate(g, game.answer).map((r) => EMOJI[r]).join(""));
  return [head, "", ...rows].join("\n");
}

export function wordStats(list, daily, today, addDays) {
  const played = list.length;
  const wins = list.filter((r) => r.won).length;
  const dist = [0, 0, 0, 0, 0, 0];
  for (const r of list) if (r.won && r.guesses >= 1 && r.guesses <= 6) dist[r.guesses - 1]++;
  let day = daily[today]?.word != null ? today : addDays(today, -1);
  let streak = 0;
  while (daily[day]?.word != null) {
    streak++;
    day = addDays(day, -1);
  }
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of Object.keys(daily).sort()) {
    if (daily[d]?.word == null) continue;
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    prev = d;
    if (run > best) best = run;
  }
  return { played, wins, winRate: played ? Math.round((wins / played) * 100) : 0, dist, streak, best };
}
