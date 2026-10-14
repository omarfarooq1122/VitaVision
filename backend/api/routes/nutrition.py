from fastapi import APIRouter, Depends

from dependencies import get_nutrition
from schemas.nutrition import CalculateRequest, TargetsRequest

router = APIRouter(prefix="/nutrition", tags=["nutrition"])


@router.get("/foods")
def foods(nutrition=Depends(get_nutrition)):
    return nutrition.foods()


@router.post("/calculate")
def calculate(body: CalculateRequest, nutrition=Depends(get_nutrition)):
    foods = nutrition.foods()
    items = []
    for it in body.items:
        food = nutrition.match(it.food_name, foods)
        items.append({"food_name": it.food_name, "matched_food": food["name"] if food else None,
                      "grams": it.grams, "nutrition": nutrition.nutrients_for(food, it.grams)})
    return {"items": items, "totals": nutrition.total([i["nutrition"] for i in items])}


@router.post("/targets")
def targets(body: TargetsRequest, nutrition=Depends(get_nutrition)):
    return nutrition.targets(**body.model_dump())
