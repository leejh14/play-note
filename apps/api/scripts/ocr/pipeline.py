from __future__ import annotations

from pathlib import Path
import json
import os
from typing import Any

from scripts.ocr.image_utils import Rect, average_rgb, crop_raster_image, load_raster_image, resize_raster_image_to_width
from scripts.ocr.matching.friend_matcher import (
    collect_allowed_numeric_name_tokens,
    extract_riot_id_candidates,
    match_friend_candidate,
    normalize_token,
)
from scripts.ocr.ocr_engine import extract_text_candidates
from scripts.ocr.roi.lol_endscreen_v1 import ROI_PROFILE_NAME, TARGET_WIDTH, get_roi_profile

VICTORY_KEYWORDS = {"victory", "승리"}
DEFEAT_KEYWORDS = {"defeat", "패배"}
DEFAULT_MODEL = "paddleocr-lol-endscreen-v1"


def load_request(input_arg: str) -> dict[str, Any]:
    candidate_path = Path(input_arg)
    if candidate_path.exists():
        payload = json.loads(candidate_path.read_text(encoding="utf-8"))
        return _resolve_request_paths(payload, candidate_path.parent)
    return _resolve_request_paths(json.loads(input_arg), Path.cwd())


def run_extraction(request: dict[str, Any]) -> dict[str, Any]:
    roi_profile_name = str(request.get("roiProfile", ROI_PROFILE_NAME))
    roi_profile = get_roi_profile(roi_profile_name)
    options = _resolve_options(request.get("options"))
    friend_dictionary = list(request.get("friendDictionary", []))
    allowed_numeric_tokens = collect_allowed_numeric_name_tokens(friend_dictionary)
    image_path = _resolve_image_path(request)
    banner_side, banner_evidence = resolve_banner_side(
        request=request,
        image_path=image_path,
        roi_profile=roi_profile,
    )
    ocr_candidates, ocr_source = collect_ocr_candidates(
        request=request,
        image_path=image_path,
        roi_profile=roi_profile,
    )

    blue_parsed = extract_riot_id_candidates(
        ocr_candidates["blueTextCandidates"],
        allowed_numeric_tokens=allowed_numeric_tokens,
    )
    red_parsed = extract_riot_id_candidates(
        ocr_candidates["redTextCandidates"],
        allowed_numeric_tokens=allowed_numeric_tokens,
    )
    blue_matching = [
        _attach_region(
            match_friend_candidate(candidate, friend_dictionary, options),
            "blue",
        )
        for candidate in blue_parsed
    ]
    red_matching = [
        _attach_region(
            match_friend_candidate(candidate, friend_dictionary, options),
            "red",
        )
        for candidate in red_parsed
    ]

    blue_selected = [item["selected"] for item in blue_matching if item["selected"]]
    red_selected = [item["selected"] for item in red_matching if item["selected"]]
    team_a_side, team_a_side_evidence = infer_team_a_side(
        request.get("match", {}).get("teamA", []),
        blue_selected,
        red_selected,
    )
    winner_outcome = detect_winner_outcome(ocr_candidates["winnerTextCandidates"])
    winner_side, winner_evidence = infer_winner_side(
        banner_side=banner_side,
        banner_evidence=banner_evidence,
        outcome=winner_outcome,
    )
    winner_team, winner_team_evidence = infer_winner_team(
        outcome=winner_outcome,
        winner_side=winner_side,
        team_a_side=team_a_side,
    )

    matched_friend_ids = sorted(
        {item["friendId"] for item in blue_selected + red_selected}
    )
    unmatched = [
        item["raw"]
        for item in blue_matching + red_matching
        if item["selected"] is None
    ]

    confidence = {
        "teamASide": _team_a_side_confidence(team_a_side_evidence, team_a_side),
        "winner": round(float(winner_evidence["bannerConfidence"]), 2)
        if winner_side != "unknown"
        else 0.0,
        "winnerTeam": _winner_team_confidence(winner_team_evidence, winner_team),
    }

    result = {
        "jobId": request.get("jobId"),
        "status": "done",
        "winnerSide": winner_side,
        "winnerTeam": winner_team,
        "teamASide": team_a_side,
        "confidence": confidence,
        "ocr": {
            **ocr_candidates,
            "source": ocr_source,
        },
        "parsed": {
            "blue": [_to_parsed_output(item) for item in blue_parsed],
            "red": [_to_parsed_output(item) for item in red_parsed],
        },
        "matching": blue_matching + red_matching,
        "teamASideEvidence": team_a_side_evidence,
        "winnerEvidence": winner_evidence,
        "winnerTeamEvidence": winner_team_evidence,
        "matchedFriendIds": matched_friend_ids,
        "unmatched": unmatched,
    }

    return {
        "winnerSide": winner_side,
        "winnerTeam": winner_team,
        "teamASide": team_a_side,
        "confidence": confidence,
        "model": DEFAULT_MODEL,
        "result": result,
    }


