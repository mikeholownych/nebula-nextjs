"""
teardown_script.py — Story-first narration for landing page teardowns.

This replaces the findings-list format with a human voice doing a live
teardown. The narration never says "finding", "signal", or "quadrant".
It sounds like someone who just opened the page and is talking through
what they notice — casual, direct, and specific.

Script structure (total ~90-120s narration):
  HOOK        (8-12s)  — Irony + what you're about to see
  ABOVE_FOLD  (10-15s) — First impression, what the visitor sees
  FINDING_1   (15-20s) — Biggest issue: what it is, why it costs money, the fix
  FINDING_2   (15-20s) — Second issue (if Quick Win)
  FINDING_3   (10-15s) — Third issue (if Quick Win)
  SCORE       (8-10s)  — The number + what it means in real money
  OFFER       (8-10s)  — Free audit + $97 sprint
  CTA         (5-8s)   — Drop your URL in the comments

Each segment has:
  text:       narration (human voice, no jargon)
  visual:     what's on screen ('evidence_headline', 'evidence_mobile',
              'above_fold', 'score_card', 'cta_card', etc.)
  dimension:  finding key (for evidence frame lookup)
  duration_hint: approximate seconds
"""

import re
from pathlib import Path

WPS = 2.4  # words per second (ElevenLabs Charlie, natural pace)

# ── Context detection ──────────────────────────────────────────────────────────

def _detect_context(domain: str, audit: dict) -> dict:
    """Detect what makes this page interesting for a teardown narrative."""
    title = (audit.get("page_title") or "").lower()
    h1    = (audit.get("page_h1")    or "").lower()
    findings = audit.get("findings") or audit.get("opp_matrix") or []
    score = float(audit.get("composite") or audit.get("score") or audit.get("overall") or 0)

    # Detect business type from domain + title
    agency_words  = ["agency", "marketing", "media", "ads", "ppc", "growth", "digital"]
    ecom_words    = ["shop", "store", "buy", "cart", "product"]
    saas_words    = ["app", "software", "platform", "saas", "tool", "dashboard"]
    coach_words   = ["coach", "consult", "mentor", "program", "course"]

    is_agency = any(w in domain or w in title for w in agency_words)
    is_ecom   = any(w in domain or w in title for w in ecom_words)
    is_saas   = any(w in domain or w in title for w in saas_words)
    is_coach  = any(w in domain or w in title for w in coach_words)

    # Get top quick-win findings
    quick_wins = [f for f in findings if f.get("quadrant") in ("quick_win", "Quick Win")]
    quick_wins.sort(key=lambda f: float(f.get("impact", 0)), reverse=True)

    return {
        "domain": domain,
        "score": score,
        "is_agency": is_agency,
        "is_ecom": is_ecom,
        "is_saas": is_saas,
        "is_coach": is_coach,
        "quick_wins": quick_wins[:3],
        "all_findings": findings,
        "h1": h1,
        "title": title,
    }


# ── Hook lines ────────────────────────────────────────────────────────────────

def _hook_line(ctx: dict) -> str:
    domain = ctx["domain"]
    score  = ctx["score"]
    qw     = ctx["quick_wins"]

    # Irony-first hooks based on business type
    if ctx["is_agency"]:
        return (
            f"This is a paid media agency. They run ads for other businesses. "
            f"I'm going to audit their own landing page right now — "
            f"and what I find is going to make a lot of sense."
        )
    elif ctx["is_ecom"]:
        return (
            f"This store is spending money on paid ads. People are clicking. "
            f"I'm going to show you exactly why they're not buying."
        )
    elif ctx["is_saas"]:
        return (
            f"This SaaS product has a landing page problem. "
            f"If they're running paid traffic to this, it's leaking. "
            f"Let me show you what I mean."
        )
    else:
        # Generic but strong
        verb = "costing" if score < 6.5 else "limiting"
        return (
            f"Someone is spending money on ads to send people to this page. "
            f"I'm going to show you what's {verb} them money — "
            f"and every single thing I find is fixable this week."
        )


