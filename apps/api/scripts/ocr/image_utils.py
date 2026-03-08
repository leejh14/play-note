from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterator

try:
    import cv2  # type: ignore
except ImportError:  # pragma: no cover - optional dependency.
    cv2 = None


@dataclass(frozen=True)
class Rect:
    x: int
    y: int
    width: int
    height: int


@dataclass(frozen=True)
class RasterImage:
    width: int
    height: int
    pixels: tuple[tuple[tuple[int, int, int], ...], ...]


def load_raster_image(path: str | Path) -> RasterImage:
    image_path = Path(path)
    if image_path.suffix.lower() == ".ppm":
        return _load_ppm(image_path)
    if cv2 is None:
        raise RuntimeError(
            "opencv-python-headless is required to load non-PPM images. "
            "Install requirements.txt or provide a .ppm dataset image."
        )
    matrix = cv2.imread(str(image_path))
    if matrix is None:
        raise RuntimeError(f"Failed to read image: {image_path}")
    return _raster_from_cv2(matrix)


def resize_raster_image_to_width(image: RasterImage, target_width: int) -> RasterImage:
    if image.width <= 0 or image.height <= 0:
        raise RuntimeError("Invalid image size")
    if image.width == target_width:
        return image

    scale = target_width / image.width
    target_height = max(1, round(image.height * scale))
    rows: list[tuple[tuple[int, int, int], ...]] = []
    for y in range(target_height):
        src_y = min(image.height - 1, int(y / scale))
        row: list[tuple[int, int, int]] = []
        for x in range(target_width):
            src_x = min(image.width - 1, int(x / scale))
            row.append(image.pixels[src_y][src_x])
        rows.append(tuple(row))
    return RasterImage(width=target_width, height=target_height, pixels=tuple(rows))


def crop_raster_image(image: RasterImage, rect: Rect) -> RasterImage:
    x_start = max(0, rect.x)
    y_start = max(0, rect.y)
    x_end = min(image.width, rect.x + rect.width)
    y_end = min(image.height, rect.y + rect.height)
    if x_start >= x_end or y_start >= y_end:
        return RasterImage(width=0, height=0, pixels=tuple())

    rows = tuple(
        tuple(image.pixels[y][x_start:x_end])
        for y in range(y_start, y_end)
    )
    return RasterImage(width=x_end - x_start, height=y_end - y_start, pixels=rows)


def average_rgb(image: RasterImage) -> tuple[float, float, float]:
    if image.width == 0 or image.height == 0:
        return (0.0, 0.0, 0.0)

    total_r = 0
    total_g = 0
    total_b = 0
    total_count = image.width * image.height
    for row in image.pixels:
        for red, green, blue in row:
            total_r += red
            total_g += green
            total_b += blue

    return (
        total_r / total_count,
        total_g / total_count,
        total_b / total_count,
    )


def load_cv2_image_with_target_width(path: str | Path, target_width: int):
    if cv2 is None:
        raise RuntimeError(
            "opencv-python-headless is required for real OCR execution."
        )
    matrix = cv2.imread(str(path))
    if matrix is None:
        raise RuntimeError(f"Failed to read image: {path}")
    height, width = matrix.shape[:2]
    if width == target_width:
        return matrix
    scale = target_width / width
    target_height = max(1, round(height * scale))
    return cv2.resize(matrix, (target_width, target_height), interpolation=cv2.INTER_LINEAR)


def crop_cv2_image(matrix, rect: Rect):
    if cv2 is None:
        raise RuntimeError("opencv-python-headless is required for real OCR execution.")
    height, width = matrix.shape[:2]
    x_start = max(0, rect.x)
    y_start = max(0, rect.y)
    x_end = min(width, rect.x + rect.width)
    y_end = min(height, rect.y + rect.height)
    if x_start >= x_end or y_start >= y_end:
        return None
    return matrix[y_start:y_end, x_start:x_end]


def _load_ppm(path: Path) -> RasterImage:
    tokens = iter(_iter_ppm_tokens(path.read_text(encoding="utf-8")))
    magic = next(tokens, None)
    if magic != "P3":
        raise RuntimeError(f"Unsupported PPM format in {path}; only P3 is supported.")

    width = int(next(tokens))
    height = int(next(tokens))
    max_value = int(next(tokens))
    if max_value <= 0:
        raise RuntimeError(f"Invalid max value in {path}")

    rows: list[tuple[tuple[int, int, int], ...]] = []
    for _ in range(height):
        row: list[tuple[int, int, int]] = []
        for _ in range(width):
            red = int(next(tokens))
            green = int(next(tokens))
            blue = int(next(tokens))
            row.append((red, green, blue))
        rows.append(tuple(row))

    return RasterImage(width=width, height=height, pixels=tuple(rows))


def _iter_ppm_tokens(content: str) -> Iterator[str]:
    for raw_line in content.splitlines():
        line = raw_line.split("#", 1)[0].strip()
        if not line:
            continue
        for token in line.split():
            yield token


def _raster_from_cv2(matrix) -> RasterImage:
    height, width = matrix.shape[:2]
    rows: list[tuple[tuple[int, int, int], ...]] = []
    for y in range(height):
        row: list[tuple[int, int, int]] = []
        for x in range(width):
            blue, green, red = matrix[y, x]
            row.append((int(red), int(green), int(blue)))
        rows.append(tuple(row))
    return RasterImage(width=width, height=height, pixels=tuple(rows))
