from __future__ import annotations

from pathlib import Path
import json
import unittest

from scripts.ocr.pipeline import load_request, run_extraction


DATASET_CASES_DIR = Path(__file__).resolve().parents[1] / "datasets" / "cases"


class DatasetRegressionTestCase(unittest.TestCase):
    def test_dataset_cases(self) -> None:
        case_dirs = sorted(path for path in DATASET_CASES_DIR.iterdir() if path.is_dir())
        self.assertGreaterEqual(len(case_dirs), 5)

        for case_dir in case_dirs:
            with self.subTest(case=case_dir.name):
                request = load_request(str(case_dir / "input.json"))
                expected = json.loads((case_dir / "expected.json").read_text(encoding="utf-8"))

                output = run_extraction(request)

                self.assertEqual(output["winnerSide"], expected["winnerSide"])
                self.assertEqual(output["winnerTeam"], expected["winnerTeam"])
                self.assertEqual(output["teamASide"], expected["teamASide"])
                self.assertEqual(
                    output["result"]["teamASideEvidence"],
                    expected["teamASideEvidence"],
                )
                self.assertEqual(
                    output["result"]["matchedFriendIds"],
                    expected["matchedFriendIds"],
                )
                self.assertEqual(output["result"]["unmatched"], expected["unmatched"])


if __name__ == "__main__":
    unittest.main()
