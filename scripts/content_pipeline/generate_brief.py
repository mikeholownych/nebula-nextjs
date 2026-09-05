#!/usr/bin/env python3
"""Generate validated local briefs without mutating content or analytics."""
from __future__ import annotations
import argparse, json, sys
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
try:
    from scripts.content_pipeline.collect_sources import EVIDENCE_VALIDATORS, SOURCE_SPECS, _provenance, _valid_record, score_opportunity
except ModuleNotFoundError:
    from collect_sources import EVIDENCE_VALIDATORS, SOURCE_SPECS, _provenance, _valid_record, score_opportunity

PROTECTED = {"article.md", "analytics.json", "analytics.csv"}
FACTOR_KEYS = {"trigger_fit", "evidence_strength", "intent_ownership", "commercial_role", "timing_eligibility"}
PROVENANCE = {"first_party", "primary_external", "competitor"}

def _record_terms(record):
    e = record.get("evidence", {}) if isinstance(record, dict) else {}; terms = set()
    if isinstance(e, dict):
        if isinstance(e.get("query"), str): terms.add(e["query"].strip().lower())
        if isinstance(e.get("primary_keywords"), dict): terms |= {x.strip().lower() for v in e["primary_keywords"].values() if isinstance(v, list) for x in v if isinstance(x, str) and x.strip()}
        terms |= {r["query"].strip().lower() for r in e.get("rows", []) if isinstance(r, dict) and isinstance(r.get("query"), str) and r["query"].strip()}
    return terms

def _valid_evidence(record):
    e = record.get("evidence") if isinstance(record, dict) else None
    source_type = record.get("source_type") if isinstance(record, dict) else None
    if not isinstance(e, dict) or source_type not in EVIDENCE_VALIDATORS: return False
    return not _valid_record(record, source_type, SOURCE_SPECS[source_type][0])

def validate_opportunity(opportunity: Any) -> dict[str, Any]:
    errors = []
    if not isinstance(opportunity, dict): return {"valid": False, "errors": ["opportunity_not_object"]}
    for key in ("id", "keyword", "lane", "score", "timing_eligible"):
        if not opportunity.get(key): errors.append(f"missing_{key}")
    arrays = {k: opportunity.get(k) for k in ("first_party_sources", "primary_external_sources", "competitor_sources")}
    errors += [f"invalid_{k}" for k,v in arrays.items() if not isinstance(v, list)]
    records = opportunity.get("source_records")
    if not isinstance(records, list) or not records: errors.append("missing_source_records")
    record_urls = {}
    if isinstance(records, list):
        for row in records:
            p = urlparse(row.get("url", "")) if isinstance(row, dict) else None
            source_type = row.get("source_type") if isinstance(row, dict) else None
            provenance = _provenance(row) if isinstance(row, dict) else None
            valid = (isinstance(row, dict) and source_type in EVIDENCE_VALIDATORS and provenance in PROVENANCE
                     and p and p.scheme in {"http", "https"} and p.netloc
                     and not _valid_record(row, source_type, SOURCE_SPECS[source_type][0]))
            if not valid: errors.append("invalid_source_records")
            else: record_urls[row["url"]] = provenance
    for field, kind in (("first_party_sources", "first_party"), ("primary_external_sources", "primary_external"), ("competitor_sources", "competitor")):
        if isinstance(arrays[field], list) and any(record_urls.get(url) != kind for url in arrays[field]): errors.append(f"{field}_mismatch")
    keyword = str(opportunity.get("keyword", "")).strip().lower()
    relevant = [r for r in records or [] if isinstance(r, dict) and keyword in _record_terms(r)]
    if not relevant: errors.append("keyword_not_supported_by_evidence")
    if relevant and all(r.get("provenance") == "competitor" for r in relevant): errors.append("competitor_only_evidence")
    score = opportunity.get("score")
    derived = None
    try:
        derived = score_opportunity({"keyword": opportunity.get("keyword"), "source_records": [r for r in records or [] if isinstance(r, dict) and _valid_evidence(r)]})
    except (TypeError, ValueError, KeyError):
        errors.append("score_not_derived")
    if not isinstance(score, dict) or set(score.get("factors", {})) != FACTOR_KEYS: errors.append("invalid_score_factors")
    else:
        factors = score["factors"]
        if any(type(v) is not int or not 0 <= v <= 20 for v in factors.values()): errors.append("score_factor_out_of_range")
        if type(score.get("total")) is not int or score["total"] != sum(factors.values()): errors.append("score_total_mismatch")
        if not isinstance(derived, dict) or score.get("factors") != derived["factors"] or score.get("total") != derived["total"] or score.get("evidence_ids") != derived["evidence_ids"]: errors.append("score_not_derived")
        if not isinstance(score.get("explanation"), dict) or not all(isinstance(v, str) and "evidence IDs:" in v and ":" in v for v in score["explanation"].values()): errors.append("score_not_derived")
    if isinstance(derived, dict) and opportunity.get("timing_eligible") is not (derived["factors"]["timing_eligibility"] == 20): errors.append("timing_not_derived")
    return {"valid": not errors, "errors": sorted(set(errors))}

