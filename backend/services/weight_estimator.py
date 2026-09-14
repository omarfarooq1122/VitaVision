"""Modular weight estimation.

Every result is an estimate and is labelled as such. Four modes, tried in order:

1. reference_object_calibration - a known-size reference in frame (e.g. a coin)
2. food_specific_visual_estimation - box area + foreground ratio vs typical size
3. food_specific_typical_size - typical item weight x detected count
4. average_serving_fallback - generic serving weight when the food is unknown
"""

from __future__ import annotations

from dataclasses import dataclass

DEFAULT_SERVING_G = 100.0

# Fraction of the frame a single typical serving of a category tends to cover.
CATEGORY_FRAME_SHARE = {
    "fruit": 0.10,
    "vegetable": 0.12,
    "grain": 0.14,
    "cereal": 0.14,
    "pulse": 0.12,
    "legume": 0.12,
    "dairy": 0.09,
    "egg": 0.05,
    "meat": 0.11,
    "seafood": 0.11,
    "nut": 0.04,
    "seed": 0.03,
    "beverage": 0.10,
    "indian": 0.14,
    "packaged": 0.10,
    "other": 0.11,
}


@dataclass(slots=True)
class WeightEstimate:
    estimated_weight_g: float
    weight_confidence: float
    estimation_method: str


@dataclass(slots=True)
class ReferenceObject:
    """Optional in-frame calibration object with a known real area in cm^2."""

    frame_area_fraction: float
    real_area_cm2: float


class WeightEstimator:
    def estimate(
        self,
        *,
        food: dict | None,
        quantity: int,
        box_area_fraction: float | None = None,
        foreground_ratio: float | None = None,
        reference: ReferenceObject | None = None,
    ) -> WeightEstimate:
        quantity = max(1, int(quantity or 1))

        if reference and food and box_area_fraction:
            estimate = self._from_reference(food, quantity, box_area_fraction, reference)
            if estimate:
                return estimate

        if food and box_area_fraction:
            estimate = self._from_visual(food, quantity, box_area_fraction, foreground_ratio)
            if estimate:
                return estimate

        if food:
            per_item = float(food.get("avg_item_weight_g") or DEFAULT_SERVING_G)
            return WeightEstimate(
                estimated_weight_g=round(per_item * quantity, 1),
                weight_confidence=0.6,
                estimation_method="food_specific_typical_size",
            )

        return WeightEstimate(
            estimated_weight_g=round(DEFAULT_SERVING_G * quantity, 1),
            weight_confidence=0.3,
            estimation_method="average_serving_fallback",
        )

    def _from_reference(
        self,
        food: dict,
        quantity: int,
        box_area_fraction: float,
        reference: ReferenceObject,
    ) -> WeightEstimate | None:
        if reference.frame_area_fraction <= 0 or reference.real_area_cm2 <= 0:
            return None
        cm2_per_fraction = reference.real_area_cm2 / reference.frame_area_fraction
        food_area_cm2 = box_area_fraction * cm2_per_fraction
        # Density-ish heuristic: grams per cm^2 of plate footprint, per category.
        grams_per_cm2 = 1.6 if (food.get("category") or "") in {"meat", "seafood", "dairy"} else 1.2
        grams = max(5.0, food_area_cm2 * grams_per_cm2)
        return WeightEstimate(
            estimated_weight_g=round(min(grams, 2000.0), 1),
            weight_confidence=0.8,
            estimation_method="reference_object_calibration",
        )

    def _from_visual(
        self,
        food: dict,
        quantity: int,
        box_area_fraction: float,
        foreground_ratio: float | None,
    ) -> WeightEstimate | None:
        typical = float(food.get("avg_item_weight_g") or DEFAULT_SERVING_G)
        category = (food.get("category") or "other").lower()
        expected_share = CATEGORY_FRAME_SHARE.get(category, CATEGORY_FRAME_SHARE["other"])
        if expected_share <= 0 or box_area_fraction <= 0:
            return None

        occupied = box_area_fraction * (foreground_ratio if foreground_ratio else 0.75)
        ratio = occupied / (expected_share * quantity)
        # Keep the visual signal within a sane band around the typical serving.
        ratio = max(0.4, min(2.5, ratio))
        grams = typical * quantity * ratio
        confidence = 0.72 if foreground_ratio else 0.62
        return WeightEstimate(
            estimated_weight_g=round(max(5.0, min(grams, 3000.0)), 1),
            weight_confidence=confidence,
            estimation_method="food_specific_visual_estimation",
        )