def _above_fold_line(ctx: dict) -> str:
    """What the visitor sees first."""
    h1 = ctx["h1"]
    if not h1 or len(h1) < 5:
        return (
            "When someone arrives from an ad, this is the first thing they see. "
            "There's no clear headline telling them what this is about. "
            "Think about that — they clicked an ad, they're interested, "
            "and the first thing the page does is leave them guessing."
        )
    elif len(h1.split()) < 4:
        return (
            f"First impression: the headline says '{h1[:60]}'. "
            "That's three words. "
            "When someone arrives from a paid ad expecting a specific promise, "
            "three words don't close that gap. "
            "The visitor doesn't know yet if they're in the right place."
        )
    else:
        return (
            "Here's what the page looks like when someone arrives. "
            "This is your one shot — the visitor decides in about three seconds "
            "whether they're in the right place. "
            "Let me show you what's working and what isn't."
        )


# ── Per-finding narration ─────────────────────────────────────────────────────

# Human-language templates per finding key
# Each template gets .format(domain=, issue=, fix=)
FINDING_NARRATION: dict[str, str] = {
    "headline": (
        "The headline is the first thing a paid-traffic visitor reads. "
        "{issue_human}. "
        "When the ad said something specific and the page doesn't match it, "
        "people bounce — not because they weren't interested, but because "
        "the page didn't confirm they were in the right place. "
        "The fix is simple: {fix_human}. "
        "That one change can cut your bounce rate on paid traffic significantly."
    ),
    "cta": (
        "Now look at the call to action. "
        "{issue_human}. "
        "This matters more than people realize — "
        "if someone has to look for the button, they won't. "
        "On paid traffic you're paying for every click, and if the CTA isn't obvious, "
        "you're paying for people to leave. "
        "{fix_human}."
    ),
    "mobile": (
        "Here's the mobile view. This is what more than half of your visitors see. "
        "{issue_human}. "
        "Mobile isn't an afterthought anymore — "
        "it's probably where your highest-intent traffic is coming from. "
        "{fix_human}."
    ),
    "social_proof": (
        "Cold traffic doesn't trust you yet. "
        "{issue_human}. "
        "Before someone buys from a page they've never seen, "
        "they need to see evidence that other people have already made that decision. "
        "Without it, the page is asking for a leap of faith. "
        "{fix_human}."
    ),
    "message_match": (
        "Here's a classic paid-traffic problem. "
        "{issue_human}. "
        "When someone clicks an ad about one thing and the page talks about something else, "
        "the brain flags it as a mismatch. "
        "They don't consciously know why — they just leave. "
        "{fix_human}."
    ),
    "load_speed": (
        "Page speed. {issue_human}. "
        "Google's own research says that every extra second of load time "
        "costs roughly seven percent of conversions. "
        "On paid traffic, you're already paying for those clicks — "
        "slow pages mean you're paying for people who left before the page even loaded. "
        "{fix_human}."
    ),
    "seo_foundations": (
        "The technical basics. {issue_human}. "
        "These aren't just SEO issues — they affect how AI systems and search engines "
        "read the page, and increasingly, how the page gets cited in AI answers. "
        "If the structure isn't there, the page is invisible to systems that drive traffic. "
        "{fix_human}."
    ),
    "above_fold": (
        "The above-the-fold section — what the visitor sees without scrolling. "
        "{issue_human}. "
        "This is your conversion window. Everything important needs to be here: "
        "what you do, who it's for, what happens next. "
        "{fix_human}."
    ),
    "ad_signals": (
        "Ad tracking. {issue_human}. "
        "Without proper tracking, your ad platform is flying blind. "
        "It can't tell which clicks turned into customers, "
        "so it can't optimize for the ones that do. "
        "You end up paying full price for half the intelligence. "
        "{fix_human}."
    ),
}

DEFAULT_FINDING_NARRATION = (
    "{label}. {issue_human}. "
    "This is costing you on every paid click that doesn't convert. "
    "{fix_human}."
)


