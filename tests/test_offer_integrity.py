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
            if any(part in {".legacy", "node_modules", ".git", "tests"} for part in path.parts):
                continue
            if retired.lower() in path.read_text(errors="ignore").lower():
                failures.append(str(path.relative_to(BASE)))
    assert not failures, f"Retired Stripe link remains in: {failures}"


def test_audit_results_page_has_only_the_canonical_fix_pack_offer():
    page = BASE / "customer-portal" / "app" / "audit" / "[id]" / "results" / "ResultsClient.tsx"
    text = page.read_text()
    assert "Audit Lite" not in text
    assert "$7" not in text
    assert "$1,497" not in text
    assert "$97 Fix Pack" in text
    # 2026-07-24: rotated off plink_1TsYoeEINR1kU9chNMFuKhDu after discovering
    # (via `stripe payment_links retrieve` against the live account) that its
    # only price was actually $147 (price_1TsYoeEINR1kU9chokWZFetZ), not the
    # $97 every LEGACY_OFFER_PATTERNS check above assumed the code enforced.
    # That link is now deactivated in Stripe. This class of bug is invisible
    # to this file by construction — it checks what the copy says, not what
    # Stripe actually charges. See scripts/deliver_prompt_pack.py's sibling
    # note; a periodic live-price check against the Stripe API, not another
    # copy regex, is what would actually catch a repeat of this.
    assert "https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h" in text


def test_active_audit_emails_have_only_the_canonical_fix_pack_offer():
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
        assert "$97 Fix Pack" in text, path
        # 2026-07-24: rotated off plink_1TsYoeEINR1kU9chNMFuKhDu after discovering
    # (via `stripe payment_links retrieve` against the live account) that its
    # only price was actually $147 (price_1TsYoeEINR1kU9chokWZFetZ), not the
    # $97 every LEGACY_OFFER_PATTERNS check above assumed the code enforced.
    # That link is now deactivated in Stripe. This class of bug is invisible
    # to this file by construction — it checks what the copy says, not what
    # Stripe actually charges. See scripts/deliver_prompt_pack.py's sibling
    # note; a periodic live-price check against the Stripe API, not another
    # copy regex, is what would actually catch a repeat of this.
    assert "https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h" in text, path
