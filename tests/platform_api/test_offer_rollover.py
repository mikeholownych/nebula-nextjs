"""CODE-8 regressions: offer pricing authority + 2027-01-01 rollover."""

from datetime import date

from platform_api.services import offer


def test_price_before_window_end():
    assert offer.active_offer_price_cents(date(2026, 12, 31)) == 9700
    assert offer.offer_price_display(date(2026, 8, 21)) == "$97"


def test_price_rollover_on_and_after_2027():
    assert offer.active_offer_price_cents(date(2027, 1, 1)) == 14700
    assert offer.active_offer_price_cents(date(2027, 6, 1)) == 14700
    assert offer.offer_price_display(date(2027, 1, 15)) == "$147"


def test_env_override(monkeypatch):
    monkeypatch.setenv("NEBULA_OFFER_PRICE_CENTS", "9900")
    import importlib
    importlib.reload(offer)
    try:
        assert offer.OFFER_PRICE_CENTS == 9900
        assert offer.offer_price_display(date(2026, 8, 21)) == "$99"
    finally:
        monkeypatch.delenv("NEBULA_OFFER_PRICE_CENTS")
        importlib.reload(offer)


def test_email_templates_reference_authority_not_hardcoded_strings():
    """The $97 literal must not reappear in email/follow-up templates."""
    from pathlib import Path
    for name in ("services/email_service.py", "services/followup_emails.py"):
        src = Path("platform_api") / name
        assert "$97" not in src.read_text(), f"hardcoded price returned in {name}"
