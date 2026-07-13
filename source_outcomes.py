#!/usr/bin/env python3
"""Observed source outcomes for Nebula's multi-source lead engine.

A clean empty result is evidence that a source was quiet. Authentication,
rate-limit, network, timeout, and schema failures are not. Persisting that
difference prevents the CEO/SRE layers from treating broken retrieval as
market evidence.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

OutcomeState = Literal[
    "ok",
    "no-results",
    "partial",
    "rate-limited",
    "auth-failed",
    "unreachable",
    "timeout",
    "schema-drift",
    "skipped-unconfigured",
    "error",
]

VALID_STATES = frozenset(
    {
        "ok",
        "no-results",
        "partial",
        "rate-limited",
        "auth-failed",
        "unreachable",
        "timeout",
        "schema-drift",
        "skipped-unconfigured",
        "error",
    }
)


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@dataclass(frozen=True)
class SourceOutcome:
    source: str
    state: OutcomeState
    items_returned: int = 0
    attempted: bool = True
    detail: str | None = None
    at: str = field(default_factory=_utc_now)
    fix_hint: str | None = None

    def __post_init__(self) -> None:
        if self.state not in VALID_STATES:
            raise ValueError(f"unknown source outcome state: {self.state}")
        if self.items_returned < 0:
            raise ValueError("items_returned cannot be negative")
        if self.fix_hint is None and self.state not in {"ok", "no-results"}:
            object.__setattr__(self, "fix_hint", "check-source-health")


def classify_http_status(status_code: int, items_returned: int = 0) -> OutcomeState:
    """Map an observed HTTP response to a source outcome."""
    if 200 <= status_code < 300:
        return "ok" if items_returned else "no-results"
    if status_code == 429:
        return "rate-limited"
    if status_code in {401, 402, 403}:
        return "auth-failed"
    if status_code in {408, 504}:
        return "timeout"
    if status_code >= 500:
        return "unreachable"
    return "error"


def record_outcome(path: str | Path, outcome: SourceOutcome) -> None:
    """Append one source result to a JSONL evidence log."""
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    row = asdict(outcome)
    row["market_quiet"] = outcome.state == "no-results"
    with destination.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(row, sort_keys=True) + "\n")


def latest_source_health(path: str | Path) -> dict[str, dict]:
    """Return the latest observed outcome for each source."""
    source_path = Path(path)
    if not source_path.exists():
        return {}

    latest: dict[str, dict] = {}
    for line in source_path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            row = json.loads(line)
            source = str(row["source"])
            state = str(row["state"])
        except (json.JSONDecodeError, KeyError, TypeError):
            continue
        row["market_quiet"] = state == "no-results"
        latest[source] = row
    return latest
