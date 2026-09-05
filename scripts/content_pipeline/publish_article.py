#!/usr/bin/env python3
"""Guarded local publication executor. Publication is never automatic."""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

try:
    from ._validation import validate_draft
    from ._workflow import atomic, emit, now, sha256
    from ._readiness_contract import validate as validate_readiness
    from .review_draft import review
except ImportError:  # pragma: no cover
    from _validation import validate_draft
    from _workflow import atomic, emit, now, sha256
    from _readiness_contract import validate as validate_readiness
    from review_draft import review


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
    else:
        try:
            datetime.fromisoformat(approval_data["timestamp"].replace("Z", "+00:00"))
        except ValueError:
            reasons.append("INVALID_TIMESTAMP")

    report_path = readiness or Path(str(approval_data.get("readiness_report", "")))
    if not report_path.is_file():
        reasons.append("MISSING_READINESS_REPORT")
    else:
        try:
            report = _load_json(report_path, "INVALID_READINESS_REPORT")
        except ValueError as exc:
            reasons.append(str(exc))
        else:
            reasons.extend(validate_readiness(report, digest, validation.get("metadata", {}).get("canonical_url")))
            if not reasons:
                expected = review(draft)
                comparable = lambda value: {key: item for key, item in value.items() if key not in {"generated_at", "workflow_signature"}}
                if comparable(report) != comparable(expected):
                    reasons.append("VALIDATOR_OUTPUT_NOT_AUTHENTICATED")
            if approval_data.get("requirements") != report.get("requirements"):
                reasons.append("APPROVAL_REQUIREMENTS_MISMATCH")
            if approval_data.get("findings") != report.get("findings"):
                reasons.append("APPROVAL_FINDINGS_MISMATCH")
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
