"""Produce rollback-safe JSON and Markdown publish-readiness reports."""
from __future__ import annotations

import argparse
import base64
import json
import os
import tempfile
from pathlib import Path
from typing import Any

try:
    from .score_opportunities import score_opportunity
    from .validate_claims import validate_article_claims
except ImportError:
    from score_opportunities import score_opportunity
    from validate_claims import validate_article_claims


def _atomic_write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_name, path)
        _fsync_directory(path.parent)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def _fsync_directory(directory: Path) -> None:
    fd = os.open(directory, os.O_RDONLY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def atomic_write_report(path: Path, payload: dict[str, Any]) -> None:
    _atomic_write_text(path, json.dumps(payload, indent=2, sort_keys=True) + "\n")


def _markdown(report: dict[str, Any]) -> str:
    lines = [f"# Publish readiness: {report['status']}", "", f"- Status: `{report['status']}`", f"- Canonical URL: {report.get('canonical_url', '')}", f"- Timing gate: `{report.get('timing_gate', 'BLOCKED')}`", f"- Blocked reasons: {', '.join(report.get('blocked_reasons', [])) or 'none'}", "", "## Source references", ""]
    lines += [f"- `{ref}`: {json.dumps(report.get('provenance', {}).get(ref, {}), sort_keys=True)}" for ref in report.get("source_refs", [])] or ["- none"]
    lines += ["", "## Claim results", ""]
    lines += [f"- `{x['status']}`: {x['claim']} | reason: `{x.get('reason', '')}` | source_ref: `{x.get('source_ref', '')}` | provenance: {json.dumps(x.get('provenance', {}), sort_keys=True)}" for x in report.get("claim_results", [])] or ["- none"]
    lines += ["", "## Complete report fields", "", "```json", json.dumps(report, indent=2, sort_keys=True), "```"]
    return "\n".join(lines) + "\n"


def build_readiness_report(article: dict[str, Any], sources: list[dict[str, Any]], opportunity: dict[str, Any] | None = None) -> dict[str, Any]:
    claims = validate_article_claims(article, sources)
    opportunity = opportunity or {"impressions": 0, "days": 0}
    opportunity_result = score_opportunity(opportunity)
    blocked = list(claims["blocked_reasons"])
    opportunity_gate_reasons = {"SOURCE_ERROR_KEYWORD_REGISTRY", "SOURCE_ERROR_AUDIT_FINDINGS", "SOURCE_ERROR_FIRST_PARTY_EXPORTS", "SOURCE_ERROR_COMPETITOR_SERP_REPORTS", "SOURCE_ERROR_FIRST_PARTY_PROVENANCE", "SOURCE_ERROR_COMPETITOR_SERP_PROVENANCE", "INSUFFICIENT_IMPRESSIONS", "28_DAY_PREREQUISITE", "LOW_EXPOSURE", "REVIEW_CANNIBALIZATION"}
    blocked.extend(reason for reason in opportunity_result.get("reasons", []) if reason in opportunity_gate_reasons)
    if int(opportunity.get("days", 0)) >= 28:
        if opportunity.get("source_lineage_complete") is not True:
            blocked.append("INCOMPLETE_SOURCE_LINEAGE")
        if opportunity.get("active_holdout") is not False:
            blocked.append("ACTIVE_HOLDOUT")
        if opportunity.get("suppressed") is not False:
            blocked.append("SUPPRESSED")
        if not isinstance(opportunity.get("indexable"), bool):
            blocked.append("MISSING_VERIFIED_INDEXABLE")
        elif opportunity.get("verified_indexable") is not True:
            blocked.append("UNVERIFIED_INDEXABLE")
        if not isinstance(opportunity.get("unresolved_cannibalization"), bool):
            blocked.append("MISSING_VERIFIED_UNRESOLVED_CANNIBALIZATION")
        elif opportunity.get("verified_unresolved_cannibalization") is not True:
            blocked.append("UNVERIFIED_UNRESOLVED_CANNIBALIZATION")
        if opportunity.get("unresolved_cannibalization") is True:
            blocked.append("REVIEW_CANNIBALIZATION")
        if opportunity.get("indexable") is False and opportunity.get("indexability_defect_verified") is not True:
            blocked.append("NOT_INDEXABLE")
    timing_reasons = {"INSUFFICIENT_IMPRESSIONS", "28_DAY_PREREQUISITE", "INCOMPLETE_SOURCE_LINEAGE", "ACTIVE_HOLDOUT", "SUPPRESSED", "REVIEW_CANNIBALIZATION", "LOW_EXPOSURE", "NOT_INDEXABLE", "MISSING_VERIFIED_INDEXABLE", "UNVERIFIED_INDEXABLE", "MISSING_VERIFIED_UNRESOLVED_CANNIBALIZATION", "UNVERIFIED_UNRESOLVED_CANNIBALIZATION"}
    timing_gate = "PASS" if not any(reason in timing_reasons for reason in blocked) else "BLOCKED"
    return {"status": "BLOCKED" if blocked else "PASS", "blocked_reasons": list(dict.fromkeys(blocked)), "claim_results": claims["claim_results"], "claim_reasons": [{"claim": item["claim"], "reason": item.get("reason")} for item in claims["claim_results"]], "timing_gate": timing_gate, "canonical_url": article.get("canonical_url", ""), "source_refs": claims["source_refs"], "provenance": claims["provenance"], "recommendation": opportunity_result["recommendation"], "opportunity": opportunity_result}


def _restore_file(target: Path, content: bytes | None) -> None:
    if content is None:
        target.unlink(missing_ok=True)
        return
    fd, name = tempfile.mkstemp(prefix=f".{target.name}.restore.", suffix=".tmp", dir=target.parent)
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(name, target)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def _transaction_path(path: Path) -> Path:
    return path.with_name(f".{path.name}.transaction.json")


def _recover_transaction(path: Path) -> None:
    journal = _transaction_path(path)
    if not journal.exists():
        return
    data = json.loads(journal.read_text(encoding="utf-8"))
    if data.get("phase") == "prepared":
        for name, encoded in data.get("old", {}).items():
            _restore_file(path.with_name(name), base64.b64decode(encoded) if encoded is not None else None)
        _fsync_directory(path.parent)
    journal.unlink(missing_ok=True)
    _fsync_directory(path.parent)


def publish_reports(path: Path, payload: dict[str, Any]) -> None:
    path = Path(path)
    markdown_path = path.with_suffix(".md")
    path.parent.mkdir(parents=True, exist_ok=True)
    _recover_transaction(path)
    contents = ((path, json.dumps(payload, indent=2, sort_keys=True) + "\n"), (markdown_path, _markdown(payload)))
    old = {target: target.read_bytes() if target.exists() else None for target, _ in contents}
    journal = _transaction_path(path)
    journal_payload = {"phase": "prepared", "old": {target.name: base64.b64encode(value).decode("ascii") if value is not None else None for target, value in old.items()}}
    temp_paths: list[Path] = []
    try:
        _atomic_write_text(journal, json.dumps(journal_payload, sort_keys=True) + "\n")
        for target, content in contents:
            fd, name = tempfile.mkstemp(prefix=f".{target.name}.", suffix=".tmp", dir=path.parent)
            temp = Path(name)
            temp_paths.append(temp)
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                handle.write(content)
                handle.flush()
                os.fsync(handle.fileno())
        for temp, (target, _) in zip(temp_paths, contents):
            os.replace(temp, target)
        _fsync_directory(path.parent)
        _atomic_write_text(journal, json.dumps({"phase": "committed"}, sort_keys=True) + "\n")
        journal.unlink(missing_ok=True)
        _fsync_directory(path.parent)
    except Exception:
        for target, content in old.items():
            _restore_file(target, content)
        journal.unlink(missing_ok=True)
        _fsync_directory(path.parent)
        raise
    finally:
        for temp in temp_paths:
            temp.unlink(missing_ok=True)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--article", required=True, type=Path)
    parser.add_argument("--sources", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--opportunity", type=Path)
    args = parser.parse_args(argv)
    try:
        article = json.loads(args.article.read_text())
        source_data = json.loads(args.sources.read_text())
        sources = source_data if isinstance(source_data, list) else source_data.get("sources", [])
        opportunity = json.loads(args.opportunity.read_text()) if args.opportunity else None
        report = build_readiness_report(article, sources, opportunity)
        publish_reports(args.output, report)
    except (OSError, json.JSONDecodeError, TypeError, AttributeError, ValueError) as exc:
        print(json.dumps({"status": "BLOCKED", "blocked_reasons": ["INPUT_ERROR", str(exc)]}))
        return 2
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
