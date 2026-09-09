#!/usr/bin/env python3
"""Collect strictly typed local evidence and build a report-only queue."""
from __future__ import annotations
import argparse, fnmatch, json, math, sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
SOURCE_SPECS = {
    "site_audit": ("first_party", ("seo-reports/site-audit-*.json",)),
    "gsc": ("primary_external", ("agency-audit-2026-08-03/gsc-*.json",)),
    "ga4": ("first_party", ("agency-audit-2026-08-03/ga4-*.json",)),
    "bing": ("first_party", ("seo-reports/bing-crawl-*.json",)),
    "posthog": ("first_party", ("agency-audit-2026-08-03/posthog-*.json",)),
    "keyword": ("first_party", ("memory/sites/nebulacomponents.com/keywords.json", "memory/sites/nebulacomponents.com/task-5-keywords.json",)),
    "competitor_serp": ("competitor", ("seo-reports/competitor-serp-*.json",)),
}
REQUIRED = tuple(SOURCE_SPECS)

def _url(value: Any) -> bool:
    if not isinstance(value, str): return False
    p = urlparse(value)
    return p.scheme in {"http", "https"} and bool(p.netloc)

def _number(value: Any, *, integer: bool = False) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and (not integer or isinstance(value, int)) and value >= 0

def _strings(values: Any) -> bool:
    return isinstance(values, list) and bool(values) and all(isinstance(x, str) and x.strip() for x in values)

def _site_audit(e: dict[str, Any]) -> bool:
    keys = ("broken", "redirect_chains", "orphan_pages")
    legacy_findings = isinstance(e.get("findings"), list) and bool(e["findings"]) and all(isinstance(x, dict) and isinstance(x.get("id"), str) and _url(x.get("url")) for x in e["findings"])
    def _valid_item(x: Any) -> bool:
        # Items may be URL strings (current cron format) or dicts with a url key (legacy format)
        if isinstance(x, str):
            return _url(x)
        return isinstance(x, dict) and bool(x)
    return (legacy_findings or (_url(e.get("site")) and isinstance(e.get("generated_at"), str) and _number(e.get("total_pages"), integer=True)
            and all(isinstance(e.get(k), list) and all(_valid_item(x) for x in e[k]) for k in keys)
            and isinstance(e.get("summary"), dict) and all(e["summary"].get({"broken":"broken_count", "redirect_chains":"redirect_chain_count", "orphan_pages":"orphan_count"}[k]) == len(e[k]) for k in keys)))

def _gsc(e: dict[str, Any]) -> bool:
    return (e.get("property") == "sc-domain:nebulacomponents.com" and isinstance(e.get("date_range"), dict)
            and all(isinstance(e["date_range"].get(k), str) and e["date_range"][k].strip() for k in ("start", "end"))
            and isinstance(e.get("rows"), list) and bool(e["rows"])
            and all(isinstance(r, dict) and isinstance(r.get("query"), str) and r["query"].strip() and _url(r.get("page"))
                    and all(_number(r.get(k)) for k in ("impressions", "clicks", "position"))
                    and r["clicks"] <= r["impressions"] for r in e["rows"]))

def _ga4(e: dict[str, Any]) -> bool:
    required = {"sessions", "users", "pageviews", "avg_daily_sessions"}
    daily = e.get("daily_data")
    return (e.get("property") == "544419051" and e.get("report") == "organic_traffic"
            and isinstance(e.get("date_range"), dict) and all(isinstance(e["date_range"].get(k), str) and e["date_range"][k].strip() for k in ("start", "end"))
            and isinstance(e.get("totals"), dict) and set(e["totals"]) == required and all(_number(e["totals"].get(k)) for k in required)
            and isinstance(daily, list) and bool(daily) and all(isinstance(r, dict) and isinstance(r.get("date"), str) and len(r["date"]) == 8
                and all(_number(r.get(k)) for k in ("sessions", "users", "pageviews", "bounce_rate", "avg_session_duration", "engagement_rate"))
                and r["bounce_rate"] <= 100 and r["engagement_rate"] <= 100 for r in daily)
            and e["totals"]["sessions"] == sum(r["sessions"] for r in daily)
            and e["totals"]["users"] >= max(r["users"] for r in daily))

