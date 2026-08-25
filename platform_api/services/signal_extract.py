"""Shared signal extraction from audits.engine_output (Task 3 + Task 4).

Expected shapes (verified against a real completed nebula_audit row):

    engine_output["dimensions"] = {
        "cta":             {"score": 0.0,  "weight": "high", "issue": "..."},
        "mobile":          {"score": 10.0, "weight": "medium", ...},
        "seo_foundations": {"score": 7.5,  "weight": "high", "issue": "Missing: canonical"},
        ...
    }
    engine_output["findings"] = [            # only signals with substantive issues
        {"key": "cta", "label": "CTA", "impact": 5.0, "effort": 2,
         "quadrant": "quick_win", "signal_type": "conversion", ...},
        ...
    ]

A signal "passes" when its dimension score reaches PASS_THRESHOLD. Observed
production rows put clean signals at 8-10 ("... signal verification completed")
and substantive issues at <=7.5, so 8.0 separates them deterministically.
All helpers tolerate missing/None/malformed keys: they return empty results
rather than raising, so a partially-written engine_output never breaks callers.
asyncpg returns jsonb columns as JSON strings - helpers accept either a dict
or a JSON-encoded string.
"""

import json

PASS_THRESHOLD = 8.0


def _coerce(engine_output) -> dict:
    """dict passthrough; JSON string -> dict (asyncpg jsonb); else {}."""
    if isinstance(engine_output, str):
        try:
            engine_output = json.loads(engine_output)
        except json.JSONDecodeError:
            return {}
    return engine_output if isinstance(engine_output, dict) else {}


def extract_signal_map(engine_output) -> dict[str, bool]:
    """{signal_key: passed} for every scored dimension in engine_output."""
    engine_output = _coerce(engine_output)
    dimensions = engine_output.get("dimensions")
    if not isinstance(dimensions, dict):
        return {}
    signals: dict[str, bool] = {}
    for key, info in dimensions.items():
        if not isinstance(info, dict):
            continue
        score = info.get("score")
        if score is None:
            continue
        try:
            signals[str(key)] = float(score) >= PASS_THRESHOLD
        except (TypeError, ValueError):
            continue
    return signals


def extract_finding_keys(engine_output) -> list[str]:
    """Ordered finding keys (the failed/substantive signals) from findings."""
    engine_output = _coerce(engine_output)
    findings = engine_output.get("findings")
    if not isinstance(findings, list):
        return []
    keys: list[str] = []
    for item in findings:
        if isinstance(item, dict) and item.get("key"):
            keys.append(str(item["key"]))
    return keys
