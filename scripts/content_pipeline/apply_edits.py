#!/usr/bin/env python3
"""Apply explicit replacements into a new immutable draft revision."""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

try:
    from ._validation import validate_draft
    from ._workflow import atomic_pair, dump, emit, json_sidecar, now, revision_lock, sha256, parse
except ImportError:  # pragma: no cover
    from _validation import validate_draft
    from _workflow import atomic_pair, dump, emit, json_sidecar, now, revision_lock, sha256, parse


def _next_revision(folder: Path) -> int:
    numbers = []
    for candidate in folder.glob("v*.md"):
        if candidate.stem[1:].isdigit():
            numbers.append(int(candidate.stem[1:]))
    return max(numbers, default=0) + 1


def _validate_parent(draft: Path) -> tuple[dict, str, dict[str, Any], str]:
    result = validate_draft(draft)
    if not result["valid"]:
        raise ValueError("INVALID_PARENT:" + ",".join(item["code"] for item in result["failures"]))
    metadata, body, _ = parse(draft)
    sidecar = result["sidecar"]
    if sidecar.get("draft_hash") != sha256(draft):
        raise ValueError("INVALID_PARENT:PARENT_HASH_MISMATCH")
    if sidecar.get("revision") != int(draft.stem[1:]):
        raise ValueError("INVALID_PARENT:PARENT_REVISION_MISMATCH")
    return metadata, body, sidecar, sha256(draft)


def apply_edits(draft: Path, edits_path: Path) -> Path:
    metadata, body, sidecar, old_hash = _validate_parent(draft)
    edits = json.loads(edits_path.read_text(encoding="utf-8"))
    rows = edits.get("replacements") if isinstance(edits, dict) else None
    if not isinstance(rows, list) or not rows:
        raise ValueError("INVALID_EDITS")
    new_body = body
    records: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get("old"), str) or not isinstance(row.get("new"), str):
            raise ValueError("INVALID_EDIT_ROW")
        if row["old"] not in new_body:
            raise ValueError("EDIT_TARGET_NOT_FOUND")
        new_body = new_body.replace(row["old"], row["new"], 1)
        records.append({"old": row["old"], "new": row["new"], "editor": edits.get("editor", "unknown"), "at": now()})
    for key in ("published_at", "updated_at", "reviewed_by"):
        if key in edits:
            metadata[key] = edits[key]
    with revision_lock(draft.parent):
        revision = _next_revision(draft.parent)
        target = draft.parent / f"v{revision:03d}.md"
        new_text = dump(metadata, new_body)
        new_sidecar = dict(sidecar)
        new_sidecar.update({"revision": revision, "draft_hash": sha256_bytes(new_text.encode()), "parent": str(draft), "parent_hash": old_hash, "edits": records, "created_at": now()})
        sidecar_text = json.dumps(new_sidecar, indent=2, sort_keys=True) + "\n"
        atomic_pair((target, new_text), (json_sidecar(target), sidecar_text))
    return target


def sha256_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--draft", required=True, type=Path)
    parser.add_argument("--edits", required=True, type=Path)
    args = parser.parse_args(argv)
    try:
        print(apply_edits(args.draft, args.edits).resolve())
        return 0
    except (OSError, UnicodeError, ValueError, TypeError, json.JSONDecodeError) as exc:
        emit({"status": "BLOCKED", "reason": str(exc)})
        return 2


if __name__ == "__main__":
    sys.exit(main())
