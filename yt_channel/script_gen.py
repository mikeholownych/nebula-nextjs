"""Generate timed video scripts from audit data.

Output structure:
  {
    "title": str,          # YouTube title
    "description": str,    # YouTube description
    "tags": list[str],
    "segments": [          # Timed narrative segments
      {"start": float, "end": float, "text": str, "visual": str,
       "dimension": str|None}
    ],
    "total_duration": float,
    "worst_dimension": str,
    "overall_score": float,
  }
"""

import re
from datetime import datetime

# ── Dimension labels (mirrors deliver_audit.py) ─────────────────────
DIM_LABELS = {
    "headline": "Headline",
    "cta": "Call to Action",
    "social_proof": "Social Proof",
    "speed": "Page Speed",
    "mobile": "Mobile Optimization",
    "pagespeed": "Page Speed Score",
    "above_fold": "Above the Fold",
    "ad_signals": "Ad Tracking",
    "seo_foundations": "SEO Foundations",
}

DIM_SHORT = {
    "headline": "Headline",
    "cta": "CTA",
    "social_proof": "Social Proof",
    "speed": "Speed",
    "mobile": "Mobile",
    "pagespeed": "PageSpeed",
    "above_fold": "Above Fold",
    "ad_signals": "Ad Tracking",
    "seo_foundations": "SEO",
}

# Words-per-second for TTS narration (conservative)
WPS = 2.5



def _score_band(score):
    if score < 4:
        return "critical", "🔴"
    elif score < 6.5:
        return "needs work", "🟡"
    elif score < 8:
        return "decent", "🟢"
    else:
        return "strong", "✅"


def _worst_key(dimensions):
    """Return dimension key with lowest score."""
    return min(dimensions, key=lambda k: dimensions[k]["score"])


