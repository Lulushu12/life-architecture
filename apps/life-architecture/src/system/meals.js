/**
 * Meal slots and timing rules, Sovereign Health OS v2.
 * The meal options themselves live as recipes in the Food app.
 * Dinner is the adjustment valve.
 */

export const SLOTS = [
  { id: "breakfast", label: "Breakfast",  when: "~06:30, at home (Sat ~07:00 as pre-workout)" },
  { id: "preworkout", label: "Pre-Workout", when: "~11:30–12:30, packed night before, portable" },
  { id: "recovery",  label: "Recovery Container", when: "Wednesday ~14:30, in car or at Sun Plaza, NON-OPTIONAL" },
  { id: "dinner",    label: "Dinner",     when: "Post-workout, flexible, fill the MFP gap" },
  { id: "snack",     label: "Late Night Snack", when: "Only if protein gap after dinner. Optional when full, not when tired." },
];

export const FAT_RULE =
  "Pre-workout meal must be low fat. Under 10g fat = 90 min minimum before training. " +
  "10–16g fat = 2–2.5 hours minimum. Do not leave the workplace without eating this.";

export const DINNER_NOTE =
  "Cook whatever you and Despina feel like. Check the running total, the remaining gap is your dinner target. " +
  "Sirloin is a regular option. Ribeye is a weekend treat, its fat will eat most of the daily fat budget in one meal. " +
  "Do not eat back gym calories.";
