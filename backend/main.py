"""VitaVision FastAPI application entry point."""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from config import get_settings
from utils.validation import ValidationError

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
settings = get_settings()
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title=settings.api_title, version=settings.api_version)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ValidationError)
async def _validation(_: Request, exc: ValidationError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def _unhandled(_: Request, exc: Exception):
    logging.getLogger("vitavision").exception("Unhandled error")
    return JSONResponse(status_code=500, content={"detail": "Something went wrong on the server. Please try again."})


from api.routes import analyze, health, history, nutrition, recommendations  # noqa: E402

for module in (health, analyze, nutrition, recommendations, history):
    app.include_router(module.router, prefix="/api")


@app.on_event("startup")
def _warm() -> None:
    from dependencies import _build

    services = _build(settings)
    services["nutrition"].foods()  # type: ignore[attr-defined]
    try:
        services["detector"].load()  # type: ignore[attr-defined]
    except Exception:
        logging.getLogger("vitavision").warning("Detector not ready; see /api/health")
