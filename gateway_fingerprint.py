"""Read-only MX and SMTP fingerprint enrichment for MailCheck evidence."""
from __future__ import annotations

from dataclasses import asdict, dataclass
from copy import deepcopy
import re
from typing import Any


@dataclass(frozen=True)
class GatewayFingerprint:
    receiving_provider: str = "unknown"
    security_gateway_vendor: str = "unknown"
    gateway_confidence: str = "unknown"
    matched_signals: tuple[str, ...] = ()


# Ordered from most specific to broadest. These are observations, not send rules.
_PATTERNS: tuple[tuple[str, str, str, str, str], ...] = (
    ("mimecast", "unknown", "mimecast", "medium", "hostname"),
    ("proofpoint", "unknown", "proofpoint", "medium", "hostname"),
    ("pphosted", "unknown", "proofpoint", "medium", "hostname"),
    ("barracuda", "unknown", "barracuda", "medium", "hostname"),
    ("barracudanetworks", "unknown", "barracuda", "medium", "hostname"),
    ("protection.outlook.com", "microsoft_365", "microsoft_eop", "medium", "hostname"),
    ("outlook.com", "microsoft_365", "microsoft_eop", "low", "hostname"),
    ("google.com", "google_workspace", "unknown", "unknown", "hostname"),
    ("googlemail.com", "google_workspace", "unknown", "unknown", "hostname"),
    ("zoho.", "zoho", "unknown", "unknown", "hostname"),
    ("zoho.com", "zoho", "unknown", "unknown", "hostname"),
    ("icloud.com", "icloud", "unknown", "unknown", "hostname"),
    ("protonmail", "proton", "unknown", "unknown", "hostname"),
)


def _clean(value: Any) -> str:
    return str(value or "").strip().lower().rstrip(".")


def fingerprint_hostname(hostname: str) -> GatewayFingerprint:
    host = _clean(hostname)
    if not host:
        return GatewayFingerprint()
    for needle, receiving, gateway, confidence, _basis in _PATTERNS:
        if needle in host:
            signal = f"mx:{host}"
            return GatewayFingerprint(receiving, gateway, confidence, (signal,))
    return GatewayFingerprint(matched_signals=(f"mx:{host}",))


def _hostnames(evidence: dict[str, Any]) -> list[tuple[str, str]]:
    found: list[tuple[str, str]] = []
    for item in evidence.get("dns", []) or []:
        if not isinstance(item, dict):
            continue
        for record in item.get("mx_records", []) or []:
            if isinstance(record, dict) and record.get("hostname"):
                found.append(("dns.mx_records", _clean(record["hostname"])))
    for item in evidence.get("smtp", []) or []:
        if not isinstance(item, dict):
            continue
        for field in ("mx_hostname", "banner"):
            value = _clean(item.get(field))
            if field == "banner" and value:
                value = value.split()[0]
            if value:
                found.append((f"smtp.{field}", value))
    return found


def enrich_gateway_evidence(evidence: dict[str, Any]) -> dict[str, Any]:
    """Return a copy of MailCheck evidence with non-authorizing enrichment."""
    result = deepcopy(evidence)
    observations = _hostnames(result)
    unique: list[tuple[str, str]] = []
    for observation in observations:
        if observation not in unique:
            unique.append(observation)

    fingerprints = [fingerprint_hostname(host) for _basis, host in unique]
    gateway = next((f for f in fingerprints if f.security_gateway_vendor != "unknown"), None)
    provider = next((f for f in fingerprints if f.receiving_provider != "unknown"), None)
    matched = sorted({signal for f in fingerprints for signal in f.matched_signals})
    result["gateway_enrichment"] = {
        "receiving_provider": provider.receiving_provider if provider else "unknown",
        "security_gateway_vendor": gateway.security_gateway_vendor if gateway else "unknown",
        "gateway_confidence": gateway.gateway_confidence if gateway else "unknown",
        "matched_signals": matched,
        "evidence_basis": [basis for basis, _host in unique],
        "authorizes_sending": False,
    }
    return result


__all__ = ["GatewayFingerprint", "enrich_gateway_evidence", "fingerprint_hostname"]
