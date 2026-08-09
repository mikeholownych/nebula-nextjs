"""Generate a short (30-45s) script for YouTube Shorts from audit data.

Format:
  - Hook (3s): punchy stat about the worst dimension
  - Problem (12s): what's broken and why it costs money
  - Fix (12s): specific actionable fix
  - CTA (5s): free audit offer
"""

from .script_gen import DIM_LABELS, DIM_SHORT, _score_band, _worst_key

import re

WPS = 2.8  # Slightly faster pace for Shorts

# ── Jenny Hoyos plain-speak labels (As7abwNhG7Y) ─────────────────────
# Jargon words like "call to action", "conversion optimization" inflate
# the readability score (she targets 5th grade or under; Mr Beast = 1st
# grade). Use these plain equivalents in NARRATION (visual labels can
# stay technical). This is the 'explain the concept, not the jargon'
# rule applied to the dimension names.
PLAIN_LABELS = {
    "cta": "your main button",
    "headline": "the headline",
    "social_proof": "the trust signals",
    "mobile": "the mobile view",
    "load_speed": "the load speed",
    "pagespeed": "the load speed",
    "ad_signals": "the ad setup",
    "seo_foundations": "the Google visibility",
    "above_fold": "the layout",
}

# Jenny's rule applied to the audit engine's own wording: the generated
# issue/fix text uses marketing jargon ("CTA", "above the fold",
# "immediately") that inflates readability. Swap for plain equivalents
# BEFORE narration (visual text can stay technical).
SIMPLIFY = {
    "call to action": "button",
    "cta": "button",
    "above the fold": "at the top",
    "below the fold": "out of sight",
    "immediately": "right away",
    "visitors": "people",
    "nearly invisible": "hard to see",
    "low contrast": "hard to see",
    "increase its contrast": "make it stand out",
    "increase contrast": "make it stand out",
    "conversion": "sale",
    "conversions": "sales",
    "optimization": "tuning",
    "optimize": "improve",
    "strategy": "plan",
    "leverage": "use",
    "significant": "big",
    "substantial": "big",
    "utilize": "use",
}


def _simplify(text: str) -> str:
    """Strip jargon from audit-generated text (Jenny Hoyos readability)."""
    t = text
    for k, v in SIMPLIFY.items():
        t = re.sub(rf"\b{k}\b", v, t, flags=re.IGNORECASE)
    return t


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
    plain_label = PLAIN_LABELS.get(worst, worst_label)  # Jenny Hoyos: plain-speak
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

    # 2. Foreshadow (Jenny Hoyos: 2 lines telling what's at the end;
    #    the score reveal is held for the REWARD at the end — saying it
    #    here AND there wastes a second and kills the payoff)
    foreshadow = (
        f"We audited {domain}. Watch to the end — you'll see "
        f"exactly what's broken and how to fix it."
    )
    seg = {
        "start": t, "end": t + len(foreshadow.split()) / WPS,
        "text": foreshadow, "visual": "score_card", "dimension": None,
    }
    segments.append(seg)
    t = seg["end"]

    # 3. Problem (8s total — Jenny: every second counts; long problem
    #    segments lose the viewer) — plain-speak label + simplified text
    budget = int(8 * WPS)  # whole-segment word budget (prefix included)
    prefix = f"The biggest problem: {plain_label} scored {worst_score:.0f} out of 10. "
    if worst_issue:
        issue_text = _simplify(worst_issue)
        # avoid repeating the label (prefix already says 'your main button')
        for lead in ("button ", "the button "):
            if issue_text.lower().startswith(lead):
                issue_text = issue_text[len(lead):]
                break
        words = issue_text.split()
        issue_text = " ".join(words[: max(0, budget - len(prefix.split()))])
        problem = f"{prefix}{issue_text}"
    else:
        problem = f"The biggest problem: {plain_label} scored {worst_score:.0f} out of 10. That is {band}."

    seg = {
        "start": t, "end": t + len(problem.split()) / WPS,
        "text": problem, "visual": "problem_card", "dimension": worst,
    }
    segments.append(seg)
    t = seg["end"]

    # 4. Fix (8s total) — plain-speak
    budget = int(8 * WPS)
    prefix = "Here's the fix: "
    if worst_fix:
        fix_text = _simplify(worst_fix)
        # Jenny: split long sentences to keep FK ≤ 5th grade
        fix_text = re.sub(r"\bso ", ". ", fix_text, count=1)
        fix_text = re.sub(r"\bthat ", ". ", fix_text, count=1)
        words = fix_text.split()
        fix_text = " ".join(words[: max(0, budget - len(prefix.split()))])
        fix = f"{prefix}{fix_text}"
    else:
        fix = f"Fix the {plain_label} and you'll see more sales right away."

    seg = {
        "start": t, "end": t + len(fix.split()) / WPS,
        "text": fix, "visual": "fix_card", "dimension": worst,
    }
    segments.append(seg)
    t = seg["end"]

    # 5. Reward (payoff — E'Calm retention psychology, srDpvEnGQg4):
    # the most rewarding reveal goes at the END so the viewer feels
    # payoff, then cut immediately. Score as the reveal moment.
    reward = (
        f"There it is: {domain} scores {overall:.0f} out of 10, grade {grade}. "
        f"That's the number your ads are paying for."
    )
    seg = {
        "start": t, "end": t + len(reward.split()) / WPS,
        "text": reward, "visual": "reward_card", "dimension": None,
    }
    segments.append(seg)
    t = seg["end"]

    # 6. CTA (Jenny Hoyos: short, simple sentences; 'nebulacomponents'
    #    is a brand name so it carries syllables, but the rest stays
    #    plain — 4 short sentences, each under 5th grade)
    cta = ("Get a free audit of your site. It takes 30 seconds. "
           "Fixes get emailed to you. Nebula Components dot com.")
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
        # vidIQ tactic (rBIeT9iLmnU): sub_confirmation=1 triggers an instant
        # subscribe popup on the channel page (choice architecture).
        f"Subscribe for a daily landing page teardown:\n"
        f"https://www.youtube.com/@nebulaaudits?sub_confirmation=1\n\n"
        f"#LandingPage #CRO #ConversionOptimization #Shorts #MarketingTips"
    )

    # Jenny Hoyos readability gate (As7abwNhG7Y): target 5th grade or
    # under on every segment; report so the orchestrator can log it.
    from yt_channel.readability import check_script
    readability = check_script(segments)
    readability_fail = [r["fk_grade"] for r in readability if not r["pass"]]

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
        "readability": {
            "target": 5,
            "segments": readability,
            "all_pass": not readability_fail,
            "failing_grades": readability_fail,
        },
    }
