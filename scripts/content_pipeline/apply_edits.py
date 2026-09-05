#!/usr/bin/env python3
"""Apply explicit replacements into a new immutable draft revision."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

try:
    from ._workflow import atomic, dump, emit, json_sidecar, now, parse, sha256
except ImportError:
    from _workflow import atomic, dump, emit, json_sidecar, now, parse, sha256


def _next_revision(folder: Path) -> int:
    revisions = []
    for candidate in folder.glob("v*.md"):
        try:
            revisions.append(int(candidate.stem[1:]))
        except ValueError:
            continue
    revision = max(revisions, default=0) + 1
    while (folder / f"v{revision:03d}.md").exists():
        revision += 1
    return revision


def apply_edits(draft: Path, edits_path: Path) -> Path:
    data, body, _ = parse(draft)
    edits = json.loads(edits_path.read_text(encoding="utf-8"))
    rows = edits.get("replacements") if isinstance(edits, dict) else None
    if not isinstance(rows, list) or not rows:
        raise ValueError("INVALID_EDITS")
    old_hash = sha256(draft)
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
            data[key] = edits[key]
    revision = _next_revision(draft.parent)
    target = draft.parent / f"v{revision:03d}.md"
    atomic(target, dump(data, new_body))
    sidecar = {}
    if json_sidecar(draft).is_file():
        sidecar = json.loads(json_sidecar(draft).read_text(encoding="utf-8"))
    sidecar.update({"revision": revision, "draft_hash": sha256(target), "parent": str(draft), "parent_hash": old_hash, "edits": records, "created_at": now()})
    atomic(json_sidecar(target), json.dumps(sidecar, indent=2, sort_keys=True) + "\n")
    return target


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
