from __future__ import annotations

import time
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.security import HTTPBearer

from api.routes.supabase_rest import rest
from config import get_settings
from dependencies import (
    current_user,
    get_allergy,
    get_detector,
    get_image_processor,
    get_nutrition,
    get_weight_estimator,
)
from services.detector import ModelUnavailableError

router = APIRouter(tags=["analyze"])
_bearer = HTTPBearer(auto_error=False)


def band(c: float) -> str:
    return "high" if c >= 0.9 else "medium" if c >= 0.7 else "low"


@router.post("/analyze")
async def analyze(
    request: Request,
    image: UploadFile = File(...),
    meal_type: str = Form("Lunch"),
    user=Depends(current_user),
    creds=Depends(_bearer),
    images=Depends(get_image_processor),
    detector=Depends(get_detector),
    weights=Depends(get_weight_estimator),
    nutrition=Depends(get_nutrition),
    allergy=Depends(get_allergy),
):
    started = time.perf_counter()
    raw = await image.read()
    prepared = images.prepare(raw, image.content_type)
    try:
        detections = detector.group(detector.detect(prepared.processed))
    except ModelUnavailableError as exc:
        raise HTTPException(503, f"Food detection model is not available: {exc}")

    foods = nutrition.foods()
    items, totals_in, checks = [], [], []
    for d in detections:
        food = nutrition.match(d.food_name, foods)
        est = weights.estimate(food=food, quantity=d.quantity, box_area_fraction=d.width * d.height)
        n = nutrition.nutrients_for(food, est.estimated_weight_g)
        totals_in.append(n)
        checks.append({"food_name": d.food_name, "food": food})
        items.append({
            "food_name": d.food_name,
            "confidence": round(d.confidence, 3),
            "confidence_band": band(d.confidence),
            "quantity": d.quantity,
            "bounding_box": {k: getattr(d, k) for k in ("x1", "y1", "x2", "y2", "width", "height")},
            "estimated_weight_g": est.estimated_weight_g,
            "weight_confidence": est.weight_confidence,
            "estimation_method": est.estimation_method,
            "nutrition": n,
            "matched_food": food["name"] if food else None,
        })
    totals = nutrition.total(totals_in)

    allergies: list[str] = []
    token = creds.credentials if creds else None
    if user and token:
        rows = rest("GET", "allergies", token, params={"select": "name", "user_id": f"eq.{user['id']}"})
        allergies = [r["name"] for r in rows or []]
    warnings_a = allergy.check(checks, allergies)

    analysis_id = str(uuid.uuid4())
    if user and token:
        saved = rest("POST", "food_analyses", token, json={
            "user_id": user["id"], "meal_type": meal_type,
            "total_weight_g": round(sum(i["estimated_weight_g"] for i in items), 1),
            "calories": totals["calories"], "protein": totals["protein_g"], "carbs": totals["carbs_g"],
            "fat": totals["fat_g"], "fiber": totals["fiber_g"], "sugar": totals["sugar_g"],
            "allergy_warnings": [{"food_name": w["food_name"], "allergy": w["allergy"], "reason": w["reason"]} for w in warnings_a],
        })
        analysis_id = saved[0]["id"]
        if items:
            rest("POST", "detected_foods", token, json=[{
                "analysis_id": analysis_id, "user_id": user["id"], "food_name": i["food_name"],
                "confidence": i["confidence"], "quantity": i["quantity"],
                "bounding_box": i["bounding_box"], "est_weight_g": i["estimated_weight_g"],
                "calories": i["nutrition"]["calories"], "protein": i["nutrition"]["protein_g"],
                "carbs": i["nutrition"]["carbs_g"], "fat": i["nutrition"]["fat_g"],
                "fiber": i["nutrition"]["fiber_g"], "sugar": i["nutrition"]["sugar_g"],
            } for i in items])

    notes = list(prepared.quality.notes)
    if not items:
        notes.append("No food was detected. Try a clearer, well-lit photo.")
    return {
        "analysis_id": analysis_id, "model": "YOLOv11",
        "processing_time_ms": int((time.perf_counter() - started) * 1000),
        "items": items, "totals": totals, "warnings": notes, "allergy_warnings": warnings_a,
        "saved": bool(user and token),
    }
