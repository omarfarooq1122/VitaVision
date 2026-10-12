"""Request/response schemas for analysis endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    x1: float = Field(ge=0, le=1)
    y1: float = Field(ge=0, le=1)
    x2: float = Field(ge=0, le=1)
    y2: float = Field(ge=0, le=1)
    width: float = Field(ge=0, le=1)
    height: float = Field(ge=0, le=1)


class Nutrients(BaseModel):
    calories: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0
    sugar_g: float = 0


class AnalysisItem(BaseModel):
    food_name: str
    confidence: float
    confidence_band: str  # high | medium | low
    quantity: int
    bounding_box: BoundingBox
    estimated_weight_g: float
    weight_confidence: float
    estimation_method: str
    nutrition: Nutrients
    matched_food: str | None = None


class AllergyWarning(BaseModel):
    food_name: str
    allergy: str
    canonical_allergen: str | None = None
    match_type: str
    severity: str
    reason: str


class AnalysisResponse(BaseModel):
    analysis_id: str
    model: str = "YOLOv11"
    processing_time_ms: int
    items: list[AnalysisItem]
    totals: Nutrients
    warnings: list[str]
    allergy_warnings: list[AllergyWarning] = []
