"""
Page intent classifier for Nebula audit engine.

Classifies audited pages into one of 9 intent categories using deterministic
rules on URL path, page title, H1, meta description, body text signals, and
HTML structure. No ML required; the rule-based approach is transparent,
debuggable, and overridable by the workspace user.

Intent categories
-----------------
paid_landing    Ad-targeted conversion page. Single focused CTA, minimal nav.
seo_content     Informational article / blog post. Optimised for organic search.
faq_support     FAQ, help centre, knowledge base, support article.
product_explainer  Feature page, how-it-works, solution page. Awareness/consideration.
comparison      Alternatives, vs., comparison, pricing-tier page.
category        Index page listing products, services, articles, or cases.
about_trust     About us, team, careers, contact, press.
checkout        Cart, checkout, order confirmation, payment.
unknown         Insufficient signals to classify with confidence ≥0.15.

Design principles
-----------------
- Every signal fires independently; the total votes determine winner + confidence.
- Signals are weighted by diagnostic value (high, medium, low).
- Confidence = winner_votes / total_possible_votes (0.0-1.0).
- Ties broken by specificity (more specific categories win).
- Minimum confidence 0.15 required to assign a non-unknown intent.
- scrape_page() data is sufficient: url, title, h1, text, html.
"""

from __future__ import annotations

import re
from typing import Optional
from dataclasses import dataclass, field
from collections import defaultdict


# ---------------------------------------------------------------------------
# Intent taxonomy
# ---------------------------------------------------------------------------

INTENTS = (
    "paid_landing",
    "seo_content",
    "faq_support",
    "product_explainer",
    "comparison",
    "category",
    "about_trust",
    "checkout",
    "unknown",
)


@dataclass
class ClassificationResult:
    intent: str
    confidence: float
    signals: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "intent": self.intent,
            "confidence": round(self.confidence, 3),
            "signals": self.signals,
        }


# ---------------------------------------------------------------------------
# Signal rules
# ---------------------------------------------------------------------------

# Each rule: (intent, weight, test_fn(url, title, h1, meta_desc, text, html))
# weight: high=3, medium=2, low=1

_H = 3   # high
_M = 2   # medium
_L = 1   # low


def _url_path(url: str) -> str:
    try:
        from urllib.parse import urlparse
        return urlparse(url).path.lower()
    except Exception:
        return url.lower()


def _has(pattern: str, *texts: str, flags: int = re.IGNORECASE) -> bool:
    rx = re.compile(pattern, flags)
    return any(rx.search(t or "") for t in texts)


# URL-path signals (very reliable)
_URL_RULES: list[tuple[str, int, str]] = [
    # (intent, weight, regex on path)
    ("paid_landing",       _H, r'/lp/|/landing/|/landing-page/|/ppc/|/paid/|/campaign/|/promo/'),
    ("paid_landing",       _M, r'/offer/|/deal/|/discount/|/free-trial/|/start/|/get-started/'),
    ("seo_content",        _H, r'/blog/|/article[s]?/|/post[s]?/|/news/|/insights/|/resources/|/signals?/|/learn/'),
    ("seo_content",        _M, r'/guide/|/tutorial/|/how-to/|/tips/|/education/'),
    ("faq_support",        _H, r'/faq/|/faqs/|/help/|/support/|/kb/|/knowledge-base/|/docs/'),
    ("faq_support",        _M, r'/questions/|/answers/|/troubleshoot/|/getting-started/'),
    ("product_explainer",  _M, r'/features?/|/solutions?/|/product[s]?/|/how-it-works/|/platform/|/spec[s]?/'),
    ("product_explainer",  _L, r'/why/|/benefits/|/use-cases?/|/capabilities/'),
    ("comparison",         _H, r'/vs/|/versus/|/compare/|/alternatives?/|/competitor/'),
    ("comparison",         _M, r'/pricing/|/plans?/'),
    ("category",           _H, r'/case-studi(?:es|y)/|/portfolio/|/client[s]?/|/success-stories?/'),
    ("category",           _M, r'/categor(?:y|ies)/|/topics?/|/tag[s]?/'),
    ("category",           _L, r'/(?:all-)?(?:articles?|posts?|resources?)/'),
    ("about_trust",        _H, r'/about(?:-us)?/|/team/|/company/|/story/|/careers?/|/jobs/'),
    ("about_trust",        _M, r'/contact(?:-us)?/|/press/|/media/|/legal/|/privacy/|/terms/'),
    ("checkout",           _H, r'/checkout/|/cart/|/order/|/payment/|/purchase/|/buy/'),
    ("checkout",           _M, r'/confirmation/|/thank-you/|/success/|/receipt/'),
]

