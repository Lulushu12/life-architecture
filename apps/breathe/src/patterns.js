export const PHASE_LABELS = { in: "In", holdIn: "Hold", out: "Out", holdOut: "Hold" };
export const PHASE_SPOKEN = { in: "Breathe in", holdIn: "Hold", out: "Breathe out", holdOut: "Hold" };

export const PATTERNS = [
  {
    id: "whm",
    label: "Wim Hof",
    sub: "Power breaths, then an exhale hold",
    retention: true,
  },
  {
    id: "box",
    label: "Box 4-4-4-4",
    sub: "Even in, hold, out, hold",
    phases: [
      { kind: "in", s: 4 },
      { kind: "holdIn", s: 4 },
      { kind: "out", s: 4 },
      { kind: "holdOut", s: 4 },
    ],
    unit: "minutes",
    amount: 4,
    min: 1,
    max: 30,
  },
  {
    id: "478",
    label: "4-7-8",
    sub: "In for 4, hold for 7, out for 8",
    phases: [
      { kind: "in", s: 4 },
      { kind: "holdIn", s: 7 },
      { kind: "out", s: 8 },
    ],
    unit: "cycles",
    amount: 4,
    min: 1,
    max: 12,
  },
  {
    id: "sigh",
    label: "Physiological sigh",
    sub: "Double inhale through the nose, long exhale",
    phases: [
      { kind: "in", s: 2 },
      { kind: "in", s: 1 },
      { kind: "out", s: 6 },
    ],
    unit: "cycles",
    amount: 3,
    min: 1,
    max: 20,
  },
  {
    id: "coherent",
    label: "Coherent",
    sub: "5.5s in, 5.5s out",
    phases: [
      { kind: "in", s: 5.5 },
      { kind: "out", s: 5.5 },
    ],
    unit: "minutes",
    amount: 5,
    min: 1,
    max: 30,
  },
];

export const patternById = (id) => PATTERNS.find((p) => p.id === id) || PATTERNS[0];

export const isRetention = (entry) => !entry.pattern || entry.pattern === "whm";

export const cycleSeconds = (phases) => phases.reduce((a, p) => a + p.s, 0);

export function cyclesFor(pattern, amount) {
  if (pattern.unit === "minutes") return Math.max(1, Math.round((amount * 60) / cycleSeconds(pattern.phases)));
  return Math.max(1, Math.round(amount));
}

export function patternAmount(settings, pattern) {
  const v = settings.patternAmounts && settings.patternAmounts[pattern.id];
  return typeof v === "number" && Number.isFinite(v) ? Math.min(pattern.max, Math.max(pattern.min, v)) : pattern.amount;
}

export function describeTiming(phases) {
  return phases.map((p) => `${PHASE_LABELS[p.kind]} ${p.s}s`).join(" · ");
}
