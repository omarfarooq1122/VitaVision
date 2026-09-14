"""Conversions between raw bytes, OpenCV BGR arrays and PIL images."""

from __future__ import annotations

import base64
import io

import cv2
import numpy as np
from PIL import Image, ImageOps

from utils.validation import ValidationError


def decode_bytes(raw: bytes) -> np.ndarray:
    """Decode image bytes into an OpenCV BGR array, honouring EXIF orientation."""
    if not raw:
        raise ValidationError("That file is empty. Please pick another photo.")
    try:
        pil = Image.open(io.BytesIO(raw))
        pil = ImageOps.exif_transpose(pil)
        pil = pil.convert("RGB")
    except Exception as exc:  # malformed / truncated / not an image
        raise ValidationError("That image could not be read. It may be corrupt.") from exc
    return cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)


def decode_base64(data: str) -> bytes:
    payload = data.split(",", 1)[-1].strip()
    try:
        return base64.b64decode(payload, validate=True)
    except Exception as exc:
        raise ValidationError("The image data could not be read. Please try again.") from exc


def to_pil(bgr: np.ndarray) -> Image.Image:
    return Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))


def to_rgb(bgr: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)


def encode_jpeg(bgr: np.ndarray, quality: int = 92) -> bytes:
    ok, buffer = cv2.imencode(".jpg", bgr, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
    if not ok:
        raise ValidationError("The processed image could not be encoded.")
    return buffer.tobytes()
