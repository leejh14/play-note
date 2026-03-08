from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import json
import unittest

from scripts.ocr.pipeline import run_extraction


FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


class PipelineFixtureTestCase(unittest.TestCase):
    def test_pipeline_fixtures(self) -> None:
        for fixture_path in sorted(FIXTURES_DIR.glob("*.json")):
            with self.subTest(fixture=fixture_path.name):
                fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
                output = run_extraction(fixture["input"])
                expected = fixture["expected"]

                self.assertEqual(output["winnerSide"], expected["winnerSide"])
                self.assertEqual(output["winnerTeam"], expected["winnerTeam"])
                self.assertEqual(output["teamASide"], expected["teamASide"])
                self.assertEqual(output["result"]["status"], expected["status"])
                self.assertEqual(
                    output["result"]["teamASideEvidence"],
                    expected["teamASideEvidence"],
                )
                self.assertEqual(
                    output["result"]["matchedFriendIds"],
                    expected["matchedFriendIds"],
                )
                self.assertEqual(output["model"], "paddleocr-lol-endscreen-v1")

    def test_pipeline_is_invariant_to_friend_and_team_order(self) -> None:
        fixture = json.loads((FIXTURES_DIR / "exact_blue_victory.json").read_text(encoding="utf-8"))
        original_input = fixture["input"]
        shuffled_input = deepcopy(original_input)
        shuffled_input["match"]["teamA"] = list(reversed(shuffled_input["match"]["teamA"]))
        shuffled_input["match"]["teamB"] = list(reversed(shuffled_input["match"]["teamB"]))
        shuffled_input["friendDictionary"] = list(reversed(shuffled_input["friendDictionary"]))

        original_output = run_extraction(original_input)
        shuffled_output = run_extraction(shuffled_input)

        self.assertEqual(original_output["winnerSide"], shuffled_output["winnerSide"])
        self.assertEqual(original_output["winnerTeam"], shuffled_output["winnerTeam"])
        self.assertEqual(original_output["teamASide"], shuffled_output["teamASide"])
        self.assertEqual(
            original_output["result"]["teamASideEvidence"],
            shuffled_output["result"]["teamASideEvidence"],
        )
        self.assertEqual(
            original_output["result"]["matchedFriendIds"],
            shuffled_output["result"]["matchedFriendIds"],
        )
        self.assertEqual(
            original_output["result"]["unmatched"],
            shuffled_output["result"]["unmatched"],
        )


if __name__ == "__main__":
    unittest.main()
