// All lesson content, loaded at build time from the files in this folder.
// Adding a new lessons file here is all it takes to publish it.

const modules = import.meta.glob("./*.js", { eager: true });

export const LESSONS = Object.entries(modules)
  .filter(([path]) => !path.endsWith("/index.js"))
  .flatMap(([, mod]) => mod.LESSONS || mod.default || []);

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
  return [...groups.entries()];
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
