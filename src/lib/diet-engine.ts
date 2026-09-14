import {
  checkAllergies,
  dietAllows,
  nutrientsFor,
  type Food,
  type Nutrients,
} from "./nutrition";

export type Recommendation = {
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  title: string;
  items: string[];
  calories: number;
  protein: number;
  rationale: string;
};

export type EngineInput = {
  goal: string;
  diet: string;
  allergies: string[];
  likes: string[];
  dislikes: string[];
  avoids: string[];
  targets: { calories: number; protein: number; fiber: number };
  consumed: Nutrients;
  recentFoods: string[];
  foods: Food[];
};

const TEMPLATES: {
  meal: Recommendation["meal"];
  title: string;
  need: string[];
  optional: string[];
  share: number;
}[] = [
  { meal: "breakfast", title: "Oats bowl", need: ["oats"], optional: ["banana", "yogurt", "chia seeds", "blueberry"], share: 0.25 },
  { meal: "breakfast", title: "Savoury start", need: ["whole wheat roti"], optional: ["egg", "tofu", "spinach", "tomato"], share: 0.25 },
  { meal: "lunch", title: "Grain and legume plate", need: ["rice", "lentils (dal)"], optional: ["green salad", "carrot", "cucumber"], share: 0.35 },
  { meal: "lunch", title: "Protein bowl", need: ["quinoa"], optional: ["chickpeas", "chicken breast", "paneer", "bell pepper"], share: 0.35 },
  { meal: "snack", title: "Light snack", need: ["apple"], optional: ["pumpkin seeds", "yogurt", "hummus", "carrot"], share: 0.12 },
  { meal: "dinner", title: "Warm, lighter dinner", need: ["vegetable soup"], optional: ["paneer", "tofu", "whole wheat roti", "broccoli"], share: 0.28 },
  { meal: "dinner", title: "Balanced dinner plate", need: ["brown rice"], optional: ["salmon", "kidney beans", "spinach", "olive oil"], share: 0.28 },
];

function isSafe(food: Food, input: EngineInput) {
  if (!dietAllows(food, input.diet)) return false;
  const blocked = [...input.dislikes, ...input.avoids].map((s) => s.toLowerCase().trim());
  if (blocked.some((b) => b && food.name.toLowerCase().includes(b))) return false;
  const warnings = checkAllergies([{ name: food.name, food }], input.allergies);
  return warnings.length === 0;
}

/**
 * Deterministic, rule-based recommendation engine.
 * Never returns a food that conflicts with a stored allergy or diet preference.
 */
export function generateRecommendations(input: EngineInput): {
  recommendations: Recommendation[];
  limit: string[];
  notes: string[];
} {
  const notes: string[] = [];
  const byName = new Map(input.foods.map((f) => [f.name.toLowerCase(), f]));
  const safeFoods = input.foods.filter((f) => isSafe(f, input));

  const remainingCalories = Math.max(0, input.targets.calories - input.consumed.calories);
  const proteinGap = Math.max(0, input.targets.protein - input.consumed.protein);
  const fiberGap = Math.max(0, input.targets.fiber - input.consumed.fiber);
  const liked = input.likes.map((l) => l.toLowerCase().trim()).filter(Boolean);

  const recommendations: Recommendation[] = [];
  const usedMeals = new Set<string>();

  for (const tpl of TEMPLATES) {
    if (usedMeals.has(tpl.meal)) continue;
    const base = tpl.need.map((n) => byName.get(n)).filter(Boolean) as Food[];
    if (base.length !== tpl.need.length) continue;
    if (!base.every((f) => isSafe(f, input))) continue;

    const budget = Math.max(180, Math.round(remainingCalories * tpl.share));
    const chosen: Food[] = [...base];

    const extras = tpl.optional
      .map((n) => byName.get(n))
      .filter((f): f is Food => !!f && isSafe(f, input))
      .sort((a, b) => {
        const likeScore = (f: Food) => (liked.some((l) => f.name.includes(l)) ? -3 : 0);
        const recent = (f: Food) => (input.recentFoods.includes(f.name) ? 2 : 0);
        const proteinScore = (f: Food) => (proteinGap > 15 ? -f.protein_100g / 12 : 0);
        const fiberScore = (f: Food) => (fiberGap > 6 ? -f.fiber_100g / 8 : 0);
        return (
          likeScore(a) + recent(a) + proteinScore(a) + fiberScore(a) -
          (likeScore(b) + recent(b) + proteinScore(b) + fiberScore(b))
        );
      });

    let total = chosen.reduce(
      (sum, f) => sum + nutrientsFor(f, f.avg_item_weight_g).calories,
      0,
    );
    for (const extra of extras) {
      const cal = nutrientsFor(extra, extra.avg_item_weight_g).calories;
      if (chosen.length >= 4) break;
      if (total + cal > budget * 1.15) continue;
      chosen.push(extra);
      total += cal;
    }

    const protein = Math.round(
      chosen.reduce((s, f) => s + nutrientsFor(f, f.avg_item_weight_g).protein, 0),
    );

    const reasons: string[] = [];
    if (input.goal === "weight_loss") reasons.push("kept within your remaining calorie budget");
    if (input.goal === "muscle" || proteinGap > 15) reasons.push(`helps close a ${Math.round(proteinGap)}g protein gap`);
    if (fiberGap > 6) reasons.push("adds fiber you are short on today");
    if (input.diet !== "none") reasons.push(`fits your ${input.diet.replace("_", "-")} preference`);
    if (input.allergies.length) reasons.push("excludes every allergy in your profile");

    recommendations.push({
      meal: tpl.meal,
      title: tpl.title,
      items: chosen.map((f) => f.name),
      calories: Math.round(total),
      protein,
      rationale: reasons.length
        ? `Estimated ${Math.round(total)} kcal — ${reasons.join(", ")}.`
        : `Estimated ${Math.round(total)} kcal from your food library.`,
    });
    usedMeals.add(tpl.meal);
  }

  if (safeFoods.length < 6) {
    notes.push(
      "Your preferences and allergies rule out most of the food library, so suggestions are limited. Add more liked foods in your profile for better results.",
    );
  }
  if (remainingCalories < 250) {
    notes.push(
      "You are close to your estimated calorie target for today, so these are light options only.",
    );
  }

  const limit = input.foods
    .filter((f) => f.calories_100g > 400 || f.sugar_100g > 12)
    .filter((f) => isSafe(f, input))
    .slice(0, 5)
    .map((f) => f.name);

  return { recommendations, limit, notes };
}
