from __future__ import annotations

from copy import deepcopy
import unittest

from scripts.ocr.matching.friend_matcher import (
    collect_allowed_numeric_name_tokens,
    extract_riot_id_candidates,
    match_friend_candidate,
    normalize_token,
)


class FriendMatcherTestCase(unittest.TestCase):
    def test_normalize_token_unifies_sharp_and_spacing(self) -> None:
        self.assertEqual(normalize_token(" Junho ＃ KR1 "), "junho#kr1")

    def test_extract_riot_id_candidates_parses_full_and_name_only(self) -> None:
        candidates = extract_riot_id_candidates(["Junho # KR1", "  Doran  "])

        self.assertEqual(
            candidates,
            [
                {
                    "raw": "Junho # KR1",
                    "normalized": "junho#kr1",
                    "gameName": "junho",
                    "tagLine": "kr1",
                    "full": "junho#kr1",
                    "nameOnly": "junho",
                },
                {
                    "raw": "  Doran  ",
                    "normalized": "doran",
                    "gameName": "doran",
                    "tagLine": None,
                    "full": "doran",
                    "nameOnly": "doran",
                },
            ],
        )

    def test_extract_riot_id_candidates_drops_numeric_noise_by_default(self) -> None:
        candidates = extract_riot_id_candidates(["5", " 18 ", "Junho"])

        self.assertEqual(
            candidates,
            [
                {
                    "raw": "Junho",
                    "normalized": "junho",
                    "gameName": "junho",
                    "tagLine": None,
                    "full": "junho",
                    "nameOnly": "junho",
                }
            ],
        )

    def test_extract_riot_id_candidates_keeps_numeric_name_when_allowed(self) -> None:
        candidates = extract_riot_id_candidates(["5", "Junho"], allowed_numeric_tokens={"5"})

        self.assertEqual(
            candidates,
            [
                {
                    "raw": "5",
                    "normalized": "5",
                    "gameName": "5",
                    "tagLine": None,
                    "full": "5",
                    "nameOnly": "5",
                },
                {
                    "raw": "Junho",
                    "normalized": "junho",
                    "gameName": "junho",
                    "tagLine": None,
                    "full": "junho",
                    "nameOnly": "junho",
                },
            ],
        )

    def test_collect_allowed_numeric_name_tokens_reads_primary_and_secondary(self) -> None:
        friend_dictionary = [
            {
                "friendId": "friend-a1",
                "primary": ["123#kr1"],
                "secondary": ["456"],
            },
            {
                "friendId": "friend-a2",
                "primary": ["junho#kr1"],
                "secondary": ["junho"],
            },
        ]

        allowed_tokens = collect_allowed_numeric_name_tokens(friend_dictionary)

        self.assertEqual(allowed_tokens, {"123", "456"})

    def test_match_friend_candidate_prefers_primary_match(self) -> None:
        candidate = extract_riot_id_candidates(["Junho#KR1"])[0]
        friend_dictionary = [
            {
                "friendId": "friend-a1",
                "primary": ["junho#kr1"],
                "secondary": ["junho"],
            },
            {
                "friendId": "friend-b1",
                "primary": ["junhoo#kr1"],
                "secondary": ["junhoo"],
            },
        ]

        matched = match_friend_candidate(candidate, friend_dictionary)

        self.assertIsNotNone(matched["selected"])
        self.assertEqual(matched["selected"]["friendId"], "friend-a1")
        self.assertEqual(matched["selected"]["matchedKey"], "primary:junho#kr1")
        self.assertFalse(matched["selected"]["needsReview"])

    def test_match_friend_candidate_matches_compact_secondary_name(self) -> None:
        candidate = extract_riot_id_candidates(["뽕딜"])[0]
        friend_dictionary = [
            {
                "friendId": "friend-b2",
                "primary": [],
                "secondary": ["뽕 딜"],
            }
        ]

        matched = match_friend_candidate(candidate, friend_dictionary)

        self.assertIsNotNone(matched["selected"])
        self.assertEqual(matched["selected"]["friendId"], "friend-b2")
        self.assertEqual(matched["selected"]["score"], 100.0)

    def test_match_friend_candidate_accepts_single_hangul_char_ocr_variation(self) -> None:
        candidate = extract_riot_id_candidates(["현거덩"])[0]
        friend_dictionary = [
            {
                "friendId": "friend-a2",
                "primary": [],
                "secondary": ["혀거덩"],
            },
            {
                "friendId": "friend-b2",
                "primary": [],
                "secondary": ["토미오카 기유"],
            },
        ]

        matched = match_friend_candidate(candidate, friend_dictionary)

        self.assertIsNotNone(matched["selected"])
        self.assertEqual(matched["selected"]["friendId"], "friend-a2")
        self.assertEqual(matched["selected"]["matchedKey"], "secondary:혀거덩")

    def test_match_friend_candidate_does_not_depend_on_friend_dictionary_order(self) -> None:
        candidate = extract_riot_id_candidates(["shared"])[0]
        original_friend_dictionary = [
            {
                "friendId": "friend-b2",
                "primary": [],
                "secondary": ["shared"],
            },
            {
                "friendId": "friend-a1",
                "primary": [],
                "secondary": ["shared"],
            },
            {
                "friendId": "friend-c3",
                "primary": [],
                "secondary": ["shared-alt"],
            },
        ]
        reversed_friend_dictionary = list(reversed(deepcopy(original_friend_dictionary)))

        matched_original = match_friend_candidate(candidate, original_friend_dictionary)
        matched_reversed = match_friend_candidate(candidate, reversed_friend_dictionary)

        self.assertIsNone(matched_original["selected"])
        self.assertIsNone(matched_reversed["selected"])
        self.assertEqual(
            matched_original["ambiguousFriendIds"],
            ["friend-a1", "friend-b2"],
        )
        self.assertEqual(
            matched_original["ambiguousFriendIds"],
            matched_reversed["ambiguousFriendIds"],
        )
        self.assertEqual(matched_original["top"], matched_reversed["top"])

    def test_match_friend_candidate_collapses_aliases_per_friend_before_tie_check(self) -> None:
        candidate = extract_riot_id_candidates(["shared"])[0]
        friend_dictionary = [
            {
                "friendId": "friend-a1",
                "primary": [],
                "secondary": ["shared", "shared"],
            },
            {
                "friendId": "friend-b2",
                "primary": [],
                "secondary": ["shared"],
            },
        ]

        matched = match_friend_candidate(candidate, friend_dictionary)

        self.assertIsNone(matched["selected"])
        self.assertEqual(matched["ambiguousFriendIds"], ["friend-a1", "friend-b2"])
        self.assertEqual([item["friendId"] for item in matched["top"]], ["friend-a1", "friend-b2"])


if __name__ == "__main__":
    unittest.main()
