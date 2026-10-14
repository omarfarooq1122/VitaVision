from fastapi import APIRouter, Depends

from dependencies import current_user, get_recommendations
from schemas.recommendation import RecommendationRequest

router = APIRouter(tags=["recommendations"])


@router.post("/recommendations")
def recommend(body: RecommendationRequest, _user=Depends(current_user), svc=Depends(get_recommendations)):
    return svc.suggest(body.profile, body.consumed_calories, body.consumed_protein_g)
