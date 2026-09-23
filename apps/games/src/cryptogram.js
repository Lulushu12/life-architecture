import { shuffle } from "./rng.js";

// perm[i] is the cipher-letter index for plain-letter index i, and perm[i] !== i for every i.
export function randomDerangement(rng = Math.random) {
  let perm;
  do {
    perm = shuffle([...Array(26).keys()], rng);
  } while (perm.some((v, i) => v === i));
  return perm;
}

export const letterCount = (s) => (String(s).match(/[a-zA-Z]/g) || []).length;

export function isValidPerm(perm) {
  return (
    Array.isArray(perm) &&
    perm.length === 26 &&
    new Set(perm).size === 26 &&
    perm.every((v) => Number.isInteger(v) && v >= 0 && v < 26)
  );
}

export function invert(perm) {
  const inv = new Array(perm.length);
  perm.forEach((v, i) => (inv[v] = i));
  return inv;
}

const A = "A".charCodeAt(0);

export function tokenize(text) {
  const tokens = [];
  let word = null;
  for (const ch of text.toUpperCase()) {
    if (ch >= "A" && ch <= "Z") {
      if (!word) {
        word = { type: "word", letters: [] };
        tokens.push(word);
      }
      word.letters.push(ch);
    } else {
      word = null;
      const last = tokens[tokens.length - 1];
      if (last && last.type === "text") last.value += ch;
      else tokens.push({ type: "text", value: ch });
    }
  }
  return tokens;
}

export function cipherLetterOf(plainLetter, perm) {
  return String.fromCharCode(65 + perm[plainLetter.charCodeAt(0) - A]);
}

export function plainLetterOf(cipherLetter, inv) {
  return String.fromCharCode(65 + inv[cipherLetter.charCodeAt(0) - A]);
}

export function usedCipherLetters(text, perm) {
  const set = new Set();
  for (const ch of text.toUpperCase()) {
    if (ch >= "A" && ch <= "Z") set.add(cipherLetterOf(ch, perm));
  }
  return set;
}

export function isSolved(text, perm, guesses) {
  const inv = invert(perm);
  for (const ch of text.toUpperCase()) {
    if (ch < "A" || ch > "Z") continue;
    const cipherLetter = cipherLetterOf(ch, perm);
    if (guesses[cipherLetter] !== ch) return false;
  }
  return true;
}

export function cipherSequence(text, perm) {
  const out = [];
  for (const ch of text.toUpperCase()) {
    if (ch >= "A" && ch <= "Z") out.push(cipherLetterOf(ch, perm));
  }
  return out;
}

export function cipherFrequency(text, perm) {
  const counts = new Map();
  for (const cl of cipherSequence(text, perm)) counts.set(cl, (counts.get(cl) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
