import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
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
    import os
    retired = "aFa7sL5E03Iwgyt2Nk43S02"
    failures = []
    ignored_dirs = {".legacy", "node_modules", ".git", "tests", ".venv", "venv", ".next", ".next-previous", "__pycache__", "storybook-static", ".swc"}
    for root, dirs, files in os.walk(BASE):
        dirs[:] = [d for d in dirs if d not in ignored_dirs and not d.startswith(".")]
        for file in files:
            if file.endswith((".py", ".html")):
                path = Path(root) / file
                if retired.lower() in path.read_text(errors="ignore").lower():
                    failures.append(str(path.relative_to(BASE)))
    assert not failures, f"Retired Stripe link remains in: {failures}"


def test_audit_results_page_has_only_the_canonical_self_implementation_offer():
    page = BASE / "customer-portal" / "app" / "audit" / "[id]" / "results" / "ResultsClient.tsx"
    text = page.read_text()
    assert "Audit Lite" not in text
    assert "$7" not in text
    assert "$1,497" not in text
    assert "One-Leak Repair Sprint" in text
    assert "/checkout?audit_id=" in text
    assert "https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h" not in text


def test_active_audit_emails_have_only_the_canonical_self_implementation_offer():
    delivery_surfaces = (
        BASE / "deliver_audit.py",
        BASE / "platform_api" / "services" / "email_service.py",
        BASE / "platform_api" / "services" / "followup_emails.py",
    )
    for path in delivery_surfaces:
        text = path.read_text()
        assert not re.search(r"\$147\b", text), path
        assert not re.search(r"\$7\b", text), path
        assert not re.search(r"\$1,?497\b", text), path
        assert "Repair Sprint" in text or "repair sprint" in text, path
        assert "https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h" not in text, path
        assert "https://nebulacomponents.com/audit" in text, path