def _humanize_issue(issue: str) -> str:
    """Convert audit-speak to plain English."""
    issue = issue.strip()
    # Remove leading audit template phrases
    replacements = [
        (r"^Early source proxy (has|lacks|missing)", "The page"),
        (r"^HTML is \d+KB", "The page HTML is"),
        (r"above the fold", "at the top of the page"),
        (r"first 3,000 (source )?chars?", "the visible top section"),
        (r"composite", "overall"),
        (r"quadrant", "category"),
        (r"quick.win", "quick fix"),
        (r"major.project", "bigger change"),
        (r"\bCTA\b", "call to action"),
        (r"\bH1\b", "main headline"),
        (r"\bSEO\b", "search optimization"),
        (r"The \(source HTML\) page", "The page"),
        (r"source HTML", "the page"),
    ]
    for pattern, replacement in replacements:
        issue = re.sub(pattern, replacement, issue, flags=re.IGNORECASE)
    # Lowercase start if it starts with a common technical prefix
    if issue and issue[0].isupper() and len(issue) > 3:
        pass  # Keep capitalization for readability
    return issue[:200]


def _humanize_fix(fix: str) -> str:
    """Convert fix text to plain-English imperative."""
    fix = fix.strip().rstrip(".")
    replacements = [
        (r"^Run rendered viewport inspection", "Check how the page actually renders in a browser"),
        (r"viewport inspection", "a browser render check"),
        (r"\bCTA\b", "call to action"),
        (r"\bH1\b", "headline"),
        (r"JSON-LD", "structured data"),
        (r"OpenGraph", "social preview metadata"),
    ]
    for pattern, replacement in replacements:
        fix = re.sub(pattern, replacement, fix, flags=re.IGNORECASE)
    return fix[:200]


def _finding_narration(f: dict) -> str:
    key   = f.get("key", "")
    label = f.get("label", key.replace("_", " ").title())
    issue = _humanize_issue(f.get("issue", ""))
    fix   = _humanize_fix(f.get("fix", ""))

    template = FINDING_NARRATION.get(key, DEFAULT_FINDING_NARRATION)
    try:
        text = template.format(
            label=label,
            issue_human=issue,
            fix_human=fix,
            domain="{domain}",  # filled later
        )
    except KeyError:
        text = f"{label}. {issue}. Fix: {fix}."
    return text


def _score_narration(ctx: dict) -> str:
    score = ctx["score"]
    n_fixes = len(ctx["quick_wins"])
    grade_word = (
        "strong" if score >= 8.0 else
        "decent" if score >= 7.0 else
        "needs work" if score >= 5.5 else
        "struggling"
    )
    cost_line = (
        f"At two dollars per click on paid traffic, "
        f"every visitor who bounces on these issues is money gone. "
    ) if score < 7.0 else ""

    return (
        f"So the score: {score:.1f} out of ten. {grade_word.title()}. "
        f"{cost_line}"
        f"The {n_fixes} quick-win fixes I just walked through? "
        f"None of them require a redesign. "
        f"A developer can ship most of them in an afternoon."
    )


def _offer_narration() -> str:
    return (
        "You can run this exact audit on your own page right now for free — "
        "no account, no email, just paste the URL and go. "
        "nebulacomponents dot com slash audit. "
        "Takes about ninety seconds. "
        "If you want one of these issues actually fixed — "
        "the specific copy change, the code, the exact implementation — "
        "that's the ninety-seven dollar sprint. Link in the description."
    )


def _cta_narration() -> str:
    return (
        "Drop your URL in the comments. "
        "I'll pick the most interesting ones and do a live teardown in a future video."
    )


# ── Main script generator ─────────────────────────────────────────────────────

