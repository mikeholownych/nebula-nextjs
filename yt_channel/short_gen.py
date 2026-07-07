"""Generate a short (30-45s) script for YouTube Shorts from audit data.

Format:
  - Hook (3s): punchy stat about the worst dimension
  - Problem (12s): what's broken and why it costs money
  - Fix (12s): specific actionable fix
  - CTA (5s): free audit offer
"""

from .script_gen import DIM_LABELS, DIM_SHORT, _score_band, _worst_key

WPS = 2.8  # Slightly faster pace for Shorts


def generate_short_script(page, audit, url=None):
    """Turn audit data into a ~35s YouTube Short script."""
    dims = audit["dimensions"]
    overall = audit["overall"]
    grade = audit.get("overall_grade", "C")
    domain = (
        (url or page.get("url", "unknown"))
        .replace("https://", "")
        .replace("http://", "")
        .split("/")[0]
    )

    worst = _worst_key(dims)
    worst_label = DIM_LABELS.get(worst, worst.replace("_", " ").title())
    worst_score = dims[worst]["score"]
    worst_issue = dims[worst].get("issue", "")
    worst_fix = dims[worst].get("fix", "")
    band, _ = _score_band(worst_score)

    segments = []
    t = 0.0

    # 1. Hook (3-4s) — pattern interrupt
    hook_options = {
        "speed":        f"This site loses visitors in 3 seconds. Here is why.",
        "mobile":       f"60 percent of your traffic is mobile. This site is failing them.",
        "social_proof": f"Nobody trusts this page. No testimonials, no proof, no conversions.",
        "cta":          f"Visitors hit this page and have no idea what to do next.",
        "headline":     f"This headline is costing the owner customers every single day.",
        "above_fold":   f"The offer is buried. Visitors leave before they ever see it.",
        "ad_signals":   f"Ad spend is being wasted because this page has zero tracking.",
        "pagespeed":    f"Google hates this page. Users bounce before it even loads.",
        "seo_foundations": f"This page cannot be found. It does not exist to Google.",
    }
    hook = hook_options.get(worst, f"This landing page is failing on {worst_label}.")
    seg = {
        "start": t, "end": t + len(hook.split()) / WPS,
        "text": hook, "visual": "hook_card", "dimension": None,
    }
    segments.append(seg)
    t = seg["end"]

    # 2. Site + score reveal (4s)
    reveal = f"We audited {domain}. Score: {overall:.0f} out of 10."
    seg = {
        "start": t, "end": t + len(reveal.split()) / WPS,
        "text": reveal, "visual": "score_card", "dimension": None,
    }
    segments.append(seg)
    t = seg["end"]

    # 3. Problem (10-12s) — explain the worst dimension
    if worst_issue:
        # Cap at ~10 seconds of speech
        max_words = int(10 * WPS)
        words = worst_issue.split()
        issue_text = " ".join(words[:max_words])
        problem = f"The biggest problem: {worst_label} scored {worst_score:.0f} out of 10. {issue_text}"
    else:
        problem = f"The biggest problem: {worst_label} scored {worst_score:.0f} out of 10. That is {band}."

    seg = {
        "start": t, "end": t + len(problem.split()) / WPS,
        "text": problem, "visual": "problem_card", "dimension": worst,
    }
    segments.append(seg)
    t = seg["end"]

    # 4. Fix (10-12s)
    if worst_fix:
        max_words = int(10 * WPS)
        words = worst_fix.split()
        fix_text = " ".join(words[:max_words])
        fix = f"Here is the fix: {fix_text}"
    else:
        fix = f"Fix your {worst_label} and you will see more conversions immediately."

    seg = {
        "start": t, "end": t + len(fix.split()) / WPS,
        "text": fix, "visual": "fix_card", "dimension": worst,
    }
    segments.append(seg)
    t = seg["end"]

    # 5. CTA (4-5s)
    cta = "Get a free audit of your own site at nebulacomponents dot shop. Takes 30 seconds."
    seg = {
        "start": t, "end": t + len(cta.split()) / WPS,
        "text": cta, "visual": "cta_card", "dimension": None,
    }
    segments.append(seg)
    t = seg["end"]

    # Title — optimised for Shorts discoverability
    title_hooks = {
        "speed":        f"Your Site Is Bleeding Visitors #Shorts",
        "mobile":       f"Mobile Is Killing Your Conversions #Shorts",
        "social_proof": f"Nobody Trusts Your Page. Here's Why #Shorts",
        "cta":          f"Your CTA Is Invisible. Fix It #Shorts",
        "headline":     f"Your Headline Is Costing You Sales #Shorts",
        "above_fold":   f"Your Offer Is Hidden. No Wonder It's Not Converting #Shorts",
        "ad_signals":   f"You're Wasting Ad Spend On This Page #Shorts",
        "pagespeed":    f"Your Page Load Is Killing Your ROI #Shorts",
        "seo_foundations": f"Google Can't Find Your Page #Shorts",
    }
    title = title_hooks.get(worst, f"Landing Page Audit: {domain} — {worst_label} Breakdown #Shorts")

    description = (
        f"Free landing page audit: {domain}\n\n"
        f"Score: {overall:.0f}/10 — worst issue: {worst_label} ({worst_score:.0f}/10)\n\n"
        f"Get a free audit of your own site:\n"
        f"https://nebulacomponents.shop\n\n"
        f"#LandingPage #CRO #ConversionOptimization #Shorts #MarketingTips"
    )

    return {
        "title": title,
        "description": description,
        "segments": segments,
        "total_duration": t,
        "worst_dimension": worst,
        "worst_label": worst_label,
        "worst_score": worst_score,
        "overall_score": overall,
        "domain": domain,
        "format": "short",
    }
