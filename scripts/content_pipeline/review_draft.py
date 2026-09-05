#!/usr/bin/env python3
"""Review a draft without modifying it. Findings are named and fail closed."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

try:
    from ._validation import validate_draft
    from ._workflow import emit, json_sidecar, parse
except ImportError:
    from _validation import validate_draft
    from _workflow import emit, json_sidecar, parse

REQUIREMENTS = (
    "H1_QUESTION", "BYLINE", "DATELINE", "ANSWER_BLOCK", "QUESTION_H2S",
    "SELF_CONTAINED_SECTIONS", "EXTRACTABLE_SENTENCES", "ORIGINAL_DATA_PROVENANCE",
    "SOURCE_LINKS", "COMPARISON_TABLE", "FAQ_BLOCK", "SCHEMA", "SERVER_RENDERING", "NEXT_STEP",
)
BANNED = re.compile(r"\b(?:guarantee(?:s|d)?|double[sd]?|always|never|almost certainly|one real proof point outperforms)\b", re.I)


def _finding(code: str, message: str) -> dict[str, str]:
    return {"code": code, "message": message}


def review(path: Path) -> dict:
    validation = validate_draft(path)
    if not validation["valid"] and any(item["code"] == "MALFORMED_DRAFT" for item in validation["failures"]):
        findings = validation["failures"]
        return {"status": "BLOCKED", "draft": str(path), "draft_hash": hashlib.sha256(path.read_bytes()).hexdigest(), "findings": findings, "requirements": list(REQUIREMENTS), "validated": False, "full_readiness": False, "readiness": {"status": "BLOCKED", "blocked_reasons": ["MALFORMED_DRAFT"]}}
    data, body, _ = parse(path)
    findings = list(validation["failures"])
    h1 = re.findall(r"^# (.+)$", body, re.M)
    if not h1 or "?" not in h1[0]:
        findings.append(_finding("H1_QUESTION", "H1 must be a reader question"))
    if not data.get("author_id"):
        findings.append(_finding("BYLINE", "named author is required"))
    if not data.get("published_at") and not data.get("updated_at"):
        findings.append(_finding("DATELINE", "published and updated dates are required"))
    paragraphs = [paragraph.strip() for paragraph in body.split("\n\n") if paragraph.strip() and not paragraph.startswith(("#", "[", "|"))]
    if not any(40 <= len(re.findall(r"\b[\w'-]+\b", paragraph)) <= 60 for paragraph in paragraphs[:2]):
        findings.append(_finding("ANSWER_BLOCK", "direct answer must be 40 to 60 words before the preamble"))
    h2 = re.findall(r"^## (.+)$", body, re.M)
    if not h2 or not all("?" in heading for heading in h2):
        findings.append(_finding("QUESTION_H2S", "H2 headings must be questions"))
    if len(h2) < 2:
        findings.append(_finding("SELF_CONTAINED_SECTIONS", "at least two self-contained sections are required"))
    if len(paragraphs) < 3:
        findings.append(_finding("EXTRACTABLE_SENTENCES", "article needs extractable explanatory sentences"))
    refs = data.get("source_refs") or []
    sidecar = validation.get("sidecar", {})
    if refs and not sidecar.get("provenance"):
        findings.append(_finding("ORIGINAL_DATA_PROVENANCE", "source refs require provenance records"))
    if not re.search(r"\[[^]]+\]\(https?://[^)]+\)", body):
        findings.append(_finding("SOURCE_LINKS", "at least one primary source link is required"))
    if "comparison" in str(data.get("post_type", "")) and "|" not in body:
        findings.append(_finding("COMPARISON_TABLE", "comparison posts require a table"))
    if not re.search(r"^###?\s+.+\?", body, re.M):
        findings.append(_finding("FAQ_BLOCK", "visible FAQ questions are required"))
    lower_body = body.lower()
    for item in ("article", "organization", "person"):
        if item not in lower_body:
            findings.append(_finding("SCHEMA", f"{item} schema declaration is missing"))
    if "<script" in lower_body or "style=" in lower_body:
        findings.append(_finding("SERVER_RENDERING", "draft contains client-only or inline presentation markup"))
    if data.get("content_lane") == "acquisition" and not re.search(r"\(/audit\)", body):
        findings.append(_finding("NEXT_STEP", "acquisition articles require one /audit CTA"))
    if "—" in body:
        findings.append(_finding("NO_EM_DASH", "content rule failed"))
    if BANNED.search(body):
        findings.append(_finding("NO_BANNED_CLAIMS", "content rule failed"))
    if re.search(r"(?:^|\n)#?\s*(?:navigation|footer)\s*$", body, re.I):
        findings.append(_finding("NO_DUPLICATE_NAV", "content rule failed"))
    if "style=" in body:
        findings.append(_finding("NO_INLINE_STYLES", "content rule failed"))
    readiness = validation.get("readiness", {})
    readiness_blocked = readiness.get("status") != "PASS" or readiness.get("blocked_reasons") or readiness.get("timing_gate") == "BLOCKED"
    if readiness_blocked:
        findings.extend(_finding(reason, "full publish-readiness validation failed") for reason in readiness.get("blocked_reasons", ["READINESS_BLOCKED"]))
    unique = {(item["code"], item["message"]): item for item in findings}
    full_readiness = not readiness_blocked
    return {
        "status": "PASS" if not unique and full_readiness else "BLOCKED",
        "draft": str(path),
        "draft_hash": hashlib.sha256(path.read_bytes()).hexdigest(),
        "findings": list(unique.values()),
        "requirements": list(REQUIREMENTS),
        "validated": not unique and full_readiness,
        "full_readiness": full_readiness and not unique,
        "readiness": readiness,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--draft", required=True, type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(argv)
    try:
        result = review(args.draft)
        if args.output:
            args.output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        emit(result)
        return 0 if result["status"] == "PASS" else 1
    except (OSError, UnicodeError, ValueError, TypeError, json.JSONDecodeError) as exc:
        emit({"status": "BLOCKED", "findings": [_finding("INPUT_ERROR", str(exc))]})
        return 2


if __name__ == "__main__":
    sys.exit(main())