def detect_winner_outcome(winner_text_candidates: list[str]) -> str:
    normalized = {
        normalize_token(item)
        for item in winner_text_candidates
        if normalize_token(item)
    }
    if normalized & VICTORY_KEYWORDS:
        return "victory"
    if normalized & DEFEAT_KEYWORDS:
        return "defeat"
    return "unknown"


def infer_team_a_side(
    team_a_friend_ids: list[str],
    blue_selected: list[dict[str, Any]],
    red_selected: list[dict[str, Any]],
) -> tuple[str, dict[str, int]]:
    team_a_set = set(team_a_friend_ids)
    count_a_blue = len(
        {match["friendId"] for match in blue_selected if match["friendId"] in team_a_set}
    )
    count_a_red = len(
        {match["friendId"] for match in red_selected if match["friendId"] in team_a_set}
    )

    if count_a_blue >= 3:
        return "blue", {"countABlue": count_a_blue, "countARed": count_a_red}
    if count_a_red >= 3:
        return "red", {"countABlue": count_a_blue, "countARed": count_a_red}
    return "unknown", {"countABlue": count_a_blue, "countARed": count_a_red}


def infer_winner_side(
    banner_side: str,
    banner_evidence: dict[str, Any],
    outcome: str,
) -> tuple[str, dict[str, Any]]:
    if banner_side in {"blue", "red"}:
        return banner_side, {
            "bannerSide": banner_side,
            "bannerConfidence": banner_evidence["confidence"],
            "averageColor": banner_evidence["averageColor"],
            "outcome": outcome,
        }
    return "unknown", {
        "bannerSide": "unknown",
        "bannerConfidence": 0.0,
        "averageColor": banner_evidence["averageColor"],
        "outcome": outcome,
    }


def infer_winner_team(
    outcome: str,
    winner_side: str,
    team_a_side: str,
) -> tuple[str, dict[str, str]]:
    if outcome == "victory":
        return "teamA", {"source": "outcome", "outcome": outcome}
    if outcome == "defeat":
        return "teamB", {"source": "outcome", "outcome": outcome}

    if winner_side in {"blue", "red"} and team_a_side in {"blue", "red"}:
        winner_team = "teamA" if winner_side == team_a_side else "teamB"
        return winner_team, {
            "source": "sideMatch",
            "winnerSide": winner_side,
            "teamASide": team_a_side,
        }

    return "unknown", {"source": "insufficient"}


def detect_banner_side(
    image,
    roi_profile: dict[str, dict[str, int]],
) -> tuple[str, dict[str, Any]]:
    banner = crop_raster_image(
        image,
        Rect(**roi_profile["winner_banner_color_roi"]),
    )
    red, green, blue = average_rgb(banner)
    delta = abs(red - blue)
    if delta < 24:
        return "unknown", {
            "averageColor": {
                "red": round(red, 2),
                "green": round(green, 2),
                "blue": round(blue, 2),
            },
            "confidence": 0.0,
        }
    return (
        "red" if red > blue else "blue",
        {
            "averageColor": {
                "red": round(red, 2),
                "green": round(green, 2),
                "blue": round(blue, 2),
            },
            "confidence": round(min(delta / 255, 1), 2),
        },
    )