# Title/H1/meta_desc text signals
_TEXT_RULES: list[tuple[str, int, str]] = [
    ("paid_landing",      _H, r'\b(get\s+(?:started|access|it\s+free|your\s+free)|start\s+(?:your\s+)?free|claim\s+(?:your|free)|buy\s+now|order\s+now|sign\s+up\s+(?:free|today)|try\s+it\s+free)\b'),
    ("paid_landing",      _M, r'\b(limited\s+time|exclusive\s+offer|one.time\s+offer|special\s+offer|free\s+(?:trial|demo|quote|consultation|access))\b'),
    ("seo_content",       _H, r'\b(how\s+to|what\s+is|why\s+(?:you\s+should|does|is)|guide\s+to|tips?\s+for|best\s+practices|complete\s+guide|ultimate\s+guide|beginners?\s+guide)\b'),
    ("seo_content",       _M, r'\b(explained?|understanding|introduction\s+to|overview\s+of|everything\s+you\s+need)\b'),
    ("faq_support",       _H, r'\b(faq|frequently\s+asked|common\s+questions|help\s+center|support|troubleshoot|how\s+do\s+i|can\s+i)\b'),
    ("product_explainer", _H, r'\b(features?|how\s+(?:it|we)\s+works?|platform|solution|built\s+for|designed\s+for|purpose.built|all.in.one)\b'),
    ("product_explainer", _M, r'\b(benefits?|why\s+choose|what\s+(?:we\s+do|makes?\s+us)|our\s+(product|platform|software|service|tool))\b'),
    ("comparison",        _H, r'\b(vs\.?|versus|compare[ds]?|alternatives?\s+to|best\s+\w+\s+for|top\s+\d+\s+(?:tools?|alternatives?|options?))\b'),
    ("comparison",        _M, r'\b(pricing|plans?\s+(?:and|&)\s+pricing|how\s+(?:much|pricing)|cost|per\s+month|per\s+year)\b'),
    ("category",          _M, r'\b(all\s+(?:articles?|posts?|resources?|case\s+studies)|browse\s+(?:by|all)|explore\s+our|our\s+(?:blog|library|collection))\b'),
    ("about_trust",       _H, r'\b(about\s+(?:us|our\s+(?:company|team|story))|meet\s+(?:our|the)\s+team|our\s+(?:mission|vision|values|story)|who\s+we\s+are)\b'),
    ("about_trust",       _M, r'\b(careers?|we(?:\'re|\s+are)\s+hiring|open\s+(?:positions?|roles?)|join\s+(?:our\s+)?team|get\s+in\s+touch|contact\s+us)\b'),
    ("checkout",          _H, r'\b(checkout|your\s+(?:cart|order|purchase)|order\s+(?:summary|confirmation|complete)|payment|billing\s+information)\b'),
]

