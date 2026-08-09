"""Generate a short (30-45s) script for YouTube Shorts from audit data.

Format:
  - Hook (3s): punchy stat about the worst dimension
  - Problem (12s): what's broken and why it costs money
  - Fix (12s): specific actionable fix
  - CTA (5s): free audit offer
"""

from .script_gen import DIM_LABELS, DIM_SHORT, _score_band, _worst_key

WPS = 2.8  # Slightly faster pace for Shorts


# ── Hormozi hook types (from The 6 Hook Types playbook) ──────────────
# Bold Claim (24%) · Proof Bomb (22%) · Direct Callout (15%)
# Case Study Intro (14%) · Story (8%) · Question (6%)

def _build_hormozi_hook(worst, worst_label, worst_score, worst_issue, dims, domain):
    """Pick a hook type based on the finding; rotate across types."""
    import hashlib
    h = int(hashlib.md5((domain + worst).encode()).hexdigest(), 16) % 6

    # Grab a second-worst dimension for contrast
    sorted_dims = sorted(dims.items(), key=lambda kv: kv[1].get("score", 10))
    second = sorted_dims[1][0] if len(sorted_dims) > 1 else worst
    second_label = DIM_LABELS.get(second, second.replace("_", " ").title())

    if h == 0:
        # Bold Claim — provocative statement, no context
        return (f"Most landing pages don't fail on design. They fail on "
                f"{worst_label.lower()} — and nobody notices until the ads stop paying.")
    if h == 1:
        # Direct Callout — "You're not X because Y"
        return (f"Your page isn't losing customers because of your offer. "
                f"It's losing them because {worst_label.lower()} is broken.")
    if h == 2:
        # Proof Bomb — specific number
        return (f"{worst_score:.0f} out of 10. That's the {worst_label.lower()} "
                f"score for this page.")
    if h == 3:
        # Case Study — introduce the site as the subject
        return (f"We audited {domain}. The {worst_label.lower()} alone "
                f"is costing them conversions every day.")
    if h == 4:
        # Story — narrative opening
        return (f"Someone is paying for ads to send people to this page. "
                f"The page just isn't doing its part.")
    # Question — rarely used, always followed by answer
    return (f"Want to know why {domain} isn't converting? "
            f"It's not the traffic. It's {worst_label.lower()}.")


def _build_ppp_reveal(domain, overall, grade, worst_label):
    """Proof (score) → Promise (what you'll learn) → Plan (the audit)."""
    return (f"We audited {domain}. Score: {overall:.0f} out of 10, grade {grade}. "
            f"By the end of this video, you'll know exactly what's broken "
            f"and how to fix it.")


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

    # 1. Hook (3-4s) — Hormozi 6 hook types, rotating by audit findings
    hook = _build_hormozi_hook(worst, worst_label, worst_score, worst_issue, dims, domain)
    seg = {
        "start": t, "end": t + len(hook.split()) / WPS,
        "text": hook, "visual": "hook_card", "dimension": None,
    }
    segments.append(seg)
    t = seg["end"]

    # 2. Site + score reveal (4s) — Proof bomb + Promise
    reveal = _build_ppp_reveal(domain, overall, grade, worst_label)
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
    cta = "Get a free audit of your own site at nebulacomponents dot com. Takes 30 seconds — your fix list gets emailed to you."
    seg = {
        "start": t, "end": t + len(cta.split()) / WPS,
        "text": cta, "visual": "cta_card", "dimension": None,
    }
    segments.append(seg)
    t = seg["end"]

    # Title — optimised for Shorts discoverability.
    # Evidence (title_research 2026-08-09): the strongest ICAHN outlier
    # (82x views/subs) used a QUESTION-first title, yet only 13% of niche
    # titles are questions. Rotate declarative/question per subject so the
    # same dimension gets variety and we test both styles.
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
    question_hooks = {
        "speed":        f"Slow Page? Your Visitors Left 3 Seconds Ago #Shorts",
        "mobile":       f"Mobile Users Leaving? Here's Why #Shorts",
        "social_proof": f"Nobody Trusts Your Page? Here's Why #Shorts",
        "cta":          f"CTA Getting No Clicks? It's Invisible #Shorts",
        "headline":     f"Headline Not Converting? That's Why #Shorts",
        "above_fold":   f"Offer Hidden Below the Fold? Big Mistake #Shorts",
        "ad_signals":   f"Ads Clicking But No Sales? Check This #Shorts",
        "pagespeed":    f"Page Slow? Your ROI Is Paying For It #Shorts",
        "seo_foundations": f"Google Ignoring Your Page? Here's Why #Shorts",
    }
    import hashlib
    from yt_channel.title_score import pick_best
    style = "question" if int(hashlib.md5(f"{domain}|{worst}".encode()).hexdigest(), 16) % 2 else "declarative"
    hooks = question_hooks if style == "question" else title_hooks
    base = hooks.get(worst, f"Landing Page Audit: {domain} — {worst_label} Breakdown #Shorts")

    # Generate 3-4 variants, score for click potential, pick the best
    # (holy-trifecta title step; deterministic per domain).
    declarative = title_hooks.get(worst, base)
    questioning = question_hooks.get(worst, base)
    specific = f"{domain} Scores {overall:.0f}/10 — Here's The Worst Issue #Shorts"
    pain = f"Stop Losing Sales: {domain} Teardown ({overall:.0f}/10) #Shorts"
    variants = list(dict.fromkeys([declarative, questioning, specific, pain, base]))
    best = pick_best(variants, is_short=True, domain=domain, has_score=True, seed=f"{domain}|{worst}")
    title = best.title

    description = (
        f"Free landing page audit: {domain}\n\n"
        f"Score: {overall:.0f}/10 — worst issue: {worst_label} ({worst_score:.0f}/10)\n\n"
        f"Get a free audit of your own site — fix list emailed to you:\n"
        f"https://nebulacomponents.com/audit?utm_source=youtube&utm_medium=shorts&utm_campaign={domain}\n\n"
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
