from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer

from api.routes.supabase_rest import rest
from dependencies import current_user

router = APIRouter(tags=["history"])
_bearer = HTTPBearer(auto_error=False)


@router.get("/history")
def history(limit: int = 50, user=Depends(current_user), creds=Depends(_bearer)):
    if not user or not creds:
        raise HTTPException(401, "Please sign in to see your history.")
    return rest("GET", "food_analyses", creds.credentials, params={
        "select": "*", "user_id": f"eq.{user['id']}", "order": "created_at.desc", "limit": str(min(limit, 200)),
    })
