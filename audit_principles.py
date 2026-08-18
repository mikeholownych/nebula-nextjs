"""
audit_principles.py — Conversion principle layer for Nebula audit findings.

Adds two fields to the audit output:

1. `principle` on each finding in opp_matrix:
   A short (2-5 word) named conversion principle that explains WHY the
   finding matters. e.g. "message match", "proof proximity", "cost salience".
   This makes findings educational, not just directive.

2. `strategic_finding` at the audit level:
   One sentence naming the single structural shift that would most change
   the page's conversion trajectory — distinct from the tactical ranked list.
   The strategic finding names what type of problem the page has, not just
   the worst individual signal.
"""

from __future__ import annotations
from typing import Any

# ── Per-signal principle definitions ──────────────────────────────────────────
# Each entry: signal key → { principle, explanation }
# principle:   short label (2-5 words) — shown on the findings card
# explanation: one sentence — used in email/PDF for the educational layer

FINDING_PRINCIPLES: dict[str, dict[str, str]] = {
    "headline": {
        "principle": "message match",
        "explanation": (
            "When the headline matches the language and intent of the ad that brought the visitor, "
            "the visitor's brain confirms they're in the right place. Mismatched headlines break "
            "attention before the page can make a case."
        ),
    },
    "cta": {
        "principle": "action clarity",
        "explanation": (
            "A call-to-action converts when the visitor can immediately see what happens next "
            "and why it's worth doing. Buried, vague, or competing CTAs raise the cost of "
            "every click you paid for."
        ),
    },
    "above_fold": {
        "principle": "attention economics",
        "explanation": (
            "Visitors spend 80% of their attention above the fold. If the core value proposition "
            "and the next action aren't visible without scrolling, most paid visitors never see them."
        ),
    },
    "social_proof": {
        "principle": "proof proximity",
        "explanation": (
            "Social proof reduces perceived risk. Its position on the page matters as much as its "
            "existence: proof that appears near the CTA converts 2-3x better than proof buried "
            "below the fold."
        ),
    },
    "load_speed": {
        "principle": "attention tax",
        "explanation": (
            "Every second of load time burns a portion of the attention you paid to acquire. "
            "53% of mobile visitors leave pages that take more than 3 seconds to load — "
            "before the page has had a chance to make any case."
        ),
    },
    "mobile": {
        "principle": "viewport integrity",
        "explanation": (
            "More than half of paid traffic arrives on mobile. A page that renders incorrectly, "
            "clips content, or breaks its form on a small screen loses those visitors at the "
            "device level, not the message level."
        ),
    },
    "ad_signals": {
        "principle": "measurement fidelity",
        "explanation": (
            "Without correct tracking, you cannot close the loop between ad spend and page "
            "outcomes. Every optimization decision made on incomplete data compounds the error "
            "in the direction of the wrong fix."
        ),
    },
    "seo_foundations": {
        "principle": "discoverability baseline",
        "explanation": (
            "Title tags, meta descriptions, and a clean H1 are the page's identity in search. "
            "Missing or misaligned SEO foundations mean the page cannot benefit from organic "
            "distribution even when paid conversion is proven."
        ),
    },
    "ai_readiness": {
        "principle": "agent citeability",
        "explanation": (
            "AI systems (ChatGPT, Perplexity, Gemini) surface pages with structured signals — "
            "JSON-LD, Open Graph, clean heading hierarchy. Pages that lack these signals are "
            "invisible to AI-driven discovery, a channel growing faster than search."
        ),
    },
    "ai_crawler_access": {
        "principle": "crawl access",
        "explanation": (
            "AI crawlers respect robots.txt. Blocking them blocks citations and discovery "
            "from AI-native search surfaces. The fix is one line in robots.txt."
        ),
    },
    "local_gbp": {
        "principle": "local intent match",
        "explanation": (
            "Local search intent carries the highest purchase probability of any search segment. "
            "A page that doesn't surface location, service area, or NAP signals cannot capture "
            "that intent regardless of how much is spent on local ads."
        ),
    },
}

# Default for unknown keys
_DEFAULT_PRINCIPLE = {
    "principle": "conversion signal",
    "explanation": (
        "This element directly affects whether a visitor completes the intended action."
    ),
}


