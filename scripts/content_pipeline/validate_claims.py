"""Validate article claims against explicit, verified provenance."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

VALID_PROVENANCE = {"first_party", "primary_external", "competitor"}
VALID_KINDS = {"first_party", "primary_external", "competitor", "primary", "external"}


def _source_index(sources: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {str(source.get("id")): source for source in sources if isinstance(source, dict) and source.get("id")}


def _source_provenance(source: dict[str, Any]) -> str | None:
    value = source.get("provenance")
    return str(value) if value in VALID_PROVENANCE else None


def _source_is_typed(source: dict[str, Any]) -> bool:
    provenance = _source_provenance(source)
    kind = source.get("kind")
    if provenance is None or kind not in VALID_KINDS:
        return False
    if provenance == "first_party":
        return kind in {"first_party", "primary"}
    if provenance == "primary_external":
        return kind in {"primary_external", "external"}
    return kind == "competitor"


def _provenance(source: dict[str, Any] | None) -> dict[str, Any]:
    if not source:
        return {}
    return {key: source[key] for key in ("id", "url", "kind", "owner", "role", "provenance", "verified") if key in source}


def _overlap_evidenced(record: dict[str, Any]) -> bool:
    query = str(record.get("canonical_query", "")).strip().casefold()
    registry = record.get("query_registry", record.get("keyword_registry", []))
    ownership = record.get("existing_page_ownership", [])
    if not query or not isinstance(registry, list) or not isinstance(ownership, list):
        return False
    registered = any(isinstance(item, str) and item.casefold() == query or isinstance(item, dict) and str(item.get("query", item.get("canonical_query", ""))).strip().casefold() == query for item in registry)
    owned = any(isinstance(item, dict) and str(item.get("query", item.get("canonical_query", ""))).strip().casefold() == query for item in ownership)
    return registered and owned


def validate_article_claims(article: dict[str, Any], sources: list[dict[str, Any]]) -> dict[str, Any]:
    source_by_id = _source_index(sources)
    results: list[dict[str, Any]] = []
    blocked: list[str] = []
    source_refs = article.get("source_refs", [])
    if not isinstance(source_refs, list):
        blocked.append("INVALID_SOURCE_REFS")
        source_refs = []
    normalized_refs: list[str] = []
    for ref in source_refs:
        ref_id = ref.get("id") if isinstance(ref, dict) else ref
        source = source_by_id.get(str(ref_id)) if ref_id else None
        if not ref_id or not source:
            blocked.append("UNKNOWN_SOURCE_REF")
        else:
            normalized_refs.append(str(ref_id))
            if not _source_is_typed(source):
                blocked.append("INVALID_SOURCE_PROVENANCE" if _source_provenance(source) is None else "INVALID_SOURCE_TYPE")
    if _overlap_evidenced(article):
        blocked.append("REVIEW_CANNIBALIZATION")
    for claim in article.get("claims", []):
        if not isinstance(claim, dict):
            blocked.append("INVALID_CLAIM")
            continue
        claim_type = str(claim.get("type", "general")).lower()
        text = str(claim.get("text", ""))
        ref_id = claim.get("source_ref")
        source = source_by_id.get(str(ref_id)) if ref_id else None
        claim_result = {"claim": text, "source_ref": ref_id, "provenance": _provenance(source)}
        if not ref_id:
            reason = "UNSOURCED"
            if claim_type in {"testimonial", "customer_story"}:
                blocked.append("FABRICATED_TESTIMONIAL")
            elif claim_type in {"numeric", "statistic", "metric"}:
                blocked.append("UNSUPPORTED_NUMERIC_CLAIM")
        elif str(ref_id) not in normalized_refs:
            reason = "CLAIM_SOURCE_NOT_DECLARED"
        elif not source:
            reason = "UNKNOWN_SOURCE_REF"
        elif not _source_is_typed(source):
            reason = "INVALID_SOURCE_PROVENANCE" if _source_provenance(source) is None else "INVALID_SOURCE_TYPE"
        elif claim_type in {"testimonial", "customer_story"} and (claim.get("synthetic") is True or claim.get("fabricated") is True or source.get("provenance") != "first_party" or source.get("verified") is not True):
            reason = "FABRICATED_TESTIMONIAL"
        elif claim_type in {"numeric", "statistic", "metric"} and (source.get("provenance") == "competitor" or source.get("verified") is not True):
            reason = "UNSUPPORTED_NUMERIC_CLAIM"
        elif source.get("provenance") == "competitor":
            reason = "UNVERIFIED_GENERAL_CLAIM"
        elif source.get("verified") is not True:
            reason = "UNVERIFIED_GENERAL_CLAIM"
        else:
            reason = None
        if reason:
            blocked.append(reason)
            claim_result.update({"status": "BLOCKED", "reason": reason})
        else:
            assert source is not None
            provenance = _source_provenance(source)
            assert provenance is not None
            claim_result.update({"status": "SUPPORTED", "reason": f"VERIFIED_{provenance.upper()}"})
        results.append(claim_result)
        if source and not _source_is_typed(source):
            blocked.append("INVALID_SOURCE_PROVENANCE" if _source_provenance(source) is None else "INVALID_SOURCE_TYPE")
    return {"status": "BLOCKED" if blocked else "PASS", "blocked_reasons": list(dict.fromkeys(blocked)), "claim_results": results, "source_refs": list(dict.fromkeys(normalized_refs)), "provenance": {ref_id: _provenance(source_by_id[ref_id]) for ref_id in dict.fromkeys(normalized_refs) if ref_id in source_by_id}}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--article", required=True, type=Path)
    parser.add_argument("--claims", required=True, type=Path, help="JSON source and claim registry")
    args = parser.parse_args(argv)
    try:
        article = json.loads(args.article.read_text())
        registry = json.loads(args.claims.read_text())
        sources = registry if isinstance(registry, list) else registry.get("sources", [])
        result = validate_article_claims(article, sources)
    except (OSError, json.JSONDecodeError, TypeError, AttributeError) as exc:
        print(json.dumps({"status": "BLOCKED", "blocked_reasons": ["INPUT_ERROR", str(exc)]}))
        return 2
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
