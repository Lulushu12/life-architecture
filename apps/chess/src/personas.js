// Bot roster: two language casts (Romanian and English), each 25 levels
// (800–3200 in 100-Elo steps) × 3 bots. Individual bots reference shared
// personality archetypes that carry the dialogue packs and play style.
// The original 8 characters live on inside the Romanian roster with their
// legacy ids, so old win/loss records still resolve.

import { RO_PERSONALITIES, RO_ROSTER } from "./personas.ro.js";
import { EN_PERSONALITIES, EN_ROSTER } from "./personas.en.js";

function build(roster, personalities, lang) {
  return roster.map((b) => {
    const p = personalities[b.personalityId];
    return { ...b, lang, style: p.style, lines: p.lines };
  });
}

export const PERSONAS = [
  ...build(RO_ROSTER, RO_PERSONALITIES, "ro"),
  ...build(EN_ROSTER, EN_PERSONALITIES, "en"),
];

export const LEVELS = Array.from({ length: 25 }, (_, i) => 800 + i * 100);

export function personasByLang(lang) {
  return PERSONAS.filter((p) => p.lang === lang);
}

export function getPersona(id) {
  return PERSONAS.find((p) => p.id === id) || PERSONAS[0];
}