def generate_teardown_script(audit: dict, url: str = None) -> dict:
    """
    Generate a story-first teardown script.
    Returns the same structure as generate_script() so produce.py works unchanged.
    """
    target_url = url or audit.get("url", "")
    domain = re.sub(r"^https?://", "", target_url).split("/")[0].replace("www.", "")
    score  = float(audit.get("composite") or audit.get("score") or audit.get("overall") or 0)
    grade  = audit.get("grade") or audit.get("overall_grade") or "C"
    findings = audit.get("findings") or audit.get("opp_matrix") or []

    ctx = _detect_context(domain, audit)
    qw  = ctx["quick_wins"]

    segments = []
    t = 0.0

    def seg(text: str, visual: str, dimension: str = None):
        nonlocal t
        dur = len(text.split()) / WPS
        segments.append({
            "start": round(t, 2),
            "end":   round(t + dur, 2),
            "text":  text,
            "visual": visual,
            "dimension": dimension,
        })
        t += dur

    # 1. Hook
    seg(_hook_line(ctx), "intro_card")

    # 2. Above the fold — show the actual page
    seg(_above_fold_line(ctx), "evidence_above_fold", "above_fold")

    # 3. Top findings (up to 3 quick wins)
    for i, f in enumerate(qw[:3]):
        key = f.get("key", "")
        narration = _finding_narration(f).replace("{domain}", domain)
        visual = f"evidence_{key}" if key else f"dimension_{i}"
        seg(narration, visual, key)

    # 4. Mobile viewport (if mobile wasn't already a finding)
    if not any(f.get("key") == "mobile" for f in qw[:3]):
        mobile_finding = next((f for f in findings if f.get("key") == "mobile"), None)
        if mobile_finding:
            seg(_finding_narration(mobile_finding).replace("{domain}", domain),
                "evidence_mobile", "mobile")

    # 5. Score
    seg(_score_narration(ctx), "score_card")

    # 6. Offer
    seg(_offer_narration(), "cta_card")

    # 7. Community CTA
    seg(_cta_narration(), "cta_card")

    # ── Title ──────────────────────────────────────────────────────────────────
    if score < 5.0:
        title = f"I Audited {domain}'s Landing Page — Here's What's Burning Their Ad Spend ({score:.1f}/10)"
    elif score < 6.5:
        title = f"Why {domain} Isn't Converting Paid Traffic — Live Teardown ({score:.1f}/10)"
    elif score < 8.0:
        title = f"What {domain} Gets Right (And What It's Still Getting Wrong) — Teardown ({score:.1f}/10)"
    else:
        title = f"How {domain} Converts Paid Traffic — Landing Page Breakdown ({score:.1f}/10)"

    # ── Description ───────────────────────────────────────────────────────────
    desc_lines = [
        f"Full landing page teardown of {target_url}",
        f"Score: {score:.1f}/10 ({grade})",
        "",
        "Issues covered:",
    ]
    for f in qw[:3]:
        desc_lines.append(f"• {f.get('label','?')}: {_humanize_issue(f.get('issue',''))[:80]}")
    desc_lines += [
        "",
        f"Run the free audit on your page: https://nebulacomponents.com/audit?utm_source=youtube&utm_medium=video&utm_campaign={domain}",
        "Fix one issue for $97: https://nebulacomponents.com/audit",
        "",
        "Chapters:",
    ]
    seen = set()
    for s in segments:
        v = s["visual"]
        chap = {
            "intro_card":         "Introduction",
            "evidence_above_fold":"First impression",
            "score_card":         f"The verdict: {score:.1f}/10",
            "cta_card":           "Free audit",
        }.get(v)
        if chap is None and v.startswith("evidence_"):
            dim = v.replace("evidence_", "")
            chap = f"Issue: {dim.replace('_', ' ').title()}"
        if chap and v not in seen:
            ts = int(s["start"])
            m, sc = divmod(ts, 60)
            desc_lines.append(f"{m:02d}:{sc:02d} {chap}")
            seen.add(v)

    desc_lines += [
        "",
        "🔔 Subscribe for daily landing page audits: https://www.youtube.com/@nebulaaudits?sub_confirmation=1",
        "",
        "#landingpage #conversionoptimization #paidads #cro #digitalmarketing",
    ]

    tags = [
        "landing page teardown", "landing page audit", "cro", "paid ads",
        "conversion rate optimization", "google ads", "meta ads",
        domain, "digital marketing", "page not converting",
    ]

    return {
        "title":          title,
        "description":    "\n".join(desc_lines),
        "tags":           tags,
        "segments":       segments,
        "total_duration": round(t, 2),
        "worst_dimension": qw[0].get("key") if qw else "above_fold",
        "worst_label":    qw[0].get("label", "Headline") if qw else "Headline",
        "overall_score":  score,
        "domain":         domain,
        "format":         "teardown",
    }
