"""OpenCV preprocessing pipeline.

Upload -> validate MIME -> decode -> check dimensions -> orientation ->
resize (aspect preserved) -> optional enhancement -> inference input.

The original decoded image is always kept for result visualisation.
"""

from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np

from config import Settings
from utils.image import decode_bytes
from utils.validation import validate_dimensions, validate_mime_type, validate_size


@dataclass(slots=True)
class ProcessedImage:
    original: np.ndarray  # untouched decoded BGR image
    processed: np.ndarray  # resized/enhanced BGR image handed to the detector
    original_width: int
    original_height: int
    scale: float
    quality: "QualityReport"


@dataclass(slots=True)
class QualityReport:
    mean_brightness: float
    blur_score: float
    is_dark: bool
    is_bright: bool
    is_blurry: bool

    @property
    def notes(self) -> list[str]:
        notes: list[str] = []
        if self.is_dark:
            notes.append("The photo is quite dark, which can reduce detection accuracy.")
        if self.is_bright:
            notes.append("The photo is very bright, which can reduce detection accuracy.")
        if self.is_blurry:
            notes.append("The photo looks blurry. A steadier shot will detect more items.")
        return notes


class ImageProcessor:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def prepare(self, raw: bytes, content_type: str | None) -> ProcessedImage:
        validate_mime_type(content_type)
        validate_size(len(raw), self.settings.max_image_bytes)

        original = decode_bytes(raw)
        height, width = original.shape[:2]
        validate_dimensions(
            width,
            height,
            self.settings.min_image_dimension,
            self.settings.max_image_dimension,
        )

        quality = self.assess(original)
        resized, scale = self.resize(original, self.settings.yolo_image_size)
        processed = self.enhance(resized, quality)

        return ProcessedImage(
            original=original,
            processed=processed,
            original_width=width,
            original_height=height,
            scale=scale,
            quality=quality,
        )

    @staticmethod
    def resize(image: np.ndarray, target_long_edge: int) -> tuple[np.ndarray, float]:
        height, width = image.shape[:2]
        long_edge = max(height, width)
        if long_edge <= target_long_edge:
            return image.copy(), 1.0
        scale = target_long_edge / long_edge
        new_size = (max(1, int(round(width * scale))), max(1, int(round(height * scale))))
        return cv2.resize(image, new_size, interpolation=cv2.INTER_AREA), scale

    @staticmethod
    def assess(image: np.ndarray) -> QualityReport:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        brightness = float(gray.mean())
        blur = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        return QualityReport(
            mean_brightness=round(brightness, 2),
            blur_score=round(blur, 2),
            is_dark=brightness < 60,
            is_bright=brightness > 205,
            is_blurry=blur < 60,
        )

    def enhance(self, image: np.ndarray, quality: QualityReport) -> np.ndarray:
        out = image
        if self.settings.enhance_brightness and (quality.is_dark or quality.is_bright):
            lab = cv2.cvtColor(out, cv2.COLOR_BGR2LAB)
            l_channel, a_channel, b_channel = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            out = cv2.cvtColor(cv2.merge((clahe.apply(l_channel), a_channel, b_channel)), cv2.COLOR_LAB2BGR)
        if self.settings.denoise:
            out = cv2.fastNlMeansDenoisingColored(out, None, 3, 3, 7, 21)
        return out

    def foreground_ratio(self, image: np.ndarray, box: tuple[int, int, int, int]) -> float:
        """Share of the crop that looks like food rather than plate/background.

        Uses saturation + Otsu thresholding. Feeds visual weight estimation; it is
        a coarse cue, not segmentation-grade accuracy.
        """
        x1, y1, x2, y2 = box
        crop = image[max(0, y1) : max(1, y2), max(0, x1) : max(1, x2)]
        if crop.size == 0:
            return 0.0
        hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
        saturation = hsv[:, :, 1]
        blurred = cv2.GaussianBlur(saturation, (5, 5), 0)
        _, mask = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        return float(np.count_nonzero(mask)) / float(mask.size)
