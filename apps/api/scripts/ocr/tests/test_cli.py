from __future__ import annotations

from pathlib import Path
import json
import subprocess
import tempfile
import unittest


OCR_DIR = Path(__file__).resolve().parents[1]
CLI_PATH = OCR_DIR / "extract.py"


class ExtractCliTestCase(unittest.TestCase):
    def test_cli_accepts_inline_json(self) -> None:
        payload = {
            "jobId": "inline-case",
            "match": {
                "teamA": ["friend-a1", "friend-a2", "friend-a3"],
                "teamB": ["friend-b1", "friend-b2", "friend-b3"],
            },
            "friendDictionary": [
                {"friendId": "friend-a1", "primary": ["junho#kr1"], "secondary": ["junho"]},
                {"friendId": "friend-a2", "primary": ["doran#kr1"], "secondary": ["doran"]},
                {"friendId": "friend-a3", "primary": ["faker#kr1"], "secondary": ["faker"]},
            ],
            "ocr": {
                "winnerBannerSide": "blue",
                "winnerTextCandidates": ["VICTORY"],
                "blueTextCandidates": ["Junho#KR1", "Doran#KR1", "Faker#KR1"],
                "redTextCandidates": [],
            },
        }

        completed = subprocess.run(
            ["python3", str(CLI_PATH), "--input", json.dumps(payload)],
            check=False,
            capture_output=True,
            text=True,
        )

        self.assertEqual(completed.returncode, 0, completed.stderr)
        output = json.loads(completed.stdout)
        self.assertEqual(output["winnerSide"], "blue")
        self.assertEqual(output["teamASide"], "blue")

    def test_cli_accepts_file_path(self) -> None:
        payload = {
            "jobId": "file-case",
            "match": {
                "teamA": ["friend-a1", "friend-a2", "friend-a3"],
                "teamB": ["friend-b1", "friend-b2", "friend-b3"],
            },
            "friendDictionary": [
                {"friendId": "friend-a1", "primary": ["kanavi#kr1"], "secondary": ["kanavi"]},
                {"friendId": "friend-a2", "primary": ["viper#kr1"], "secondary": ["viper"]},
                {"friendId": "friend-a3", "primary": ["lehends#kr1"], "secondary": ["lehends"]},
            ],
            "ocr": {
                "winnerBannerSide": "red",
                "winnerTextCandidates": ["승리"],
                "blueTextCandidates": [],
                "redTextCandidates": ["Kanavi#KR1", "Viper#KR1", "Lehends#KR1"],
            },
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            payload_path = Path(temp_dir) / "payload.json"
            payload_path.write_text(json.dumps(payload), encoding="utf-8")
            completed = subprocess.run(
                ["python3", str(CLI_PATH), "--input", str(payload_path)],
                check=False,
                capture_output=True,
                text=True,
            )

        self.assertEqual(completed.returncode, 0, completed.stderr)
        output = json.loads(completed.stdout)
        self.assertEqual(output["winnerSide"], "red")
        self.assertEqual(output["teamASide"], "red")


if __name__ == "__main__":
    unittest.main()
