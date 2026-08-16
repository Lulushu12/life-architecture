// Build public/games/famous.json — the curated "famous games" collection.
//
//   node scripts/build-famous-games.mjs --src <dir with events/ and players/ pgn dirs>
//
// Each entry below locates one specific game inside the downloaded pgnmentor
// archives (players/<X>.pgn or events/<X>.pgn) by header matching, validates
// it with chess.js, and attaches a short story. The build fails loudly if a
// spec matches zero or several games, so the curation stays honest.

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readPgn, splitGames, tokenize, validate, toRecord } from "./build-games-db.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const srcIdx = argv.indexOf("--src");
if (srcIdx === -1 || !argv[srcIdx + 1]) {
  console.error("usage: node scripts/build-famous-games.mjs --src <dir>");
  process.exit(1);
}
const SRC = argv[srcIdx + 1];

// match: substring (case-insensitive) on White/Black, prefix on Date,
// exact on Round/Result, optional `movePrefix` (SAN) to split casual twins.
const SPECS = [
  {
    title: "The Immortal Game",
    event: "Casual game, London 1851",
    file: "players/Anderssen.pgn",
    match: { w: "Anderssen", b: "Kieseritzky", year: "1851", res: "1-0", plies: 45 },
    story:
      "Anderssen gives up a bishop, both rooks and his queen — and mates with the three minor pieces he has left. Played as a casual game between rounds of the London 1851 tournament, it became the most famous attacking game ever recorded.",
  },
  {
    title: "The Evergreen Game",
    event: "Casual game, Berlin 1852",
    file: "players/Anderssen.pgn",
    match: { w: "Anderssen", b: "Dufresne", year: "1852", res: "1-0" },
    story:
      "A year after the Immortal Game, Anderssen produced its equal: the queen sacrifice 21.Qxd7+!! forces a mate delivered by two bishops. Steinitz called it \"the evergreen in Anderssen's laurel wreath\" — the name stuck.",
  },
  {
    title: "Paulsen–Morphy, First American Chess Congress",
    event: "New York 1857",
    file: "players/Morphy.pgn",
    match: { w: "Paulsen", b: "Morphy", year: "1857", res: "0-1", movePrefix: "e4 e5 Nf3 Nc6 Nc3 Nf6 Bb5 Bc5" },
    story:
      "Morphy uncorks 17...Qxf3!!, giving his queen for a single bishop. The point is not a forced mate but total domination of the light squares — decades ahead of its time in understanding compensation.",
  },
  {
    title: "The Opera Game",
    event: "Paris Opera House 1858",
    file: "players/Morphy.pgn",
    match: { w: "Morphy", b: "Duke Karl", year: "1858" },
    story:
      "Played in a box at the Paris Opera while Norma was performed on stage, against the Duke of Brunswick and Count Isouard consulting. Development, open lines, a queen sacrifice, mate in 17 moves — still the most-taught chess game in history.",
  },
  {
    title: "Zukertort's Brilliancy",
    event: "London 1883",
    file: "events/London1883.pgn",
    match: { w: "Zukertort", b: "Blackburne", year: "1883", res: "1-0", plies: 65 },
    story:
      "28.Qb4!! leaves the queen hanging with a rook already en prise — Blackburne can take neither. Zukertort's combination at London 1883 was immediately hailed as one of the finest ever played on English soil.",
  },
  {
    title: "Lasker's Double Bishop Sacrifice",
    event: "Amsterdam 1889",
    file: "players/Lasker.pgn",
    match: { w: "Lasker", b: "Bauer", year: "1889", res: "1-0", plies: 75 },
    story:
      "The future world champion sacrifices both bishops on h7 and g7 to strip the king bare — the original \"Lasker double bishop sacrifice\", copied (knowingly or not) in hundreds of games since.",
  },
  {
    title: "Steinitz–von Bardeleben",
    event: "Hastings 1895",
    file: "events/Hastings1895.pgn",
    match: { w: "Steinitz", b: "Bardeleben", res: "1-0" },
    story:
      "Steinitz's rook walks into a fork of captures on move 22 and stays untakeable for the rest of the game. Von Bardeleben, seeing the coming king hunt, simply left the hall rather than resign; Steinitz demonstrated the mate to the spectators.",
  },
  {
    title: "Rubinstein's Immortal",
    event: "Lodz 1907",
    file: "players/Rubinstein.pgn",
    match: { w: "Rotlewi", b: "Rubinstein", year: "1907", res: "0-1", plies: 50 },
    story:
      "Rotlewi–Rubinstein features perhaps the deepest combination of the pre-war era: 22...Rxc3!! begins a sequence in which every black piece hangs and none can be taken. The final position is a study in geometry.",
  },
  {
    title: "The Gold Coins Game",
    event: "Breslau 1912",
    file: "players/Marshall.pgn",
    match: { w: "Levitsky", b: "Marshall", year: "1912", res: "0-1" },
    story:
      "Marshall finishes with 23...Qg3!!, offering the queen to three different captures, each losing on the spot. Legend says the spectators showered the board with gold coins. The legend is probably false; the move is real.",
  },
  {
    title: "The Marshall Attack Unveiled",
    event: "New York 1918",
    file: "players/Capablanca.pgn",
    match: { w: "Capablanca", b: "Marshall", year: "1918", res: "1-0", movePrefix: "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5" },
    story:
      "Marshall reportedly saved his gambit for years to spring on Capablanca — who accepted the challenge over the board, defended perfectly, and won. The Marshall Attack lost the battle but won the war: it remains a main line of the Ruy Lopez today.",
  },
  {
    title: "Bogoljubov–Alekhine",
    event: "Hastings 1922",
    file: "events/Hastings1922.pgn",
    match: { w: "Bogoljubow", b: "Alekhine", res: "0-1" },
    story:
      "Alekhine's masterpiece: a pawn reaches e2 supported by nothing, promotes with 30...e1=Q only to be traded, and a second promotion threat ends the game. Alekhine considered it one of his two finest games.",
  },
  {
    title: "The Immortal Zugzwang Game",
    event: "Copenhagen 1923",
    file: "players/Nimzowitsch.pgn",
    match: { w: "Saemisch", b: "Nimzowitsch", year: "1923", res: "0-1", plies: 50 },
    story:
      "Nimzowitsch concludes with the quiet 25...h6 — and White, with almost every piece on the board, has literally no move that doesn't lose material. Complete zugzwang in the middlegame is nearly unique in master chess.",
  },
  {
    title: "Réti Beats Bogoljubov",
    event: "New York 1924",
    file: "events/NewYork1924.pgn",
    match: { w: "Reti", b: "Bogolj", res: "1-0" },
    story:
      "The showcase game of hypermodern chess: Réti controls the centre from the flanks, and the finishing 25.Be8!! wins by interference. It earned the brilliancy prize at one of the strongest tournaments ever held.",
  },
  {
    title: "Capablanca's Rook Endgame",
    event: "New York 1924",
    file: "events/NewYork1924.pgn",
    match: { w: "Capablanca", b: "Tartakower", res: "1-0" },
    story:
      "The most quoted rook endgame in chess literature. Capablanca gives up pawns without counting to activate king and rook; the king marches to g6 in front of its own passed pawn. Every endgame manual since has cited it.",
  },
  {
    title: "Botvinnik–Capablanca",
    event: "AVRO 1938",
    file: "events/AVRO1938.pgn",
    match: { w: "Botvinnik", b: "Capablanca", res: "1-0" },
    story:
      "Botvinnik's 30.Ba3!! deflects the queen from the kingside, and a knight sacrifice drives the black king into a lost pawn race. Widely voted one of the greatest games of the twentieth century.",
  },
  {
    title: "Tal Sacrifices Against Botvinnik",
    event: "World Championship 1960, game 6",
    file: "events/WorldChamp1960.pgn",
    match: { w: "Botvinnik", b: "Tal", rd: "6", res: "0-1" },
    story:
      "The signature game of the match that made 23-year-old Tal the youngest world champion to date: the speculative 21...Nf4 piece sacrifice leads to chaos only Tal could navigate. Botvinnik, the great scientist of chess, was never at home in it.",
  },
  {
    title: "Spassky's King's Gambit",
    event: "Candidates 1965 — Tal match",
    file: "players/Spassky.pgn",
    match: { w: "Spassky", b: "Bronstein", year: "1960", res: "1-0" },
    story:
      "Spassky–Bronstein, Leningrad 1960: a King's Gambit where White ignores a knight capture on f1 to keep the attack running. The game was borrowed for the chess scene in the Bond film From Russia with Love.",
  },
  {
    title: "Larsen–Spassky: 17 Moves",
    event: "USSR vs Rest of the World, Belgrade 1970",
    file: "players/Spassky.pgn",
    match: { w: "Larsen", b: "Spassky", year: "1970", rd: "2.1", res: "0-1" },
    story:
      "Spassky demolishes Larsen's 1.b3 in seventeen moves. The rook sacrifice 14...Rxh1 clears the way for a pawn to reach g2; White's extra rook watches from the queenside as the pawn promotes.",
  },
  {
    title: "Fischer–Spassky, Game 6",
    event: "World Championship 1972",
    file: "events/WorldChamp1972.pgn",
    match: { w: "Fischer", b: "Spassky", rd: "6", res: "1-0" },
    story:
      "Fischer opens 1.c4 — abandoning 1.e4 for the first time in a serious game — and produces a positional masterpiece so clean that Spassky joined the audience's applause. Many call it the finest game of the century's most famous match.",
  },
  {
    title: "The Game of the Century",
    event: "Rosenwald Memorial, New York 1956",
    file: "players/Fischer.pgn",
    match: { w: "Byrne, D", b: "Fischer", year: "1956", res: "0-1" },
    story:
      "Thirteen-year-old Bobby Fischer plays 17...Be6!!, leaving his queen en prise, and follows with a windmill that wins pieces one by one. Hans Kmoch christened it \"the game of the century\" the week it was played.",
  },
  {
    title: "Fischer's Brilliancy vs Robert Byrne",
    event: "US Championship 1963",
    file: "players/Fischer.pgn",
    match: { w: "Byrne, Robert", b: "Fischer", year: "1963", res: "0-1" },
    story:
      "Fischer sacrifices a knight on the empty-looking d4 square; six moves later Byrne resigns in a position where the grandmasters commentating for the audience thought Fischer was losing. The winning ideas were simply invisible from the surface.",
  },
  {
    title: "Karpov–Kasparov, Game 16: The Octopus",
    event: "World Championship 1985",
    file: "events/WorldChamp1985.pgn",
    match: { w: "Karpov", b: "Kasparov", rd: "16", res: "0-1" },
    story:
      "Kasparov's knight lands on d3 — the \"octopus\" — and paralyses Karpov's entire army from inside his own camp. The win put Kasparov on the road to becoming, at 22, the youngest world champion ever.",
  },
  {
    title: "Kasparov–Karpov, Game 20",
    event: "World Championship 1990",
    file: "events/WorldChamp1990.pgn",
    match: { w: "Kasparov", b: "Karpov", rd: "20", res: "1-0" },
    story:
      "The last great game of the twenty-year rivalry: Kasparov builds a kingside attack in the Ruy Lopez and finishes with a queen sacrifice on h6 that cannot be accepted or declined. He kept the title by a single point.",
  },
  {
    title: "Short's King March",
    event: "Tilburg 1991",
    file: "events/Tilburg1991.pgn",
    match: { w: "Short", b: "Timman", res: "1-0" },
    story:
      "With queens still on the board, Short walks his king Kg3–Kf4–Kg5 up the board in front of his own pawns to help deliver mate. Timman could only watch: every check fails, every defence loses.",
  },
  {
    title: "Ivanchuk–Yusupov",
    event: "Candidates rapid playoff, Brussels 1991",
    file: "players/Ivanchuk.pgn",
    match: { w: "Ivanchuk", b: "Jussupow", year: "1991", res: "0-1" },
    story:
      "Needing a win on demand, Yusupov throws every kingside pawn at Ivanchuk's king in a King's Indian and keeps sacrificing until the attack crashes through. The final quiet move 39...Qg3 leaves mate unstoppable — routinely voted the greatest rapid game ever played.",
  },
  {
    title: "Kasparov–Anand, Game 10",
    event: "PCA World Championship 1995",
    file: "events/PCAChamp1995.pgn",
    match: { w: "Kasparov", b: "Anand", rd: "10", res: "1-0" },
    story:
      "On top of the World Trade Center, Kasparov answers Anand's Open Ruy with a rook sacrifice prepared to move 20-plus at home. Anand later admitted he was \"playing against the ghost of Kasparov's analysis\".",
  },
  {
    title: "Deep Blue Defeats Kasparov",
    event: "New York 1997, game 6",
    file: "players/Kasparov.pgn",
    match: { w: "Comp Deep Blue", b: "Kasparov", year: "1997", rd: "6", res: "1-0" },
    story:
      "The deciding game of the first match a computer won against a reigning world champion. Deep Blue plays the known knight sacrifice 8.Nxe6 in the Caro-Kann; Kasparov, shaken, collapses in nineteen moves. Machine chess was never dismissed again.",
  },
  {
    title: "Topalov–Shirov: The Bishop Goes to h3",
    event: "Linares 1998",
    file: "events/Linares1998.pgn",
    match: { w: "Topalov", b: "Shirov", res: "0-1", year: "1998.03.04" },
    story:
      "In a drawish-looking endgame Shirov plays 47...Bh3!!, giving up the bishop for nothing to clear the way for his king. Engines took two decades to understand it; Topalov resigned six moves later.",
  },
  {
    title: "Kasparov's Immortal",
    event: "Wijk aan Zee 1999",
    file: "events/WijkaanZee1999.pgn",
    match: { w: "Kasparov", b: "Topalov", res: "1-0" },
    story:
      "24.Rxd4!! launches a king hunt that drags Topalov's king from b8 to h2 — across the entire board — with half the pieces hanging at every step. Kasparov's own favourite of all his games, and by many votes the greatest ever played.",
  },
  {
    title: "Kramnik's Berlin Wall",
    event: "World Championship 2000, game 1",
    file: "events/WorldChamp2000.pgn",
    match: { w: "Kasparov", b: "Kramnik", rd: "1", res: "=" },
    story:
      "Not a brilliancy — a fortress. In game 1 Kramnik unveils the revived Berlin Defence, trades queens on move 8, and holds effortlessly. Kasparov never breached it in the whole match and lost his title without winning a game.",
  },
  {
    title: "Polgár Beats Kasparov",
    event: "Russia vs Rest of the World, Moscow 2002",
    file: "players/PolgarJ.pgn",
    match: { w: "Polgar", b: "Kasparov", year: "2002.09", res: "1-0" },
    story:
      "Judit Polgár becomes the first woman to defeat a reigning world number one in a serious game, grinding Kasparov down on the white side of a Berlin. She had been refused a game against him as a child prodigy; the wait ended here.",
  },
  {
    title: "Aronian–Anand",
    event: "Wijk aan Zee 2013",
    file: "events/WijkaanZee2013.pgn",
    match: { w: "Aronian", b: "Anand", res: "0-1" },
    story:
      "Anand's 16...Nde5!! — pieces hang everywhere, none can be taken — produced what commentators immediately compared to Rotlewi–Rubinstein. Prepared at home, executed in 23 moves against the world number two.",
  },
  {
    title: "Carlsen Grinds Down Anand",
    event: "World Championship 2013, game 5",
    file: "events/WorldChamp2013.pgn",
    match: { w: "Carlsen", b: "Anand", rd: "5", res: "1-0" },
    story:
      "The game that decided the match's character: from a level rook endgame Carlsen presses for 58 moves until Anand cracks. His first win on the way to the title, and the model for a decade of Carlsen endgame torture.",
  },
  {
    title: "Carlsen–Karjakin: Mate in the Tiebreak",
    event: "World Championship 2016, tiebreak game 4",
    file: "events/WorldChamp2016.pgn",
    match: { w: "Carlsen", b: "Karjakin", res: "1-0", movePrefix: "e4 c5" },
    story:
      "Needing only a draw in the final rapid game, Carlsen instead finds 50.Qh6+!! — a pure queen sacrifice that forces mate on the spot with either capture. The most spectacular closing move a title match has ever had.",
  },
  {
    title: "Ding–Nepomniachtchi, Game 12",
    event: "World Championship 2023",
    file: "events/WorldChamp2023.pgn",
    match: { w: "Ding", b: "Nepomniachtchi", rd: "12.1", res: "1-0" },
    story:
      "Down in the match and out of safe options, Ding Liren plays the ultra-sharp 16.Rg4 line his team had marked as too risky. The win levelled the score and carried him to the title — China's first world champion.",
  },
  {
    title: "Gukesh–Ding, The Decider",
    event: "World Championship 2024, game 14",
    file: "events/WorldChamp2024.pgn",
    match: { w: "Ding", b: "Gukesh", rd: "14.1", res: "0-1" },
    story:
      "A drawn rook endgame until 55.Rf2?? — Ding trades into a lost king-and-pawn ending, and 18-year-old Gukesh Dommaraju becomes the youngest undisputed world champion in history. The final moments were watched live by millions.",
  },
];

