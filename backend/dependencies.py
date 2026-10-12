"""Shared FastAPI dependencies: services and auth verification."""

from __future__ import annotations

import logging

import httpx
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import Settings, get_settings
from services.allergy_service import AllergyService
from services.detector import FoodDetector
from services.image_processor import ImageProcessor
from services.nutrition_service import NutritionService
from services.recommendation_service import RecommendationService
from services.weight_estimator import WeightEstimator

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)

# Services are created once per process and reused for every request.
_services: dict[str, object] = {}


def _build(settings: Settings) -> dict[str, object]:
    if not _services:
        nutrition = NutritionService(settings)
        allergy = AllergyService()
        _services.update(
            {
                "detector": FoodDetector(settings),
                "images": ImageProcessor(settings),
                "weights": WeightEstimator(),
                "nutrition": nutrition,
                "allergy": allergy,
                "recommendations": RecommendationService(nutrition, allergy),
            }
        )
    return _services


def get_detector(settings: Settings = Depends(get_settings)) -> FoodDetector:
    return _build(settings)["detector"]  # type: ignore[return-value]


def get_image_processor(settings: Settings = Depends(get_settings)) -> ImageProcessor:
    return _build(settings)["images"]  # type: ignore[return-value]


def get_weight_estimator(settings: Settings = Depends(get_settings)) -> WeightEstimator:
    return _build(settings)["weights"]  # type: ignore[return-value]


def get_nutrition(settings: Settings = Depends(get_settings)) -> NutritionService:
    return _build(settings)["nutrition"]  # type: ignore[return-value]


def get_allergy(settings: Settings = Depends(get_settings)) -> AllergyService:
    return _build(settings)["allergy"]  # type: ignore[return-value]


def get_recommendations(settings: Settings = Depends(get_settings)) -> RecommendationService:
    return _build(settings)["recommendations"]  # type: ignore[return-value]


async def current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    settings: Settings = Depends(get_settings),
) -> dict | None:
    """Verify the Supabase access token. Returns the user dict or None.

    When REQUIRE_AUTH=false (local development), requests without a token are
    allowed through with user=None.
    """
    if credentials is None:
        if settings.require_auth:
            raise HTTPException(status_code=401, detail="Please sign in to use this endpoint.")
        return None

    if not (settings.supabase_url and settings.supabase_anon_key):
        if settings.require_auth:
            raise HTTPException(status_code=503, detail="Sign-in verification is not configured on the server.")
        return None

    try:
        response = httpx.get(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/user",
            headers={
                "apikey": settings.supabase_anon_key,
                "Authorization": f"Bearer {credentials.credentials}",
            },
            timeout=10.0,
        )
    except Exception:
        logger.exception("Auth verification request failed")
        raise HTTPException(status_code=503, detail="Could not verify your sign-in. Please try again.")

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Your session has expired. Please sign in again.")
    return response.json()