def _bing(e: dict[str, Any]) -> bool:
    rows = e.get("data", {}).get("d") if isinstance(e.get("data"), dict) else None
    required = ("CrawlErrors", "CrawledPages", "Code2xx", "Code4xx", "Code5xx")
    return (e.get("site_url") == "https://nebulacomponents.com" and isinstance(rows, list) and bool(rows)
            and all(isinstance(r, dict) and all(_number(r.get(k), integer=True) for k in required) for r in rows)
            and all(r["Code2xx"] + r["Code4xx"] + r["Code5xx"] <= r["CrawledPages"] + r["CrawlErrors"] for r in rows)
            and any(r["CrawledPages"] > 0 or r["CrawlErrors"] > 0 for r in rows))

def _posthog(e: dict[str, Any]) -> bool:
    query, results = e.get("query"), e.get("results")
    series = query.get("series") if isinstance(query, dict) else None
    return (isinstance(query, dict) and query.get("kind") == "FunnelsQuery" and isinstance(query.get("dateRange"), dict)
            and isinstance(series, list) and bool(series)
            and all(isinstance(s, dict) and s.get("kind") == "EventsNode" and s.get("event") in {"audit_submitted", "audit_email_submitted", "audit_results_unlocked"} for s in series)
            and isinstance(results, list) and len(results) == len(series)
            and all(isinstance(r, dict) and isinstance(r.get("action_id"), str) and r["action_id"].strip()
                    and isinstance(r.get("name"), str) and r["name"] == r["action_id"] and _number(r.get("count")) and r.get("type") == "events" for r in results))

def _keyword(e: dict[str, Any]) -> bool:
    return (e.get("site") == "nebulacomponents.com" and isinstance(e.get("artifact_id"), str) and e["artifact_id"].startswith("keywords-")
            and isinstance(e.get("primary_keywords"), dict) and isinstance(e.get("secondary_keywords"), dict)
            and all(k in e["primary_keywords"] for k in ("high_intent", "problem_aware", "solution_aware"))
            and all(_strings(v) for v in e["primary_keywords"].values())
            and all(_strings(v) for v in e["secondary_keywords"].values())
            and _strings(e.get("negative_keywords")) and _strings(e.get("ai_visibility_queries")))

def _competitor(e: dict[str, Any]) -> bool:
    rows = e.get("rankings")
    return (isinstance(e.get("retrieved_at"), str) and isinstance(rows, list) and bool(rows) and all(isinstance(r, dict) and isinstance(r.get("query"), str) and r["query"].strip()
        and isinstance(r.get("domain"), str) and r["domain"].strip() and _number(r.get("position"), integer=True) and r["position"] > 0 for r in rows))

EVIDENCE_VALIDATORS = {"site_audit": _site_audit, "gsc": _gsc, "ga4": _ga4, "bing": _bing, "posthog": _posthog, "keyword": _keyword, "competitor_serp": _competitor}

class PrimaryExternalAdapter:
    source_class = "primary_external"
    def __init__(self, name: str):
        if name not in SOURCE_SPECS or SOURCE_SPECS[name][0] != "primary_external": raise ValueError("not a primary-external source")
        self.name = name
    def matches(self, filename: str) -> bool:
        return any(_relative_pattern_matches(filename, pattern) for pattern in SOURCE_SPECS[self.name][1])

def _read(path: Path) -> Any:
    try: return json.loads(path.read_text())
    except (OSError, UnicodeError, ValueError): return None

def _files(root: Path, patterns: tuple[str, ...], cutoff: datetime | None) -> list[Path]:
    found = {}
    for pattern in patterns:
        for path in root.glob(pattern):
            if path.is_file() and (cutoff is None or datetime.fromtimestamp(path.stat().st_mtime, timezone.utc) >= cutoff): found[str(path)] = path
    return sorted(found.values(), key=str)

