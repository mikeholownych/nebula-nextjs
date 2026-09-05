#!/usr/bin/env python3
"""Create an immutable, provenance-carrying local draft."""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

try:
    from ._validation import _source_bundle
    from ._workflow import atomic, dump, emit, json_sidecar, now, revision_lock, sha256
    from .collect_sources import validate_source_bundle
    from .generate_brief import generate_brief, validate_opportunity
except ImportError:  # pragma: no cover
    from _validation import _source_bundle
    from _workflow import atomic, dump, emit, json_sidecar, now, revision_lock, sha256
    from collect_sources import validate_source_bundle
    from generate_brief import generate_brief, validate_opportunity

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def _load_brief(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("INVALID_BRIEF")
    required = ("id", "lane", "post_type", "question_h1", "sources", "timing_gate")
    if any(not data.get(key) for key in required):
        raise ValueError("INVALID_BRIEF")
    slug = _slug(data)
    records = data.get("sources", {}).get("records") if isinstance(data.get("sources"), dict) else None
    if not isinstance(records, list) or not records:
        raise ValueError("INVALID_SOURCE_BUNDLE:missing_source_records")
    malformed = [row for row in records if not isinstance(row, dict)]
    if malformed:
        raise ValueError("INVALID_SOURCE_BUNDLE:MALFORMED_SOURCE_RECORD")
    source_check = validate_source_bundle(_source_bundle(records))
    errors = list(source_check["errors"])
    if any(not isinstance(row, dict) or not isinstance(row.get("source_type"), str) for row in records):
        errors.append("SOURCE_ERROR_UNTYPED_RECORD")
    if errors:
        raise ValueError("INVALID_SOURCE_BUNDLE:" + ",".join(dict.fromkeys(errors)))
    if data.get("timing_gate", {}).get("status") != "ELIGIBLE":
        raise ValueError("BRIEF_NOT_VALIDATED")
    return data


def _slug(brief: dict[str, Any]) -> str:
    value = brief.get("slug")
    if value is None:
        value = re.sub(r"[^a-z0-9]+", "-", str(brief["question_h1"]).lower()).strip("-")
    if not isinstance(value, str) or not SLUG_PATTERN.fullmatch(value):
        raise ValueError("INVALID_SLUG")
    return value


def _next_revision(folder: Path) -> int:
    numbers = []
    for candidate in folder.glob("v*.md"):
        match = re.fullmatch(r"v(\d+)", candidate.stem)
        if match:
            numbers.append(int(match.group(1)))
    return max(numbers, default=0) + 1


def _body(brief: dict[str, Any]) -> str:
    records = brief["sources"]["records"]
    source_url = records[0]["url"]
    answer = " ".join(str(brief.get("answer_target", "")).split())
    answer += " This bounded answer uses only the declared evidence. It explains the observed problem, names the relevant context, and gives a practical next step without inventing a customer result, promising a conversion outcome, or treating a recommendation as approval or execution."
    cta = brief.get("cta", {})
    return (
        f"# {brief['question_h1']}\n\n{answer}\n\n"
        "## What should I check first?\n\nCheck the relevant page evidence, record the method, date, sample, and limitation, and make the smallest evidence-backed change.\n\n"
        "## What does the evidence show?\n\nThe declared sources support only the claims tied to their provenance and stated boundary. Read the [primary source]("
        f"{source_url}) before relying on the observation.\n\n"
        "## What should I do next?\n\nReview the evidence before acting. This is a recommendation, not an approval or execution.\n\n"
        "### What is the bounded answer?\n\nUse the stated evidence boundary and do not generalize beyond it.\n\n"
        "Schema declarations: Article, Organization, Person.\n\n"
        f"[{cta.get('text', 'Run the Nebula landing page audit')}]({cta.get('href', '/audit')})\n"
    )


def create_draft(brief_path: Path, output_root: Path) -> Path:
    brief = _load_brief(brief_path)
    slug = _slug(brief)
    root = output_root.resolve()
    folder = (root / slug).resolve()
    if folder.parent != root:
        raise ValueError("UNSAFE_DRAFT_PATH")
    with revision_lock(folder):
        revision = _next_revision(folder)
        path = folder / f"v{revision:03d}.md"
        records = brief["sources"]["records"]
        metadata = {
            "slug": slug, "status": "drafted", "content_lane": brief["lane"], "post_type": brief["post_type"],
            "author_id": "mike-holownych", "category": brief.get("category", "Editorial"),
            "purpose": "organic-discovery" if brief["lane"] == "acquisition" else "trust",
            "commercial_role": brief.get("commercial_role", "audit-entry"), "evidence_level": "first_party",
            "source_refs": [row["id"] for row in records], "published_at": None, "updated_at": now(),
            "reviewed_by": None, "canonical_url": f"https://nebulacomponents.com/blog/{slug}",
        }
        body = _body(brief)
        atomic(path, dump(metadata, body))
        sidecar = {
            "revision": revision, "draft_hash": sha256(path), "brief_path": str(brief_path.resolve()),
            "brief_id": brief["id"], "created_at": now(), "provenance": brief["sources"],
            "opportunity": brief.get("readiness_opportunity"),
            "article": {"canonical_url": metadata["canonical_url"], "source_refs": metadata["source_refs"], "claims": []},
            "parent_hash": None,
        }
        atomic(json_sidecar(path), json.dumps(sidecar, indent=2, sort_keys=True) + "\n")
    return path


def _find_opportunity(input_path: Path, opportunity_id: str) -> dict[str, Any]:
    for line in input_path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            item = json.loads(line)
            if isinstance(item, dict) and item.get("id") == opportunity_id:
                return item
    raise ValueError("OPPORTUNITY_NOT_FOUND")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--brief", type=Path)
    parser.add_argument("--opportunity")
    parser.add_argument("--input", type=Path, default=Path("content-ledger/opportunities.jsonl"))
    parser.add_argument("--output-root", type=Path, default=Path("content/drafts"))
    args = parser.parse_args(argv)
    try:
        brief_path = args.brief
        if brief_path is None and args.opportunity:
            opportunity = _find_opportunity(args.input, args.opportunity)
            check = validate_opportunity(opportunity)
            if not check["valid"]:
                raise ValueError("INVALID_OPPORTUNITY:" + ",".join(check["errors"]))
            brief_path = args.output_root.parent / "briefs" / f"{args.opportunity}.json"
            atomic(brief_path, json.dumps(generate_brief(opportunity), indent=2, sort_keys=True) + "\n")
        if brief_path is None:
            raise ValueError("BRIEF_OR_OPPORTUNITY_REQUIRED")
        print(create_draft(brief_path, args.output_root).resolve())
        return 0
    except (OSError, UnicodeError, ValueError, TypeError, json.JSONDecodeError) as exc:
        emit({"status": "BLOCKED", "reason": str(exc)})
        return 2


if __name__ == "__main__":
    sys.exit(main())
