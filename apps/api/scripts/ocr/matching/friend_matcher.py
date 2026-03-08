from __future__ import annotations

from difflib import SequenceMatcher
import re
from typing import Any

try:
    from rapidfuzz import fuzz
except ImportError:  # pragma: no cover - exercised implicitly when dependency exists.
    fuzz = None


_SHARP_CHARS = ("＃", "♯")
_WHITESPACE_RE = re.compile(r"\s+")
_FULL_RIOT_ID_RE = re.compile(r"(.+?)\s*#\s*([A-Za-z0-9]{2,10})")
_NUMERIC_TOKEN_RE = re.compile(r"^\d+$")


def normalize_token(value: str | None) -> str:
    if value is None:
        return ""

    normalized = value.strip().lower()
    for sharp in _SHARP_CHARS:
        normalized = normalized.replace(sharp, "#")
    normalized = normalized.replace(" #", "#").replace("# ", "#")
    normalized = _WHITESPACE_RE.sub(" ", normalized)
    return normalized


def extract_riot_id_candidates(
    raw_texts: list[str],
    allowed_numeric_tokens: set[str] | None = None,
) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    allowed_numeric_tokens = allowed_numeric_tokens or set()
    for raw in raw_texts:
        normalized = normalize_token(raw)
        if not normalized:
            continue
        if _NUMERIC_TOKEN_RE.fullmatch(normalized) and normalized not in allowed_numeric_tokens:
            continue

        full = normalized
        name_only = normalized
        game_name = normalized
        tag_line = None
        match = _FULL_RIOT_ID_RE.search(normalized)
        if match:
            full = f"{match.group(1).strip()}#{match.group(2).strip()}"
            name_only = match.group(1).strip()
            game_name = match.group(1).strip()
            tag_line = match.group(2).strip()

        candidates.append(
            {
                "raw": raw,
                "normalized": normalized,
                "gameName": game_name,
                "tagLine": tag_line,
                "full": full,
                "nameOnly": name_only,
            }
        )
    return candidates


def _score_similarity(left: str, right: str) -> float:
    if fuzz is not None:
        return float(fuzz.ratio(left, right))
    return SequenceMatcher(None, left, right).ratio() * 100


def _compact_token(value: str) -> str:
    return _WHITESPACE_RE.sub("", value)


def _contains_hangul(value: str) -> bool:
    return any("가" <= char <= "힣" for char in value)


def _is_single_hangul_char_variation(left: str, right: str) -> bool:
    left_compact = _compact_token(left)
    right_compact = _compact_token(right)
    if (
        len(left_compact) != len(right_compact)
        or len(left_compact) < 3
        or not _contains_hangul(left_compact)
        or not _contains_hangul(right_compact)
    ):
        return False
    return sum(1 for left_char, right_char in zip(left_compact, right_compact) if left_char != right_char) == 1


def _score_secondary_similarity(left: str, right: str) -> float:
    return max(
        _score_similarity(left, right),
        _score_similarity(_compact_token(left), _compact_token(right)),
    )


def _stage_priority(stage: str) -> int:
    return 0 if stage == "primary" else 1


def _match_sort_key(match: dict[str, Any]) -> tuple[float, int, str, str]:
    return (
        -float(match["score"]),
        _stage_priority(str(match["stage"])),
        str(match["friendId"]),
        str(match["matchedKey"]),
    )


def collect_allowed_numeric_name_tokens(
    friend_dictionary: list[dict[str, Any]],
) -> set[str]:
    tokens: set[str] = set()
    for friend in friend_dictionary:
        for _, key in _iter_keys(friend, "primary"):
            match = _FULL_RIOT_ID_RE.search(key)
            candidate_name = match.group(1).strip() if match else key
            if _NUMERIC_TOKEN_RE.fullmatch(candidate_name):
                tokens.add(candidate_name)
        for _, key in _iter_keys(friend, "secondary"):
            if _NUMERIC_TOKEN_RE.fullmatch(key):
                tokens.add(key)
    return tokens


def _iter_keys(friend: dict[str, Any], stage: str) -> list[tuple[str, str]]:
    field_name = "primary" if stage == "primary" else "secondary"
    values = friend.get(field_name, [])
    normalized_values = []
    for value in values:
        normalized = normalize_token(value)
        if normalized:
            normalized_values.append((field_name, normalized))
    return normalized_values