def _record(path: Path, source_class: str, data: Any) -> dict[str, Any]:
    payload = data if isinstance(data, dict) else {}
    url = next((x for x in (payload.get("url"), payload.get("site"), payload.get("source_url")) if _url(x)), None)
    if source_class == "competitor" and not url and _url("https://" + str(payload.get("domain", ""))): url = "https://" + str(payload["domain"])
    retrieved = datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat()
    source_type = next((n for n in SOURCE_SPECS if _canonical_path(path.resolve(), n)), path.stem.split("-")[0])
    evidence = dict(payload) if payload else None
    if evidence is not None:
        evidence.setdefault("artifact_id", f"keywords-{path.stem}" if source_type == "keyword" else path.stem)
        evidence.setdefault("retrieved_at", retrieved)
    return {"id": str(payload.get("id") or payload.get("source_id") or path.stem), "source_type": source_type, "url": url, "path": str(path), "data": data,
            "provenance": {"source_class": source_class, "method": "local_file", "retrieved_at": retrieved}, "evidence": evidence, "retrieved_at": retrieved}

def _provenance(record):
    p = record.get("provenance"); return p if isinstance(p, str) else p.get("source_class") if isinstance(p, dict) else None

def _relative_pattern_matches(relative: str, pattern: str) -> bool:
    """Match an exact repository directory plus a filename glob.

    ``Path.match`` treats a pattern without a directory as basename-only,
    allowing a canonical-looking file at any nesting depth.  Source patterns
    are intentionally split so the directory is always an exact match.
    """
    candidate = Path(relative).as_posix()
    if Path(relative).is_absolute() or any(part in {"", ".", ".."} for part in candidate.split("/")):
        return False
    parent, filename = candidate.rsplit("/", 1) if "/" in candidate else ("", candidate)
    expected_parent, expected_filename = pattern.rsplit("/", 1) if "/" in pattern else ("", pattern)
    return parent == expected_parent and fnmatch.fnmatchcase(filename, expected_filename)


def _canonical_path(path: Path, name: str) -> bool:
    try:
        relative = path.resolve().relative_to(REPOSITORY_ROOT).as_posix()
    except (OSError, ValueError):
        return False
    return any(_relative_pattern_matches(relative, pattern) for pattern in SOURCE_SPECS[name][1])

def _artifact_identity(name: str, artifact: Any) -> tuple[Any, ...] | None:
    if not isinstance(artifact, dict):
        return None
    if name == "site_audit":
        values = (artifact.get("site"), artifact.get("generated_at"), artifact.get("total_pages"))
    elif name == "gsc":
        values = (artifact.get("property"), tuple(sorted((artifact.get("date_range") or {}).items())))
    elif name == "ga4":
        values = (artifact.get("property"), artifact.get("report"), tuple(sorted((artifact.get("date_range") or {}).items())))
    elif name == "bing":
        values = (artifact.get("site_url"),)
    elif name == "posthog":
        query = artifact.get("query")
        if not isinstance(query, dict): return None
        values = (query.get("kind"), tuple(sorted(s.get("event") for s in query.get("series", []) if isinstance(s, dict))))
    elif name == "keyword":
        values = (artifact.get("site"),)
    elif name == "competitor_serp":
        values = (artifact.get("retrieved_at"), tuple(sorted((r.get("query"), r.get("domain"), r.get("position")) for r in artifact.get("rankings", []) if isinstance(r, dict))))
    else:
        return None
    return values if all(value not in (None, "", (), {}) for value in values) else None

def _same_artifact_content(name: str, evidence: dict[str, Any], artifact: Any) -> bool:
    if not isinstance(artifact, dict) or not isinstance(evidence, dict):
        return False
    # Evidence is accepted only when it is the parsed canonical artifact, not a caller-shaped copy.
    expected = dict(artifact)
    for key in ("artifact_id", "retrieved_at"):
        expected.pop(key, None)
    actual = dict(evidence)
    for key in ("artifact_id", "retrieved_at"):
        actual.pop(key, None)
    return actual == expected and _artifact_identity(name, artifact) is not None

