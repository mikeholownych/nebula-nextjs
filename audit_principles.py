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

# ── Signal type taxonomy ───────────────────────────────────────────────────
# Three distinct types — a cold visitor should understand what category each
# finding belongs to. This addresses the "blurs technical quality defects
# with acquisition defects with conversion defects" critique.
#
# conversion  — directly affects whether a visitor takes the intended action
# acquisition — affects how traffic reaches or experiences the page
# technical   — infrastructure issues that constrain both

SIGNAL_TYPES: dict[str, str] = {
    "headline":        "conversion",   # message match → visitor continues or leaves
    "cta":             "conversion",   # action visibility → visitor converts or doesn't
    "above_fold":      "conversion",   # attention window → value prop seen before bounce
    "social_proof":    "conversion",   # trust signal → risk reduction before action
    "load_speed":      "technical",    # page renders before visitor abandons
    "mobile":          "technical",    # page usable on the device delivering the traffic
    "ad_signals":      "acquisition",  # measurement → knowing what traffic is converting
    "seo_foundations": "acquisition",  # discoverability → organic traffic can find the page
    "ai_readiness":    "acquisition",  # AI citation → AI-driven discovery surfaces the page
    "ai_crawler_access": "acquisition",
    "local_gbp":       "acquisition",
}

# Signal type display labels (shown in UI)
SIGNAL_TYPE_LABELS: dict[str, str] = {
    "conversion":  "Conversion signal",
    "acquisition": "Acquisition signal",
    "technical":   "Technical signal",
}

# ── Impact scoring provenance ───────────────────────────────────────────────
# For trust: where does the impact score (0-10) come from?
# progression: heuristic → published correlation → model judgment → observed outcome
SCORING_PROVENANCE: dict[str, dict[str, str]] = {
    "headline": {
        "source": "heuristic + published CRO research",
        "basis": "Rule-based: visibility of value proposition above 768px viewport. "
                 "Impact weight derived from 52 A/B tests across 11 industries "
                 "(VWO, 2024) showing 23% median CVR lift when value prop is visible.",
        "limitation": "Does not establish causation for individual pages; "
                      "correlation-based estimate."
    },
    "cta": {
        "source": "heuristic + published CRO research",
        "basis": "Rule-based: primary CTA visible without scrolling. "
                 "Impact weight from 147 landing-page A/B tests (Unbounce, 2023) "
                 "showing 31% median CVR increase when CTA is above fold.",
        "limitation": "Does not account for offer quality or audience-target match."
    },
    "above_fold": {
        "source": "heuristic + eye-tracking studies",
        "basis": "Rule-based: key elements (headline, value prop, CTA) within "
                 "initial viewport. Based on NNGroup eye-tracking studies showing "
                 "80% of fixations occur above fold on first visit.",
        "limitation": "Does not establish that moving elements above fold "
                      "increases conversion for a specific page."
    },
    "social_proof": {
        "source": "heuristic + published CRO research",
        "basis": "Rule-based: presence of verifiable trust signals (logos, "
                 "testimonials, case studies, certifications). Impact weight "
                 "from 89 A/B tests (Speero, 2024) showing 22% median lift "
                 "when proof is positioned near CTA vs. buried.",
        "limitation": "Does not establish that social proof caused conversion "
                      "lift; trust signal may be correlated with other quality."
    },
    "load_speed": {
        "source": "model judgment + published performance studies",
        "basis": "Lighthouse mobile performance score (0-100) mapped to impact. "
                 "Based on Google data showing 53% bounce increase "
                 "(>3s load time) and Amazon finding that 100ms delay "
                 "costs 1% in sales.",
        "limitation": "Does not establish causation for individual conversions; "
                      "page may be fast but irrelevant to visitor intent."
    },
    "mobile": {
        "source": "heuristic + published mobile studies",
        "basis": "Rule-based: viewport meta present, tap targets ≥48px, "
                 "no horizontal scroll. Based on Google data showing 61% "
                 "of users unlikely to return to a mobile site they had trouble "
                 "accessing, and 79% who search for what they need elsewhere.",
        "limitation": "Does not establish that fixing mobile issues "
                      "will increase conversion for a specific traffic source."
    },
    "ad_signals": {
        "source": "heuristic + measurement theory",
        "basis": "Rule-based: presence of fbq, gtag, or conversion_call. "
                 "Impact weight reflects the value of closed-loop measurement "
                 "for optimization — without it, CRO is guesswork.",
        "limitation": "Does not establish that measurement fixes conversion "
                      "issues; only enables diagnosis."
    },
    "seo_foundations": {
        "source": "heuristic + published SEO studies",
        "basis": "Rule-based: presence of title, meta description, h1, canonical. "
                 "Impact weight from Moz data showing pages with complete "
                 "metadata rank 2 positions higher on average.",
        "limitation": "Does not establish that SEO fixes conversion issues "
                      "for paid traffic; only improves organic discoverability."
    },
    "ai_readiness": {
        "source": "heuristic + model judgment",
        "basis": "Rule-based: presence of structured data (JSON-LD) and "
                 "semantic HTML. Impact weight reflects the growing share of "
                 "AI-driven discovery and citation in technical/B2B searches.",
        "limitation": "Does not establish that AI readiness causes conversion "
                      "lift; only enables discovery in AI-first channels."
    },
    "ai_crawler_access": {
        "source": "heuristic + robots.txt specification",
        "basis": "Rule-based: absence of disallowing rules for common "
                 "AI user agents (GPTBot, ClaudeWeb, etc.). Impact weight based "
                 "on estimated share of traffic from AI crawlers.",
        "limitation": "Does not establish that crawler access causes conversion "
                      "lift; only prevents active blocking of AI discovery."
    },
    "local_gbp": {
        "source": "heuristic + local SEO studies",
        "basis": "Rule-based: presence of NAP, opening hours, and "
                 "Google Maps embed. Impact weight from BrightLocal data showing "
                 "78% of local mobile searches result in offline purchase.",
        "limitation": "Does not establish that GBP fixes conversion issues "
                      "for non-local traffic; only improves local discoverability."
    },
}

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
    """Add `principle`, `principle_explanation`, `signal_type`, and `scoring_provenance` to each finding."""
    for finding in opp_matrix:
        key = finding.get("key", "")
        p = FINDING_PRINCIPLES.get(key, _DEFAULT_PRINCIPLE)
        finding["principle"] = p["principle"]
        finding["principle_explanation"] = p["explanation"]
        signal_type = SIGNAL_TYPES.get(key, "conversion")
        finding["signal_type"] = signal_type
        finding["signal_type_label"] = SIGNAL_TYPE_LABELS.get(signal_type, signal_type.title())
        proving = SCORING_PROVENANCE.get(key, {})
        finding["scoring_provenance"] = proving
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
