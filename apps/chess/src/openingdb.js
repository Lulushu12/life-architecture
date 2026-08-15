// The opening reference, built once from the bundled line list.
//
// OPENINGS is a flat list of named lines (lichess-org/chess-openings, CC0).
// Everything the explorer needs — which moves are playable from a position,
// what they transpose into, how often each is actually played — comes from
// indexing that list into a tree keyed by move prefix.
//
// Enrichment (real-world play counts, engine evaluations) lives in
// public/opening-meta.json and is loaded on demand, so the 3,700-entry
// reference costs nothing until the explorer is opened.

import { OPENINGS } from "./openings.js";

let meta = null;
let inflight = null;

/** Play counts and engine evaluations, keyed "ECO|Name". Loaded once. */
export async function loadOpeningMeta() {
  if (meta) return meta;
  if (!inflight) {
    inflight = fetch(`${import.meta.env.BASE_URL}opening-meta.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`opening-meta.json: ${r.status}`))))
      .then((m) => {
        meta = m;
        inflight = null;
        return m;
      })
      .catch((e) => {
        inflight = null;
        throw e;
      });
  }
  return inflight;
}

/** Every line as {eco, name, sans[]}, computed once. */
let lines = null;
export function allLines() {
  if (!lines) lines = OPENINGS.map(([eco, name, sans]) => ({ eco, name, key: `${eco}|${name}`, sans: sans.split(" ") }));
  return lines;
}

/**
 * Continuations from a position given by a move prefix.
 *
 * Returns one entry per distinct next move, each carrying the most-played
 * named line that runs through it, so the explorer can show "1...c5 →
 * Sicilian Defense" without the caller walking the tree itself.
 */
export function continuations(prefix, metaData) {
  const depth = prefix.length;
  const byMove = new Map();
  // Several ECO codes can carry the same opening name (three are just
  // "Sicilian Defense"), and each holds that name's full play count. Counting
  // per name rather than per entry stops the total being multiplied.
  const counted = new Map();

  for (const line of allLines()) {
    if (line.sans.length <= depth) continue;
    let matches = true;
    for (let i = 0; i < depth; i++) {
      if (line.sans[i] !== prefix[i]) { matches = false; break }
    }
    if (!matches) continue;

    const move = line.sans[depth];
    if (!counted.has(move)) counted.set(move, new Set());
    const seen = counted.get(move);
    const fresh = !seen.has(line.name);
    seen.add(line.name);
    const plays = fresh ? metaData?.plays?.[line.key] || 0 : 0;
    const cur = byMove.get(move);
    if (!cur) {
      byMove.set(move, { move, plays, lines: 1, best: line });
    } else {
      cur.plays += plays;
      cur.lines += 1;
      // The representative is the SHALLOWEST named line through this move —
      // the one that names the move itself. Picking the most-played instead
      // labelled 1.e4 as "Sicilian Defense", which is a Black opening three
      // plies deeper. Ties break towards the more played.
      if (
        line.sans.length < cur.best.sans.length ||
        (line.sans.length === cur.best.sans.length &&
          (metaData?.plays?.[line.key] || 0) > (metaData?.plays?.[cur.best.key] || 0))
      )
        cur.best = line;
    }
  }

  // `plays` sums the named lines below a move, which overlap: a game tagged
  // both "Sicilian Defense" and "Sicilian Najdorf" is counted by each. That
  // makes the total a usable popularity ordering but NOT a game count, so it is
  // deliberately never surfaced as one. Only a node that is itself an
  // exactly-named line reports a real figure, via `exactPlays`.
  const out = [...byMove.values()].sort((a, b) => b.plays - a.plays || b.lines - a.lines);
  for (const n of out) {
    n.exactPlays = n.best.sans.length === depth + 1 ? metaData?.plays?.[n.best.key] ?? null : null;
  }
  return out;
}

/** The named line exactly matching this move sequence, if there is one. */
export function nameFor(prefix) {
  const joined = prefix.join(" ");
  let hit = null;
  for (const line of allLines()) {
    if (line.sans.join(" ") === joined) return line;
    // longest named prefix, so a position deeper than any name still reports
    // the opening it came from
    if (
      line.sans.length < prefix.length &&
      prefix.slice(0, line.sans.length).join(" ") === line.sans.join(" ") &&
      (!hit || line.sans.length > hit.sans.length)
    )
      hit = line;
  }
  return hit;
}

/** Case-insensitive search over name and ECO. */
export function searchLines(query, metaData, limit = 60) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits = allLines().filter(
    (l) => l.name.toLowerCase().includes(q) || l.eco.toLowerCase() === q
  );
  return hits
    .sort((a, b) => (metaData?.plays?.[b.key] || 0) - (metaData?.plays?.[a.key] || 0))
    .slice(0, limit);
}

/** "+0.34" / "-1.20" / "M4" from a stored evaluation, White's perspective. */
export function formatEval(ev) {
  if (!ev) return null;
  // mate 0 means the side to move is already mated — two named lines end that
  // way (Fool's Mate, the Sea-Cadet Mate), and "M0" reads as nonsense.
  if (ev.mate === 0) return "mate";
  if (ev.mate != null) return (ev.mate > 0 ? "M" : "-M") + Math.abs(ev.mate);
  const p = ev.cp / 100;
  return (p > 0 ? "+" : "") + p.toFixed(2);
}

/** Rough verdict for a White-perspective centipawn score. */
export function verdict(ev) {
  if (!ev) return null;
  if (ev.mate === 0) return "the line ends in checkmate";
  if (ev.mate != null) return ev.mate > 0 ? "winning for White" : "winning for Black";
  const cp = ev.cp;
  if (cp > 150) return "clearly better for White";
  if (cp > 50) return "slightly better for White";
  if (cp < -150) return "clearly better for Black";
  if (cp < -50) return "slightly better for Black";
  return "balanced";
}
