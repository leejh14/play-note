#!/usr/bin/env python3
"""Dataset evaluator for LoL end-screen OCR."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

CURRENT_DIR = Path(__file__).resolve().parent
PACKAGE_ROOT = CURRENT_DIR.parent.parent
if str(PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(PACKAGE_ROOT))

from scripts.ocr.pipeline import load_request, run_extraction

DATASET_CASES_DIR = CURRENT_DIR / "datasets" / "cases"


def compute_id_metrics(
    expected_ids: list[str],
    actual_ids: list[str],
) -> dict[str, float | int]:
    expected_set = set(expected_ids)
    actual_set = set(actual_ids)
    tp = len(expected_set & actual_set)
    fp = len(actual_set - expected_set)
    fn = len(expected_set - actual_set)

    precision = tp / (tp + fp) if (tp + fp) else 1.0
    recall = tp / (tp + fn) if (tp + fn) else 1.0
    if precision + recall == 0:
        f1 = 0.0
    else:
        f1 = (2 * precision * recall) / (precision + recall)

    return {
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
    }


def compare_case_result(
    case_id: str,
    expected: dict[str, Any],
    output: dict[str, Any],
) -> dict[str, Any]:
    actual_result = output["result"]
    actual_matched = list(actual_result.get("matchedFriendIds", []))
    actual_unmatched = list(actual_result.get("unmatched", []))
    expected_matched = list(expected.get("matchedFriendIds", []))
    expected_unmatched = list(expected.get("unmatched", []))
    metrics = compute_id_metrics(expected_matched, actual_matched)

    exact = {
        "winnerSideExact": output["winnerSide"] == expected["winnerSide"],
        "teamASideExact": output["teamASide"] == expected["teamASide"],
        "teamASideEvidenceExact": actual_result["teamASideEvidence"] == expected["teamASideEvidence"],
        "matchedFriendIdsExact": actual_matched == expected_matched,
        "unmatchedExact": actual_unmatched == expected_unmatched,
    }

    return {
        "caseId": case_id,
        "exact": {
            **exact,
            "all": all(exact.values()),
        },
        "expected": {
            "winnerSide": expected["winnerSide"],
            "teamASide": expected["teamASide"],
            "teamASideEvidence": expected["teamASideEvidence"],
            "matchedFriendIds": expected_matched,
            "unmatched": expected_unmatched,
        },
        "actual": {
            "winnerSide": output["winnerSide"],
            "teamASide": output["teamASide"],
            "teamASideEvidence": actual_result["teamASideEvidence"],
            "matchedFriendIds": actual_matched,
            "unmatched": actual_unmatched,
        },
        "matchedFriendIdsMetrics": metrics,
    }


def evaluate_case_dir(case_dir: Path) -> dict[str, Any]:
    request = load_request(str(case_dir / "input.json"))
    expected = json.loads((case_dir / "expected.json").read_text(encoding="utf-8"))
    output = run_extraction(request)
    return compare_case_result(case_dir.name, expected, output)


def list_case_dirs(case_name: str | None) -> list[Path]:
    case_dirs = sorted(path for path in DATASET_CASES_DIR.iterdir() if path.is_dir())
    if case_name is None:
        return case_dirs
    return [case_dir for case_dir in case_dirs if case_dir.name == case_name]


def summarize_results(case_results: list[dict[str, Any]]) -> dict[str, Any]:
    summary = {
        "caseCount": len(case_results),
        "exactPassCount": 0,
        "winnerSideExactCount": 0,
        "teamASideExactCount": 0,
        "teamASideEvidenceExactCount": 0,
        "matchedFriendIdsExactCount": 0,
        "unmatchedExactCount": 0,
        "matchedFriendIdsMicro": {
            "tp": 0,
            "fp": 0,
            "fn": 0,
            "precision": 1.0,
            "recall": 1.0,
            "f1": 1.0,
        },
    }

    tp_total = 0
    fp_total = 0
    fn_total = 0
    for case_result in case_results:
        exact = case_result["exact"]
        metrics = case_result["matchedFriendIdsMetrics"]
        summary["exactPassCount"] += 1 if exact["all"] else 0
        summary["winnerSideExactCount"] += 1 if exact["winnerSideExact"] else 0
        summary["teamASideExactCount"] += 1 if exact["teamASideExact"] else 0
        summary["teamASideEvidenceExactCount"] += 1 if exact["teamASideEvidenceExact"] else 0
        summary["matchedFriendIdsExactCount"] += 1 if exact["matchedFriendIdsExact"] else 0
        summary["unmatchedExactCount"] += 1 if exact["unmatchedExact"] else 0
        tp_total += int(metrics["tp"])
        fp_total += int(metrics["fp"])
        fn_total += int(metrics["fn"])

    precision = tp_total / (tp_total + fp_total) if (tp_total + fp_total) else 1.0
    recall = tp_total / (tp_total + fn_total) if (tp_total + fn_total) else 1.0
    if precision + recall == 0:
        f1 = 0.0
    else:
        f1 = (2 * precision * recall) / (precision + recall)

    summary["matchedFriendIdsMicro"] = {
        "tp": tp_total,
        "fp": fp_total,
        "fn": fn_total,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
    }

    return summary


def render_text_report(case_results: list[dict[str, Any]], summary: dict[str, Any]) -> str:
    lines: list[str] = []
    for case_result in case_results:
        metrics = case_result["matchedFriendIdsMetrics"]
        exact = case_result["exact"]
        lines.extend(
            [
                f"[{case_result['caseId']}]",
                f"winnerSideExact={str(exact['winnerSideExact']).lower()} expected={case_result['expected']['winnerSide']} actual={case_result['actual']['winnerSide']}",
                f"teamASideExact={str(exact['teamASideExact']).lower()} expected={case_result['expected']['teamASide']} actual={case_result['actual']['teamASide']}",
                f"teamASideEvidenceExact={str(exact['teamASideEvidenceExact']).lower()} expected={json.dumps(case_result['expected']['teamASideEvidence'], ensure_ascii=False)} actual={json.dumps(case_result['actual']['teamASideEvidence'], ensure_ascii=False)}",
                f"matchedFriendIdsExact={str(exact['matchedFriendIdsExact']).lower()} precision={metrics['precision']:.4f} recall={metrics['recall']:.4f} f1={metrics['f1']:.4f} tp={metrics['tp']} fp={metrics['fp']} fn={metrics['fn']}",
                f"unmatchedExact={str(exact['unmatchedExact']).lower()} expected={json.dumps(case_result['expected']['unmatched'], ensure_ascii=False)} actual={json.dumps(case_result['actual']['unmatched'], ensure_ascii=False)}",
                f"exactAll={str(exact['all']).lower()}",
                "",
            ]
        )

    micro = summary["matchedFriendIdsMicro"]
    lines.extend(
        [
            "[summary]",
            f"cases={summary['caseCount']}",
            f"exactPassCount={summary['exactPassCount']}",
            f"winnerSideExactCount={summary['winnerSideExactCount']}",
            f"teamASideExactCount={summary['teamASideExactCount']}",
            f"teamASideEvidenceExactCount={summary['teamASideEvidenceExactCount']}",
            f"matchedFriendIdsExactCount={summary['matchedFriendIdsExactCount']}",
            f"unmatchedExactCount={summary['unmatchedExactCount']}",
            f"matchedFriendIdsMicro precision={micro['precision']:.4f} recall={micro['recall']:.4f} f1={micro['f1']:.4f} tp={micro['tp']} fp={micro['fp']} fn={micro['fn']}",
        ]
    )
    return "\n".join(lines)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate OCR dataset cases.")
    parser.add_argument("--case", dest="case_name")
    parser.add_argument(
        "--format",
        choices=("text", "json"),
        default="text",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    case_dirs = list_case_dirs(args.case_name)
    if not case_dirs:
        print(
            json.dumps(
                {"error": f"No dataset case found for: {args.case_name}"},
                ensure_ascii=False,
            )
        )
        return 1

    case_results = [evaluate_case_dir(case_dir) for case_dir in case_dirs]
    summary = summarize_results(case_results)
    payload = {
        "cases": case_results,
        "summary": summary,
    }

    if args.format == "json":
        print(json.dumps(payload, ensure_ascii=False))
    else:
        print(render_text_report(case_results, summary))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
