// Macro math shared by the picker, editor, and Today screen. Foods always
// store per-100g macros; piece-based foods additionally carry pieceWeight
// (grams per piece) so grams stays the single source of truth for a log
// entry no matter how the user entered the quantity.

export function macrosForGrams(food, grams) {
  const g = Number(grams) || 0;
  const f = g / 100;
  return {
    kcal: (food.kcal100 || 0) * f,
    protein: (food.protein100 || 0) * f,
    carbs: (food.carbs100 || 0) * f,
    fat: (food.fat100 || 0) * f,
  };
}

export function gramsForPieces(food, pieces) {
  return (Number(pieces) || 0) * (food.pieceWeight || 0);
}
