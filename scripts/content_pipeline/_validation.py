"""Shared fail-closed validation for draft review and publication."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

try:
    from ._workflow import json_sidecar, parse
    from .collect_sources import validate_source_bundle
    from .publish_readiness import build_readiness_report
    from .validate_claims import validate_article_claims
except ImportError:
    from _workflow import json_sidecar, parse
    from collect_sources import validate_source_bundle
    from publish_readiness import build_readiness_report
    from validate_claims import validate_article_claims


def _failure(code: str, message: str) -> dict[str, str]:
    return {"code": code, "message": message}


def _records(sidecar: dict[str, Any]) -> list[dict[str, Any]]:
    provenance = sidecar.get("provenance", {})
    if isinstance(provenance, dict) and isinstance(provenance.get("records"), list):
        return [row for row in provenance["records"] if isinstance(row, dict)]
    if isinstance(provenance, list):
        return [row for row in provenance if isinstance(row, dict)]
    return []


def _claim_sources(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    result = []
    for record in records:
        row = dict(record)
        provenance = row.get("provenance")
        if isinstance(provenance, dict):
            row["provenance"] = provenance.get("source_class")
        row.setdefault("kind", "competitor" if row.get("source_type") == "competitor_serp" else row.get("source_type", "primary"))
        result.append(row)
    return result


def validate_draft(path: Path) -> dict[str, Any]:
    failures: list[dict[str, str]] = []
    try:
        metadata, body, _ = parse(path)
    except (OSError, UnicodeError, ValueError) as exc:
        return {"valid": False, "failures": [_failure("MALFORMED_DRAFT", str(exc))]}

    if not body.strip() or not body.lstrip().startswith("# "):
        failures.append(_failure("MALFORMED_DRAFT", "draft body must contain a markdown H1"))
    canonical = metadata.get("canonical_url")
    parsed = urlparse(canonical) if isinstance(canonical, str) else None
    if parsed is None or parsed.scheme not in {"http", "https"} or not parsed.netloc:
        failures.append(_failure("INVALID_CANONICAL", "canonical_url must be an absolute HTTP(S) URL"))

    sidecar_path = json_sidecar(path)
    sidecar: dict[str, Any] = {}
    if sidecar_path.is_file():
        try:
            loaded = json.loads(sidecar_path.read_text(encoding="utf-8"))
            if not isinstance(loaded, dict):
                raise ValueError("sidecar must be an object")
            sidecar = loaded
        except (OSError, UnicodeError, ValueError, json.JSONDecodeError) as exc:
            failures.append(_failure("INVALID_PROVENANCE", f"malformed provenance sidecar: {exc}"))
    else:
        failures.append(_failure("MISSING_PROVENANCE", "draft provenance sidecar is required"))

    records = _records(sidecar)
    article = sidecar.get("article")
    if not isinstance(article, dict):
        article = {
            "canonical_url": canonical,
            "source_refs": metadata.get("source_refs", []),
            "claims": [],
        }
    claim_result = validate_article_claims(article, _claim_sources(records))
    for reason in claim_result.get("blocked_reasons", []):
        failures.append(_failure(reason, "claim and provenance validation failed"))

    if records and all(isinstance(row.get("source_type"), str) for row in records):
        source_bundle = {row["source_type"]: [row] for row in records}
        source_result = validate_source_bundle(source_bundle)
        for reason in source_result.get("errors", []):
            failures.append(_failure(reason, "source artifact validation failed"))

    opportunity = sidecar.get("opportunity")
    try:
        readiness = build_readiness_report(article, _claim_sources(records), opportunity if isinstance(opportunity, dict) else None)
    except (TypeError, ValueError, KeyError) as exc:
        readiness = {"status": "BLOCKED", "blocked_reasons": ["READINESS_VALIDATION_ERROR"]}
        if isinstance(opportunity, dict):
            failures.append(_failure("READINESS_VALIDATION_ERROR", str(exc)))
    if isinstance(opportunity, dict) and readiness.get("status") != "PASS":
        for reason in readiness.get("blocked_reasons", ["READINESS_BLOCKED"]):
            failures.append(_failure(reason, "full publish-readiness validation failed"))

    return {"valid": not failures, "failures": failures, "metadata": metadata, "body": body, "sidecar": sidecar}
