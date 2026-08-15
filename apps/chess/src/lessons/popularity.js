// How often each opening family actually shows up in real games.
//
// Counted from the OpeningTags column of the Lichess puzzle database (CC0):
// 6,100,960 puzzles, of which 1,214,759 carry an opening tag. Puzzles are drawn
// from real online games, so this is a far better guide to what you will
// actually face than an editor's impression of what is important.
//
// One vote per game per family: a row tagged both Sicilian_Defense and
// Sicilian_Defense_Najdorf counts once, so the shares below are comparable
// and don't sum past 100%.
//
// Regenerate with scripts/opening-frequency.py against a fresh dump (see
// scripts/README.md).

export const FAMILY_PLAYS = {
  Sicilian: 189118,
  French: 80957,
  "Queens Pawn": 73986,
  "Caro-Kann": 69848,
  Italian: 69202,
  Scandinavian: 54250,
  "Queens Gambit Declined": 45965,
  English: 42598,
  "Ruy Lopez": 36887,
  Scotch: 34595,
  Indian: 33731,
  Philidor: 22898,
  "Kings Gambit Accepted": 18900,
  Zukertort: 18649,
  "Four Knights": 18328,
  Russian: 18278,
  Modern: 17954,
  Pirc: 17648,
  Vienna: 17533,
  Bishops: 16862,
  Slav: 16324,
  "Kings Pawn": 16021,
  "Queens Gambit Accepted": 12543,
  Benoni: 12000,
  Nimzowitsch: 11613,
  Alekhine: 10893,
  "Kings Indian": 10839,
  Horwitz: 9780,
  Owen: 9555,
};

// Which families each lesson group covers. Editorial — the counts above are
// data, this mapping is the judgement call about what belongs where.
export const GROUP_FAMILIES = {
  "Semi-Open": ["French", "Caro-Kann", "Scandinavian", "Pirc", "Modern", "Alekhine"],
  Sicilian: ["Sicilian"],
  "Open Games": ["Scotch", "Philidor", "Four Knights", "Russian", "Vienna", "Bishops", "Kings Pawn"],
  "d4 Systems": ["Queens Pawn", "Zukertort", "English"],
  "Italian Game": ["Italian"],
  "Indian Defences": ["Indian", "Kings Indian", "Benoni", "Nimzowitsch"],
  "Queen's Gambit": ["Queens Gambit Declined", "Queens Gambit Accepted", "Slav"],
  "Ruy Lopez": ["Ruy Lopez"],
  "Offbeat Gambits": ["Kings Gambit Accepted", "Owen", "Horwitz"],
};

const TOTAL_TAGGED = 1214759;

/** Combined play count for a lesson group (0 for groups with no mapping). */
export function groupPlays(group) {
  const fams = GROUP_FAMILIES[group];
  if (!fams) return 0;
  return fams.reduce((sum, f) => sum + (FAMILY_PLAYS[f] || 0), 0);
}

/** Share of tagged games, as a rounded percentage string, or null. */
export function groupShare(group) {
  const plays = groupPlays(group);
  if (!plays) return null;
  const pct = (plays / TOTAL_TAGGED) * 100;
  return pct >= 1 ? `${Math.round(pct)}% of games` : "<1% of games";
}