def repository_path(root, candidate, *, must_exist=False):
    root = root.resolve()
    try: resolved = candidate.resolve(strict=must_exist); resolved.relative_to(root); return resolved
    except (OSError, RuntimeError, ValueError): return None

def safe_output_path(root, name):
    if not name or Path(name).name != name or Path(name).suffix.lower() != ".json" or Path(name).stem in {Path(x).stem for x in PROTECTED}: return None
    reports = (root / "reports" / "content_pipeline").resolve(); reports.mkdir(parents=True, exist_ok=True)
    target = repository_path(reports, reports / name); return target if target and target.parent == reports else None

def generate_brief(opportunity):
    check = validate_opportunity(opportunity)
    if not check["valid"]: raise ValueError("invalid opportunity: " + ",".join(check["errors"]))
    keyword, lane = str(opportunity["keyword"]), opportunity["lane"]; question = keyword.rstrip("?").capitalize() + "?"
    return {"id": opportunity["id"], "lane": lane, "post_type": opportunity.get("post_type", "problem_guide" if lane == "acquisition" else "field_note"), "question_h1": question, "answer_target": f"Give a direct, evidence-backed answer to: {question}", "sections": ["Short answer", "What the evidence shows", "How to diagnose it", "Practical next step"], "sources": {"first_party_sources": opportunity["first_party_sources"], "primary_external_sources": opportunity["primary_external_sources"], "competitor_sources": opportunity["competitor_sources"], "records": opportunity["source_records"]}, "internal_links": ["/audit", "/learning-centre"], "cta": {"href": "/audit", "text": "Run the Nebula landing page audit"} if lane == "acquisition" else {"href": "/", "text": "See how Nebula is built"}, "timing_gate": {"status": "ELIGIBLE", "rule": "Validated evidence timing gate. Report only. No publication or article edit is performed."}}

def main():
    p = argparse.ArgumentParser(); p.add_argument("--opportunity", required=True); p.add_argument("--input", type=Path, default=Path("content-ledger/opportunities.jsonl")); p.add_argument("--output"); a = p.parse_args(); root = Path(__file__).resolve().parents[2]
    try:
        inp = repository_path(root, a.input, must_exist=True)
        if inp is None: raise ValueError("input path is outside repository")
        match = next((json.loads(line) for line in inp.read_text().splitlines() if line.strip() and isinstance(json.loads(line), dict) and json.loads(line).get("id") == a.opportunity), None)
        if match is None: raise ValueError(f"opportunity not found: {a.opportunity}")
        text = json.dumps(generate_brief(match), indent=2, sort_keys=True) + "\n"
        if a.output: target = safe_output_path(root, a.output); target.write_text(text) if target else (_ for _ in ()).throw(ValueError("unsafe output path"))
        else: print(text, end="")
        return 0
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError, TypeError) as exc: print(f"error: {exc}", file=sys.stderr); return 2
if __name__ == "__main__": raise SystemExit(main())
