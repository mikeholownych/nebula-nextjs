"""Immutable, evidence-backed Paid Traffic Leak Report artifacts."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any, Mapping
from urllib.parse import urlparse


REPORT_ROOT = Path("ops/paid-traffic-leak-reports")
CHECKOUT_URL = "https://buy.stripe.com/9B63cvc2o7YMcid2Nk43S0j"
REQUIRED_FIELDS = (
    "report_id",
    "created_at",
    "prospect_id",
    "landing_page_url",
    "campaign_copy",
    "conversion_goal",
    "message_match_finding",
    "evidence",
    "priority_leak",
    "confidence",
    "replacement_headline",
    "replacement_subheadline",
    "replacement_cta",
    "implementation_notes",
    "experiment_brief",
)
CONFIDENCE_LEVELS = {"high", "medium", "low"}
SENSITIVE_PATTERNS = (
    re.compile(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b"),
    re.compile(r"\bsk_(?:live|test)_[A-Za-z0-9_-]+\b", re.IGNORECASE),
    re.compile(r"\b(?:api[_ -]?key|token|password|secret)\s*[:=]\s*\S+", re.IGNORECASE),
    re.compile(r"\b(?:postgres(?:ql)?|mysql|redis)://\S+", re.IGNORECASE),
)
EXPERIMENT_FIELDS = ("hypothesis", "primary_metric", "traffic_note", "stop_rule", "rollback_rule")


class ReportValidationError(ValueError):
    """Raised when a report cannot be safely created or persisted."""


def _scan_sensitive(value: Any, path: str = "payload") -> None:
    if isinstance(value, Mapping):
        for key, child in value.items():
            _scan_sensitive(child, f"{path}.{key}")
    elif isinstance(value, (list, tuple)):
        for index, child in enumerate(value):
            _scan_sensitive(child, f"{path}[{index}]")
    elif isinstance(value, str):
        for pattern in SENSITIVE_PATTERNS:
            if pattern.search(value):
                raise ReportValidationError(f"sensitive material found in {path}")


def _require_text(payload: Mapping[str, Any], field: str) -> str:
    value = payload.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ReportValidationError(f"{field} is required")
    return value.strip()


def _validate_url(value: str) -> str:
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.netloc:
        raise ReportValidationError("landing_page_url must be an HTTPS URL")
    return value


def _canonical_json(payload: Mapping[str, Any]) -> str:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def build_report(payload: Mapping[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, Mapping):
        raise ReportValidationError("payload must be an object")

    missing = [field for field in REQUIRED_FIELDS if field not in payload]
    if missing:
        raise ReportValidationError(f"missing required fields: {', '.join(missing)}")
    _scan_sensitive(payload)

    report: dict[str, Any] = {field: payload[field] for field in REQUIRED_FIELDS}
    report["report_id"] = _require_text(report, "report_id")
    report["created_at"] = _require_text(report, "created_at")
    report["prospect_id"] = _require_text(report, "prospect_id")
    report["landing_page_url"] = _validate_url(_require_text(report, "landing_page_url"))
    for field in (
        "campaign_copy",
        "conversion_goal",
        "message_match_finding",
        "replacement_headline",
        "replacement_subheadline",
        "replacement_cta",
    ):
        report[field] = _require_text(report, field)

    evidence = report["evidence"]
    if not isinstance(evidence, list) or not evidence:
        raise ReportValidationError("evidence must contain at least one item")
    if any(not isinstance(item, Mapping) for item in evidence):
        raise ReportValidationError("evidence items must be objects")

    priority_leak = report["priority_leak"]
    if not isinstance(priority_leak, str) or not priority_leak.strip():
        raise ReportValidationError("report must contain one primary leak")
    report["priority_leak"] = priority_leak.strip()

    confidence = report["confidence"]
    if confidence not in CONFIDENCE_LEVELS:
        raise ReportValidationError("confidence must be high, medium, or low")

    notes = report["implementation_notes"]
    if not isinstance(notes, list) or not notes or any(not isinstance(item, str) or not item.strip() for item in notes):
        raise ReportValidationError("implementation_notes must be a non-empty list of text")
    report["implementation_notes"] = [item.strip() for item in notes]

    experiment = report["experiment_brief"]
    if not isinstance(experiment, Mapping):
        raise ReportValidationError("experiment_brief must be an object")
    for field in EXPERIMENT_FIELDS:
        if not isinstance(experiment.get(field), str) or not experiment[field].strip():
            raise ReportValidationError(f"experiment_brief.{field} is required")
    report["experiment_brief"] = {field: experiment[field].strip() for field in EXPERIMENT_FIELDS}
    report["checkout_url"] = CHECKOUT_URL

    report["content_hash"] = hashlib.sha256(_canonical_json(report).encode("utf-8")).hexdigest()
    return report


def write_report(payload: Mapping[str, Any], root: Path = REPORT_ROOT) -> Path:
    report = build_report(payload)
    root = Path(root)
    root.mkdir(parents=True, exist_ok=True)
    path = root / f"{report['report_id']}.json"
    try:
        with path.open("x", encoding="utf-8") as handle:
            handle.write(json.dumps(report, sort_keys=True, indent=2, ensure_ascii=False) + "\n")
    except FileExistsError as exc:
        raise ReportValidationError("report ID already exists") from exc
    return path.resolve()
