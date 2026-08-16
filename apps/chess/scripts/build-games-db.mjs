// Build the historic games database (public/games/) from PGN event files
// downloaded from pgnmentor.com.
//
//   node scripts/build-games-db.mjs --src <dir-with-event-pgns>
//
// Every game is replayed through chess.js; games that don't validate are
// dropped (count reported). Output:
//   public/games/index.json     — event catalog {id,name,series,year,cat,n}
//   public/games/ev/<id>.json   — one file per event, lazy-loaded by the app
//
// Game scores (moves + results) are facts and not copyrightable; the PGN
// collation is pgnmentor.com's freely downloadable event archive.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Chess } from "chess.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const srcIdx = argv.indexOf("--src");
if (srcIdx === -1 || !argv[srcIdx + 1]) {
  console.error("usage: node scripts/build-games-db.mjs --src <dir>");
  process.exit(1);
}
const SRC = argv[srcIdx + 1];
const OUT = join(ROOT, "public", "games");

// ---------------------------------------------------------------------------
// PGN parsing

/** Read a file that may be UTF-8 or Latin-1 (old pgnmentor files are Latin-1). */
export function readPgn(path) {
  const buf = readFileSync(path);
  const utf8 = buf.toString("utf8");
  return utf8.includes("�") ? buf.toString("latin1") : utf8;
}

/** Split a multi-game PGN into { headers: {}, moveText } records. */
export function splitGames(text) {
  const games = [];
  let headers = null;
  let moves = [];
  const flush = () => {
    if (headers) games.push({ headers, moveText: moves.join(" ") });
    headers = null;
    moves = [];
  };
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("[") && /^\[\s*\w+\s+"/.test(line)) {
      if (moves.length) flush();
      headers = headers || {};
      const m = line.match(/^\[\s*(\w+)\s+"(.*)"\s*\]/);
      if (m) headers[m[1]] = m[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    } else if (line) {
      if (!headers) continue; // stray text before any header
      moves.push(line);
    }
  }
  flush();
  return games;
}

/** Strip comments, variations and NAGs; return bare move tokens. */
export function tokenize(moveText) {
  let t = moveText;
  t = t.replace(/\{[^}]*\}/g, " "); // {comments}
  t = t.replace(/;[^\n]*/g, " "); // ; comments
  // nested (variations) — repeat innermost-first
  let prev;
  do {
    prev = t;
    t = t.replace(/\([^()]*\)/g, " ");
  } while (t !== prev);
  t = t.replace(/\$\d+/g, " "); // NAGs
  return t
    .split(/\s+/)
    .filter(Boolean)
    .filter((tok) => !/^\d+\.+$/.test(tok)) // move numbers
    .filter((tok) => !["1-0", "0-1", "1/2-1/2", "*"].includes(tok))
    .map((tok) => tok.replace(/^\d+\.+/, "")) // "12.e4" glued numbers
    .filter((tok) => tok !== "..." && tok !== "");
}

/** Replay tokens through chess.js. Returns SAN array or null if invalid. */
export function validate(tokens) {
  const c = new Chess();
  const sans = [];
  for (const tok of tokens) {
    let mv = null;
    try {
      mv = c.move(tok, { strict: false });
    } catch {
      return null;
    }
    if (!mv) return null;
    sans.push(mv.san);
  }
  return sans;
}

const RESULT = { "1-0": "1-0", "0-1": "0-1", "1/2-1/2": "=" };

export function toRecord(headers, sans) {
  const g = {
    w: headers.White || "?",
    b: headers.Black || "?",
    m: sans.join(" "),
  };
  const res = RESULT[headers.Result];
  if (res) g.res = res;
  if (headers.Date && headers.Date !== "????.??.??") g.d = headers.Date;
  if (headers.Round && headers.Round !== "?") g.rd = headers.Round;
  if (headers.ECO && /^[A-E]\d\d$/.test(headers.ECO)) g.eco = headers.ECO;
  const we = parseInt(headers.WhiteElo, 10);
  const be = parseInt(headers.BlackElo, 10);
  if (we) g.we = we;
  if (be) g.be = be;
  return g;
}

// ---------------------------------------------------------------------------
// Event naming

