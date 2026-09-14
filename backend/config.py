"""Environment-driven configuration. Nothing here is hardcoded per-deployment."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"), extra="ignore", case_sensitive=False
    )

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # YOLO
    yolo_model_path: str = "models/food_yolov11.pt"
    yolo_confidence: float = 0.35
    yolo_iou: float = 0.45
    yolo_device: str = "auto"
    yolo_image_size: int = 640
    yolo_max_detections: int = 40

    # Images
    max_image_size_mb: float = 8
    min_image_dimension: int = 64
    max_image_dimension: int = 4096
    enhance_brightness: bool = True
    denoise: bool = False

    # API
    cors_origins: str = "http://localhost:8080,http://localhost:5173"
    rate_limit_analyze: str = "20/minute"
    require_auth: bool = True
    nutrition_fallback_file: str = "../data/nutrition/foods.json"

    api_title: str = Field(default="VitaVision Detection API")
    api_version: str = Field(default="1.0.0")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def max_image_bytes(self) -> int:
        return int(self.max_image_size_mb * 1024 * 1024)

    def resolve(self, relative: str) -> Path:
        path = Path(relative)
        return path if path.is_absolute() else (BACKEND_DIR / path).resolve()

    @property
    def model_file(self) -> Path:
        return self.resolve(self.yolo_model_path)

    @property
    def nutrition_file(self) -> Path:
        return self.resolve(self.nutrition_fallback_file)


@lru_cache
def get_settings() -> Settings:
    return Settings()