def match_friend_candidate(
    candidate: dict[str, Any],
    friend_dictionary: list[dict[str, Any]],
    options: dict[str, Any] | None = None,
) -> dict[str, Any]:
    top_k = int((options or {}).get("topK", 3))
    min_score_full = float((options or {}).get("minScoreFull", 90))
    min_score_name_only = float((options or {}).get("minScoreNameOnly", 92))

    candidate_full = candidate["full"]
    candidate_name_only = candidate["nameOnly"]
    all_matches: list[dict[str, Any]] = []

    for friend in friend_dictionary:
        friend_id = friend["friendId"]

        for stage_name, key in _iter_keys(friend, "primary"):
            score = _score_similarity(candidate_full, key)
            all_matches.append(
                {
                    "friendId": friend_id,
                    "score": round(score, 2),
                    "matchedKey": f"{stage_name}:{key}",
                    "stage": "primary",
                }
            )

        for stage_name, key in _iter_keys(friend, "secondary"):
            score = _score_secondary_similarity(candidate_name_only, key)
            all_matches.append(
                {
                    "friendId": friend_id,
                    "score": round(score, 2),
                    "matchedKey": f"{stage_name}:{key}",
                    "stage": "secondary",
                    "normalizedKey": key,
                }
            )

    ranked = _collapse_friend_matches(all_matches)
    top_matches = ranked[:top_k]

    selected_match, ambiguity = _select_ranked_match(
        ranked=ranked,
        min_score_full=min_score_full,
        min_score_name_only=min_score_name_only,
    )

    if selected_match is None:
        selected_match, relaxed_ambiguity = _select_relaxed_secondary_match(
            ranked=ranked,
            candidate_name_only=candidate_name_only,
            min_score_name_only=min_score_name_only,
        )
        if relaxed_ambiguity is not None:
            ambiguity = relaxed_ambiguity

    result = {
        "raw": candidate["raw"],
        "normalized": candidate["normalized"],
        "gameName": candidate["gameName"],
        "tagLine": candidate["tagLine"],
        "top": [
            {
                "friendId": item["friendId"],
                "score": item["score"],
                "matchedKey": item["matchedKey"],
                "stage": item["stage"],
            }
            for item in top_matches
        ],
        "selected": (
            {
                "friendId": selected_match["friendId"],
                "score": selected_match["score"],
                "matchedKey": selected_match["matchedKey"],
                "stage": selected_match["stage"],
                "needsReview": selected_match["stage"] == "secondary",
            }
            if selected_match
            else None
        ),
    }
    if ambiguity is not None:
        result["ambiguityReason"] = "top_score_tie"
        result["ambiguousFriendIds"] = ambiguity
    return result


def _collapse_friend_matches(all_matches: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_friend: dict[str, dict[str, Any]] = {}
    for match in all_matches:
        friend_id = str(match["friendId"])
        current = by_friend.get(friend_id)
        if current is None or _match_sort_key(match) < _match_sort_key(current):
            by_friend[friend_id] = match
    return sorted(by_friend.values(), key=_match_sort_key)


def _select_ranked_match(
    ranked: list[dict[str, Any]],
    min_score_full: float,
    min_score_name_only: float,
) -> tuple[dict[str, Any] | None, list[str] | None]:
    eligible = [
        match
        for match in ranked
        if match["score"] >= (
            min_score_full if match["stage"] == "primary" else min_score_name_only
        )
    ]
    if not eligible:
        return None, None
    return _resolve_top_score_tie(eligible)


def _select_relaxed_secondary_match(
    ranked: list[dict[str, Any]],
    candidate_name_only: str,
    min_score_name_only: float,
) -> tuple[dict[str, Any] | None, list[str] | None]:
    relaxed_threshold = max(min_score_name_only - 26, 66)
    secondary_matches = [match for match in ranked if match["stage"] == "secondary"]
    if not secondary_matches:
        return None, None

    best_match = secondary_matches[0]
    normalized_key = str(best_match.get("normalizedKey", ""))
    if best_match["score"] < relaxed_threshold:
        return None, None
    if not _is_single_hangul_char_variation(candidate_name_only, normalized_key):
        return None, None

    tied_candidates = [
        match
        for match in secondary_matches
        if match["score"] == best_match["score"]
        and _is_single_hangul_char_variation(
            candidate_name_only,
            str(match.get("normalizedKey", "")),
        )
    ]
    selected_match, ambiguity = _resolve_top_score_tie(tied_candidates)
    if ambiguity is not None:
        return None, ambiguity

    next_competitor = next(
        (
            match
            for match in secondary_matches[1:]
            if match["friendId"] != best_match["friendId"]
        ),
        None,
    )
    if next_competitor and (best_match["score"] - next_competitor["score"]) < 20:
        return None, None
    return selected_match, None


def _resolve_top_score_tie(
    ranked: list[dict[str, Any]],
) -> tuple[dict[str, Any] | None, list[str] | None]:
    if not ranked:
        return None, None

    best_match = ranked[0]
    top_score = best_match["score"]
    ambiguous_friend_ids = sorted(
        {
            str(match["friendId"])
            for match in ranked
            if match["score"] == top_score
        }
    )
    if len(ambiguous_friend_ids) > 1:
        return None, ambiguous_friend_ids
    return best_match, None