function findGame(spec) {
  const games = splitGames(readPgn(join(SRC, spec.file)));
  const m = spec.match;
  const hits = [];
  for (const { headers: h, moveText } of games) {
    if (m.w && !(h.White || "").toLowerCase().includes(m.w.toLowerCase())) continue;
    if (m.b && !(h.Black || "").toLowerCase().includes(m.b.toLowerCase())) continue;
    if (m.year && !(h.Date || "").startsWith(m.year)) continue;
    if (m.rd && (h.Round || "") !== m.rd) continue;
    if (m.res) {
      const norm = h.Result === "1/2-1/2" ? "=" : h.Result;
      if (norm !== m.res) continue;
    }
    const sans = validate(tokenize(moveText));
    if (!sans || sans.length < 4) continue;
    if (m.movePrefix && !sans.join(" ").startsWith(m.movePrefix)) continue;
    if (m.plies && sans.length !== m.plies) continue;
    hits.push({ headers: h, sans });
  }
  return hits;
}

const out = [];
let failed = 0;
for (const spec of SPECS) {
  const hits = findGame(spec);
  if (hits.length !== 1) {
    failed++;
    console.error(`✗ ${spec.title}: ${hits.length} matches in ${spec.file}`);
    for (const h of hits.slice(0, 5))
      console.error(`    ${h.headers.White} - ${h.headers.Black} ${h.headers.Date} rd${h.headers.Round} ${h.headers.Result} (${h.sans.length} plies)`);
    continue;
  }
  const rec = toRecord(hits[0].headers, hits[0].sans);
  out.push({ title: spec.title, event: spec.event, story: spec.story, ...rec });
}

if (failed) {
  console.error(`${failed} spec(s) failed — famous.json NOT written`);
  process.exit(1);
}
writeFileSync(join(ROOT, "public", "games", "famous.json"), JSON.stringify({ v: 1, games: out }));
console.log(`famous.json written: ${out.length} games`);
