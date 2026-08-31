"""Finding defensibility primitives.

Stamps additive fields onto new audits. Never mutates score, grade, composite,
issue, fix, or evidence.confidence. Public scoring stays unchanged.
"""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any, Literal

_log = logging.getLogger("nebula.epistemic")

Determination = Literal[
    "PASS",
    "FAIL",
    "REVIEW",
    "INDETERMINATE",
    "NOT_APPLICABLE",
]

Integrity = Literal["usable", "degraded", "unusable"]
DeterminationConfidence = Literal["high", "medium", "low", "none"]

NOT_ESTABLISHED_DEFAULT = (
    "Nebula has not established that this condition caused conversion loss "
    "or that changing it will increase conversion rate."
)

INTEGRITY_REASON_CODES = frozenset({
    "CAPTURE_FAILED",
    "CAPTURE_INCOMPLETE",
    "RENDER_TIMEOUT",
    "INTERSTITIAL_DETECTED",
    "BOT_CHALLENGE",
    "AUTH_REQUIRED",
    "UNSUPPORTED_RENDER_STATE",
})

DETERMINATION_REASON_CODES = frozenset({
    "CAPTURE_FAILED",
    "CAPTURE_INCOMPLETE",
    "ELEMENT_UNRESOLVED",
    "RENDER_TIMEOUT",
    "INTERSTITIAL_DETECTED",
    "BOT_CHALLENGE",
    "AUTH_REQUIRED",
    "PERSONALIZATION_AMBIGUOUS",
    "EXPERIMENT_VARIANT_AMBIGUOUS",
    "UNSUPPORTED_RENDER_STATE",
    "INSUFFICIENT_EVIDENCE",
    "INTENT_NOT_APPLICABLE",
})

PASS_SCORE = 7.0
CASE_FILE_SCHEMA = "nebula.case_file.v1"

_REGISTRY_PATH = Path(__file__).resolve().parent.parent / "schemas" / "conditions.registry.json"
_REGISTRY_CACHE: dict[str, Any] | None = None

_BOT_RE = re.compile(
    r"just a moment|attention required|cloudflare|access denied|captcha|bot detection",
    re.I,
)
_AUTH_RE = re.compile(
    r"sign in to continue|log in to continue|please log in|please sign in|401 unauthorized",
    re.I,
)


def load_condition_registry() -> dict[str, Any]:
    global _REGISTRY_CACHE
    if _REGISTRY_CACHE is None:
        loaded = json.loads(_REGISTRY_PATH.read_text(encoding="utf-8"))
        if not isinstance(loaded, dict):
            loaded = {}
        _REGISTRY_CACHE = loaded
    return _REGISTRY_CACHE


def registry_version() -> str:
    return str(load_condition_registry().get("registry_version") or "")


def condition_ref(legacy_key: str) -> dict[str, Any]:
    registry = load_condition_registry()
    for row in registry.get("conditions") or []:
        if row.get("legacy_key") == legacy_key:
            return {
                "condition_id": str(row["condition_id"]),
                "condition_version": int(row.get("condition_version") or 1),
                "registry_version": registry_version(),
            }
    return {
        "condition_id": f"UNREGISTERED_{str(legacy_key).upper()}",
        "condition_version": 0,
        "registry_version": registry_version(),
    }


def condition_id_for(legacy_key: str) -> str:
    return str(condition_ref(legacy_key)["condition_id"])


def observation_integrity(
    *,
    html: str | None,
    fetch_error: str | None = None,
    reason: str | None = None,
    title: str | None = None,
) -> tuple[Integrity, str | None]:
    """Return (integrity, reason_code). Reason codes are closed-set."""
    if fetch_error:
        code = reason if reason in INTEGRITY_REASON_CODES else "CAPTURE_FAILED"
        return "unusable", code
    text = str(html or "")
    if not text.strip():
        code = reason if reason in INTEGRITY_REASON_CODES else "CAPTURE_INCOMPLETE"
        return "unusable", code
    haystack = f"{title or ''}\n{text[:4000]}"
    if _BOT_RE.search(haystack):
        return "unusable", "BOT_CHALLENGE"
    if _AUTH_RE.search(haystack):
        return "unusable", "AUTH_REQUIRED"
    if len(text.strip()) < 200:
        return "degraded", "CAPTURE_INCOMPLETE"
    return "usable", None