# HTML structure signals (body text, html)
_HTML_RULES: list[tuple[str, int, callable]] = [
    ("paid_landing",      _H, lambda t, h: bool(re.search(r'<form[^>]*>', h, re.I)) and
                                            bool(re.search(r'\b(sign\s*up|get\s+started|start\s+free|claim|download)', t, re.I))),
    ("paid_landing",      _M, lambda t, h: bool(h) and _nav_link_count(h) <= 3),
    ("seo_content",       _H, lambda t, h: _word_count(t) >= 800),
    ("seo_content",       _M, lambda t, h: bool(re.search(r'"@type"\s*:\s*"(Article|BlogPosting|NewsArticle|HowTo)"', h))),
    ("faq_support",       _H, lambda t, h: bool(re.search(r'"@type"\s*:\s*"(FAQPage|QAPage|Question)"', h))),
    ("faq_support",       _M, lambda t, h: _question_density(t) >= 3),
    ("product_explainer", _M, lambda t, h: bool(re.search(r'"@type"\s*:\s*"(SoftwareApplication|Product|Service)"', h))),
    ("comparison",        _M, lambda t, h: bool(re.search(r'<table[^>]*>', h, re.I)) and
                                            bool(re.search(r'\b(feature|plan|price|include|vs\.?)\b', t, re.I))),
    ("about_trust",       _M, lambda t, h: bool(re.search(r'"@type"\s*:\s*"(Organization|Person|Employee|JobPosting)"', h))),
    ("checkout",          _H, lambda t, h: bool(re.search(r'<input[^>]+type=["\'](?:credit|card|payment)', h, re.I))),
]


def _nav_link_count(html: str) -> int:
    """Count links inside <nav> or header nav blocks."""
    nav_html = re.findall(r'<nav[^>]*>.*?</nav>', html, re.IGNORECASE | re.DOTALL)
    all_nav = " ".join(nav_html)
    return len(re.findall(r'<a\b', all_nav, re.IGNORECASE))


def _word_count(text: str) -> int:
    return len(text.split())


def _question_density(text: str) -> int:
    """Count question-like sentences."""
    return len(re.findall(r'\?', text))


# ---------------------------------------------------------------------------
# Classifier
# ---------------------------------------------------------------------------

def classify_page(
    url: str,
    title: str = "",
    h1: str = "",
    meta_desc: str = "",
    text: str = "",
    html: str = "",
) -> ClassificationResult:
    """
    Classify a page's intent from scraped content.

    Returns a ClassificationResult with intent, confidence, and the signals
    that drove the decision.
    """
    votes: dict[str, int] = defaultdict(int)
    fired: dict[str, list[str]] = defaultdict(list)

    path = _url_path(url)

    # URL-path rules
    for intent, weight, pattern in _URL_RULES:
        if re.search(pattern, path, re.IGNORECASE):
            votes[intent] += weight
            fired[intent].append(f"url_path:{pattern[:40]}")

    # Text rules (title, h1, meta_desc)
    for intent, weight, pattern in _TEXT_RULES:
        if _has(pattern, title, h1, meta_desc):
            votes[intent] += weight
            fired[intent].append(f"text:{pattern[:40]}")

    # HTML structure rules
    for intent, weight, fn in _HTML_RULES:
        try:
            if fn(text, html):
                votes[intent] += weight
                fired[intent].append(f"html:{fn.__code__.co_firstlineno}")
        except Exception:
            pass

    if not votes:
        return ClassificationResult(
            intent="unknown",
            confidence=0.0,
            signals={"fired": {}, "votes": {}},
        )

    # Winner first, then normalise against its own max possible votes.
    # Per-intent normalisation is fairer: "how much evidence did we see
    # relative to what was possible for THIS intent?" rather than vs. the
    # intent with the most total rules.
    winner = max(votes, key=lambda k: (votes[k], -list(INTENTS).index(k)))
    winner_votes = votes[winner]
    winner_max = (
        sum(w for i, w, _ in _URL_RULES if i == winner) +
        sum(w for i, w, _ in _TEXT_RULES if i == winner) +
        sum(w for i, w, _ in _HTML_RULES if i == winner)
    ) or 1
    confidence = min(winner_votes / winner_max, 1.0)

    if confidence < 0.15:
        # Not enough signal; fall back to unknown
        return ClassificationResult(
            intent="unknown",
            confidence=confidence,
            signals={"fired": dict(fired), "votes": dict(votes)},
        )

    return ClassificationResult(
        intent=winner,
        confidence=confidence,
        signals={"fired": dict(fired), "votes": dict(votes)},
    )


# ---------------------------------------------------------------------------
# Quick test helper
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else "https://example.com/blog/how-to-test"
    r = classify_page(url, title="How to test landing pages", h1="The complete guide to A/B testing")
    print(r.to_dict())
