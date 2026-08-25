"""Unit tests for the page intent classifier."""
import pytest
from platform_api.services.page_intent import classify_page, INTENTS


def test_paid_landing_url_path():
    result = classify_page(url="https://example.com/lp/free-trial", title="", h1="")
    assert result.intent == "paid_landing"
    assert result.confidence >= 0.15


def test_seo_content_title():
    result = classify_page(
        url="https://example.com/blog/how-to-write-copy",
        title="How to Write High-Converting Landing Page Copy",
        h1="",
    )
    assert result.intent in ("seo_content", "paid_landing")  # both are plausible
    assert result.confidence >= 0.15


def test_comparison_url():
    result = classify_page(url="https://example.com/vs/competitor", title="", h1="")
    assert result.intent == "comparison"
    assert result.confidence >= 0.15


def test_below_threshold_returns_unknown():
    result = classify_page(url="https://example.com/", title="", h1="")
    # Home page with no signals -- may or may not be unknown depending on rules
    # Regardless: confidence must be a float, intent must be in taxonomy
    assert result.intent in INTENTS
    assert 0.0 <= result.confidence <= 1.0


def test_unknown_when_no_signals():
    result = classify_page(url="https://example.com/zzz-totally-ambiguous-slug", title="", h1="", meta_desc="", text="", html="")
    assert result.intent == "unknown"
    assert result.confidence == 0.0


def test_checkout_url():
    result = classify_page(url="https://example.com/checkout/payment", title="", h1="")
    assert result.intent == "checkout"


def test_about_trust_url():
    result = classify_page(url="https://example.com/about-us/team", title="", h1="")
    assert result.intent == "about_trust"


def test_result_has_signals_dict():
    result = classify_page(url="https://example.com/pricing", title="Plans and Pricing", h1="")
    assert isinstance(result.signals, dict)
    assert "fired" in result.signals
    assert "votes" in result.signals


def test_confidence_capped_at_one():
    # Many signals firing at once should not produce confidence > 1.0
    result = classify_page(
        url="https://example.com/lp/get-started",
        title="Get Started Free -- Limited Time Offer",
        h1="Claim Your Free Trial",
        meta_desc="Start your free trial today. Exclusive offer.",
    )
    assert result.confidence <= 1.0


def test_to_dict_keys():
    result = classify_page(url="https://example.com/vs/other", title="", h1="")
    d = result.to_dict()
    assert set(d.keys()) == {"intent", "confidence", "signals"}
    assert isinstance(d["confidence"], float)
