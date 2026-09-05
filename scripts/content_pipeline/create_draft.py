#!/usr/bin/env python3
"""Create an immutable, provenance-carrying local draft from a validated brief."""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

try:
    from ._workflow import atomic, dump, emit, json_sidecar, now, sha256
    from .generate_brief import validate_opportunity
except ImportError:
    from _workflow import atomic, dump, emit, json_sidecar, now, sha256
    from generate_brief import validate_opportunity


SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def _load_brief(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("INVALID_BRIEF")
    required = ("id", "lane", "post_type", "question_h1", "sources")
    if any(not data.get(key) for key in required):
        raise ValueError("INVALID_BRIEF")
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
    revisions = []
    for candidate in folder.glob("v*.md"):
        match = re.fullmatch(r"v(\d+)", candidate.stem)
        if match:
            revisions.append(int(match.group(1)))
    revision = max(revisions, default=0) + 1
    while (folder / f"v{revision:03d}.md").exists():
        revision += 1
    return revision


def _body(brief: dict[str, Any]) -> str:
    source_rows = brief.get("sources", {}).get("records", [])
    source_url = "https://example.com/source"
    if source_rows and isinstance(source_rows[0], dict):
        source_url = source_rows[0].get("url", source_url)
    answer = " ".join(str(brief.get("answer_target", "")).split())
    answer += " This bounded answer uses only the declared evidence. It explains the observed problem, names the relevant context, and gives a practical next step without inventing a customer result, promising a conversion outcome, or treating a recommendation as approval or execution."
    cta = brief.get("cta", {})
    return (
        f"# {brief['question_h1']}\n\n{answer}\n\n"
        "## What should I check first?\n\n"
        "Check the relevant page evidence, record the method, date, sample, and limitation, and make the smallest evidence-backed change.\n\n"
        "## What does the evidence show?\n\n"
        f"The declared sources support only the claims tied to their provenance and stated boundary. Read the [primary source]({source_url}) before relying on the observation.\n\n"
        "## What should I do next?\n\nReview the evidence before acting. This is a recommendation, not an approval or execution.\n\n"
        "### What is the bounded answer?\n\nUse the stated evidence boundary and do not generalize beyond it.\n\n"
        "Schema declarations: Article, Organization, Person.\n\n"
        f"[{cta.get('text', 'Run the Nebula landing page audit')}]({cta.get('href', '/audit')})\n"
    )


def create_draft(brief_path: Path, output_root: Path) -> Path:
    brief = _load_brief(brief_path)
    slug = _slug(brief)
    output_root = output_root.resolve()
    folder = output_root / slug
    folder.mkdir(parents=True, exist_ok=True)
    revision = _next_revision(folder)
    path = folder / f"v{revision:03d}.md"
    records = brief.get("sources", {}).get("records", [])
    metadata = {
        "slug": slug,
        "status": "drafted",
        "content_lane": brief["lane"],
        "post_type": brief["post_type"],
        "author_id": "mike-holownych",
        "category": brief.get("category", "Editorial"),
        "purpose": "organic-discovery" if brief["lane"] == "acquisition" else "trust",
        "commercial_role": brief.get("commercial_role", "audit-entry" if brief["lane"] == "acquisition" else "assisted-conversion"),
        "evidence_level": "first_party",
        "source_refs": [row.get("id") for row in records if isinstance(row, dict) and row.get("id")],
        "published_at": None,
        "updated_at": now(),
        "reviewed_by": None,
        "canonical_url": f"https://nebulacomponents.com/blog/{slug}",
    }
    atomic(path, dump(metadata, _body(brief)))
    sidecar = {
        "revision": revision,
        "draft_hash": sha256(path),
        "brief_path": str(brief_path.resolve()),
        "brief_id": brief["id"],
        "created_at": now(),
        "provenance": brief.get("sources", {}),
        "opportunity": brief.get("readiness_opportunity"),
        "article": {"canonical_url": metadata["canonical_url"], "source_refs": metadata["source_refs"], "claims": []},
        "parent_hash": None,
    }
    atomic(json_sidecar(path), json.dumps(sidecar, indent=2, sort_keys=True) + "\n")
    return path


def _find_opportunity(input_path: Path, opportunity_id: str) -> dict[str, Any]:
    for line in input_path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
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
            item = _find_opportunity(args.input, args.opportunity)
            check = validate_opportunity(item)
            if not check["valid"]:
                raise ValueError("INVALID_OPPORTUNITY:" + ",".join(check["errors"]))
            brief_path = args.output_root.parent / "briefs" / f"{args.opportunity}.json"
            atomic(brief_path, json.dumps(item, indent=2, sort_keys=True) + "\n")
        if brief_path is None:
            raise ValueError("BRIEF_OR_OPPORTUNITY_REQUIRED")
        print(create_draft(brief_path, args.output_root).resolve())
        return 0
    except (OSError, UnicodeError, ValueError, TypeError, json.JSONDecodeError) as exc:
        emit({"status": "BLOCKED", "reason": str(exc)})
        return 2


if __name__ == "__main__":
    sys.exit(main())
