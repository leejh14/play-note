#!/usr/bin/env python3
"""PlayNote LoL end-screen OCR CLI."""
import json
import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
PACKAGE_ROOT = CURRENT_DIR.parent.parent
if str(PACKAGE_ROOT) not in sys.path:
    sys.path.insert(0, str(PACKAGE_ROOT))

from scripts.ocr.pipeline import load_request, run_extraction


def main():
    input_str = None
    for i, arg in enumerate(sys.argv):
        if arg == "--input" and i + 1 < len(sys.argv):
            input_str = sys.argv[i + 1]
            break

    if not input_str:
        print(json.dumps({"error": "Missing --input"}))
        sys.exit(1)

    try:
        request = load_request(input_str)
    except json.JSONDecodeError as exc:
        print(json.dumps({"error": f"Invalid JSON input: {exc.msg}"}))
        sys.exit(1)
    except OSError as exc:
        print(json.dumps({"error": f"Failed to read input: {exc}"}))
        sys.exit(1)

    try:
        output = run_extraction(request)
    except Exception as exc:  # pragma: no cover - CLI guard.
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)

    print(json.dumps(output, ensure_ascii=False))


if __name__ == "__main__":
    main()
