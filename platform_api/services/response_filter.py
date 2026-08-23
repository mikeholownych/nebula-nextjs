"""Deterministic auto-filter for public company responses."""

import re
from dataclasses import dataclass, field

MAX_RESPONSE_CHARS = 1000
MAX_LINKS = 3

_LINK_RE = re.compile(
    r"https?://\S+|\[.+?\]\(\S+\)|\b[\w-]+(?:\.[\w-]+)*\.(?:com|net|io|org|dev|co)\b",
    re.I,
)

_DENYLIST: list[tuple[str, re.Pattern]] = [
    ("legal_threat", re.compile(
        r"\b(sue|suing|lawsuit|attorney|lawyer|cease and desist|legal action)\b", re.I)),
    ("contact_farming", re.compile(
        r"\b(telegram|whatsapp|dm me|guest post|backlink|seo services|"
        r"link building|crypto|casino|betting)\b", re.I)),
]


@dataclass
class FilterResult:
    allowed: bool = True
    reasons: list[str] = field(default_factory=list)


def evaluate_response(text: str) -> FilterResult:
    result = FilterResult()
    if len(text or "") > MAX_RESPONSE_CHARS:
        result.allowed = False
        result.reasons.append("too_long")
    links = _LINK_RE.findall(text or "")
    if len(links) > MAX_LINKS:
        result.allowed = False
        result.reasons.append("too_many_links")
    for name, pattern in _DENYLIST:
        if pattern.search(text or ""):
            result.allowed = False
            result.reasons.append(f"flagged:{name}")
    return result
