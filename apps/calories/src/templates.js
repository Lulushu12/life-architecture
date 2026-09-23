const LA_OPTIONS = {
  breakfast: [
    { id: "b1", label: "3 scrambled eggs + 60g oats + black coffee", kcal: 450, protein: 27, fat: 20, carbs: 40 },
    { id: "b2", label: "4-egg omelette + 30g feta + 2 wholegrain bread + coffee", kcal: 550, protein: 34, fat: 30, carbs: 32 },
    { id: "b3", label: "60g oats + 1 scoop whey (after cooking) + banana", kcal: 460, protein: 33, fat: 8, carbs: 65 },
    { id: "b4", label: "200g Greek yogurt + 60g overnight oats + banana + coffee", kcal: 480, protein: 28, fat: 10, carbs: 68 },
  ],
  preworkout: [
    { id: "p1", label: "100g turkey breast + 150g cooked rice + banana", kcal: 420, protein: 28, fat: 4, carbs: 70 },
    { id: "p2", label: "100g chicken breast + 3 Wasa crispbreads + apple", kcal: 320, protein: 26, fat: 4, carbs: 45 },
    { id: "p3", label: "ON Nutty Chocolate Caramel bar + 150g branza de vaci", kcal: 400, protein: 35, fat: 14, carbs: 30 },
    { id: "p4", label: "2 rice cakes + 100g turkey breast + banana", kcal: 300, protein: 25, fat: 3, carbs: 45 },
  ],
  recovery: [
    { id: "r1", label: "150g branza de vaci + 20g chia seeds", kcal: 270, protein: 26, fat: 12, carbs: 10 },
    { id: "r2", label: "ON Nutty Chocolate Caramel bar", kcal: 240, protein: 20, fat: 9, carbs: 19 },
    { id: "r3", label: "200g Greek yogurt + banana", kcal: 290, protein: 20, fat: 6, carbs: 40 },
    { id: "r4", label: "150g cottage cheese + 30g walnuts (not before training)", kcal: 350, protein: 22, fat: 24, carbs: 8 },
  ],
  snack: [
    { id: "s1", label: "150g branza de vaci + 20g chia seeds", kcal: 270, protein: 26, fat: 12, carbs: 10 },
    { id: "s2", label: "200g Greek yogurt", kcal: 130, protein: 20, fat: 1, carbs: 8 },
    { id: "s3", label: "1 scoop whey in water", kcal: 120, protein: 24, fat: 1, carbs: 3 },
    { id: "s4", label: "2 hard boiled eggs", kcal: 140, protein: 12, fat: 10, carbs: 1 },
  ],
};

const SLOT_TO_MEAL = { breakfast: "breakfast", preworkout: "lunch", recovery: "snacks", snack: "snacks" };

export function quickItem({ name, kcal, protein, carbs, fat }) {
  return {
    name: name || "Quick add",
    quick: true,
    grams: 100,
    kcal100: Number(kcal) || 0,
    protein100: Number(protein) || 0,
    carbs100: Number(carbs) || 0,
    fat100: Number(fat) || 0,
  };
}

export function seedTemplates() {
  const out = {};
  const seen = new Set();
  for (const [slot, options] of Object.entries(LA_OPTIONS)) {
    const meal = SLOT_TO_MEAL[slot];
    for (const o of options) {
      const key = `${meal}:${o.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const id = `la-${o.id}`;
      out[id] = { id, name: o.label, meal, items: [quickItem({ name: o.label, ...o })], seeded: true, updatedAt: 0 };
    }
  }
  return out;
}
