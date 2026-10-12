"""Schemas for the recommendation endpoint."""

from __future__ import annotations

from pydantic import BaseModel, Field


class RecommendationProfile(BaseModel):
    age: int | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    gender: str | None = None
    activity_level: str = "moderate"
    goal: str = "healthy_eating"
    diet: str = "non_vegetarian"
    allergies: list[str] = []
    likes: list[str] = []
    dislikes: list[str] = []


class RecommendationRequest(BaseModel):
    profile: RecommendationProfile
    consumed_calories: float = Field(default=0, ge=0)
    consumed_protein_g: float = Field(default=0, ge=0)


class MealSuggestion(BaseModel):
    meal: str  # Breakfast | Lunch | Snack | Dinner
    food_name: str
    servings: float
    calories: float
    protein_g: float
    reason: str


class RecommendationResponse(BaseModel):
    targets: dict
    remaining_calories: float
    suggestions: list[MealSuggestion]
    note: str = "Suggestions are estimates based on your profile and the food database, not medical advice."
