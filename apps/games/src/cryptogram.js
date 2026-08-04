// Monoalphabetic substitution cipher helpers for the cryptogram game.

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A random derangement of 0..25: perm[i] is the cipher-letter index for
// plain-letter index i, guaranteed perm[i] !== i for every i.
export function randomDerangement() {
  let perm;
  do {
    perm = shuffle([...Array(26).keys()]);
  } while (perm.some((v, i) => v === i));
  return perm;
}

export function invert(perm) {
  const inv = new Array(perm.length);
  perm.forEach((v, i) => (inv[v] = i));
  return inv;
}

const A = "A".charCodeAt(0);

// Splits puzzle text into tokens for rendering: words (arrays of letter
// cells) separated by literal whitespace/punctuation runs.
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

// Unique cipher letters that actually appear in the puzzle text.
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