def resolve_banner_side(
    request: dict[str, Any],
    image_path: str | None,
    roi_profile: dict[str, dict[str, int]],
) -> tuple[str, dict[str, Any]]:
    explicit = request.get("ocr")
    if explicit and explicit.get("winnerBannerSide") in {"blue", "red", "unknown"}:
        return (
            str(explicit["winnerBannerSide"]),
            {
                "averageColor": None,
                "confidence": 1.0 if explicit["winnerBannerSide"] != "unknown" else 0.0,
                "source": "provided",
            },
        )

    if image_path:
        layout_image = _load_layout_image(image_path)
        side, evidence = detect_banner_side(layout_image, roi_profile)
        return side, {
            **evidence,
            "source": "image",
        }

    return "unknown", {
        "averageColor": None,
        "confidence": 0.0,
        "source": "missing",
    }


def collect_ocr_candidates(
    request: dict[str, Any],
    image_path: str | None,
    roi_profile: dict[str, dict[str, int]],
) -> tuple[dict[str, list[str]], str]:
    explicit = request.get("ocr")
    if explicit:
        return (
            {
                "winnerTextCandidates": list(explicit.get("winnerTextCandidates", [])),
                "blueTextCandidates": list(explicit.get("blueTextCandidates", [])),
                "redTextCandidates": list(explicit.get("redTextCandidates", [])),
            },
            "provided",
        )

    if not image_path:
        raise RuntimeError(
            "imagePath is required when OCR candidates are not provided explicitly."
        )

    return (
        extract_text_candidates(
            image_path=image_path,
            roi_profile=roi_profile,
            target_width=TARGET_WIDTH,
        ),
        "paddleocr",
    )


def _resolve_request_paths(payload: dict[str, Any], base_dir: Path) -> dict[str, Any]:
    resolved = dict(payload)
    image_path = resolved.get("imagePath")
    if isinstance(image_path, str):
        candidate = Path(image_path)
        if not candidate.is_absolute():
            resolved["imagePath"] = str((base_dir / candidate).resolve())
    return resolved


def _resolve_image_path(request: dict[str, Any]) -> str | None:
    image_path = request.get("imagePath")
    if image_path:
        return str(image_path)
    return None


def _load_layout_image(image_path: str):
    raster = load_raster_image(image_path)
    return resize_raster_image_to_width(raster, TARGET_WIDTH)


def _resolve_options(raw_options: Any) -> dict[str, Any]:
    options = raw_options or {}
    return {
        "topK": int(options.get("topK", os.getenv("OCR_TOP_K", "3"))),
        "minScoreFull": float(
            options.get("minScoreFull", os.getenv("OCR_MIN_SCORE_FULL", "90"))
        ),
        "minScoreNameOnly": float(
            options.get(
                "minScoreNameOnly",
                os.getenv("OCR_MIN_SCORE_NAME_ONLY", "92"),
            )
        ),
    }


def _attach_region(match: dict[str, Any], region: str) -> dict[str, Any]:
    attached = dict(match)
    attached["region"] = region
    return attached


def _to_parsed_output(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "raw": item["raw"],
        "normalized": item["normalized"],
        "gameName": item["gameName"],
        "tagLine": item["tagLine"],
    }


def _team_a_side_confidence(evidence: dict[str, int], team_a_side: str) -> float:
    if team_a_side == "unknown":
        return 0.0
    score = max(evidence["countABlue"], evidence["countARed"])
    return round(min(score / 3, 1), 2)


def _winner_team_confidence(evidence: dict[str, str], winner_team: str) -> float:
    if winner_team == "unknown":
        return 0.0
    return 1.0 if evidence["source"] == "outcome" else 0.8
