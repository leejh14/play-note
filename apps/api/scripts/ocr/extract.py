#!/usr/bin/env python3
"""
LOL 엔드스크린 OCR 추출 스크립트 (stub)
TODO: 08-worker-ocr에서 실제 OCR 구현
"""
import json
import sys


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
        _ = json.loads(input_str)
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
        sys.exit(1)

    output = {
        "winnerSide": "unknown",
        "teamASide": "unknown",
        "confidence": {},
        "result": {},
    }
    print(json.dumps(output))


if __name__ == "__main__":
    main()
