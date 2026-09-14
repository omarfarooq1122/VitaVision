"""Nutrition lookup and calculation.

Supabase's `foods` table is the source of truth. A local JSON copy in
data/nutrition/foods.json is used only when Supabase cannot be reached, so the
backend never invents values.
"""

from __future__ import annotations

import json
import logging
import re
import threading
import time

import httpx

from config import Settings

logger = logging.getLogger(__name__)

NUMERIC_FIELDS = (
    "calories_100g",
    "protein_100g",
    "carbs_100g",
    "fat_100g",
    "fiber_100g",
    "sugar_100g",
    "avg_item_weight_g",
)

ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "very": 1.725,
    "athlete": 1.9,
}

GOAL_CALORIE_DELTA = {
    "weight_loss": -400,
    "weight_gain": 400,
    "muscle": 250,
    "maintenance": 0,
    "healthy_eating": 0,
}


def normalise(name: str) -> str:
    cleaned = re.sub(r"[^a-z\s]", "", (name or "").strip().lower())
    return re.sub(r"s$", "", cleaned).strip()


class NutritionService:
    def __init__(self, settings: Settings, cache_seconds: int = 600) -> None:
        self.settings = settings
        self._cache: list[dict] = []
        self._loaded_at = 0.0
        self._cache_seconds = cache_seconds
        self._lock = threading.Lock()

    # --- food library -----------------------------------------------------
    def foods(self, force: bool = False) -> list[dict]:
        fresh = self._cache and (time.time() - self._loaded_at) < self._cache_seconds
        if fresh and not force:
            return self._cache
        with self._lock:
            foods = self._from_supabase() or self._from_file()
            if foods:
                self._cache = foods
                self._loaded_at = time.time()
        return self._cache

    def _from_supabase(self) -> list[dict]:
        if not (self.settings.supabase_url and self.settings.supabase_anon_key):
            return []
        url = f"{self.settings.supabase_url.rstrip('/')}/rest/v1/foods"
        try:
            response = httpx.get(
                url,
                params={"select": "*", "limit": "5000"},
                headers={
                    "apikey": self.settings.supabase_anon_key,
                    "Accept": "application/json",
                },
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()
            return [self._coerce(row) for row in data] if isinstance(data, list) else []
        except Exception as exc:  # noqa: BLE001 - fall back to the bundled file
            logger.warning("Could not read foods from Supabase (%s); using local file", exc)
            return []

    def _from_file(self) -> list[dict]:
        path = self.settings.nutrition_file
        if not path.exists():
            logger.error("Local nutrition file missing at %s", path)
            return []
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            logger.exception("Local nutrition file could not be parsed")
            return []
        rows = payload.get("foods", payload) if isinstance(payload, dict) else payload
        return [self._coerce(row) for row in rows]

    @staticmethod
    def _coerce(row: dict) -> dict:
        out = dict(row)
        for field in NUMERIC_FIELDS:
            try:
                out[field] = float(out.get(field) or 0)
            except (TypeError, ValueError):
                out[field] = 0.0
        out["allergens"] = [str(a).lower() for a in (out.get("allergens") or [])]
        out["diet_tags"] = [str(t).lower() for t in (out.get("diet_tags") or [])]
        out["name"] = str(out.get("name") or "").strip()
        out["category"] = str(out.get("category") or "other").strip().lower()
        out["source"] = str(out.get("source") or "unknown")
        return out

    # --- matching ---------------------------------------------------------
    def match(self, name: str, foods: list[dict] | None = None) -> dict | None:
        library = foods if foods is not None else self.foods()
        target = normalise(name)
        if not target:
            return None
        best: dict | None = None
        best_score = 0
        target_words = set(target.split())
        for food in library:
            candidate = normalise(food["name"])
            if not candidate:
                continue
            if candidate == target:
                score = 100
            elif target in candidate or candidate in target:
                score = 60 + min(len(candidate), len(target))
            else:
                score = len(target_words & set(candidate.split())) * 20
            if score > best_score:
                best_score, best = score, food
        return best if best_score >= 40 else None

    # --- calculation ------------------------------------------------------
    @staticmethod
    def nutrients_for(food: dict | None, grams: float) -> dict[str, float]:
        if not food:
            return {"calories": 0.0, "protein_g": 0.0, "carbs_g": 0.0, "fat_g": 0.0, "fiber_g": 0.0, "sugar_g": 0.0}
        factor = grams / 100.0
        return {
            "calories": round(food["calories_100g"] * factor, 1),
            "protein_g": round(food["protein_100g"] * factor, 1),
            "carbs_g": round(food["carbs_100g"] * factor, 1),
            "fat_g": round(food["fat_100g"] * factor, 1),
            "fiber_g": round(food["fiber_100g"] * factor, 1),
            "sugar_g": round(food["sugar_100g"] * factor, 1),
        }

    @staticmethod
    def total(items: list[dict[str, float]]) -> dict[str, float]:
        keys = ("calories", "protein_g", "carbs_g", "fat_g", "fiber_g", "sugar_g")
        return {key: round(sum(item.get(key, 0.0) for item in items), 1) for key in keys}

    @staticmethod
    def targets(
        *,
        age: int | None,
        height_cm: float | None,
        weight_kg: float | None,
        gender: str | None,
        activity_level: str = "moderate",
        goal: str = "healthy_eating",
    ) -> dict[str, float | str]:
        """Mifflin-St Jeor BMR -> TDEE -> goal-adjusted targets. All estimates."""
        weight = float(weight_kg or 70)
        height = float(height_cm or 170)
        years = int(age or 30)
        weight = min(max(weight, 25.0), 300.0)
        height = min(max(height, 100.0), 250.0)
        years = min(max(years, 10), 100)

        sex_offset = {"male": 5, "female": -161}.get((gender or "").lower(), -78)
        bmr = 10 * weight + 6.25 * height - 5 * years + sex_offset
        multiplier = ACTIVITY_MULTIPLIERS.get(activity_level, 1.55)
        tdee = bmr * multiplier
        calories = tdee + GOAL_CALORIE_DELTA.get(goal, 0)
        # Safety floor: never recommend below a conservative minimum intake.
        floor = 1500 if (gender or "").lower() == "male" else 1200
        calories = max(floor, round(calories / 10) * 10)

        protein_per_kg = 1.8 if goal == "muscle" else 1.6 if goal == "weight_loss" else 1.2
        protein = round(weight * protein_per_kg)
        fat = round((calories * 0.28) / 9)
        carbs = max(80, round((calories - protein * 4 - fat * 9) / 4))
        fiber = round(min(38, max(22, calories / 1000 * 14)))

        return {
            "bmr": round(bmr),
            "tdee": round(tdee),
            "activity_multiplier": multiplier,
            "goal_adjustment": GOAL_CALORIE_DELTA.get(goal, 0),
            "calorie_target": calories,
            "protein_target": protein,
            "carb_target": carbs,
            "fat_target": fat,
            "fiber_target": fiber,
            "basis": "Mifflin-St Jeor BMR x activity multiplier, adjusted for goal. Estimates only.",
        }
