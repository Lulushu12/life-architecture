// Build public/opening-meta.json: play counts and engine evaluations keyed to
// the bundled opening list.
//
//   node scripts/build-opening-meta.mjs <opening_names.json> [opening_evals.json]
//
// opening_names.json comes from scripts/opening-frequency.py (per-tag counts).
// opening_evals.json comes from the evaluation pass described in scripts/README.
//
// Matching rule: a line only inherits a count from a tag naming that same line.
// Trailing qualifiers may be dropped, but never far enough to collapse into the
// parent family — otherwise every obscure sub-variation would report the whole
// Sicilian's numbers, which is worse than reporting nothing.
import { readFileSync, writeFileSync } from "node:fs";
import { OPENINGS } from "../src/openings.js";

const [, , namesPath, evalsPath] = process.argv;
if (!namesPath) {
  console.error("usage: build-opening-meta.mjs <opening_names.json> [opening_evals.json]");
  process.exit(1);
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).join(" ");
const STOP = new Set(["variation", "attack", "system", "line", "defence", "game"]);

const raw = JSON.parse(readFileSync(namesPath, "utf8"));
const tags = new Map(raw.counts.map(([n, c]) => [n, c]));

function lookup(name) {
  const family = norm(name.split(":")[0]);
  const full = norm(name);
  if (tags.has(full)) return tags.get(full);
  const words = full.split(" ").filter((w) => !STOP.has(w));
  const nostop = words.join(" ");
  if (nostop !== full && tags.has(nostop)) return tags.get(nostop);
  const floor = family.split(" ").filter((w) => !STOP.has(w)).length + 1;
  for (let n = words.length - 1; n >= floor; n--) {
    const cand = words.slice(0, n).join(" ");
    if (tags.has(cand)) return tags.get(cand);
  }
  return null;
}

const plays = {};
let matched = 0;
for (const [eco, name] of OPENINGS) {
  const c = lookup(name);
  if (c != null) {
    plays[`${eco}|${name}`] = c;
    matched++;
  }
}

const evals = evalsPath ? JSON.parse(readFileSync(evalsPath, "utf8")) : {};

const out = {
  source: "Lines: lichess-org/chess-openings (CC0). Play counts: tagged games in the Lichess puzzle database (CC0). Evaluations: Stockfish 16 NNUE at depth 12.",
  tagged: raw.tagged,
  plays,
  evals,
};
writeFileSync(new URL("../public/opening-meta.json", import.meta.url), JSON.stringify(out));

console.log(`lines: ${OPENINGS.length}`);
console.log(`with play counts: ${matched} (${((matched / OPENINGS.length) * 100).toFixed(1)}%)`);
console.log(`with evaluations: ${Object.keys(evals).length}`);