def _valid_record(record, name, expected):
    if not isinstance(record, dict) or not isinstance(record.get("id"), str) or not record["id"].strip(): return "missing_id"
    if not _url(record.get("url")): return "invalid_url"
    if _provenance(record) != expected: return "invalid_provenance"
    if record.get("source_type") != name: return "invalid_source_type"
    path = record.get("path")
    if not isinstance(path, str) or not path or not Path(path).is_absolute(): return "missing_canonical_artifact"
    try:
        artifact = Path(path).resolve()
        artifact.relative_to(REPOSITORY_ROOT)
    except (OSError, ValueError): return "invalid_canonical_artifact"
    if not artifact.is_file(): return "missing_canonical_artifact"
    if not _canonical_path(artifact, name): return "noncanonical_artifact_path"
    canonical = _read(artifact)
    if not isinstance(canonical, dict) or not EVIDENCE_VALIDATORS[name](canonical): return "invalid_canonical_artifact"
    try:
        datetime.fromisoformat(str(record.get("retrieved_at")))
    except (TypeError, ValueError): return "missing_retrieval_metadata"
    evidence = record.get("evidence")
    if not isinstance(evidence, dict) or not EVIDENCE_VALIDATORS[name](evidence): return "invalid_evidence_schema"
    if not _same_artifact_content(name, evidence, canonical): return "evidence_artifact_mismatch"
    return None

def validate_source_bundle(sources):
    errors, checked = [], {}
    for record in sources.get("__unknown_typed__", []) + sources.get("__untyped__", []):
        errors.append("SOURCE_ERROR_UNKNOWN_SOURCE_TYPE" if isinstance(record.get("source_type"), str) else "SOURCE_ERROR_UNTYPED_RECORD")
    for name, (expected, _) in SOURCE_SPECS.items():
        checked[name] = []; rows = sources.get(name)
        if not isinstance(rows, list) or not rows: errors.append(f"SOURCE_ERROR_{name.upper()}:missing"); continue
        for record in rows:
            reason = _valid_record(record, name, expected)
            if reason: errors.append(f"SOURCE_ERROR_{name.upper()}:{reason}")
            else:
                record.setdefault("source_type", name)
                checked[name].append(record)
        if not checked[name]: errors.append(f"SOURCE_ERROR_{name.upper()}:no_valid_records")
    return {"valid": not errors, "errors": errors, "sources": checked}

def _terms(name, evidence):
    if name == "keyword": return {x.strip() for v in evidence.get("primary_keywords", {}).values() for x in v}
    if name == "gsc": return {r["query"].strip() for r in evidence.get("rows", [])}
    return set()

def classify_opportunity(item):
    text, role = str(item.get("keyword", "")).lower(), str(item.get("commercial_role", "")).lower()
    acquisition = role in {"audit", "conversion", "commercial"} or any(x in text for x in ("audit", "conversion", "traffic", "sales"))
    out = dict(item); out["lane"] = "acquisition" if acquisition else "feature"; out.setdefault("commercial_role", "audit" if acquisition else "trust"); out.setdefault("post_type", "problem_guide" if acquisition else "field_note"); return out