def determination_from_evidence(
    *,
    passed: bool | None,
    evidence: dict[str, Any] | None,
    applicable: bool = True,
    integrity: Integrity = "usable",
    integrity_reason: str | None = None,
) -> tuple[Determination, str | None]:
    """Return (determination, reason_code). Does not change scores."""
    if not applicable:
        return "NOT_APPLICABLE", "INTENT_NOT_APPLICABLE"
    if integrity == "unusable":
        code = integrity_reason if integrity_reason in DETERMINATION_REASON_CODES else "CAPTURE_INCOMPLETE"
        return "INDETERMINATE", code
    confidence = str((evidence or {}).get("confidence") or "").lower()
    if confidence == "unavailable":
        selector = str((evidence or {}).get("selector") or "")
        if selector in {"", "N/A"}:
            return "INDETERMINATE", "ELEMENT_UNRESOLVED"
        return "INDETERMINATE", "INSUFFICIENT_EVIDENCE"
    if passed is None:
        return "REVIEW", None
    return ("PASS" if passed else "FAIL"), None


def determination_confidence_for(
    *,
    determination: Determination,
    integrity: Integrity,
    evidence: dict[str, Any] | None,
) -> DeterminationConfidence:
    """Separate from observation integrity and from evidence.confidence."""
    if determination in {"INDETERMINATE", "NOT_APPLICABLE"}:
        return "none"
    if integrity == "unusable":
        return "none"
    ev_conf = str((evidence or {}).get("confidence") or "").lower()
    if integrity == "degraded":
        return "low"
    if ev_conf == "high":
        return "high"
    if ev_conf == "contextual":
        return "medium"
    return "low"


def not_established_for(determination: Determination) -> str | None:
    if determination in {"FAIL", "REVIEW"}:
        return NOT_ESTABLISHED_DEFAULT
    return None


def is_condition_applicable(legacy_key: str, page_intent: str | None) -> bool:
    intent = (page_intent or "unknown") or "unknown"
    if intent == "unknown":
        return True
    try:
        from platform_api.services.signal_intent_map import is_relevant
        return is_relevant(legacy_key, intent)
    except Exception:
        return True


def stamp_finding(
    finding: dict[str, Any],
    *,
    integrity: Integrity,
    integrity_reason: str | None,
    page_intent: str | None = None,
    passed: bool | None = None,
) -> dict[str, Any]:
    """Copy a finding and add epistemic fields. Leaves score/issue/fix/evidence intact."""
    stamped = dict(finding)
    key = str(stamped.get("key") or "")
    evidence = stamped.get("evidence") if isinstance(stamped.get("evidence"), dict) else {}
    applicable = is_condition_applicable(key, page_intent)
    if passed is None:
        score = stamped.get("score")
        if score is None:
            passed = False
        else:
            try:
                passed = float(score) >= PASS_SCORE
            except (TypeError, ValueError):
                passed = False
    determination, reason_code = determination_from_evidence(
        passed=passed,
        evidence=evidence,
        applicable=applicable,
        integrity=integrity,
        integrity_reason=integrity_reason,
    )
    ref = condition_ref(key)
    stamped["condition_id"] = ref["condition_id"]
    stamped["condition_version"] = ref["condition_version"]
    stamped["registry_version"] = ref["registry_version"]
    stamped["determination"] = determination
    stamped["determination_reason_code"] = reason_code
    stamped["observation_integrity"] = integrity
    stamped["observation_integrity_reason"] = integrity_reason
    stamped["determination_confidence"] = determination_confidence_for(
        determination=determination,
        integrity=integrity,
        evidence=evidence,
    )
    stamped["not_established"] = not_established_for(determination)
    provenance = dict(stamped.get("scoring_provenance") or {})
    provenance.update({
        "condition_id": stamped["condition_id"],
        "condition_version": stamped["condition_version"],
        "registry_version": stamped["registry_version"],
        "determination": determination,
        "determination_reason_code": reason_code,
        "observation_integrity": integrity,
        "observation_integrity_reason": integrity_reason,
        "determination_confidence": stamped["determination_confidence"],
        "not_established": stamped["not_established"],
        "page_intent": page_intent or "unknown",
    })
    stamped["scoring_provenance"] = provenance
    return stamped


