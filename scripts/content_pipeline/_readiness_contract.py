"""Strict, workflow-bound readiness report contract."""
from __future__ import annotations

import hashlib
import hmac
import json
from datetime import datetime
from typing import Any

SCHEMA = "nebula.local.review-readiness.v1"
PRODUCER = "scripts/content_pipeline/review_draft.py"
_KEY = b"nebula-task-5-local-review-workflow-v1"
_REQUIRED = {"schema", "producer", "generated_at", "draft", "draft_hash", "status", "validated", "full_readiness", "requirements", "findings", "readiness", "workflow_signature"}

def _canonical(report: dict[str, Any]) -> bytes:
    unsigned = {k: v for k, v in report.items() if k != "workflow_signature"}
    return json.dumps(unsigned, sort_keys=True, separators=(",", ":")).encode()

def sign(report: dict[str, Any]) -> str:
    return hmac.new(_KEY, _canonical(report), hashlib.sha256).hexdigest()

def workflow_report(report: dict[str, Any]) -> dict[str, Any]:
    result = dict(report)
    result.update({"schema": SCHEMA, "producer": PRODUCER})
    result["workflow_signature"] = sign(result)
    return result

def _timestamp(value: Any) -> bool:
    if not isinstance(value, str) or not value.strip(): return False
    try: datetime.fromisoformat(value.replace("Z", "+00:00")); return True
    except ValueError: return False

def validate(report: Any, draft_hash: str) -> list[str]:
    if not isinstance(report, dict): return ["INVALID_READINESS_REPORT_SCHEMA"]
    reasons = []
    if set(report) != _REQUIRED: reasons.append("INVALID_READINESS_REPORT_SCHEMA")
    if report.get("schema") != SCHEMA or report.get("producer") != PRODUCER: reasons.append("READINESS_NOT_WORKFLOW_BOUND")
    if not _timestamp(report.get("generated_at")): reasons.append("INVALID_TIMESTAMP")
    if report.get("draft_hash") != draft_hash: reasons.append("READINESS_HASH_MISMATCH")
    if report.get("status") != "PASS": reasons.append("READINESS_NOT_PASSED")
    if report.get("validated") is not True: reasons.append("READINESS_NOT_VALIDATED")
    if report.get("full_readiness") is not True: reasons.append("FULL_READINESS_NOT_PASSED")
    if not isinstance(report.get("requirements"), list) or not report["requirements"] or not all(isinstance(x, str) and x for x in report["requirements"]): reasons.append("MISSING_DECLARED_REQUIREMENTS")
    if not isinstance(report.get("findings"), list) or report.get("findings") != []: reasons.append("DECLARED_FINDINGS_NOT_CLEAR")
    if not isinstance(report.get("readiness"), dict): reasons.append("MISSING_VALIDATOR_OUTPUTS")
    signature = report.get("workflow_signature")
    if not isinstance(signature, str) or not hmac.compare_digest(signature, sign(report)): reasons.append("READINESS_SIGNATURE_INVALID")
    return list(dict.fromkeys(reasons))
