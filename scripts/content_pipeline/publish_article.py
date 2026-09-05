#!/usr/bin/env python3
"""Guarded local publication executor. Publication is never automatic."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

try:
    from ._validation import validate_draft
    from ._workflow import atomic, emit, now, sha256
except ImportError:  # pragma: no cover
    from _validation import validate_draft
    from _workflow import atomic, emit, now, sha256


def _local_root(path: Path) -> Path:
    root = path.resolve()
    if any(part.lower() in {"customer-portal", "production", "public"} for part in root.parts):
        raise ValueError("UNSAFE_PUBLICATION_ROOT")
    return root


def _load_json(path: Path, error_code: str) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, ValueError, json.JSONDecodeError) as exc:
        raise ValueError(error_code) from exc
    if not isinstance(value, dict):
        raise ValueError(error_code)
    return value


def publish(draft: Path, approval: Path, readiness: Path | None, output_root: Path, dry_run: bool = False) -> dict[str, Any]:
    reasons: list[str] = []
    if not approval.is_file():
        reasons.append("MISSING_APPROVAL")
    if not draft.is_file():
        reasons.append("MISSING_DRAFT")
    if reasons:
        return {"status": "BLOCKED", "reasons": reasons}
    validation = validate_draft(draft)
    reasons.extend(item["code"] for item in validation["failures"])
    digest = sha256(draft)
    try:
        approval_data = _load_json(approval, "INVALID_APPROVAL")
    except ValueError as exc:
        return {"status": "BLOCKED", "reasons": [str(exc)], "draft_hash": digest}
    if approval_data.get("approved") is not True:
        reasons.append("NOT_EXPLICITLY_APPROVED")
    if approval_data.get("draft_hash") != digest:
        reasons.append("APPROVAL_HASH_MISMATCH")
    if not isinstance(approval_data.get("reviewer"), str) or not approval_data["reviewer"].strip():
        reasons.append("MISSING_REVIEWER")
    if not isinstance(approval_data.get("timestamp"), str) or not approval_data["timestamp"].strip():
        reasons.append("MISSING_TIMESTAMP")

    report_path = readiness or Path(str(approval_data.get("readiness_report", "")))
    if not report_path.is_file():
        reasons.append("MISSING_READINESS_REPORT")
    else:
        try:
            report = _load_json(report_path, "INVALID_READINESS_REPORT")
        except ValueError as exc:
            reasons.append(str(exc))
        else:
            if report.get("status") != "PASS":
                reasons.append("READINESS_NOT_PASSED")
            if report.get("validated") is not True:
                reasons.append("READINESS_NOT_VALIDATED")
            if report.get("full_readiness") is not True:
                reasons.append("FULL_READINESS_NOT_PASSED")
            if not isinstance(report.get("draft_hash"), str) or not report["draft_hash"]:
                reasons.append("MISSING_READINESS_HASH")
            elif report["draft_hash"] != digest:
                reasons.append("READINESS_HASH_MISMATCH")
    if reasons:
        return {"status": "BLOCKED", "reasons": list(dict.fromkeys(reasons)), "draft_hash": digest}

    root = _local_root(output_root)
    result = {"status": "DRY_RUN" if dry_run else "PUBLISHED", "draft": str(draft), "draft_hash": digest, "reviewer": approval_data["reviewer"], "timestamp": approval_data["timestamp"], "target": str(root / draft.name)}
    if not dry_run:
        root.mkdir(parents=True, exist_ok=True)
        atomic(root / draft.name, draft.read_text(encoding="utf-8"))
        atomic(root / f"{draft.stem}.publication.json", json.dumps({**result, "published_at": now()}, indent=2, sort_keys=True) + "\n")
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--draft", required=True, type=Path)
    parser.add_argument("--approval", required=True, type=Path)
    parser.add_argument("--readiness", type=Path)
    parser.add_argument("--output-root", type=Path, default=Path("content/published"))
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--report-only", action="store_true")
    args = parser.parse_args(argv)
    try:
        result = publish(args.draft, args.approval, args.readiness, args.output_root, args.dry_run or args.report_only)
        emit(result)
        return 0 if result["status"] in {"DRY_RUN", "PUBLISHED"} else 1
    except (OSError, UnicodeError, ValueError, TypeError) as exc:
        emit({"status": "BLOCKED", "reasons": ["INPUT_ERROR", str(exc)]})
        return 2


if __name__ == "__main__":
    sys.exit(main())
