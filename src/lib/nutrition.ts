export type Food = {
  id: string;
  name: string;
  category: string;
  calories_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
  fiber_100g: number;
  sugar_100g: number;
  avg_item_weight_g: number;
  serving_label: string;
  allergens: string[];
  diet_tags: string[];
};

export type Detection = {
  food_name: string;
  confidence: number;
  quantity: number;
  bounding_box: { x1: number; y1: number; x2: number; y2: number } | null;
};

export type Nutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
};

export const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary (desk job, little exercise)", multiplier: 1.2 },
  { value: "light", label: "Lightly active (1–3 days a week)", multiplier: 1.375 },
  { value: "moderate", label: "Moderately active (3–5 days a week)", multiplier: 1.55 },
  { value: "very", label: "Very active (6–7 days a week)", multiplier: 1.725 },
  { value: "athlete", label: "Athlete / physical job", multiplier: 1.9 },
] as const;

export const GOALS = [
  { value: "weight_loss", label: "Weight loss" },
  { value: "maintenance", label: "Weight maintenance" },
  { value: "weight_gain", label: "Weight gain" },
  { value: "healthy_eating", label: "General healthy eating" },
  { value: "muscle", label: "Muscle / fitness support" },
] as const;

export const DIETS = [
  { value: "none", label: "No specific preference" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "eggetarian", label: "Eggetarian" },
  { value: "non_vegetarian", label: "Non-vegetarian" },
  { value: "other", label: "Other" },
] as const;

export const COMMON_ALLERGENS = [
  "peanut",
  "milk",
  "egg",
  "soy",
  "wheat",
  "fish",
  "shellfish",
  "tree nuts",
  "sesame",
  "gluten",
];

export type TargetProfile = {
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  gender: string | null;
  activity_level: string;
  goal: string;
};

/**
 * Mifflin–St Jeor BMR x activity multiplier, adjusted for goal.
 * Deliberately transparent and always presented as an estimate.
 */
export function computeTargets(p: TargetProfile) {
  const weight = p.weight_kg ?? 70;
  const height = p.height_cm ?? 170;
  const age = p.age ?? 30;
  const sexOffset = p.gender === "female" ? -161 : p.gender === "male" ? 5 : -78;
  const bmr = 10 * weight + 6.25 * height - 5 * age + sexOffset;

  const activity =
    ACTIVITY_LEVELS.find((a) => a.value === p.activity_level)?.multiplier ?? 1.55;
  let calories = bmr * activity;

  if (p.goal === "weight_loss") calories -= 400;
  if (p.goal === "weight_gain") calories += 400;
  if (p.goal === "muscle") calories += 250;
  calories = Math.max(1200, Math.round(calories / 10) * 10);

  const proteinPerKg = p.goal === "muscle" ? 1.8 : p.goal === "weight_loss" ? 1.6 : 1.2;
  const protein = Math.round(weight * proteinPerKg);
  const fat = Math.round((calories * 0.28) / 9);
  const carbs = Math.max(80, Math.round((calories - protein * 4 - fat * 9) / 4));
  const fiber = Math.round(Math.min(38, Math.max(22, calories / 1000 * 14)));

  return { bmr: Math.round(bmr), calories, protein, carbs, fat, fiber };
}

export function normalise(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z\s]/g, "").replace(/s$/, "");
}

export function matchFood(name: string, foods: Food[]): Food | null {
  const n = normalise(name);
  if (!n) return null;
  let best: Food | null = null;
  let bestScore = 0;
  for (const food of foods) {
    const f = normalise(food.name);
    let score = 0;
    if (f === n) score = 100;
    else if (n.includes(f) || f.includes(n)) score = 60 + Math.min(f.length, n.length);
    else {
      const shared = f.split(" ").filter((w) => n.split(" ").includes(w));
      score = shared.length * 20;
    }
    if (score > bestScore) {
      bestScore = score;
      best = food;
    }
  }
  return bestScore >= 40 ? best : null;
}

/** Estimated weight: food-specific average item weight x detected count. */
export function estimateWeight(food: Food | null, quantity: number) {
  const per = food?.avg_item_weight_g ?? 100;
  return Math.round(per * Math.max(1, quantity));
}

export function nutrientsFor(food: Food | null, grams: number): Nutrients {
  if (!food) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };
  const k = grams / 100;
  const r = (v: number) => Math.round(v * k * 10) / 10;
  return {
    calories: Math.round(food.calories_100g * k),
    protein: r(food.protein_100g),
    carbs: r(food.carbs_100g),
    fat: r(food.fat_100g),
    fiber: r(food.fiber_100g),
    sugar: r(food.sugar_100g),
  };
}

export function sumNutrients(items: Nutrients[]): Nutrients {
  return items.reduce(
    (acc, n) => ({
      calories: acc.calories + n.calories,
      protein: Math.round((acc.protein + n.protein) * 10) / 10,
      carbs: Math.round((acc.carbs + n.carbs) * 10) / 10,
      fat: Math.round((acc.fat + n.fat) * 10) / 10,
      fiber: Math.round((acc.fiber + n.fiber) * 10) / 10,
      sugar: Math.round((acc.sugar + n.sugar) * 10) / 10,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
  );
}

export type AllergyWarning = {
  food_name: string;
  allergy: string;
  reason: string;
};

/**
 * Matches detected foods against the stored allergy profile.
 * This is a preference-matching aid — never a guarantee of allergen-free food.
 */
export function checkAllergies(
  detected: { name: string; food: Food | null }[],
  allergies: string[],
): AllergyWarning[] {
  const warnings: AllergyWarning[] = [];
  for (const allergy of allergies) {
    const a = normalise(allergy);
    if (!a) continue;
    for (const item of detected) {
      const itemName = normalise(item.name);
      const allergens = (item.food?.allergens ?? []).map(normalise);
      const directHit = itemName.includes(a) || a.includes(itemName);
      const listedHit = allergens.some((x) => x.includes(a) || a.includes(x));
      if (directHit || listedHit) {
        warnings.push({
          food_name: item.name,
          allergy,
          reason: directHit
            ? `Detected food matches "${allergy}" in your allergy list.`
            : `This food is listed as containing ${allergy}.`,
        });
      }
    }
  }
  return warnings;
}

export function dietAllows(food: Food, diet: string) {
  const tags = food.diet_tags.map((t) => t.toLowerCase());
  switch (diet) {
    case "vegan":
      return tags.includes("vegan");
    case "vegetarian":
      return tags.includes("vegetarian") || tags.includes("vegan");
    case "eggetarian":
      return tags.includes("vegetarian") || tags.includes("vegan") || tags.includes("eggetarian");
    default:
      return true;
  }
}

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];
