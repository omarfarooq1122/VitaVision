"""Schemas for nutrition endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field


class FoodOut(BaseModel):
    name: str
    category: str
    calories_100g: float
    protein_100g: float
    carbs_100g: float
    fat_100g: float
    fiber_100g: float
    sugar_100g: float
    avg_item_weight_g: float
    allergens: list[str] = []
    diet_tags: list[str] = []
    source: str = "unknown"


class CalculateItem(BaseModel):
    food_name: str
    grams: float = Field(gt=0, le=5000)


class CalculateRequest(BaseModel):
    items: list[CalculateItem] = Field(min_length=1, max_length=40)


class TargetsRequest(BaseModel):
    age: int | None = Field(default=None, ge=10, le=100)
    height_cm: float | None = Field(default=None, ge=100, le=250)
    weight_kg: float | None = Field(default=None, ge=25, le=300)
    gender: str | None = None
    activity_level: str = "moderate"
    goal: str = "healthy_eating"
