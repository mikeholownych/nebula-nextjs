import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]

# Production systemd serves the Next.js application from customer-portal only.
# Any new deployed content root must be added here so offer checks expand with deployment scope.
DEPLOYED_CONTENT_ROOTS = (
    BASE / "customer-portal" / "app",
    BASE / "customer-portal" / "public",
)

LEGACY_OFFER_PATTERNS = [
    re.compile(r"\$147\s+(?:Conversion\s+)?Fix Pack", re.I),
    re.compile(r"Fix Pack.{0,30}\$147", re.I | re.S),
    re.compile(r"\$147\s+fix", re.I),
    re.compile(r"spending\s+\$147\s+to\s+fix", re.I),
    re.compile(r"Pay\s+\$147\s+today", re.I),
    re.compile(r"Start\s+\$147\s+fix", re.I),
    re.compile(r"start\s+(?:your\s+)?\$147\s+fix", re.I),
    re.compile(r"\$147\s+self-serve", re.I),
    re.compile(r"Fix Pack.{0,120}(?:delivered|within|in).{0,20}72\s*(?:h|hours)", re.I | re.S),
    re.compile(r"\$147.{0,80}(?:takes|delivered|within|in).{0,20}72\s*(?:h|hours)", re.I | re.S),
]


def test_public_html_has_no_legacy_147_fix_pack_copy():
    failures = []
    assert all(root.is_dir() for root in DEPLOYED_CONTENT_ROOTS)
    for live_root in DEPLOYED_CONTENT_ROOTS:
        for suffix in ("*.html", "*.ts", "*.tsx"):
            for page in live_root.rglob(suffix):
                text = page.read_text(errors="ignore")
                for pattern in LEGACY_OFFER_PATTERNS:
                    match = pattern.search(text)
                    if match:
                        failures.append(f"{page.relative_to(BASE)}: {match.group(0)[:100]}")
    assert not failures, "Legacy $147 offer copy:\n" + "\n".join(failures)


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