// Series whose camel-case split would come out wrong, plus branded names.
const SERIES_NAMES = {
  WorldChamp: "World Championship",
  FideChamp: "FIDE World Championship",
  PCAChamp: "PCA World Championship",
  PCACand: "PCA Candidates",
  PCAQual: "PCA Qualifier",
  WccQual: "World Ch. Qualifier",
  SovietChamp: "USSR Championship",
  WorldCup: "World Cup",
  WijkaanZee: "Wijk aan Zee",
  MardelPlata: "Mar del Plata",
  DosHermanas: "Dos Hermanas",
  LasPalmas: "Las Palmas",
  NewYork: "New York",
  SaintLouis: "Saint Louis",
  StLouis: "Saint Louis",
  StPetersburg: "St Petersburg",
  MonteCarlo: "Monte Carlo",
  ReggioEmilia: "Reggio Emilia",
  BuenosAires: "Buenos Aires",
  NoviSad: "Novi Sad",
  KhantyMansiysk: "Khanty-Mansiysk",
  LosAngeles: "Los Angeles",
  SanAntonio: "San Antonio",
  SanRemo: "San Remo",
  SanSebastian: "San Sebastian",
  SantaMonica: "Santa Monica",
  LakeHopatcong: "Lake Hopatcong",
  TerApel: "Ter Apel",
  BadKissingen: "Bad Kissingen",
  BadNauheim: "Bad Nauheim",
  BadElster: "Bad Elster",
  BadHarzburg: "Bad Harzburg",
  BadPistyan: "Bad Pistyan",
  BadOeynhausen: "Bad Oeynhausen",
  BadNiendorf: "Bad Niendorf",
  Stavanger: "Norway Chess (Stavanger)",
  AVRO: "AVRO",
};

const SUFFIX_NAMES = { a: " (first match)", b: " (second match)", r: " (rapid)", "-GP": " Grand Prix", "-Sinq": " Sinquefield Cup" };

export function eventName(id) {
  const m = id.match(/^(.*?)(\d{4})(.*)$/);
  if (!m) return { name: camel(id), series: camel(id), year: null };
  const [, prefix, year, suffix] = m;
  const series = SERIES_NAMES[prefix] || camel(prefix);
  const extra = SUFFIX_NAMES[suffix] ?? (suffix ? ` (${suffix.replace(/^-/, "")})` : "");
  return { name: `${series} ${year}${extra}`, series, year: parseInt(year, 10) };
}

function camel(s) {
  return s.replace(/([a-z])([A-Z0-9])/g, "$1 $2");
}

export function category(id) {
  if (/^(WorldChamp|FideChamp|PCAChamp)/.test(id)) return "wcc";
  if (/^(Candidates|Interzonal|PCACand|PCAQual|WccQual|WorldCup)/.test(id)) return "cycle";
  return "tour";
}

// ---------------------------------------------------------------------------
// Main

// Only run the pipeline when executed directly (the famous-games builder
// imports the helpers above).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  rmSync(join(OUT, "ev"), { recursive: true, force: true });
  mkdirSync(join(OUT, "ev"), { recursive: true });

  const files = readdirSync(SRC).filter((f) => f.endsWith(".pgn")).sort();
  const index = [];
  let total = 0;
  let dropped = 0;

  for (const file of files) {
    const id = file.replace(/\.pgn$/, "");
    const games = [];
    for (const { headers, moveText } of splitGames(readPgn(join(SRC, file)))) {
      if ((headers.Variant || "").match(/960|from position/i)) continue;
      if (headers.FEN) continue; // set-up positions: viewer assumes startpos
      const sans = validate(tokenize(moveText));
      if (!sans || sans.length < 2) {
        dropped++;
        continue;
      }
      games.push(toRecord(headers, sans));
    }
    if (!games.length) continue;
    const { name, series, year } = eventName(id);
    index.push({ id, name, series, year, cat: category(id), n: games.length });
    writeFileSync(join(OUT, "ev", `${id}.json`), JSON.stringify({ id, name, games }));
    total += games.length;
  }

  index.sort((a, b) => (a.series === b.series ? (b.year || 0) - (a.year || 0) : a.series.localeCompare(b.series)));
  writeFileSync(join(OUT, "index.json"), JSON.stringify({ v: 1, events: index }));
  console.log(`${index.length} events, ${total} games kept, ${dropped} dropped`);
}