def build_case_file(
    *,
    dimensions: dict[str, Any],
    findings: list[dict[str, Any]],
    integrity: Integrity,
    integrity_reason: str | None,
    page_intent: str | None,
    engine_version: str | None,
    html: str | None = None,
    fetch_error: str | None = None,
    title: str | None = None,
) -> dict[str, Any]:
    by_key = {str(f.get("key")): f for f in findings if isinstance(f, dict) and f.get("key")}
    determinations = []
    for key, dim in (dimensions or {}).items():
        if not isinstance(dim, dict):
            continue
        finding = dict(by_key.get(key) or {})
        finding.setdefault("key", key)
        if "score" not in finding and dim.get("score") is not None:
            finding["score"] = dim.get("score")
        if "evidence" not in finding:
            finding["evidence"] = {}
        try:
            passed = float(dim.get("score") or 0) >= PASS_SCORE
        except (TypeError, ValueError):
            passed = None
        stamped = stamp_finding(
            finding,
            integrity=integrity,
            integrity_reason=integrity_reason,
            page_intent=page_intent,
            passed=passed,
        )
        determinations.append({
            "legacy_key": key,
            "condition_id": stamped["condition_id"],
            "condition_version": stamped["condition_version"],
            "determination": stamped["determination"],
            "determination_reason_code": stamped["determination_reason_code"],
            "determination_confidence": stamped["determination_confidence"],
            "not_established": stamped["not_established"],
            "score": dim.get("score"),
        })
    counts: dict[str, int] = {}
    for row in determinations:
        det = str(row["determination"])
        counts[det] = counts.get(det, 0) + 1
    return {
        "schema_version": CASE_FILE_SCHEMA,
        "engine_version": engine_version,
        "registry_version": registry_version(),
        "page_intent": page_intent or "unknown",
        "observation_integrity": integrity,
        "observation_integrity_reason": integrity_reason,
        "html_bytes": len(str(html or "").encode("utf-8")),
        "fetch_error": fetch_error,
        "title": (title or "")[:240] or None,
        "determinations": determinations,
        "determination_counts": counts,
    }


def attach_epistemic(
    result: dict[str, Any],
    *,
    html: str | None = None,
    fetch_error: str | None = None,
    title: str | None = None,
    page_intent: str | None = None,
) -> dict[str, Any]:
    """Stamp observation + case_file + finding fields. Scores are copied, not recomputed."""
    before_scores = {
        "overall": result.get("overall"),
        "composite": result.get("composite"),
        "score": result.get("score"),
        "overall_grade": result.get("overall_grade"),
        "grade": result.get("grade"),
    }
    integrity, integrity_reason = observation_integrity(
        html=html,
        fetch_error=fetch_error,
        title=title,
    )
    findings_key = "opp_matrix" if isinstance(result.get("opp_matrix"), list) else "findings"
    raw_findings = result.get(findings_key) or []
    stamped_findings = [
        stamp_finding(
            f,
            integrity=integrity,
            integrity_reason=integrity_reason,
            page_intent=page_intent,
            passed=False,
        )
        if isinstance(f, dict) else f
        for f in raw_findings
    ]
    result[findings_key] = stamped_findings
    if findings_key == "opp_matrix" and "findings" in result:
        result["findings"] = stamped_findings
    result["observation"] = {
        "integrity": integrity,
        "reason_code": integrity_reason,
        "html_bytes": len(str(html or "").encode("utf-8")),
        "fetch_error": fetch_error,
    }
    result["case_file"] = build_case_file(
        dimensions=result.get("dimensions") or {},
        findings=stamped_findings if all(isinstance(f, dict) for f in stamped_findings) else [],
        integrity=integrity,
        integrity_reason=integrity_reason,
        page_intent=page_intent,
        engine_version=result.get("engine_version"),
        html=html,
        fetch_error=fetch_error,
        title=title,
    )
    result["registry_version"] = registry_version()
    _log_invariants(result, before_scores)
    return result


