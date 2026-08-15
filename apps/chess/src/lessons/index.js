// All lesson content, loaded at build time from the files in this folder.
// Adding a new lessons file here is all it takes to publish it.

import { groupPlays, groupShare } from "./popularity.js";

const modules = import.meta.glob("./*.js", { eager: true });

// Everything in this folder is lesson content except the two support modules.
const SUPPORT = ["/index.js", "/popularity.js"];

export const LESSONS = Object.entries(modules)
  .filter(([path]) => !SUPPORT.some((s) => path.endsWith(s)))
  .flatMap(([, mod]) => mod.LESSONS || mod.default || []);

export { groupShare };

export const CATEGORY_LABELS = {
  openings: "Openings",
  concepts: "Concepts",
  endgames: "Endgames",
};

export const LEVEL_ORDER = { beginner: 0, intermediate: 1, advanced: 2 };

export function lessonsByCategory(category) {
  const list = LESSONS.filter((l) => l.category === category);
  const groups = new Map();
  for (const l of list) {
    const key = l.group || "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(l);
  }
  for (const arr of groups.values())
    arr.sort((a, b) => (LEVEL_ORDER[a.level] ?? 1) - (LEVEL_ORDER[b.level] ?? 1));

  const entries = [...groups.entries()];
  // Openings are ordered by how often you'll actually meet them, commonest
  // first, rather than alphabetically — learning the Sicilian before the
  // Latvian Gambit is worth more than tidy ordering. Other categories keep
  // their authored order.
  if (category === "openings") {
    entries.sort((a, b) => groupPlays(b[0]) - groupPlays(a[0]));
  }
  return entries;
}

export function getLesson(id) {
  return LESSONS.find((l) => l.id === id);
}

export function categoryCounts() {
  return Object.keys(CATEGORY_LABELS).map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    count: LESSONS.filter((l) => l.category === key).length,
  }));
}
