/**
 * Meal options — Sovereign Health OS v2.
 * Macros are reasonable per-option ESTIMATES to drive the running total;
 * every quick-logged entry is editable before save. Dinner is the adjustment valve.
 */

export const SLOTS = [
  { id: "breakfast", label: "Breakfast",  when: "~06:30, at home (Sat ~07:00 as pre-workout)" },
  { id: "preworkout", label: "Pre-Workout", when: "~11:30–12:30, packed night before, portable" },
  { id: "recovery",  label: "Recovery Container", when: "Wednesday ~14:30, in car or at Sun Plaza — NON-OPTIONAL" },
  { id: "dinner",    label: "Dinner",     when: "Post-workout, flexible — fill the MFP gap" },
  { id: "snack",     label: "Late Night Snack", when: "Only if protein gap after dinner. Optional when full, not when tired." },
];

export const FAT_RULE =
  "Pre-workout meal must be low fat. Under 10g fat = 90 min minimum before training. " +
  "10–16g fat = 2–2.5 hours minimum. Do not leave the workplace without eating this.";

export const OPTIONS = {
  breakfast: [
    { id: "b1", label: "3 scrambled eggs + 60g oats + black coffee",                 kcal: 450, protein: 27, fat: 20, carbs: 40 },
    { id: "b2", label: "4-egg omelette + 30g feta + 2 wholegrain bread + coffee",    kcal: 550, protein: 34, fat: 30, carbs: 32 },
    { id: "b3", label: "60g oats + 1 scoop whey (after cooking) + banana",           kcal: 460, protein: 33, fat: 8,  carbs: 65 },
    { id: "b4", label: "200g Greek yogurt + 60g overnight oats + banana + coffee",   kcal: 480, protein: 28, fat: 10, carbs: 68 },
  ],
  preworkout: [
    { id: "p1", label: "100g turkey breast + 150g cooked rice + banana",             kcal: 420, protein: 28, fat: 4,  carbs: 70 },
    { id: "p2", label: "100g chicken breast + 3 Wasa crispbreads + apple",           kcal: 320, protein: 26, fat: 4,  carbs: 45 },
    { id: "p3", label: "ON Nutty Chocolate Caramel bar + 150g branza de vaci",       kcal: 400, protein: 35, fat: 14, carbs: 30, fatNote: "10–16g fat → 2–2.5h before training" },
    { id: "p4", label: "2 rice cakes + 100g turkey breast + banana",                 kcal: 300, protein: 25, fat: 3,  carbs: 45 },
  ],
  recovery: [
    { id: "r1", label: "150g branza de vaci + 20g chia seeds",                       kcal: 270, protein: 26, fat: 12, carbs: 10 },
    { id: "r2", label: "ON Nutty Chocolate Caramel bar",                             kcal: 240, protein: 20, fat: 9,  carbs: 19 },
    { id: "r3", label: "200g Greek yogurt + banana",                                 kcal: 290, protein: 20, fat: 6,  carbs: 40 },
    { id: "r4", label: "150g cottage cheese + 30g walnuts (not before training)",    kcal: 350, protein: 22, fat: 24, carbs: 8 },
  ],
  dinner: [], // free-form: cook with Despina, fill the remaining macro gap
  snack: [
    { id: "s1", label: "150g branza de vaci + 20g chia seeds",                       kcal: 270, protein: 26, fat: 12, carbs: 10 },
    { id: "s2", label: "200g Greek yogurt",                                          kcal: 130, protein: 20, fat: 1,  carbs: 8 },
    { id: "s3", label: "1 scoop whey in water",                                      kcal: 120, protein: 24, fat: 1,  carbs: 3 },
    { id: "s4", label: "2 hard boiled eggs",                                         kcal: 140, protein: 12, fat: 10, carbs: 1 },
  ],
};

export const DINNER_NOTE =
  "Cook whatever you and Despina feel like. Check the running total — the remaining gap is your dinner target. " +
  "Sirloin is a regular option. Ribeye is a weekend treat — its fat will eat most of the daily fat budget in one meal. " +
  "Do not eat back gym calories.";
