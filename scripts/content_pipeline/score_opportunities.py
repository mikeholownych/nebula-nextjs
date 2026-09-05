"""Score local opportunity evidence without mutating analytics data."""
from __future__ import annotations

import argparse
import json
from urllib.parse import urlparse
from pathlib import Path
from typing import Any

REQUIRED_SOURCES = {
    "keyword_registry": "KEYWORD_REGISTRY",
    "audit_findings": "AUDIT_FINDINGS",
    "first_party_exports": "FIRST_PARTY_EXPORTS",
    "competitor_serp_reports": "COMPETITOR_SERP_REPORTS",
}


def _validate_sources(evidence: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for field, label in REQUIRED_SOURCES.items():
        value = evidence.get(field)
        if not isinstance(value, list) or not value:
            errors.append(f"SOURCE_ERROR_{label}")
        if isinstance(value, list):
            ids: set[str] = set()
            for item in value:
                valid = isinstance(item, dict)
                item_id = item.get("id") if valid else None
                parsed = urlparse(str(item.get("url", ""))) if valid else None
                expected = "first_party" if field in {"keyword_registry", "audit_findings", "first_party_exports"} else "competitor"
                valid = valid and isinstance(item_id, str) and bool(item_id.strip()) and item_id not in ids
                valid = valid and parsed is not None and parsed.scheme in {"http", "https"} and bool(parsed.netloc)
                valid = valid and item.get("provenance") == expected and item.get("verified") is True
                valid = valid and isinstance(item.get("evidence"), dict) and bool(item["evidence"])
                if field in {"keyword_registry", "audit_findings"}:
                    valid = valid and isinstance(item.get("query"), str) and bool(item["query"].strip())
                if not valid:
                    errors.append(f"SOURCE_ERROR_{label}")
                    errors.append(f"SOURCE_ERROR_{label}_SCHEMA")
                if isinstance(item_id, str):
                    ids.add(item_id)
    return list(dict.fromkeys(errors))


def _intent_overlap(evidence: dict[str, Any]) -> bool:
    query = str(evidence.get("canonical_query", "")).strip().casefold()
    registry = evidence.get("query_registry", evidence.get("keyword_registry", []))
    ownership = evidence.get("existing_page_ownership", [])
    if not query or not isinstance(registry, list) or not isinstance(ownership, list):
        return False
    def query_of(item: Any) -> str:
        return item if isinstance(item, str) else str(item.get("query", item.get("canonical_query", ""))) if isinstance(item, dict) else ""
    return any(query_of(x).strip().casefold() == query for x in registry) and any(query_of(x).strip().casefold() == query for x in ownership)


def score_opportunity(evidence: dict[str, Any]) -> dict[str, Any]:
    source_errors = _validate_sources(evidence)
    if source_errors:
        return {"recommendation": "BLOCKED", "reasons": source_errors, "source_errors": source_errors, "evidence": evidence}
    impressions = int(evidence.get("impressions", 0))
    competitor_wins = int(evidence.get("competitor_wins", 0))
    days = int(evidence.get("days", 0))
    position = float(evidence.get("position", 999))
    clicks = int(evidence.get("clicks", 0))
    reasons: list[str] = []
    if impressions < 100 and not (evidence.get("indexable") is False and evidence.get("indexability_defect_verified") is True):
        reasons.append("INSUFFICIENT_IMPRESSIONS")
    if position > 20 and clicks == 0:
        reasons.append("LOW_EXPOSURE")
    if competitor_wins == 1:
        reasons.append("SINGLE_COMPETITOR_WIN")
    if days < 28:
        reasons.append("28_DAY_PREREQUISITE")
    if _intent_overlap(evidence):
        reasons.append("REVIEW_CANNIBALIZATION")
    if reasons:
        return {"recommendation": "OBSERVE", "reasons": reasons, "evidence": evidence}
    if competitor_wins >= 2 and 11 <= position <= 20:
        return {"recommendation": "REVIEW_CONTENT_ALIGNMENT", "reasons": ["REPEATED_COMPETITOR_EVIDENCE"], "evidence": evidence}
    return {"recommendation": "OBSERVE", "reasons": ["NO_ACTION_RULE_MATCH"], "evidence": evidence}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    args = parser.parse_args(argv)
    try:
        data = json.loads(args.input.read_text())
        records = data if isinstance(data, list) else data.get("opportunities", [data])
        results = [score_opportunity(item) for item in records]
        print(json.dumps(results, indent=2, sort_keys=True))
        return 0 if all(item["recommendation"] != "BLOCKED" for item in results) else 1
    except (OSError, json.JSONDecodeError, TypeError, AttributeError, ValueError) as exc:
        print(json.dumps({"status": "BLOCKED", "blocked_reasons": ["INPUT_ERROR", str(exc)]}))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
