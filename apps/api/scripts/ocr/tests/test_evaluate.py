from __future__ import annotations

from pathlib import Path
import json
import subprocess
import sys
import unittest

from scripts.ocr.evaluate import compare_case_result, compute_id_metrics


OCR_DIR = Path(__file__).resolve().parents[1]
EVALUATE_PATH = OCR_DIR / "evaluate.py"


class EvaluateTestCase(unittest.TestCase):
    def test_compute_id_metrics_reports_precision_recall_and_f1(self) -> None:
        metrics = compute_id_metrics(
            ["friend-a1", "friend-a2", "friend-a3"],
            ["friend-a1", "friend-a2", "friend-b1"],
        )

        self.assertEqual(metrics["tp"], 2)
        self.assertEqual(metrics["fp"], 1)
        self.assertEqual(metrics["fn"], 1)
        self.assertEqual(metrics["precision"], 0.6667)
        self.assertEqual(metrics["recall"], 0.6667)
        self.assertEqual(metrics["f1"], 0.6667)

    def test_compare_case_result_marks_exact_flags(self) -> None:
        expected = {
            "winnerSide": "unknown",
            "winnerTeam": "teamA",
            "teamASide": "blue",
            "teamASideEvidence": {"countABlue": 5, "countARed": 0},
            "matchedFriendIds": ["friend-a1", "friend-a2"],
            "unmatched": [],
        }
        output = {
            "winnerSide": "unknown",
            "winnerTeam": "teamA",
            "teamASide": "blue",
            "result": {
                "teamASideEvidence": {"countABlue": 5, "countARed": 0},
                "matchedFriendIds": ["friend-a1", "friend-a2"],
                "unmatched": [],
            },
        }

        comparison = compare_case_result("case-id", expected, output)

        self.assertTrue(comparison["exact"]["winnerSideExact"])
        self.assertTrue(comparison["exact"]["winnerTeamExact"])
        self.assertTrue(comparison["exact"]["teamASideExact"])
        self.assertTrue(comparison["exact"]["teamASideEvidenceExact"])
        self.assertTrue(comparison["exact"]["matchedFriendIdsExact"])
        self.assertTrue(comparison["exact"]["unmatchedExact"])
        self.assertTrue(comparison["exact"]["all"])

    def test_cli_json_format_outputs_case_report(self) -> None:
        completed = subprocess.run(
            [
                sys.executable,
                str(EVALUATE_PATH),
                "--case",
                "case-001-kr-blue-16x9",
                "--format",
                "json",
            ],
            check=False,
            capture_output=True,
            text=True,
        )

        self.assertEqual(completed.returncode, 0, completed.stderr)
        payload = json.loads(completed.stdout)
        self.assertEqual(payload["summary"]["caseCount"], 1)
        self.assertEqual(payload["cases"][0]["caseId"], "case-001-kr-blue-16x9")


if __name__ == "__main__":
    unittest.main()
