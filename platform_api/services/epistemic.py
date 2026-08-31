"""Finding defensibility primitives.

Not wired into deliver_audit scoring. Live determinations stay unchanged until
a dedicated P1 migration stamps additive fields on new audits only.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Literal

Determination = Literal[
    "PASS",
    "FAIL",
    "REVIEW",
    "INDETERMINATE",
    "NOT_APPLICABLE",
]

Integrity = Literal["usable", "degraded", "unusable"]

NOT_ESTABLISHED_DEFAULT = (
    "Nebula has not established that this condition caused conversion loss "
    "or that changing it will increase conversion rate."
)

_REGISTRY_PATH = Path(__file__).resolve().parent.parent / "schemas" / "conditions.registry.json"


def load_condition_registry() -> dict[str, Any]:
    return json.loads(_REGISTRY_PATH.read_text(encoding="utf-8"))


def condition_id_for(legacy_key: str) -> str:
    registry = load_condition_registry()
    for row in registry.get("conditions") or []:
        if row.get("legacy_key") == legacy_key:
            return str(row["condition_id"])
    return f"UNREGISTERED_{legacy_key.upper()}_V0"


def observation_integrity(
    *,
    html: str | None,
    fetch_error: str | None = None,
    reason: str | None = None,
) -> tuple[Integrity, str | None]:
    if fetch_error:
        return "unusable", reason or fetch_error
    if not html or not str(html).strip():
        return "unusable", reason or "empty_html"
    return "usable", None


def determination_from_evidence(
    *,
    passed: bool | None,
    evidence: dict[str, Any] | None,
    applicable: bool = True,
    integrity: Integrity = "usable",
) -> Determination:
    if not applicable:
        return "NOT_APPLICABLE"
    if integrity == "unusable":
        return "INDETERMINATE"
    confidence = str((evidence or {}).get("confidence") or "").lower()
    if confidence == "unavailable":
        return "INDETERMINATE"
    if passed is None:
        return "REVIEW"
    return "PASS" if passed else "FAIL"


def not_established_for(determination: Determination) -> str | None:
    if determination in {"FAIL", "REVIEW"}:
        return NOT_ESTABLISHED_DEFAULT
    return None
