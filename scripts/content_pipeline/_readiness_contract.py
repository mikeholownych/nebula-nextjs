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
_REQUIRED_REQUIREMENTS = {
    "H1_QUESTION", "BYLINE", "DATELINE", "ANSWER_BLOCK", "QUESTION_H2S",
    "SELF_CONTAINED_SECTIONS", "EXTRACTABLE_SENTENCES", "ORIGINAL_DATA_PROVENANCE",
    "SOURCE_LINKS", "COMPARISON_TABLE", "FAQ_BLOCK", "SCHEMA", "SERVER_RENDERING", "NEXT_STEP",
}
_REQUIRED_READINESS = {
    "status", "blocked_reasons", "claim_results", "claim_reasons", "timing_gate",
    "canonical_url", "source_refs", "provenance", "recommendation", "opportunity",
}

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

def _complete_requirements(value: Any) -> bool:
    return (isinstance(value, list) and len(value) == len(_REQUIRED_REQUIREMENTS)
            and all(isinstance(item, str) and item for item in value)
            and set(value) == _REQUIRED_REQUIREMENTS)

def validate(report: Any, draft_hash: str) -> list[str]:
    if not isinstance(report, dict): return ["INVALID_READINESS_REPORT_SCHEMA"]
    reasons = []
    if set(report) != _REQUIRED: reasons.append("INVALID_READINESS_REPORT_SCHEMA")
    if report.get("schema") != SCHEMA or report.get("producer") != PRODUCER: reasons.append("READINESS_NOT_WORKFLOW_BOUND")
    if not _timestamp(report.get("generated_at")): reasons.append("INVALID_TIMESTAMP")
    if not isinstance(report.get("draft"), str) or not report["draft"].strip(): reasons.append("MISSING_DRAFT_BINDING")
    if not isinstance(draft_hash, str) or len(draft_hash) != 64 or any(c not in "0123456789abcdef" for c in draft_hash): reasons.append("INVALID_DRAFT_HASH")
    if report.get("draft_hash") != draft_hash: reasons.append("READINESS_HASH_MISMATCH")
    if report.get("status") != "PASS": reasons.append("READINESS_NOT_PASSED")
    if report.get("validated") is not True: reasons.append("READINESS_NOT_VALIDATED")
    if report.get("full_readiness") is not True: reasons.append("FULL_READINESS_NOT_PASSED")
    if not _complete_requirements(report.get("requirements")):
        reasons.append("MISSING_DECLARED_REQUIREMENTS")
    if (not isinstance(report.get("findings"), list)
            or report.get("findings") != []
            or any(not isinstance(x, dict) or set(x) != {"code", "message"} for x in report.get("findings", []))):
        reasons.append("DECLARED_FINDINGS_NOT_CLEAR")
    readiness = report.get("readiness")
    if (not isinstance(readiness, dict) or set(readiness) != _REQUIRED_READINESS
            or not isinstance(readiness.get("blocked_reasons"), list)
            or readiness.get("blocked_reasons") != []
            or readiness.get("status") != "PASS"
            or readiness.get("timing_gate") != "PASS"
            or not isinstance(readiness.get("claim_results"), list)
            or not isinstance(readiness.get("claim_reasons"), list)
            or not isinstance(readiness.get("source_refs"), list)
            or not isinstance(readiness.get("provenance"), dict)
            or not isinstance(readiness.get("opportunity"), dict)
            or not isinstance(readiness.get("canonical_url"), str)
            or not readiness["canonical_url"].strip()):
        reasons.append("MISSING_VALIDATOR_OUTPUTS")
    signature = report.get("workflow_signature")
    if not isinstance(signature, str) or not hmac.compare_digest(signature, sign(report)): reasons.append("READINESS_SIGNATURE_INVALID")
    return list(dict.fromkeys(reasons))
