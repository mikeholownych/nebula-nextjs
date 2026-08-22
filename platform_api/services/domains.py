"""Registered-domain normalization and freemail detection.

Single authority for domain identity decisions (claims, by-domain attach).
Never inline suffix logic elsewhere.
"""

import re
from functools import lru_cache
from urllib.parse import urlparse

from publicsuffixlist import PublicSuffixList

_psl = PublicSuffixList()

# Providers no employee can receive verification mail on for their employer.
FREEMAIL_DOMAINS: frozenset[str] = frozenset({
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "ymail.com",
    "outlook.com", "hotmail.com", "hotmail.co.uk", "live.com", "live.co.uk",
    "msn.com", "icloud.com", "me.com", "mac.com", "proton.me",
    "protonmail.com", "protonmail.ch", "pm.me", "aol.com", "gmx.com",
    "gmx.de", "mail.com", "zoho.com", "yandex.com", "yandex.ru",
    "fastmail.com", "tutanota.com", "hey.com",
})

_EMAIL_RE = re.compile(r"^[^@\s]+@([^@\s]+)$")


@lru_cache(maxsize=4096)
def registered_domain(value: str) -> str | None:
    """Return the public-suffix registered domain for a URL or host."""
    if not value or not isinstance(value, str):
        return None
    candidate = value.strip().lower()
    if "://" not in candidate:
        candidate = "//" + candidate
    try:
        host = (urlparse(candidate).hostname or "").strip().lower()
    except ValueError:
        return None
    if not host or "." not in host:
        return None
    name = _psl.privatesuffix(host)
    return name or None


def email_domain(email: str) -> str | None:
    """Return the registered domain of an email address's domain part."""
    if not email or not isinstance(email, str):
        return None
    m = _EMAIL_RE.match(email.strip())
    if not m:
        return None
    return registered_domain(m.group(1))


def is_freemail(domain_or_email: str) -> bool:
    d = email_domain(domain_or_email) if "@" in (domain_or_email or "") else \
        registered_domain(domain_or_email or "")
    return d in FREEMAIL_DOMAINS if d else False
