"""Personalized meal suggestions built from the food database.

Profile -> daily targets -> remaining today -> filter allergies / diet /
dislikes -> prefer likes -> pick per-meal foods. Never suggests a food that
conflicts with a stored allergy.
"""

from __future__ import annotations

from services.allergy_service import AllergyService
from services.nutrition_service import NutritionService, normalise

MEAL_ORDER = ("Breakfast", "Lunch", "Snack", "Dinner")

# Which categories make sense for which meal.
MEAL_CATEGORIES = {
    "Breakfast": {"cereal", "grain", "dairy", "egg", "fruit", "indian", "beverage"},
    "Lunch": {"grain", "pulse", "legume", "vegetable", "meat", "seafood", "indian", "dairy"},
    "Snack": {"fruit", "nut", "seed", "dairy", "packaged", "beverage"},
    "Dinner": {"grain", "pulse", "legume", "vegetable", "meat", "seafood", "indian", "dairy"},
}

VEGETARIAN_EXCLUDED = {"meat", "seafood", "egg"}
VEGAN_EXCLUDED = VEGETARIAN_EXCLUDED | {"dairy"}


class RecommendationService:
    def __init__(self, nutrition: NutritionService, allergy: AllergyService) -> None:
        self.nutrition = nutrition
        self.allergy = allergy

    def suggest(self, profile, consumed_calories: float, consumed_protein_g: float) -> dict:
        targets = NutritionService.targets(
            age=profile.age,
            height_cm=profile.height_cm,
            weight_kg=profile.weight_kg,
            gender=profile.gender,
            activity_level=profile.activity_level,
            goal=profile.goal,
        )
        remaining = max(0.0, float(targets["calorie_target"]) - consumed_calories)

        diet = (profile.diet or "non_vegetarian").lower()
        excluded_categories: set[str] = set()
        if diet in {"vegetarian", "vegan", "eggetarian"}:
            excluded_categories |= {"meat", "seafood"}
            if diet == "vegan":
                excluded_categories |= VEGAN_EXCLUDED
            if diet == "vegetarian":
                excluded_categories |= {"egg"}

        dislikes = {normalise(d) for d in profile.dislikes}
        likes = {normalise(l) for l in profile.likes}

        eligible: list[dict] = []
        for food in self.nutrition.foods():
            category = (food.get("category") or "other").lower()
            if category in excluded_categories:
                continue
            if diet in {"vegetarian", "vegan", "eggetarian"}:
                tags = set(food.get("diet_tags") or [])
                if tags and diet not in tags and "non_vegetarian" in tags:
                    continue
            if normalise(food.get("name", "")) in dislikes:
                continue
            if profile.allergies and self.allergy.conflicts(food, profile.allergies):
                continue  # hard rule: never recommend an allergy-conflicting food
            eligible.append(food)

        suggestions: list[dict] = []
        per_meal_budget = remaining / len(MEAL_ORDER) if remaining else 0
        used: set[str] = set()
        for meal in MEAL_ORDER:
            candidates = [
                f
                for f in eligible
                if (f.get("category") or "other").lower() in MEAL_CATEGORIES[meal]
                and f["name"] not in used
            ]
            if not candidates:
                continue
            candidates.sort(
                key=lambda f: (
                    normalise(f["name"]) in likes,
                    f.get("protein_100g", 0),
                ),
                reverse=True,
            )
            pick = candidates[0]
            used.add(pick["name"])
            per_100 = float(pick.get("calories_100g") or 0)
            serving = float(pick.get("avg_item_weight_g") or 100)
            if per_100 > 0 and per_meal_budget > 0:
                servings = max(0.5, min(3.0, round(per_meal_budget / (per_100 * serving / 100) * 2) / 2))
            else:
                servings = 1.0
            grams = serving * servings
            nutrients = NutritionService.nutrients_for(pick, grams)
            liked = normalise(pick["name"]) in likes
            suggestions.append(
                {
                    "meal": meal,
                    "food_name": pick["name"],
                    "servings": servings,
                    "calories": nutrients["calories"],
                    "protein_g": nutrients["protein_g"],
                    "reason": (
                        "One of your liked foods that fits today's remaining target."
                        if liked
                        else "Fits your diet preference and today's remaining calorie target."
                    ),
                }
            )

        return {
            "targets": targets,
            "remaining_calories": round(remaining, 1),
            "suggestions": suggestions,
        }
