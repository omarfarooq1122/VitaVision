"""YOLOv11 inference service.

The model is loaded once per process and reused for every request. If the
weights file is missing the service reports itself unavailable instead of
pretending to detect food.
"""

from __future__ import annotations

import logging
import threading
from dataclasses import dataclass, field

import numpy as np

from config import Settings

logger = logging.getLogger(__name__)


class ModelUnavailableError(RuntimeError):
    """Weights missing or the inference stack could not be initialised."""


@dataclass(slots=True)
class Detection:
    food_name: str
    confidence: float
    x1: float
    y1: float
    x2: float
    y2: float
    width: float
    height: float
    quantity: int = 1
    members: list[tuple[float, float, float, float]] = field(default_factory=list)


class FoodDetector:
    """Singleton-style detector. Instantiate once at application startup."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._model = None
        self._device = "cpu"
        self._lock = threading.Lock()
        self._load_error: str | None = None

    # --- lifecycle --------------------------------------------------------
    def resolve_device(self) -> str:
        configured = (self.settings.yolo_device or "auto").lower()
        if configured in {"cpu", "cuda"}:
            return configured
        try:
            import torch

            return "cuda" if torch.cuda.is_available() else "cpu"
        except Exception:  # torch not installed
            return "cpu"

    def load(self) -> None:
        """Load weights once. Safe to call repeatedly; failures are remembered."""
        if self._model is not None or self._load_error is not None:
            return
        with self._lock:
            if self._model is not None or self._load_error is not None:
                return
            path = self.settings.model_file
            if not path.exists():
                self._load_error = (
                    f"YOLOv11 weights were not found at {path}. "
                    "See models/README.md for where to place a food-trained .pt file."
                )
                logger.warning(self._load_error)
                return
            try:
                from ultralytics import YOLO

                self._device = self.resolve_device()
                model = YOLO(str(path))
                model.to(self._device)
                self._model = model
                logger.info("Loaded YOLOv11 weights %s on %s", path, self._device)
            except Exception as exc:  # noqa: BLE001 - surfaced as unavailable
                self._load_error = f"The detection model could not be loaded: {exc}"
                logger.exception("YOLO load failed")

    @property
    def ready(self) -> bool:
        return self._model is not None

    @property
    def status(self) -> dict[str, object]:
        return {
            "ready": self.ready,
            "model": "YOLOv11",
            "weights_path": str(self.settings.model_file),
            "weights_present": self.settings.model_file.exists(),
            "device": self._device if self.ready else self.resolve_device(),
            "confidence_threshold": self.settings.yolo_confidence,
            "iou_threshold": self.settings.yolo_iou,
            "error": self._load_error,
        }

    # --- inference --------------------------------------------------------
    def detect(self, image: np.ndarray) -> list[Detection]:
        self.load()
        if self._model is None:
            raise ModelUnavailableError(self._load_error or "The detection model is unavailable.")

        height, width = image.shape[:2]
        try:
            results = self._model.predict(
                source=image,
                conf=self.settings.yolo_confidence,
                iou=self.settings.yolo_iou,
                imgsz=self.settings.yolo_image_size,
                max_det=self.settings.yolo_max_detections,
                device=self._device,
                verbose=False,
            )
        except Exception as exc:  # noqa: BLE001 - never crash the API
            raise ModelUnavailableError(f"Detection failed while running the model: {exc}") from exc

        raw: list[Detection] = []
        for result in results:
            names = getattr(result, "names", {}) or {}
            boxes = getattr(result, "boxes", None)
            if boxes is None:
                continue
            for box in boxes:
                try:
                    x1, y1, x2, y2 = (float(v) for v in box.xyxy[0].tolist())
                    confidence = float(box.conf[0])
                    class_id = int(box.cls[0])
                except Exception:  # malformed row from the model output
                    continue
                label = str(names.get(class_id, f"class_{class_id}")).replace("_", " ").strip().lower()
                if not label:
                    continue
                raw.append(
                    Detection(
                        food_name=label,
                        confidence=min(1.0, max(0.0, confidence)),
                        x1=max(0.0, x1 / width),
                        y1=max(0.0, y1 / height),
                        x2=min(1.0, x2 / width),
                        y2=min(1.0, y2 / height),
                        width=abs(x2 - x1) / width,
                        height=abs(y2 - y1) / height,
                    )
                )
        return self.group(raw)

    @staticmethod
    def group(detections: list[Detection]) -> list[Detection]:
        """Collapse repeats of the same food into one item with a quantity."""
        grouped: dict[str, Detection] = {}
        for det in detections:
            existing = grouped.get(det.food_name)
            if existing is None:
                det.quantity = 1
                det.members = [(det.x1, det.y1, det.x2, det.y2)]
                grouped[det.food_name] = det
                continue
            existing.quantity += 1
            existing.members.append((det.x1, det.y1, det.x2, det.y2))
            existing.confidence = max(existing.confidence, det.confidence)
            existing.x1 = min(existing.x1, det.x1)
            existing.y1 = min(existing.y1, det.y1)
            existing.x2 = max(existing.x2, det.x2)
            existing.y2 = max(existing.y2, det.y2)
            existing.width = existing.x2 - existing.x1
            existing.height = existing.y2 - existing.y1
        return sorted(grouped.values(), key=lambda d: d.confidence, reverse=True)
