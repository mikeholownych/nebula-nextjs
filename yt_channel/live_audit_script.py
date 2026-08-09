"""
Live Audit Script Generator — "real page, narrated teardown" format.

Produces a timed narrative following the content brief:
  Hook (irony) → Setup → 3 Quick Win findings with money math → Offer → CTA

Designed for pages where the irony IS the hook:
  - A paid media agency whose own page doesn't convert
  - An ecommerce store with a poor mobile CTA
  - Any founder burning ad budget on an underperforming page

Usage:
    from yt_channel.live_audit_script import generate_live_script
    script = generate_live_script(audit, url="https://adblazemedia.com")
"""

import hashlib
import re
from datetime import datetime, timezone

WPS = 2.4          # words per second (slightly faster for engaging narration)
WPS_SHORT = 2.8    # shorts pace


# ── Context detection ──────────────────────────────────────────────────────────

def _detect_irony_context(domain: str, audit: dict) -> str:
    """
    Detect what makes this page's score ironic or interesting.
    Returns a hook framing string.
    """
    title = (audit.get("page_title") or "").lower()
    h1 = (audit.get("page_h1") or "").lower()
    tech = audit.get("tech_stack", {}) or {}
    findings = audit.get("findings", [])

    # Check for agency/marketing context
    agency_signals = ["agency", "marketing", "ads", "media", "growth", "digital", "ppc", "seo", "advertising"]
    is_agency = any(s in domain for s in agency_signals) or any(s in title for s in agency_signals)

    # Check for ecommerce
    ecom_signals = ["shop", "store", "buy", "cart", "checkout", "price"]
    is_ecom = any(s in domain for s in ecom_signals) or any(s in title for s in ecom_signals)

    score = audit.get("composite") or audit.get("score", 0)
    grade = audit.get("grade", "C")

    if is_agency:
        return f"This is a paid media agency. They run ads for clients. Their own landing page scores {score:.1f} out of 10."
    elif is_ecom:
        return f"This store is running paid traffic. Visitors are clicking the ads. The page scored {score:.1f} out of 10."
    else:
        return f"This page is running paid traffic. Someone is spending money on ads right now. The page scored {score:.1f} out of 10."


def _quick_wins(findings: list) -> list:
    """Return top 3 Quick Win findings sorted by impact descending."""
    qw = [f for f in findings if f.get("quadrant") in ("quick_win", "Quick Win")]
    qw.sort(key=lambda f: float(f.get("impact", 0)), reverse=True)
    return qw[:3] if qw else findings[:3]


def _money_math(finding: dict, domain: str) -> str:
    """
    Generate a one-sentence money math statement for a finding.
    Uses conservative CPC assumptions.
    """
    key = finding.get("key", "")
    label = finding.get("label", "")

    math = {
        "headline": "At two dollars per click on Google Ads, a visitor who bounces because they can't tell what you do is two dollars gone. Fix the headline, and that same click has a chance to convert.",
        "cta": "If your call to action isn't visible on mobile without scrolling, you're paying for clicks from people who never see the button to buy. The fix takes one developer an hour.",
        "social_proof": "Cold traffic doesn't trust you yet. No testimonial or proof near your first CTA means every visitor is being asked to buy before they have any reason to believe you. That's the cheapest problem to fix.",
        "mobile": "More than half of paid traffic arrives on mobile. If the CTA is below the fold on a phone, you're paying for visits where the most important button is invisible.",
        "load_speed": "Every extra second of load time costs roughly seven percent of conversions. Large pages bleed money from the first click.",
        "seo_foundations": "Missing title tags and H1s mean AI systems and search engines can't read the page. Every future organic visit you'd have earned is not coming.",
        "message_match": "When the ad says one thing and the landing page says another, visitors arrive confused. Confused visitors don't buy. This is the number one reason ad campaigns fail.",
        "ad_signals": "Without conversion tracking, your ad platform is optimizing blind. It can't learn which clicks turn into customers. You're paying full price for half the intelligence.",
    }

    return math.get(key, f"This finding is directly costing you money on every paid click that doesn't convert.")


