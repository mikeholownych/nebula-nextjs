"""Single fail-closed validation path used by review, edits, and publication."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

try:
    from ._workflow import json_sidecar, parse
    from .collect_sources import SOURCE_SPECS, validate_source_bundle
    from .publish_readiness import build_readiness_report
    from .validate_claims import validate_article_claims
except ImportError:  # pragma: no cover
    from _workflow import json_sidecar, parse
    from collect_sources import SOURCE_SPECS, validate_source_bundle
    from publish_readiness import build_readiness_report
    from validate_claims import validate_article_claims


def _failure(code: str, message: str) -> dict[str, str]:
    return {"code": code, "message": message}


def _records(sidecar: dict[str, Any]) -> list[dict[str, Any]]:
    provenance = sidecar.get("provenance", {})
    if isinstance(provenance, dict):
        provenance = provenance.get("records", [])
    if not isinstance(provenance, list):
        return []
    return [row for row in provenance if isinstance(row, dict)]


def _claim_sources(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    sources: list[dict[str, Any]] = []
    for record in records:
        source = dict(record)
        provenance = source.get("provenance")
        if isinstance(provenance, dict):
            source["provenance"] = provenance.get("source_class")
        source.setdefault(
            "kind",
            "competitor" if source.get("source_type") == "competitor_serp" else (provenance.get("source_class") if isinstance(provenance, dict) else provenance) or "primary",
        )
        sources.append(source)
    return sources


def _source_bundle(records: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    bundle = {name: [] for name in SOURCE_SPECS}
    bundle["__untyped__"] = []
    bundle["__unknown_typed__"] = []
    for record in records:
        source_type = record.get("source_type")
        if source_type in bundle:
            bundle[source_type].append(record)
        elif isinstance(source_type, str):
            bundle["__unknown_typed__"].append(record)
        else:
            bundle["__untyped__"].append(record)
    return bundle


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

    sidecar: dict[str, Any] = {}
    sidecar_path = json_sidecar(path)
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
        article = {"canonical_url": canonical, "source_refs": metadata.get("source_refs", []), "claims": []}
    claim_result = validate_article_claims(article, _claim_sources(records))
    failures.extend(_failure(reason, "claim and provenance validation failed") for reason in claim_result["blocked_reasons"])

    source_result = validate_source_bundle(_source_bundle(records))
    source_errors = source_result["errors"]
    untyped_records = [row for row in records if not isinstance(row.get("source_type"), str)]
    if untyped_records:
        source_errors.append("SOURCE_ERROR_UNTYPED_RECORD")
    failures.extend(_failure(reason, "source artifact validation failed") for reason in source_errors)

    opportunity = sidecar.get("opportunity")
    readiness_input = opportunity if isinstance(opportunity, dict) else None
    try:
        readiness = build_readiness_report(article, _claim_sources(records), readiness_input)
    except (TypeError, ValueError, KeyError) as exc:
        readiness = {"status": "BLOCKED", "blocked_reasons": ["READINESS_VALIDATION_ERROR"]}
        failures.append(_failure("READINESS_VALIDATION_ERROR", str(exc)))
    if readiness.get("status") != "PASS" or readiness.get("blocked_reasons") or readiness.get("timing_gate") == "BLOCKED":
        failures.extend(
            _failure(reason, "full publish-readiness validation failed")
            for reason in readiness.get("blocked_reasons", ["READINESS_BLOCKED"])
        )

    unique = {(item["code"], item["message"]): item for item in failures}
    return {
        "valid": not unique,
        "failures": list(unique.values()),
        "metadata": metadata,
        "body": body,
        "sidecar": sidecar,
        "readiness": readiness,
    }
