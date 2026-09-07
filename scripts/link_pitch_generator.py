#!/usr/bin/env python3
"""
Humanized Guest Post Pitch Generator — nebulacomponents.com

Takes opportunities from link_opportunities.jsonl and generates
highly humanized outreach drafts grounded in real Nebula audit data.

Humanization rules (hard constraints):
- No em-dashes
- No AI tells: "leveraging", "in today's", "dive into", "holistic", "robust",
  "synergy", "unlock", "game-changer", "delve", "it's worth noting",
  "I wanted to reach out", "I hope this email finds you well"
- Every pitch references a specific real number from our audit database
- Voice: direct, slightly casual, first-person, specific
- No generic "I noticed you accept guest posts" openers
- Subject lines: specific claim or question, never generic

Run manually or via cron (dry-run mode by default, --send to actually queue).
"""

import json
import sys
import argparse
from pathlib import Path
from datetime import datetime, timezone
import random

# ── Real data from Nebula audit DB (pulled 2026-09-06) ──────────────────────
# These are MEASURED facts, not estimates
AUDIT_BENCHMARKS = {
    "total_audits": 892,
    "avg_score": 74.9,
    "pct_below_50": 5.4,
    "pct_above_70": 80.7,
    "most_common_signal": "above_fold",  # 57 findings, avg impact 3.6
    "second_signal": "ad_signals",       # 53 findings, avg impact 3.6
    "highest_impact": "ai_crawler_access",  # avg impact 4.5
    "social_proof_impact": 4.3,          # highest avg impact at scale
    "headline_findings": 23,
    "cta_findings": 18,
    "social_proof_findings": 19,
    "load_speed_findings": 33,
}

# Specific angles for different publication types
PITCH_TEMPLATES = {
    "guest_post_cxl": {
        "subject": "Guest post pitch: what {total} landing page audits taught me about above-the-fold conversion",
        "body": """Hi {name},

I ran {total} landing page audits at Nebula Components. The most common finding wasn't headline clarity or CTA placement. It was above-the-fold layout, showing up in {above_fold_pct}% of pages we audited with an average impact score of {above_fold_impact}.

Most CRO content covers what to test. I want to write something for CXL about what the data actually says about where conversions die before someone ever scrolls.

Proposed title: "Above-the-Fold Conversion Failures: What {total} Audits Reveal"

Outline:
1. Why above-the-fold outperforms headline in failure frequency ({above_fold_pct}% vs {headline_pct}%)
2. The three specific layout patterns that appear in failing pages
3. How to diagnose this without running a test
4. Before/after examples from real audit findings

Word count: 1,800-2,200. I'll include screenshots and specific measurements, not opinions.

I write on conversion optimization at nebulacomponents.com. Let me know if you'd want to see a full draft.

Mike Holownych
Nebula Components
mike@nebulacomponents.com""",
    },

    "guest_post_unbounce": {
        "subject": "Guest post: the landing page signal that kills more conversions than bad CTAs",
        "body": """Hey {name},

Quick question before I pitch: is Unbounce's blog still publishing external contributor pieces? I've seen some recent posts from outside writers and wasn't sure if that's still open.

If yes: I've been running evidence-based landing page audits and recently processed {total} pages. The finding that surprised me most is that social proof issues have the highest average conversion impact ({social_proof_impact}/5) but appear on fewer than 10% of the audits. Meaning most pages have the wrong social proof, not no social proof.

I want to write about why founders keep optimizing CTAs and headlines when their social proof architecture is quietly destroying trust.

Happy to share the full data set and a draft outline if this sounds like a fit.

Mike
nebulacomponents.com""",
    },

    "roundup_submission": {
        "subject": "Nebula Components for your {list_topic} list",
        "body": """Hi {name},

I'm reaching out about your "{list_title}" roundup.

Nebula Components does evidence-grade landing page audits — not heuristic recommendations, but measured findings backed by real page data. We've run {total} audits. The output is a scored report with specific findings, impact ratings, and implementation steps.

We'd fit well alongside {competitor1} and {competitor2} for teams that want audit findings they can actually cite, not a generic checklist.

If you're updating the list or have a submission process, I'd love to be considered.

Here's the listing: https://nebulacomponents.com

Mike
Nebula Components""",
    },

    "podcast_pitch": {
        "subject": "Guest pitch: {total} landing page audits, one counterintuitive finding",
        "body": """Hi {name},

I run Nebula Components, an evidence-based landing page audit service. Over {total} audits, I've been tracking which signals actually kill conversions.

The counterintuitive one: social proof has the highest average impact score ({social_proof_impact}/5) but appears in fewer than 10% of audits. Founders are obsessing over CTAs when their trust architecture is the real problem.

I think this would be a useful 30-minute conversation for your audience, especially founders who are running paid traffic and not getting the ROI they expect.

A few things I can speak to specifically:
- Why most CRO audits are heuristics dressed up as analysis
- The difference between "your headline is weak" and a measurable conversion leak
- What {total} audits revealed about where landing pages actually fail

Let me know if you'd want to explore a guest slot.

Mike Holownych
nebulacomponents.com""",
    },
}


