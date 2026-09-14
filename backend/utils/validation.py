"""Upload validation helpers. Errors here are always user-readable."""

from __future__ import annotations

ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


class ValidationError(ValueError):
    """Raised with a message that is safe to show a person."""


def validate_mime_type(content_type: str | None) -> str:
    normalised = (content_type or "").split(";")[0].strip().lower()
    if normalised not in ALLOWED_MIME_TYPES:
        raise ValidationError("Please upload a JPG, PNG or WebP photo.")
    return normalised


def validate_size(size_bytes: int, max_bytes: int) -> None:
    if size_bytes <= 0:
        raise ValidationError("That file is empty. Please pick another photo.")
    if size_bytes > max_bytes:
        limit_mb = max_bytes / (1024 * 1024)
        raise ValidationError(f"That photo is larger than {limit_mb:.0f} MB. Please use a smaller one.")


def validate_dimensions(width: int, height: int, minimum: int, maximum: int) -> None:
    if width < minimum or height < minimum:
        raise ValidationError("That photo is too small to analyse. Please use a larger image.")
    if width > maximum or height > maximum:
        raise ValidationError("That photo is unusually large. Please resize it and try again.")


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))
