import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]

LEGACY_OFFER_PATTERNS = [
    re.compile(r"\$97\s+(?:Conversion\s+)?Fix Pack", re.I),
    re.compile(r"Fix Pack.{0,30}\$97", re.I | re.S),
    re.compile(r"\$97\s+fix", re.I),
    re.compile(r"spending\s+\$97\s+to\s+fix", re.I),
    re.compile(r"Pay\s+\$97\s+today", re.I),
    re.compile(r"Start\s+\$97\s+fix", re.I),
    re.compile(r"start\s+(?:your\s+)?\$97\s+fix", re.I),
    re.compile(r"\$97\s+self-serve", re.I),
    re.compile(r"Fix Pack.{0,120}(?:delivered|within|in).{0,20}72\s*(?:h|hours)", re.I | re.S),
    re.compile(r"\$147.{0,80}(?:takes|delivered|within|in).{0,20}72\s*(?:h|hours)", re.I | re.S),
]


def test_public_html_has_no_legacy_97_fix_pack_copy():
    failures = []
    for page in BASE.rglob("*.html"):
        if any(part in {"archived", "node_modules", "test-results", "playwright-report"} for part in page.parts):
            continue
        text = page.read_text(errors="ignore")
        for pattern in LEGACY_OFFER_PATTERNS:
            match = pattern.search(text)
            if match:
                failures.append(f"{page.relative_to(BASE)}: {match.group(0)[:100]}")
    assert not failures, "Legacy $97 offer copy:\n" + "\n".join(failures)


def test_active_runtime_has_no_retired_fix_pack_payment_link():
    retired = "aFa7sL5E03Iwgyt2Nk43S02"
    failures = []
    for suffix in ("*.py", "*.html"):
        for path in BASE.rglob(suffix):
            if any(part in {"archived", "node_modules", ".git", "tests"} for part in path.parts):
                continue
            if retired.lower() in path.read_text(errors="ignore").lower():
                failures.append(str(path.relative_to(BASE)))
    assert not failures, f"Retired Stripe link remains in: {failures}"
