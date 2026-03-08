from __future__ import annotations

from functools import lru_cache
import os
from typing import Any

os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")

try:
    from paddleocr import PaddleOCR  # type: ignore
except ImportError:  # pragma: no cover - optional dependency.
    PaddleOCR = None

from scripts.ocr.image_utils import Rect, crop_cv2_image, load_cv2_image_with_target_width


@lru_cache(maxsize=1)
def _get_paddle_ocr():
    if PaddleOCR is None:
        raise RuntimeError(
            "PaddleOCR is not installed. Install scripts/ocr/requirements.txt "
            "to enable real OCR extraction."
        )
    return PaddleOCR(
        lang="korean",
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
    )


def extract_text_candidates(
    image_path: str,
    roi_profile: dict[str, dict[str, int]],
    target_width: int,
) -> dict[str, list[str]]:
    image = load_cv2_image_with_target_width(image_path, target_width)
    engine = _get_paddle_ocr()

    mapping = {
        "winnerTextCandidates": "winner_text_roi",
        "blueTextCandidates": "blue_names_roi",
        "redTextCandidates": "red_names_roi",
    }

    output: dict[str, list[str]] = {}
    for output_key, roi_key in mapping.items():
        roi = roi_profile[roi_key]
        crop = crop_cv2_image(
            image,
            Rect(
                x=roi["x"],
                y=roi["y"],
                width=roi["width"],
                height=roi["height"],
            ),
        )
        output[output_key] = _run_ocr(engine, crop)
    return output


def _run_ocr(engine, crop) -> list[str]:
    if crop is None:
        return []
    raw_result = engine.predict(
        crop,
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
        return_word_box=False,
    )
    return _extract_texts(raw_result)


def _extract_texts(raw_result: Any) -> list[str]:
    candidates: list[str] = []

    for page in raw_result or []:
        if isinstance(page, dict):
            for text in page.get("rec_texts", []) or []:
                if text:
                    candidates.append(str(text))
            continue

        if hasattr(page, "get"):
            rec_texts = page.get("rec_texts", [])
            for text in rec_texts or []:
                if text:
                    candidates.append(str(text))
            continue

        for line in page or []:
            candidates.extend(_extract_legacy_texts_from_line(line))

    return candidates


def _extract_legacy_texts_from_line(line: Any) -> list[str]:
    candidates: list[str] = []
    if line is None:
        return candidates

    # Legacy PaddleOCR often returns a single OCR item in the shape:
    # [box_points, (text, score)]
    if isinstance(line, (list, tuple)) and len(line) > 1:
        text_info = line[1]
        if (
            isinstance(text_info, (list, tuple))
            and len(text_info) > 0
            and text_info[0]
        ):
            candidates.append(str(text_info[0]))
            return candidates

    for item in line or []:
        if not isinstance(item, (list, tuple)) or len(item) <= 1:
            continue
        text_info = item[1]
        if (
            not isinstance(text_info, (list, tuple))
            or len(text_info) == 0
            or not text_info[0]
        ):
            continue
        candidates.append(str(text_info[0]))

    return candidates