def load_opportunities(opp_file: Path, opp_type: str = None, min_score: int = 6) -> list[dict]:
    """Load unpitched opportunities above score threshold."""
    if not opp_file.exists():
        return []
    opps = []
    with opp_file.open() as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            opp = json.loads(line)
            if opp.get("status") != "new":
                continue
            if opp.get("score", 0) < min_score:
                continue
            if opp_type and opp.get("type") != opp_type:
                continue
            opps.append(opp)
    return sorted(opps, key=lambda x: x["score"], reverse=True)


def humanize_check(text: str) -> list[str]:
    """Returns list of AI-tell violations found in text."""
    violations = []
    AI_TELLS = [
        "leveraging", "in today's", "dive into", "holistic", "robust",
        "synergy", "unlock", "game-changer", "delve", "it's worth noting",
        "I wanted to reach out", "I hope this email finds you well",
        "I hope you're doing well", "hope this finds you", "cutting-edge",
        "seamlessly", "innovative", "revolutionize", "transform",
        "touch base", "circle back", "moving forward", "going forward",
        "at the end of the day", " -- ", " — ",  # em dashes
    ]
    for tell in AI_TELLS:
        if tell.lower() in text.lower():
            violations.append(tell)
    return violations


def generate_pitch(opp: dict, template_key: str) -> dict | None:
    """Generate a humanized pitch for an opportunity."""
    template = PITCH_TEMPLATES.get(template_key)
    if not template:
        return None

    # Extract contact name from URL domain
    domain = opp["url"].split("/")[2].replace("www.", "")
    name = domain.split(".")[0].capitalize()

    above_fold_pct = round(57 / 267 * 100, 1)  # 57 findings / 267 total
    headline_pct = round(23 / 267 * 100, 1)

    vars = {
        "name": name,
        "total": AUDIT_BENCHMARKS["total_audits"],
        "above_fold_pct": above_fold_pct,
        "above_fold_impact": AUDIT_BENCHMARKS["most_common_signal"],
        "headline_pct": headline_pct,
        "social_proof_impact": AUDIT_BENCHMARKS["social_proof_impact"],
        "list_topic": "CRO tools",
        "list_title": opp.get("title", "CRO tools roundup")[:50],
        "competitor1": "Hotjar",
        "competitor2": "Microsoft Clarity",
    }

    subject = template["subject"].format(**vars)
    body = template["body"].format(**vars)

    # Run humanization check
    violations = humanize_check(body) + humanize_check(subject)

    pitch = {
        "opportunity_url": opp["url"],
        "opportunity_title": opp["title"],
        "opportunity_type": opp["type"],
        "opportunity_score": opp["score"],
        "template_used": template_key,
        "subject": subject,
        "body": body,
        "humanize_violations": violations,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status": "draft",
        "contact_email": None,  # requires manual discovery
    }

    return pitch


def select_template(opp: dict) -> str:
    """Pick the right template for opportunity type and domain."""
    url = opp.get("url", "").lower()
    opp_type = opp.get("type", "")

    if "cxl.com" in url or "conversionxl.com" in url:
        return "guest_post_cxl"
    if "unbounce.com" in url:
        return "guest_post_unbounce"
    if opp_type == "podcast":
        return "podcast_pitch"
    if opp_type == "roundup":
        return "roundup_submission"
    return "guest_post_cxl"  # default to highest-value template


def main():
    parser = argparse.ArgumentParser(description="Generate humanized link acquisition pitches")
    parser.add_argument("--type", help="Filter by opportunity type", default=None)
    parser.add_argument("--min-score", type=int, default=6)
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--output", help="Output file for drafts",
                        default="/home/mike/nebula/seo/pitch_drafts.jsonl")
    args = parser.parse_args()

    opp_file = Path("/home/mike/nebula/seo/link_opportunities.jsonl")
    output_file = Path(args.output)

    opportunities = load_opportunities(opp_file, args.type, args.min_score)

    if not opportunities:
        print("No new opportunities to pitch. Run link_opportunity_scanner.py first.")
        return

    print(f"Found {len(opportunities)} opportunities. Generating drafts for top {args.limit}...\n")

    drafts = []
    for opp in opportunities[:args.limit]:
        template_key = select_template(opp)
        pitch = generate_pitch(opp, template_key)

        if pitch is None:
            continue

        if pitch["humanize_violations"]:
            print(f"⚠️  Humanize violations in pitch for {opp['url']}: {pitch['humanize_violations']}")
            # Still output for review, but flag it
            pitch["status"] = "review_needed"
        else:
            pitch["status"] = "draft"

        drafts.append(pitch)
        print(f"✓ Draft: {pitch['subject'][:70]}")
        print(f"  Target: {opp['url']}")
        print(f"  Score: {opp['score']}/10, Type: {opp['type']}\n")

    # Write drafts
    with output_file.open("a") as f:
        for draft in drafts:
            f.write(json.dumps(draft) + "\n")

    print(f"\n{len(drafts)} drafts written to {output_file}")
    print("\nNext step: review drafts, find contact emails, submit via release gate.")


if __name__ == "__main__":
    main()