def apply_page_intent(data: dict[str, Any], page_intent: str | None) -> dict[str, Any]:
    """Recompute applicability after intent classification. Scores unchanged."""
    observation = data.get("observation") if isinstance(data.get("observation"), dict) else {}
    if not isinstance(observation, dict):
        observation = {}
    integrity = observation.get("integrity") or "usable"
    if integrity not in {"usable", "degraded", "unusable"}:
        integrity = "usable"
    integrity_reason = observation.get("reason_code")
    html_bytes = observation.get("html_bytes")
    html_proxy = "x" * int(html_bytes or 0) if integrity != "unusable" else ""
    if integrity == "unusable":
        html_proxy = ""
        fetch_error = integrity_reason
    else:
        fetch_error = None
        if not html_proxy:
            html_proxy = "<html><body>placeholder</body></html>"
    findings = data.get("findings") or data.get("opp_matrix") or []
    if isinstance(findings, list):
        stamped = [
            stamp_finding(
                f,
                integrity=integrity,  # type: ignore[arg-type]
                integrity_reason=integrity_reason,
                page_intent=page_intent,
                passed=False,
            )
            if isinstance(f, dict) else f
            for f in findings
        ]
        data["findings"] = stamped
        if isinstance(data.get("opp_matrix"), list):
            data["opp_matrix"] = stamped
    if isinstance(data.get("dimensions"), dict):
        data["case_file"] = build_case_file(
            dimensions=data["dimensions"],
            findings=data.get("findings") or [],
            integrity=integrity,  # type: ignore[arg-type]
            integrity_reason=integrity_reason,
            page_intent=page_intent,
            engine_version=data.get("engine_version"),
            html=html_proxy if integrity != "unusable" else "",
            fetch_error=fetch_error,
        )
        if isinstance(data.get("observation"), dict):
            data["observation"] = dict(data["observation"])
    _log_invariants(data, None)
    return data


def collect_invariants(result: dict[str, Any], before_scores: dict[str, Any] | None = None) -> list[str]:
    """Return logically impossible combinations. Never mutates result."""
    violations: list[str] = []
    observation = result.get("observation") if isinstance(result.get("observation"), dict) else {}
    integrity = observation.get("integrity")
    case_file = result.get("case_file") if isinstance(result.get("case_file"), dict) else {}
    rows = case_file.get("determinations") if isinstance(case_file.get("determinations"), list) else []
    for row in rows:
        if not isinstance(row, dict):
            continue
        det = row.get("determination")
        cid = row.get("condition_id") or row.get("legacy_key")
        if integrity == "unusable" and det == "PASS":
            violations.append(f"unusable_integrity_pass:{cid}")
        if det == "NOT_APPLICABLE" and row.get("score") is not None:
            # NA may still carry a leftover score; that is allowed. Opening is not.
            pass
    findings = result.get("findings") or result.get("opp_matrix") or []
    if isinstance(findings, list):
        for finding in findings:
            if not isinstance(finding, dict):
                continue
            if finding.get("determination") == "NOT_APPLICABLE" and finding.get("open_in_workspace") is True:
                violations.append(f"na_opened:{finding.get('key')}")
    if before_scores:
        for key in ("overall", "composite", "score", "overall_grade", "grade"):
            if key in before_scores and result.get(key) != before_scores.get(key):
                violations.append(f"score_mutated:{key}")
    return violations


def _log_invariants(result: dict[str, Any], before_scores: dict[str, Any] | None) -> None:
    violations = collect_invariants(result, before_scores)
    if violations:
        _log.warning("epistemic_invariant_violation %s", ",".join(violations))


def gated_signal_keys(signal_keys: list[str], page_intent: str | None) -> set[str]:
    """Keys that are NOT_APPLICABLE for this intent. unknown gates nothing."""
    return {key for key in signal_keys if not is_condition_applicable(key, page_intent)}


def diff_determinations(
    before: list[dict[str, Any]] | None,
    after: list[dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    """Condition transitions only. Same condition_id + version."""
    def _index(rows: list[dict[str, Any]] | None) -> dict[tuple[str, int], dict[str, Any]]:
        out: dict[tuple[str, int], dict[str, Any]] = {}
        for row in rows or []:
            cid = str(row.get("condition_id") or "")
            if not cid:
                key = str(row.get("legacy_key") or row.get("key") or "")
                ref = condition_ref(key)
                cid = ref["condition_id"]
                ver = int(ref["condition_version"])
            else:
                ver = int(row.get("condition_version") or 1)
            out[(cid, ver)] = row
        return out

    t0 = _index(before)
    t1 = _index(after)
    keys = sorted(set(t0) | set(t1))
    transitions = []
    for key in keys:
        left = t0.get(key) or {}
        right = t1.get(key) or {}
        a = left.get("determination")
        b = right.get("determination")
        if a == b:
            continue
        transitions.append({
            "condition_id": key[0],
            "condition_version": key[1],
            "from": a,
            "to": b,
            "verified_condition_change": a in {"PASS", "FAIL"} and b in {"PASS", "FAIL"} and a != b,
            "not_established": NOT_ESTABLISHED_DEFAULT,
        })
    return transitions
