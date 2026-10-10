// Archive tabs and filters, and saved analyses (plan item 12).

/** "w" | "d" | "l" from your side, or null when the game has no "you". */
export function outcomeOf(g) {
  if (!g.result || !g.playerColor) return null;
  if (g.result === "1/2-1/2") return "d";
  if (g.result !== "1-0" && g.result !== "0-1") return null;
  return (g.result === "1-0") === (g.playerColor === "w") ? "w" : "l";
}

export const TABS = [
  { id: "all", label: "All" },
  { id: "starred", label: "Starred" },
  { id: "bots", label: "Bots" },
  { id: "imported", label: "Imported" },
  { id: "analyses", label: "Analyses" },
];

export const RESULTS = [
  { id: "any", label: "Any result" },
  { id: "w", label: "Won" },
  { id: "d", label: "Drawn" },
  { id: "l", label: "Lost" },
];

export function filterGames(games, tab, result = "any") {
  return games.filter((g) => {
    if (tab === "starred" && !g.favourite) return false;
    if (tab === "bots" && g.mode !== "bot") return false;
    if (tab === "imported" && g.mode !== "import") return false;
    if (result !== "any" && outcomeOf(g) !== result) return false;
    return true;
  });
}

// Saved analyses live apart from games, so the game cap never touches them.
export const ANALYSIS_CAP = 30;

/**
 * Saves (or updates, when `entry.id` is already saved) an analysis. The
 * oldest go when there are more than ANALYSIS_CAP. Returns the new store and
 * the saved id.
 */
export function saveAnalysis(s, entry, makeId, now = Date.now()) {
  const list = s.analyses || [];
  const id = entry.id && list.some((a) => a.id === entry.id) ? entry.id : makeId();
  const saved = { name: "Analysis", startFen: null, sans: [], ...entry, id, date: now };
  const rest = list.filter((a) => a.id !== id);
  const analyses = [saved, ...rest].sort((a, b) => b.date - a.date).slice(0, ANALYSIS_CAP);
  return { store: { ...s, analyses }, id };
}
