#!/usr/bin/env python3
"""
email_permutator.py — Email address permutation + MX verification.

Source: Illingworth "How to Find Anyone's Email Address"
  - LinkedIn name + company domain → ranked candidate list
  - MX record check (stdlib host CLI) before adding to send queue
  - No-email fallback: log for LinkedIn DM outreach

Usage:
    from email_permutator import permute, mx_exists, top_candidate

    candidates = permute("John", "Doe", "acme.com")
    valid = [e for e in candidates if mx_exists(e.split("@")[1])]
    best = top_candidate("John", "Doe", "acme.com")
"""

import re
import subprocess
import time
from functools import lru_cache


# ── Permutation generator ─────────────────────────────────────────
# Ranked by empirical frequency: first.last > first > flast > f.last > last.first
# Source: Hunter.io "Most common email formats" data + Illingworth examples

ROLE_ALIASES = [
    "info", "hello", "contact", "founders", "team", "hi", "support",
    "sales", "marketing", "growth",
]

def _clean(name: str) -> str:
    """Lowercase, strip non-alpha."""
    return re.sub(r"[^a-z]", "", name.lower())


def permute(first: str, last: str, domain: str) -> list[str]:
    """
    Generate ranked email candidates for a person at a domain.
    Returns ordered list — most likely first.
    """
    f = _clean(first)
    l = _clean(last)
    d = domain.lower().strip()

    if not f or not l or not d:
        return []

    templates = [
        f"{f}.{l}@{d}",       # john.doe      (most common)
        f"{f}@{d}",            # john
        f"{f[0]}{l}@{d}",     # jdoe
        f"{f[0]}.{l}@{d}",   # j.doe
        f"{l}.{f}@{d}",       # doe.john
        f"{f}{l}@{d}",        # johndoe
        f"{l}@{d}",            # doe
        f"{f}{l[0]}@{d}",     # johnD (less common)
        f"{f[0]}{l[0]}@{d}",  # jd
    ]

    # Dedupe while preserving order
    seen = set()
    out = []
    for t in templates:
        if t not in seen:
            seen.add(t)
            out.append(t)
    return out


def permute_role(domain: str) -> list[str]:
    """Fallback: role-based addresses when no name available."""
    d = domain.lower().strip()
    return [f"{alias}@{d}" for alias in ROLE_ALIASES]


# ── MX record verification ────────────────────────────────────────
# Uses `host` CLI (stdlib DNS) — no dnspython dependency
# Illingworth: "Always verify before sending — it kills your deliverability"

@lru_cache(maxsize=512)
def mx_exists(domain: str) -> bool:
    """
    Return True if the domain has at least one MX record.
    Cached per-domain to avoid repeated DNS lookups in batch runs.
    """
    try:
        r = subprocess.run(
            ["host", "-t", "MX", domain],
            capture_output=True, text=True, timeout=5
        )
        # "mail is handled by" = valid MX
        return "mail is handled by" in r.stdout
    except Exception:
        return False


def mx_batch(domains: list[str], delay: float = 0.1) -> dict[str, bool]:
    """MX check a list of domains with optional delay. Returns {domain: bool}."""
    results = {}
    for d in domains:
        if d not in results:
            results[d] = mx_exists(d)
            time.sleep(delay)
    return results


# ── Top candidate selector ────────────────────────────────────────

def top_candidate(first: str, last: str, domain: str) -> str | None:
    """
    Return the single most likely email address, or None if domain has no MX.
    Fast path: check MX once, return first permutation template.
    """
    if not mx_exists(domain):
        return None
    candidates = permute(first, last, domain)
    return candidates[0] if candidates else None


# ── LinkedIn no-email fallback logger ────────────────────────────
# Illingworth pro tip: "If you can't find an email, connect on LinkedIn first."

def log_linkedin_fallback(lead: dict, fallback_file: str = "/home/mike/nebula/linkedin_fallback.json") -> None:
    """
    Append a lead with no email to the LinkedIn DM queue.
    Fields: name, title, post_url, domain, site_urls
    """
    import json
    from datetime import datetime, timezone

    try:
        with open(fallback_file) as f:
            queue = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        queue = []

    queue.append({
        "name":      lead.get("author", ""),
        "post_url":  lead.get("post_url", ""),
        "domain":    lead.get("domain", ""),
        "site_urls": lead.get("site_urls", []),
        "title":     lead.get("title", "")[:120],
        "queued_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "channel":   "linkedin_dm",
        "status":    "pending",
    })

    with open(fallback_file, "w") as f:
        json.dump(queue, f, indent=2)


# ── CLI smoke test ────────────────────────────────────────────────

if __name__ == "__main__":
    print("=== Email Permutator — smoke test ===\n")

    # Permutation test
    print("Permutations for John Doe @ acme.com:")
    for e in permute("John", "Doe", "acme.com"):
        print(f"  {e}")

    # MX check
    print("\nMX checks:")
    for d in ["gmail.com", "microsoft.com", "notarealedomain12345.xyz"]:
        print(f"  {d:40s} {'✅' if mx_exists(d) else '❌'}")

    # Top candidate
    print("\nTop candidates:")
    for first, last, domain in [
        ("John", "Doe", "gmail.com"),
        ("Jane", "Smith", "notarealedomain12345.xyz"),
    ]:
        c = top_candidate(first, last, domain)
        print(f"  {first} {last} @ {domain} → {c or 'NO MX — skip'}")