def generate_live_script(audit: dict, url: str = None) -> dict:
    """
    Generate a timed live-audit narration script.

    Args:
        audit: dict from deliver_audit.py (has findings, score, grade, page_title etc.)
        url: canonical URL (falls back to audit['url'])

    Returns:
        Script dict with title, description, tags, segments, total_duration
    """
    target_url = url or audit.get("url", "")
    domain = re.sub(r"^https?://", "", target_url).split("/")[0].replace("www.", "")
    # Normalise across subprocess output (score/grade/findings) and score_audit() direct return
    score = float(audit.get("composite") or audit.get("score") or audit.get("overall") or 0)
    grade = audit.get("grade") or audit.get("overall_grade") or "C"
    findings = audit.get("findings") or audit.get("opp_matrix") or []
    quick_wins = _quick_wins(findings)

    irony = _detect_irony_context(domain, audit)

    # ── Build segments ─────────────────────────────────────────────────────────
    segments = []
    t = 0.0

    def seg(text: str, visual: str, dimension: str = None):
        nonlocal t
        words = len(text.split())
        duration = words / WPS
        s = {"start": round(t, 2), "end": round(t + duration, 2),
             "text": text, "visual": visual, "dimension": dimension}
        segments.append(s)
        t += duration

    # 1. Hook (5–8s)
    seg(
        f"If you're running paid ads and not converting, nine times out of ten the problem is not the ad. "
        f"It's the page. Today I'm going to show you exactly how to find the leak — on a real page, in real time.",
        "intro_card"
    )

    # 2. Irony setup (5–8s)
    seg(irony, "score_card")

    # 3. Audit running narration (8s)
    seg(
        f"I'm pasting the URL into the audit tool right now. It runs nine conversion signals: "
        f"headline clarity, CTA visibility, social proof, message match, mobile layout, load speed, "
        f"SEO foundations, ad tracking, and AI readiness. Takes about ninety seconds.",
        "dimension_intro"
    )

    # 4. Score reveal (5s)
    band = "needs work" if score < 6.5 else "decent"
    seg(
        f"Results are in. {domain} scored {score:.1f} out of ten. Grade: {grade}. "
        f"That puts it in the {band} range. Here's what's costing them money.",
        "score_card",
        "overall"
    )

    # 5. Finding walkthrough (3 findings × ~15s each)
    for i, finding in enumerate(quick_wins):
        label = finding.get("label", "Finding")
        issue = finding.get("issue", "")[:150]
        fix = finding.get("fix", "")[:150]
        money = _money_math(finding, domain)

        seg(
            f"Finding {i+1}: {label}. {issue}. "
            f"The fix: {fix}. "
            f"{money}",
            f"dimension_{finding.get('key', 'finding')}",
            finding.get("key")
        )

    # 6. Summary (8s)
    total_findings = len(findings)
    seg(
        f"That's {len(quick_wins)} quick wins out of {total_findings} total findings on this page. "
        f"Each one is a place where a paid click can escape without converting. "
        f"The good news: none of these require a redesign.",
        "outro_card"
    )

    # 7. Offer (10s)
    seg(
        f"You can run this exact audit on your own page right now, free, at nebulacomponents dot com slash audit. "
        f"No signup, takes ninety seconds. If you want one of these findings implemented — "
        f"the specific fix, the exact code change — that's the ninety-seven dollar sprint. "
        f"Link in the description.",
        "cta_card"
    )

    # 8. Community CTA (5s)
    seg(
        f"Drop your URL in the comments. I'll run a live audit on the top three and post the results.",
        "cta_card"
    )

    # ── Title ──────────────────────────────────────────────────────────────────
    if score < 5:
        title = f"I Audited a {domain.split('.')[0].title()} Landing Page Live — Here's What's Bleeding Their Ad Spend ({score:.1f}/10)"
    elif score < 6.5:
        title = f"Why {domain}'s Landing Page Isn't Converting Paid Traffic — Live Audit ({score:.1f}/10)"
    else:
        title = f"Live Landing Page Audit: {domain} ({score:.1f}/10) — What Works and What's Leaking"

    # ── Description ────────────────────────────────────────────────────────────
    desc_lines = [
        f"Live landing page audit of {target_url}",
        f"Score: {score:.1f}/10 ({grade})",
        "",
        "Quick Win findings:",
    ]
    for f in quick_wins:
        desc_lines.append(f"• {f.get('label')}: {f.get('issue','')[:80]}")

    desc_lines += [
        "",
        "Run the free audit on your own page: https://nebulacomponents.com/audit?utm_source=youtube&utm_medium=video&utm_campaign=" + domain,
        "Get one finding fixed for $97: https://nebulacomponents.com/audit",
        "",
        "Chapters:",
    ]
    # Add chapter timestamps
    chapter_map = {
        "intro_card": "Intro",
        "score_card": f"Score reveal ({score:.1f}/10)",
        "dimension_intro": "Running the audit",
        "outro_card": "Summary",
        "cta_card": "Get your free audit",
    }
    seen_visuals = set()
    for s in segments:
        visual = s["visual"]
        if visual.startswith("dimension_") and not visual.startswith("dimension_intro"):
            label = s.get("dimension", visual.replace("dimension_", "")).replace("_", " ").title()
            chapter_map[visual] = f"Finding: {label}"
        if visual not in seen_visuals and visual in chapter_map:
            ts = int(s["start"])
            m, sec = divmod(ts, 60)
            desc_lines.append(f"{m:02d}:{sec:02d} {chapter_map[visual]}")
            seen_visuals.add(visual)

    desc_lines += [
        "",
        "🔔 Subscribe for daily landing page audits: https://www.youtube.com/@nebulaaudits?sub_confirmation=1",
        "",
        "#landingpage #conversionoptimization #paidads #cro #digitalmarketing",
    ]

    description = "\n".join(desc_lines)

    tags = [
        "landing page audit", "conversion rate optimization", "cro", "paid ads",
        "google ads", "meta ads", "landing page teardown", "conversion optimization",
        domain, "digital marketing", "ad spend", "page not converting"
    ]

    return {
        "title": title,
        "description": description,
        "tags": tags,
        "segments": segments,
        "total_duration": round(t, 2),
        "worst_dimension": quick_wins[0].get("key") if quick_wins else "headline",
        "worst_label": quick_wins[0].get("label", "Headline") if quick_wins else "Headline",
        "overall_score": score,
        "domain": domain,
        "format": "live_audit",
    }