def enrich_with_principles(opp_matrix: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Add `principle` and `principle_explanation` to each finding."""
    for finding in opp_matrix:
        key = finding.get("key", "")
        p = FINDING_PRINCIPLES.get(key, _DEFAULT_PRINCIPLE)
        finding["principle"] = p["principle"]
        finding["principle_explanation"] = p["explanation"]
    return opp_matrix


# ── Strategic finding synthesis ───────────────────────────────────────────────
# Maps the pattern of failing signals to a structural problem type.
# A strategic finding names the *type* of problem the page has, not just
# the worst individual signal.

def _strategic_finding(opp_matrix: list[dict[str, Any]], overall_score: float) -> str:
    """
    Synthesize one sentence naming the single structural shift the page needs.
    Examines which signals are failing and their quadrant to identify the
    dominant problem type.
    """
    if not opp_matrix:
        return (
            "This page passes all core conversion signals — "
            "test the audience and offer before optimizing further."
        )

    failing = [f for f in opp_matrix if f.get("quadrant") in ("quick_win", "major_project")]
    if not failing:
        failing = opp_matrix  # fall back to all findings

    failing_keys = {f["key"] for f in failing}

    # Detect dominant problem patterns (order matters — most specific first)

    # Pattern: message match breakdown — headline fails, ad_signals present
    if "headline" in failing_keys and "ad_signals" in failing_keys:
        return (
            "The page has a message match breakdown — the headline and tracking both need "
            "work, which means the funnel can't be measured and the message may not be landing; "
            "fix measurement first so you can verify whether the headline change actually worked."
        )

    # Pattern: pure trust deficit — social proof fails as the only or top issue
    trust_keys = {"social_proof"}
    if trust_keys.issubset(failing_keys) and len(failing_keys) <= 3:
        if "headline" not in failing_keys and "cta" not in failing_keys:
            return (
                "The page's structure is sound but it asks for trust before earning it — "
                "the highest-leverage change is adding verifiable proof within one scroll "
                "of the primary CTA."
            )

    # Pattern: attention collapse — above_fold + headline both failing
    if "above_fold" in failing_keys and "headline" in failing_keys:
        return (
            "The page loses visitors in the first three seconds — "
            "both the headline and above-fold composition are failing, which means "
            "the fundamental value proposition isn't landing before attention runs out."
        )

    # Pattern: friction-heavy conversion path — cta + above_fold failing
    if "cta" in failing_keys and "above_fold" in failing_keys:
        return (
            "The conversion path has structural friction — visitors can't quickly find "
            "what to do or why to do it, which means even good traffic converts poorly; "
            "the fix is compositional, not copywriting."
        )

    # Pattern: measurement black hole — ad_signals is top issue
    if failing and failing[0]["key"] == "ad_signals":
        return (
            "The page is operating blind — without correct conversion tracking, "
            "every optimization decision is a guess; fix measurement before "
            "changing anything else or you won't know what worked."
        )

    # Pattern: technical drag — load_speed or mobile dominant
    tech_keys = {"load_speed", "mobile"}
    if tech_keys.issubset(failing_keys):
        return (
            "The page has technical conversion drag — slow load and mobile rendering issues "
            "are losing visitors before the message has a chance to land; "
            "these are infrastructure fixes that unblock everything else."
        )

    if "load_speed" in failing_keys and failing[0]["key"] == "load_speed":
        return (
            "The page is leaking paid traffic to load time — "
            "visitors are leaving before the page renders; "
            "performance is the highest-leverage fix on this page."
        )

    # Pattern: good fundamentals, minor gaps
    if overall_score >= 7.0:
        top = failing[0]
        label = FINDING_PRINCIPLES.get(top["key"], {}).get("principle", top.get("label", ""))
        return (
            f"The page converts adequately but has a fixable gap in {label} — "
            "a targeted adjustment to the highest-impact finding could move this "
            "from a passing page to a high-performer without a structural rebuild."
        )

    # Pattern: headline is the top issue
    if failing and failing[0]["key"] == "headline":
        return (
            "The page's conversion ceiling is the headline — "
            "it's the first thing every visitor reads and the primary determinant "
            "of whether they continue; fix this before any other element."
        )

    # Pattern: CTA is the top issue
    if failing and failing[0]["key"] == "cta":
        return (
            "The page is losing conversions at the action point — "
            "visitors are arriving, reading, and leaving without knowing what to do next; "
            "the CTA fix is the single change most likely to move the conversion rate."
        )

    # Generic: name the top finding's principle
    top = failing[0]
    principle = FINDING_PRINCIPLES.get(top["key"], {}).get("principle", "conversion signal")
    issue_short = (top.get("issue") or "")[:120]
    return (
        f"The highest-leverage structural change for this page is improving {principle}: "
        f"{issue_short.rstrip('.')}."
    )
