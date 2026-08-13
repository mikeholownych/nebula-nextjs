#!/usr/bin/env python3
"""Create one local Paid Traffic Leak Report artifact from a JSON payload."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from paid_traffic_leak_report import ReportValidationError, write_report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="JSON report payload")
    parser.add_argument("--root", type=Path, default=None, help="artifact directory")
    args = parser.parse_args()

    try:
        payload = json.loads(args.input.read_text(encoding="utf-8"))
        path = write_report(payload, root=args.root) if args.root is not None else write_report(payload)
    except (OSError, json.JSONDecodeError, ReportValidationError) as exc:
        print(f"report creation failed: {exc}", file=sys.stderr)
        return 2

    report = json.loads(path.read_text(encoding="utf-8"))
    print(path)
    print(f"content_hash={report['content_hash']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
