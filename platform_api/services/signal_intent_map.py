"""
Signal-to-intent relevance registry.

Every signal key used by the audit engine is mapped to the page intents for
which it is meaningful. When the classifier assigns an intent, findings_sync
gates on this registry: a finding is only created (or kept open) if the
signal is relevant for the detected intent.

Intent keys match the classifier's output taxonomy:
  paid_landing, seo_content, faq_support, product_explainer,
  comparison, category, about_trust, checkout, unknown

A signal in ALL_INTENTS (or absent from this registry) fires for every intent.
An empty list means the signal is never relevant (suppressed everywhere).
'unknown' always inherits ALL signals so we never suppress on low-confidence.

Design notes
------------
- Conservative tagging: when unsure, include the intent rather than exclude.
- 'unknown' always gets all signals (classifier wasn't confident enough to gate).
- Signals absent from this dict are treated as ALL_INTENTS (safe default).
"""

from __future__ import annotations

ALL_INTENTS = frozenset({
    "paid_landing", "seo_content", "faq_support", "product_explainer",
    "comparison", "category", "about_trust", "checkout", "unknown",
})

# Conversion-focused signals: only relevant when the page goal is to convert.
_CONVERSION_INTENTS = frozenset({
    "paid_landing", "product_explainer", "comparison", "checkout", "unknown",
})

# Informational/trust signals: relevant when the goal is to inform or rank.
_INFORMATIONAL_INTENTS = frozenset({
    "seo_content", "faq_support", "product_explainer", "comparison",
    "category", "about_trust", "unknown",
})

# Broadly applicable: relevant for most page types.
_BROAD_INTENTS = ALL_INTENTS - frozenset({"about_trust"})


SIGNAL_INTENT_RELEVANCE: dict[str, frozenset[str]] = {
    # ── Conversion signals ─────────────────────────────────────────────────
    # A landing page or checkout that lacks a clear CTA is broken.
    # An FAQ or About page is not expected to have a dominant CTA.
    "cta": _CONVERSION_INTENTS,

    # Above-the-fold composition: only matters for pages where the first screen
    # must establish the value prop and drive action.
    "above_fold": frozenset({"paid_landing", "product_explainer", "checkout", "unknown"}),

    # Headline quality: most important for paid landing pages and product pages.
    "headline": frozenset({
        "paid_landing", "product_explainer", "comparison", "unknown",
    }),

    # Ad signal / traffic-source alignment (UTM, pixel, ad copy match).
    # Only meaningful if the page is being sent paid traffic.
    "ad_signals": frozenset({"paid_landing", "unknown"}),

    # Social proof (testimonials, review count, logos, case-study snippets).
    # Important on conversion and comparison pages; less so on pure content.
    "social_proof": frozenset({
        "paid_landing", "product_explainer", "comparison", "checkout", "unknown",
    }),

    # ── SEO / discoverability signals ──────────────────────────────────────
    # SEO foundations (meta, canonical, hreflang, crawlability) matter for
    # any page Google should find and rank.
    "seo_foundations": _INFORMATIONAL_INTENTS | frozenset({"paid_landing"}),

    # AI readiness (LLM-parseable content, structured answers, FAQ schema).
    # Most impactful on informational and FAQ pages.
    "ai_readiness": frozenset({
        "seo_content", "faq_support", "product_explainer", "comparison",
        "about_trust", "unknown",
    }),

    # AI crawler access (robots.txt, GPTBot directives).
    # Relevant everywhere except checkout (which should block bots anyway).
    "ai_crawler_access": ALL_INTENTS - frozenset({"checkout"}),

    # ── Performance / UX signals ───────────────────────────────────────────
    # Load speed matters universally: slow pages hurt conversion AND ranking.
    "load_speed": ALL_INTENTS,

    # Mobile usability: applies to every page type.
    "mobile": ALL_INTENTS,

    # ── Local / contextual signals ─────────────────────────────────────────
    # GBP (Google Business Profile) signals only apply to local-business pages.
    # We include it for all conversion intents since a local business's landing
    # page would still benefit. About pages for local businesses too.
    "local_gbp": frozenset({
        "paid_landing", "product_explainer", "about_trust", "unknown",
    }),
}


def get_relevant_intents(signal_key: str) -> frozenset[str]:
    """Return the set of page intents for which this signal is relevant.

    Falls back to ALL_INTENTS for unknown signal keys (conservative: never
    suppress a signal we don't have explicit data on).
    """
    return SIGNAL_INTENT_RELEVANCE.get(signal_key, ALL_INTENTS)


def is_relevant(signal_key: str, page_intent: str) -> bool:
    """True when signal_key should fire for the given page_intent.

    Always returns True when:
    - page_intent is 'unknown' (low-confidence classification)
    - signal_key is not in the registry (safe default)
    """
    if page_intent == "unknown":
        return True
    return page_intent in get_relevant_intents(signal_key)
