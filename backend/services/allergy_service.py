"""Allergy matching against the user's stored allergy profile.

This is a preference-matching aid built on a food database. It can never
guarantee that a dish is free of an allergen.
"""

from __future__ import annotations

from services.nutrition_service import normalise

CANONICAL_ALLERGENS = {
    "milk": {"milk", "dairy", "curd", "yogurt", "yoghurt", "paneer", "cheese", "butter", "ghee", "cream", "lassi", "khoa", "casein", "whey"},
    "egg": {"egg", "omelette", "omelet", "mayonnaise", "albumen"},
    "peanut": {"peanut", "groundnut", "peanut butter", "chikki"},
    "tree nuts": {"tree nut", "almond", "cashew", "walnut", "pistachio", "hazelnut", "pecan", "badam", "kaju"},
    "soy": {"soy", "soya", "soybean", "tofu", "edamame", "tempeh"},
    "wheat": {"wheat", "atta", "maida", "chapati", "roti", "paratha", "naan", "bread", "pasta", "suji", "semolina", "rava"},
    "gluten": {"gluten", "wheat", "barley", "rye", "atta", "maida", "seitan", "bread", "pasta"},
    "fish": {"fish", "tuna", "salmon", "sardine", "mackerel", "anchovy", "pomfret", "rohu"},
    "shellfish": {"shellfish", "prawn", "shrimp", "crab", "lobster", "squid", "clam", "mussel", "oyster"},
    "sesame": {"sesame", "til", "tahini", "gingelly"},
    "mustard": {"mustard", "sarson", "rai"},
}

HIGH_PRIORITY = {"peanut", "tree nuts", "shellfish", "fish", "egg", "milk", "sesame"}


def canonical_for(term: str) -> str | None:
    key = normalise(term)
    if not key:
        return None
    for canonical, synonyms in CANONICAL_ALLERGENS.items():
        if key == canonical or key in {normalise(s) for s in synonyms}:
            return canonical
    return None


class AllergyService:
    def check(
        self,
        detected: list[dict],
        allergies: list[str],
    ) -> list[dict]:
        """detected items: {"food_name": str, "food": dict | None}"""
        warnings: list[dict] = []
        seen: set[tuple[str, str]] = set()

        for allergy in allergies:
            term = normalise(allergy)
            if not term:
                continue
            canonical = canonical_for(allergy)
            synonyms = {term}
            if canonical:
                synonyms |= {normalise(s) for s in CANONICAL_ALLERGENS[canonical]}
            synonyms.discard("")

            for item in detected:
                name = normalise(item.get("food_name", ""))
                food = item.get("food") or {}
                listed = {normalise(a) for a in (food.get("allergens") or [])}

                name_hit = any(s and (s in name or name in s) for s in synonyms)
                ingredient_hit = bool(listed & synonyms) or (canonical and canonical in listed)

                if not (name_hit or ingredient_hit):
                    continue

                key = (item.get("food_name", ""), allergy)
                if key in seen:
                    continue
                seen.add(key)

                severity = "high" if (canonical in HIGH_PRIORITY if canonical else False) else "medium"
                warnings.append(
                    {
                        "food_name": item.get("food_name", ""),
                        "allergy": allergy,
                        "canonical_allergen": canonical,
                        "match_type": "name" if name_hit else "ingredient",
                        "severity": severity,
                        "reason": (
                            f'Detected food matches "{allergy}" in your allergy list.'
                            if name_hit
                            else f"This food is recorded as containing {allergy}."
                        ),
                    }
                )
        # High severity first so the UI can lead with it.
        return sorted(warnings, key=lambda w: 0 if w["severity"] == "high" else 1)

    def conflicts(self, food: dict, allergies: list[str]) -> bool:
        return bool(self.check([{"food_name": food.get("name", ""), "food": food}], allergies))