def score_opportunity(item):
    """Derive a score only from source records that pass their own validators."""
    if not isinstance(item, dict) or not isinstance(item.get("source_records"), list) or not item["source_records"]:
        raise ValueError("score requires validated source records")
    keyword = str(item.get("keyword", "")).strip().lower()
    if not keyword: raise ValueError("score requires keyword")
    valid = []
    for record in item["source_records"]:
        source_type = record.get("source_type") if isinstance(record, dict) else None
        if source_type not in EVIDENCE_VALIDATORS or _valid_record(record, source_type, SOURCE_SPECS[source_type][0]):
            raise ValueError("score requires source-validated records")
        if keyword in _terms(source_type, record["evidence"]): valid.append(record)
    if not valid: raise ValueError("score keyword is unsupported by evidence")
    lane = "acquisition" if any(x in keyword for x in ("audit", "conversion", "traffic", "sales")) else "feature"
    ids = sorted(r["id"] for r in valid)
    trigger = 20 if any(r.get("source_type") in {"gsc", "site_audit"} for r in valid) else 8
    evidence = min(20, len(valid) * 4)
    intent = 20 if lane == "acquisition" else 12
    commercial = 20 if lane == "acquisition" else 8
    timing = 20 if any(r.get("source_type") == "gsc" and any(_number(row.get("impressions")) and (row["impressions"] > 0 or row.get("clicks", 0) > 0) for row in r["evidence"].get("rows", [])) for r in valid) else 0
    factors = {"trigger_fit": trigger, "evidence_strength": evidence, "intent_ownership": intent, "commercial_role": commercial, "timing_eligibility": timing}
    metrics = {
        "trigger_fit": "source_type in validated GSC/site-audit records",
        "evidence_strength": f"{len(valid)} validated supporting record(s)",
        "intent_ownership": f"lane derived from keyword intent: {lane}",
        "commercial_role": f"commercial role derived from lane: {'audit' if lane == 'acquisition' else 'trust'}",
        "timing_eligibility": "GSC row has positive impressions or clicks" if timing else "no eligible GSC timing signal",
    }
    explanation = {k: f"{k}={v}/20, {metrics[k]}, evidence IDs: {', '.join(ids)}" for k, v in factors.items()}
    return {"factors": factors, "total": sum(factors.values()), "evidence_ids": ids, "explanation": explanation}

def build_opportunities(sources):
    terms = {t for n, rows in sources.items() if n != "competitor_serp" for r in rows for t in _terms(n, r["evidence"])}; result = []
    for i, keyword in enumerate(sorted(terms), 1):
        supporting = [r for n, rows in sources.items() if n != "competitor_serp" for r in rows if keyword in _terms(n, r["evidence"])]
        first = [r for r in supporting if _provenance(r) == "first_party"]; external = [r for r in supporting if _provenance(r) == "primary_external"]
        def signal(r): return any(_number(x.get("impressions")) and (x.get("impressions") > 0 or x.get("clicks", 0) > 0) for x in r["evidence"].get("rows", []))
        eligible = bool(first or external) and any(signal(r) for r in supporting)
        item = classify_opportunity({"id": f"opp_{i:04d}", "keyword": keyword, "first_party_sources": [r["url"] for r in first], "primary_external_sources": [r["url"] for r in external], "competitor_sources": [r["url"] for r in sources.get("competitor_serp", [])], "source_records": supporting + sources.get("competitor_serp", []), "sources": [r["url"] for r in supporting], "timing_eligible": eligible})
        item["score"] = score_opportunity(item); result.append(item)
    return sorted(result, key=lambda x: (-x["score"]["total"], x["id"]))

def collect_sources(root=REPOSITORY_ROOT, days=7, today=None):
    root = Path(root).resolve()
    try: root.relative_to(REPOSITORY_ROOT)
    except ValueError: raise ValueError("collector root must be inside repository")
    if days < 0: raise ValueError("days must be non-negative")
    end = date.fromisoformat(today) if today else date.today(); cutoff = datetime.combine(end - timedelta(days=days), datetime.min.time(), timezone.utc)
    sources, missing = {}, []
    for name, (kind, patterns) in SOURCE_SPECS.items():
        rows = [_record(p, kind, _read(p)) for p in _files(root, patterns, None if name == "keyword" else cutoff)]
        sources[name] = [r for r in rows if r["data"] is not None]
        if not sources[name]: missing.append(name)
    checked = validate_source_bundle(sources); result = {"generated_at": datetime.now(timezone.utc).isoformat(), "window_days": days, "sources": sources, "missing_sources": missing, "source_errors": checked["errors"], "ready": not missing and checked["valid"], "opportunities": []}
    if result["ready"]: result["opportunities"] = build_opportunities(checked["sources"])
    return result

def main():
    p = argparse.ArgumentParser(); p.add_argument("--days", type=int, default=7); p.add_argument("--root", type=Path, default=REPOSITORY_ROOT); p.add_argument("--report-only", action="store_true"); a = p.parse_args()
    try: print(json.dumps(collect_sources(a.root, a.days), indent=2, sort_keys=True)); return 0
    except (OSError, ValueError) as e: print(f"error: {e}", file=sys.stderr); return 2
if __name__ == "__main__": raise SystemExit(main())
