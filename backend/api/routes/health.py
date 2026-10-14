from fastapi import APIRouter, Depends

from dependencies import get_detector, get_nutrition

router = APIRouter(tags=["health"])


@router.get("/health")
def health(detector=Depends(get_detector), nutrition=Depends(get_nutrition)):
    return {"status": "ok", "detector": detector.status, "foods_loaded": len(nutrition.foods())}
