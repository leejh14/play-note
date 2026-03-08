from __future__ import annotations

import unittest
from unittest.mock import patch

from scripts.ocr.ocr_engine import _extract_texts, extract_text_candidates


class OcrEngineTestCase(unittest.TestCase):
    def test_extract_text_candidates_uses_split_roi_keys(self) -> None:
        roi_profile = {
            "winner_text_roi": {"x": 1, "y": 2, "width": 3, "height": 4},
            "blue_names_roi": {"x": 5, "y": 6, "width": 7, "height": 8},
            "red_names_roi": {"x": 9, "y": 10, "width": 11, "height": 12},
        }

        with (
            patch("scripts.ocr.ocr_engine.load_cv2_image_with_target_width", return_value="image"),
            patch("scripts.ocr.ocr_engine._get_paddle_ocr", return_value="engine"),
            patch(
                "scripts.ocr.ocr_engine.crop_cv2_image",
                side_effect=["winner-crop", "blue-crop", "red-crop"],
            ),
            patch(
                "scripts.ocr.ocr_engine._run_ocr",
                side_effect=[["승리"], ["나는 돌"], ["세르스타펜"]],
            ),
        ):
            output = extract_text_candidates("input.png", roi_profile, 1920)

        self.assertEqual(
            output,
            {
                "winnerTextCandidates": ["승리"],
                "blueTextCandidates": ["나는 돌"],
                "redTextCandidates": ["세르스타펜"],
            },
        )

    def test_extract_texts_supports_paddleocr_v3_result_shape(self) -> None:
        raw_result = [
            {
                "rec_texts": ["승리", "나는 돌", "Radiohead"],
            }
        ]

        self.assertEqual(_extract_texts(raw_result), ["승리", "나는 돌", "Radiohead"])

    def test_extract_texts_supports_legacy_nested_result_shape(self) -> None:
        raw_result = [
            [
                [None, ("Victory", 0.99)],
                [None, ("Faker#KR1", 0.98)],
            ]
        ]

        self.assertEqual(_extract_texts(raw_result), ["Victory", "Faker#KR1"])


if __name__ == "__main__":
    unittest.main()