def generate_script(page, audit, url=None):
    """Turn audit data into a timed video script."""
    dims = audit["dimensions"]
    overall = audit["overall"]
    grade = audit.get("overall_grade", "C")
    domain = (url or page.get("url", "unknown")).replace("https://", "").replace("http://", "").split("/")[0]

    worst = _worst_key(dims)
    worst_label = DIM_LABELS.get(worst, worst.replace("_", " ").title())
    worst_score = dims[worst]["score"]
    band, emoji = _score_band(overall)

    # ── Build segments ──────────────────────────────────────────────
    segments = []
    t = 0.0  # running time cursor

    # Intro hook (5 seconds)
    hook = f"Here is another landing page audit. Today we are looking at {domain}."
    seg = {"start": t, "end": t + len(hook) / WPS, "text": hook,
           "visual": "intro_card", "dimension": None}
    segments.append(seg)
    t = seg["end"]

    # Score reveal (4 seconds)
    score_line = f"Overall score: {overall:.1f} out of 10. Grade {grade}. That is {band}."
    seg = {"start": t, "end": t + len(score_line) / WPS, "text": score_line,
           "visual": "score_card", "dimension": None}
    segments.append(seg)
    t = seg["end"]

    # Worst dimension highlight (6 seconds)
    if worst_score < 6:
        highlight = (
            f"The biggest problem: {worst_label}, scoring only {worst_score:.0f} out of 10. "
            f"Here is why that matters."
        )
    else:
        highlight = (
            f"No critical failures, but {worst_label} at {worst_score:.0f} out of 10 "
            f"has room to improve."
        )
    seg = {"start": t, "end": t + len(highlight) / WPS, "text": highlight,
           "visual": f"dimension_{worst}", "dimension": worst}
    segments.append(seg)
    t = seg["end"]

    # Walk through each dimension (sorted by score ascending — worst first)
    sorted_dims = sorted(dims.items(), key=lambda kv: kv[1]["score"])
    for key, data in sorted_dims:
        label = DIM_SHORT.get(key, key.replace("_", " ").title())
        score = data["score"]
        issue = data.get("issue", "No issues detected.")
        fix = data.get("fix", "")

        # Skip dimensions that are fine (score >= 7) unless one of the worst 3
        if score >= 7 and key != worst:
            continue

        narrative = f"{label}: {score} out of 10. {issue}"
        if fix:
            narrative += f" Fix: {fix}"
        # Cap per-dimension narration at ~15 seconds
        max_words = int(15 * WPS)
        words = narrative.split()
        if len(words) > max_words:
            narrative = " ".join(words[:max_words]) + "..."

        seg = {"start": t, "end": t + len(narrative.split()) / WPS,
               "text": narrative, "visual": f"dimension_{key}", "dimension": key}
        segments.append(seg)
        t = seg["end"]

    # Call to action (8 seconds)
    cta = (
        f"Want your own audit? Visit nebulacomponents dot shop slash audit for a free instant score "
        f"with specific fixes for each issue. No call, no credit card."
    )
    seg = {"start": t, "end": t + len(cta.split()) / WPS, "text": cta,
           "visual": "outro_card", "dimension": None}
    segments.append(seg)
    t = seg["end"]

    # ── Title ───────────────────────────────────────────────────────
    if overall < 4:
        title = f"Landing Page Audit: {domain} — Critical Issues Found ({overall:.0f}/10)"
    elif overall < 6.5:
        title = f"Landing Page Teardown: {domain} — Why It Is Not Converting ({overall:.0f}/10)"
    elif overall < 8:
        title = f"Landing Page Review: {domain} — Close to Great ({overall:.0f}/10)"
    else:
        title = f"Landing Page Breakdown: {domain} — What They Are Doing Right ({overall:.0f}/10)"

    # ── Description ─────────────────────────────────────────────────
    desc_lines = [
        f"📊 Landing page audit for {domain}",
        f"",
        f"Score: {overall:.1f}/10 · Grade {grade}",
        f"",
    ]
    for key, data in sorted_dims:
        label = DIM_LABELS.get(key, key.replace("_", " ").title())
        s = data["score"]
        icon = "✅" if s >= 7 else "⚠️" if s >= 5 else "❌"
        desc_lines.append(f"{icon} {label}: {s:.0f}/10")

    desc_lines.extend([
        "",
        "🔧 Fix Map: https://nebulacomponents.shop/7-systems.html",
        "🚀 Free Instant Audit: https://nebulacomponents.shop/audit.html",
        "💻 DIY Fix Kit: https://nebulacomponents.shop/checkout.html",
        "",
        f"#landingpage #cro #conversionoptimization #{domain.split('.')[0]}",
    ])
    description = "\n".join(desc_lines)

    return {
        "title": title,
        "description": description,
        "segments": segments,
        "total_duration": t,
        "worst_dimension": worst,
        "worst_label": worst_label,
        "overall_score": overall,
        "domain": domain,
    }


def format_script_text(script):
    """Return just the narration text for TTS."""
    return " ".join(s["text"] for s in script["segments"])


if __name__ == "__main__":
    # Quick test
    import sys, json
    sample_dims = {
        "headline": {"score": 4, "issue": "Headline is a brand tagline, not a value promise.",
                     "fix": "Rewrite to state the specific outcome for a specific audience."},
        "cta": {"score": 6, "issue": "CTA is generic 'Learn More'.",
                "fix": "Use action + outcome language."},
        "social_proof": {"score": 3, "issue": "No testimonials visible above fold.",
                         "fix": "Add at least one metric or testimonial near the CTA."},
        "speed": {"score": 7, "issue": "Page load acceptable.",
                  "fix": ""},
        "mobile": {"score": 5, "issue": "CTA button too small on mobile.",
                   "fix": "Increase to 48px height."},
        "pagespeed": {"score": 6, "issue": "LCP slightly slow.",
                      "fix": "Optimize hero image."},
        "above_fold": {"score": 4, "issue": "Value prop buried below fold.",
                       "fix": "Move CTA above fold."},
        "ad_signals": {"score": 2, "issue": "No conversion tracking on landing page.",
                       "fix": "Install Facebook Pixel + GA4."},
        "seo_foundations": {"score": 5, "issue": "Title and H1 don't align.",
                            "fix": "Align title tag with H1 keyword focus."},
    }
    page = {"url": "https://example.com"}
    audit = {"overall": 4.5, "overall_grade": "D", "dimensions": sample_dims}
    script = generate_script(page, audit)
    print(json.dumps(script, indent=2))
