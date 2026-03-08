from __future__ import annotations

ROI_PROFILE_NAME = "LOL_ENDSCREEN_V1"
TARGET_WIDTH = 1920

ROI_PROFILE = {
    "winner_text_roi": {
        "x": 50,
        "y": 90,
        "width": 260,
        "height": 90,
    },
    "winner_banner_color_roi": {
        "x": 540,
        "y": 48,
        "width": 840,
        "height": 168,
    },
    "blue_names_roi": {
        "x": 175,
        "y": 402,
        "width": 195,
        "height": 292,
    },
    "red_names_roi": {
        "x": 175,
        "y": 708,
        "width": 205,
        "height": 278,
    },
}


def get_roi_profile(name: str) -> dict[str, dict[str, int]]:
    if name != ROI_PROFILE_NAME:
        raise ValueError(f"Unsupported roi profile: {name}")
    return ROI_PROFILE