def generate_live_short_script(audit: dict, url: str = None) -> dict:
    """
    60-second Short version of the live audit format.
    Hook → Score → Worst finding → Fix → CTA
    """
    target_url = url or audit.get("url", "")
    domain = re.sub(r"^https?://", "", target_url).split("/")[0].replace("www.", "")
    score = float(audit.get("composite") or audit.get("score") or 0)
    grade = audit.get("grade", "C")
    findings = audit.get("findings", [])
    quick_wins = _quick_wins(findings)
    worst = quick_wins[0] if quick_wins else {}

    segments = []
    t = 0.0

    def seg(text, visual, dimension=None):
        nonlocal t
        duration = len(text.split()) / WPS_SHORT
        segments.append({"start": round(t, 2), "end": round(t + duration, 2),
                         "text": text, "visual": visual, "dimension": dimension})
        t += duration

    # 1. Hook (3s)
    irony = _detect_irony_context(domain, audit)
    hook_sentence = irony.split(".")[0] + "."
    seg(hook_sentence, "hook_card")

    # 2. Foreshadow / score tease (3s)
    seg(f"I ran a nine-signal audit. Watch to the end — you'll see the score.", "score_card", "overall")

    # 3. Problem (10s)
    if worst:
        seg(
            f"Biggest leak: {worst.get('label')}. {worst.get('issue','')[:100]}",
            "problem_card",
            worst.get("key")
        )
    else:
        seg("The page has conversion leaks on multiple signals.", "problem_card")

    # 4. Fix (10s)
    if worst:
        seg(
            f"Fix: {worst.get('fix','')[:100]}",
            "fix_card",
            worst.get("key")
        )
    else:
        seg("Each fix is simple and specific.", "fix_card")

    # 5. Score reveal (3s)
    seg(f"The verdict: {score:.1f} out of ten.", "reward_card", "overall")

    # 6. CTA (3s)
    seg(
        "Free audit on your page. nebulacomponents dot com slash audit. Link in bio.",
        "cta_card"
    )

    title = f"Your landing page headline is why your ads aren't converting #Shorts"

    return {
        "title": title,
        "description": f"Free audit: https://nebulacomponents.com/audit?utm_source=youtube&utm_medium=shorts&utm_campaign={domain}",
        "tags": ["landing page", "ads not converting", "cro", "shorts"],
        "segments": segments,
        "total_duration": round(t, 2),
        "worst_dimension": worst.get("key", "headline"),
        "worst_label": worst.get("label", "Headline"),
        "worst_score": float(worst.get("impact", 5)) if worst else 5.0,
        "overall_score": score,
        "domain": domain,
        "format": "live_audit_short",
    }
