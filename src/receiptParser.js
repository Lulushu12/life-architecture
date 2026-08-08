/**
 * Best-effort heuristics for pulling merchant / date / total out of raw
 * OCR text from a receipt photo. OCR text is noisy, so every field is a
 * guess the user is expected to review before saving.
 */

const TOTAL_LINE = /\b(grand\s*total|total\s*due|amount\s*due|balance\s*due|total)\b(?!.*subtotal)/i;
const SUBTOTAL_LINE = /\b(sub\s*-?\s*total|tax|change|cash|tip|card)\b/i;
const MONEY = /\$?\s*(\d{1,3}(?:[,.\s]\d{3})*[.,]\d{2})\b/;

function toNumber(raw) {
  // Normalize "1.234,56" or "1,234.56" style groupings to a plain float.
  const cleaned = raw.replace(/\s/g, "");
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized = cleaned;
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = cleaned.replace(/,/g, "");
  }
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

function guessAmount(lines) {
  for (const line of lines) {
    if (TOTAL_LINE.test(line) && !SUBTOTAL_LINE.test(line)) {
      const m = line.match(MONEY);
      if (m) {
        const n = toNumber(m[1]);
        if (n != null) return n;
      }
    }
  }
  // Fallback: largest money-looking value anywhere in the receipt.
  let max = null;
  for (const line of lines) {
    const m = line.match(MONEY);
    if (m) {
      const n = toNumber(m[1]);
      if (n != null && (max === null || n > max)) max = n;
    }
  }
  return max;
}

const DATE_PATTERNS = [
  { re: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/, order: ["y", "m", "d"] },
  { re: /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/, order: ["d", "m", "y"] },
  { re: /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/, order: ["d", "m", "y"] },
  { re: /\b(\d{1,2})-(\d{1,2})-(\d{4})\b/, order: ["d", "m", "y"] },
];

function guessDate(text) {
  for (const { re, order } of DATE_PATTERNS) {
    const m = text.match(re);
    if (!m) continue;
    const parts = {};
    order.forEach((key, i) => { parts[key] = parseInt(m[i + 1], 10); });
    let { y, m: mo, d } = parts;
    if (mo > 12 && d <= 12) [mo, d] = [d, mo];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) continue;
    const iso = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (!Number.isNaN(new Date(iso).getTime())) return iso;
  }
  return null;
}

function guessMerchant(lines) {
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 2) continue;
    const digitRatio = (trimmed.match(/\d/g) || []).length / trimmed.length;
    if (digitRatio > 0.4) continue;
    return trimmed.slice(0, 60);
  }
  return null;
}

export function parseReceiptText(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  return {
    merchant: guessMerchant(lines),
    date: guessDate(text),
    amount: guessAmount(lines),
    rawText: text,
  };
}
