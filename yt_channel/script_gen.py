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

    # Intro hook (5 seconds) — Brenda Turner fifth wall (RRDJO_UV4I8):
    # talk to the ONE viewer, not an audience. No "we are looking at".
    # {PAUSE} markers mimic natural speech rhythm (pauses at sentence boundaries).
    hook = f"Today: {domain}. {{PAUSE}} Watch closely — you will see exactly where the money leaks."
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

    # Worst dimension highlight (6 seconds) — viewer-owned, plain label
    from yt_channel.short_gen import PLAIN_LABELS as _PL
    plain = _PL.get(worst, worst_label.lower())
    if worst_score < 6:
        highlight = (
            f"The biggest problem is your {plain}: only {worst_score:.0f} out of 10. "
            f"That is costing you sales."
        )
    else:
        highlight = (
            f"No critical failures, but your {plain} scores {worst_score:.0f} out of 10. "
            f"There is room to grow."
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

        # Brenda Turner fifth wall: the viewer owns the audit. Report as
        # "your {plain}" instead of a third-person report read at them.
        plain = _PL.get(key, label.lower())
        narrative = f"Your {plain} scores {score} out of 10. {issue}"
        if fix:
            narrative += f" Here is the fix: {fix}"
        # Cap per-dimension narration at ~15 seconds
        max_words = int(15 * WPS)
        words = narrative.split()
        if len(words) > max_words:
            narrative = " ".join(words[:max_words]) + "..."

        seg = {"start": t, "end": t + len(narrative.split()) / WPS,
               "text": narrative, "visual": f"dimension_{key}", "dimension": key}
        segments.append(seg)
        t = seg["end"]

    # Call to action (8 seconds) — ends with the verbal sign-off ritual
    # (vidIQ Primal Branding): the same line every video, so viewers
    # anticipate it. Also Brenda Turner voice: direct, one-to-one.
    cta = (
        f"Want your own audit? Get a free instant score at nebulacomponents dot com slash audit. "
        f"Enter your email and the full fix list is sent straight to your inbox. No call, no credit card. "
        f"That's your number. Nebula's got your fix."
    )
    seg = {"start": t, "end": t + len(cta.split()) / WPS, "text": cta,
           "visual": "outro_card", "dimension": None}
    segments.append(seg)
    t = seg["end"]

    # ── Title ───────────────────────────────────────────────────────
    # Search-intent first: lead with the pain, keep domain secondary.
    if overall < 4:
        title = f"Your Landing Page Is Bleeding Money: {domain} Audit ({overall:.0f}/10)"
    elif overall < 6.5:
        title = f"Why This Landing Page Isn't Converting: {domain} Teardown ({overall:.0f}/10)"
    elif overall < 8:
        title = f"What {domain} Gets Right (That Most Pages Don't): Review ({overall:.0f}/10)"
    else:
        title = f"How {domain} Turns Visitors Into Customers: Breakdown ({overall:.0f}/10)"

    # Holy-trifecta title step: generate variants, score, pick best.
    from yt_channel.title_score import pick_best
    variant_pain = f"Your Landing Page Is Costing You Sales: {domain} Teardown ({overall:.0f}/10)"
    variant_question = f"Is Your Landing Page Leaving Money On The Table? {domain} Audit ({overall:.0f}/10)"
    variant_specific = f"{domain} Scores {overall:.0f}/10 — Landing Page Audit"
    best = pick_best([title, variant_pain, variant_question, variant_specific],
                     is_short=False, domain=domain, has_score=True, seed=domain)
    title = best.title

    # ── Description ─────────────────────────────────────────────────
    # Shane Hummus (N45nMvSOgFQ) tip #5: most important links go at the
    # VERY TOP of the description (above the fold in the preview; ~everyone
    # sees the first lines, few scroll), SEO copy BELOW the links.
    audit_link = ("https://nebulacomponents.com/audit?utm_source=youtube"
                  f"&utm_medium=video&utm_campaign={domain}")
    desc_lines = [
        audit_link,
        f"",
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
        "Your worst issue: {worst_label} ({worst_score:.0f}/10)".format(
            worst_label=worst_label,
            worst_score=min(data["score"] for _, data in sorted_dims)),
        "",
    ])

    # Chapter timestamps (from segment timing — helps YouTube understand
    # the video and gives viewers a jump menu).
    def _mmss(sec: float) -> str:
        m, s = divmod(int(sec), 60)
        return f"{m}:{s:02d}"
    seen = set()
    chapters = ["Timestamps:"]
    for seg in segments:
        visual = seg.get("visual", "")
        if visual == "intro_card":
            label = "Intro"
        elif visual == "score_card":
            label = "Score Overview"
        elif visual == "outro_card":
            label = "Get Your Free Audit"
        elif visual.startswith("dimension_"):
            label = DIM_LABELS.get(seg.get("dimension"), seg.get("dimension", "").replace("_", " ").title())
        else:
            label = seg.get("dimension") or "Intro"
        # One chapter per section (worst-dimension gets highlight + narrative
        # segments — keep only the first, at the earliest timestamp).
        if label in seen:
            continue
        seen.add(label)
        chapters.append(f"{_mmss(seg['start'])} {label}")
    desc_lines.append("\n".join(chapters))

    desc_lines.extend([
        "",
        # Primal branding creed (vidIQ pgvFAwznds0): one line, every video
        "Real audits. Real scores. No fluff.",
        "",
        "Fix Map: https://nebulacomponents.com/7-systems.html",
        "DIY Fix Kit: https://nebulacomponents.com/checkout.html",
        "",
        # vidIQ tactic (rBIeT9iLmnU): channel URL + sub_confirmation=1
        # triggers an instant subscribe popup on arrival (choice
        # architecture — the channel page is a top-3 subscriber source).
        "Subscribe for a daily landing page teardown:",
        "https://www.youtube.com/@nebulaaudits?sub_confirmation=1",
        "",
        # Element 4: ritual — the verbal sign-off line, same every video
        "That's your number. Nebula's got your fix.",
        "",
        f"#landingpage #cro #conversionoptimization #{domain.split('.')[0]}",
    ])
    description = "\n".join(desc_lines)

    # Brenda Turner fifth-wall voice gate (RRDJO_UV4I8) — fail-closed:
    # a script that talks AT an audience must never be produced.
    from yt_channel.readability import check_voice
    voice = check_voice(" ".join(s["text"] for s in segments))
    if not voice["pass"]:
        raise ValueError(f"Fifth-wall voice gate FAILED: {voice['reason']}")

    return {
        "title": title,
        "description": description,
        "segments": segments,
        "total_duration": t,
        "worst_dimension": worst,
        "worst_label": worst_label,
        "overall_score": overall,
        "domain": domain,
        "voice": voice,
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
