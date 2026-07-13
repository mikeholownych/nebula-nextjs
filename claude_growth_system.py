#!/usr/bin/env python3
"""Flat-file Claude-style growth system for Nebula.

Implements the six-step playbook without adding new infrastructure:
ICP/positioning/banned words -> 30d calendar -> content skills -> engager ingest -> DM queue -> weekly summary.

Based on the Solo Founder LinkedIn Operating System pattern:
Voice DNA (what you sound like) + Skill Commands (what you can do)
+ Ask User Questions (before composing) + Tools Map (auto vs manual)
+ 1M Token Window (feed past patterns into context).
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable

DEFAULT_BASE = Path("/home/mike/nebula")
SYSTEM_DIR = "growth_system"
AUDIT_URL = "https://nebulacomponents.shop/"
CHECKOUT_URL = "https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b"

ICP_TEXT = """# ICP

Founders actively bleeding money on ads with zero or weak conversions.

Must-have buying triggers:
- Publicly mentions paid traffic, ads, clicks, or spend.
- Says leads, demos, bookings, sales, or conversions are weak.
- Has a live landing page or offer page to audit.

Not ICP:
- Agencies selling ads/CRO.
- People asking abstract marketing questions with no spend or URL.
- Free-tool promoters and roast-thread tourists.
"""

POSITIONING_TEXT = """# Positioning

Nebula Components is the autonomous conversion leak detector for founders burning ad budget.

Promise: paste the landing page, get the top conversion leaks, then buy the $147 implementation-ready fix pack without calls, calendars, or manual review.

Core angle: your ads may not be broken; your landing page is leaking the money.
"""

BANNED_WORDS = [
    "book a call",
    "jump on a call",
    "calendar",
    "let me know",
    "pick your brain",
    "synergy",
    "revolutionary",
    "game-changing",
]

VOICE_DNA = """# Nebula Voice DNA

## Who We Are
Nebula Components is the autonomous conversion leak detector for founders burning ad budget. We are not an agency. We are not consultants. We are a self-serve engine that finds and fixes landing page leaks without calls, calendars, or manual review.

## Sentence Structure
- Short declarative sentences. 12-18 words average.
- One claim per sentence. One idea per paragraph.
- Lead with the problem or the number. "4% CTR. 0% conversion. Here's where it breaks."
- No throat-clearing. Cut "we believe," "we think," "it's important to note."

## Word Choice
- Concrete nouns. Specific numbers. No abstractions.
- Use: leak, bleed, burn, fix, ship, score, trigger, gap, friction, proof
- Avoid: optimize (use fix or improve), empower, leverage, best-in-class, holistic, robust, seamless, cutting-edge
- Dollar amounts always: "$147 fix pack" not "premium service tier"
- Never "book a call," "jump on a call," "schedule a meeting," "let me know"

## Hook Patterns
- Pain-first: "Your ads may not be broken. Your landing page is leaking the money."
- Specific number + gap: "$3,000/mo in ad spend. Zero conversions. One leak."
- Insider term: "Message-match gap. CPM creep. ROAS cliff. You know the feeling."
- Curiosity + outcome: "Founders who fix their above-fold CTA see 2-3x more audits. Here's the one I use."

## Proof Rules
- Every claim needs evidence within 2 sentences.
- Trust signals must be shown, not just claimed: star ratings, named customers, count numbers, screenshots.
- "Founded in 2026" is a disadvantage — lead with product proof, not company age.
- Reference the self-audit case study: "Score 6.8/10 B. We fixed the 3/10 SEO in 2 minutes."

## CTA Format
- Action verb + outcome + link: "Run my free audit →" not "Click here for more info"
- No friction claim: "No call. No calendar. No card required."
- Ends at the URL: every CTA points to nebulacomponents.shop or the audit tool.

## Voice Examples
- "Paste the URL. Get the scored teardown. Buy the $147 fix pack. No sales call."
- "Your ads might be fine. The page is where money goes to die. We can show you exactly where in 60 seconds."
- "Spent $10k on ads and got barely any orders? The leak isn't in the targeting. It's in the page."

## Enforcement
- When composing any outbound, read Voice DNA first.
- If the draft would sound generic, delete and restart.
- Read the draft aloud. If it sounds like a freelancer pitch, rewrite.
- CTA must be the last sentence. No exceptions.
"""

REPURPOSE_SKILL = """# Nebula Repurposing Skill

For every post, create:
1. LinkedIn post.
2. X thread hook + 5 bullets.
3. Email subject + short body.
4. DM opener for engagers.
5. Build-in-public proof snippet.
"""

# ── Nebula Skill Commands ──────────────────────────────────────────

AUDIT_SKILL = """# /audit — Run Conversion Audit

Paste any landing page URL. Returns scored breakdown:
- Headline: clarity, length, keyword overlap with title
- CTA: action language, number of CTAs, placement above fold
- Social Proof: claimed vs. shown (the "say vs show" gap)
- Mobile: viewport tag, responsive detection
- Load Speed: HTML size, WordPress detection
- Above Fold: CTA visibility in first viewport
- Ad Signals: GA4, Facebook Pixel, UTM params, thank-you page
- SEO Foundations: title length, meta description, H1 alignment
- Opp Matrix: impact vs effort for every finding (quick win / major project)
- Overall score 0-10 + grade (A/B/C/D/F)

Deliver via AgentMail to prospect.
"""

FIX_SKILL = """# /fix — Generate Fix Recommendations

From an audit result, produce implementation-ready fixes:
- For each dimension scoring < 6: specific code change, copy edit, or config update
- Priority-ordered by impact/effort quadrant
- Plain language — the prospect can hand it to a developer or implement themselves
- Gated behind $147 fix pack purchase
"""

COMPOSE_SKILL = """# /compose — Write Outbound Message

Rules:
1. Load Voice DNA first. Read all sections.
2. Load the prospect's buying trigger signal.
3. Load the prospect's ICP fit score.
4. If < 24 hours since last touch, skip.
5. Open with their specific pain (quote their comment or ad symptom).
6. State the diagnosis you found (or can find with the audit).
7. CTA: the free audit URL.
8. Max 150 words for DM, 200 for email.
9. Check for banned words. If present, rewrite.
10. Read aloud. If it sounds like a template, delete and restart.
"""

SCORE_SKILL = """# /score — Score Prospect ICP Fit

Evaluate against buying triggers:
- Spending on ads? (paid traffic, ad spend, google ads, meta ads, campaigns)
- Bleeding on conversions? (zero conversions, no sales, not converting, no leads)
- Has a landing page? (live URL or offer page to audit)

Score 0-100:
- 80-100: Red alert — contact immediately
- 50-79: Warm — queue for today's outreach
- 20-49: Tepid — research first, need more signal
- 0-19: Not ICP — do not contact

Return: score, trigger match (list), gap (list for missing triggers), recommendation.
"""

FOLLOWUP_SKILL = """# /followup — Write Follow-Up Message

When prospect was contacted but silent for 5+ days:
1. Never re-pitch the same message.
2. Add new value: "Ran the audit on a similar page yesterday — found X leak. Your page may have the same pattern."
3. Prove you are not a bot: reference their specific industry or role.
4. End with the audit URL. No ask. No urgency.
5. If 3 follow-ups sent with no reply, archive to cold_pool.jsonl.

Follow-up cadence:
- Day 5: value-add (new finding from similar audit)
- Day 14: social proof (case study or testimonial)
- Day 30: final (archive unless reply)
"""

# ── Ask User Questions ─────────────────────────────────────────────

ASK_USER_QUESTIONS = """# AskUserQuestion — Pre-Composition Discovery

Before composing any outbound, check what data is available:
1. Do we have the prospect's URL? If yes → run audit first.
2. Do we have the prospect's comment/signal? If yes → extract the specific pain.
3. Do we have the prospect's role and company? If yes → personalize industry context.
4. Do we have past audit results for similar prospects? If yes → compare patterns.
5. Is it < 24h since last contact? If yes → skip.

If none of the above is available, ask the user:
- "What's their landing page URL?"
- "What did they say or post that flagged them?"
- "What industry are they in?"
- "Do we have a previous conversation with this prospect?"

Only compose after at least 2 of (1) URL, (2) pain signal, (3) industry context are answered.
"""

# ── Tools Connectivity Map ─────────────────────────────────────────

TOOLS_MAP = """# Tools Map — Auto vs Manual
## CONNECTS AUTOMATICALLY
| Tool | What it does | Connected since |
|------|-------------|-----------------|
| Apify (balm_snowflake) | Scrapes LinkedIn engagers from post comments/likes | √ |
| AgentMail (nebulashop@agentmail.to) | Sends audit emails, deliverability, open tracking | √ |
| Stripe | Checkout for $147 fix pack, $1,497 retainer | √ (via buy.stripe.com) |

## CONNECTS MANUALLY (needs user action)
| Tool | What's missing | To automate |
|------|---------------|-------------|
| LinkedIn feed read | Claude cannot natively read LinkedIn feed | Use Apify on-demand scrape |
| LinkedIn DM send | Claude writes DMs; user sends manually | Buffer / Taplio scheduling |
| Notion content calendar | Can read/write via ntn CLI | Already wired — manual trigger |
| Gmail | Pulls email threads for reply drafting | Via AgentMail for audits only |
| Post to LinkedIn/X | Claude writes; user copies + pastes | Scheduling via Buffer or Typefully |

## RULE
If a tool icon has a red X in the infographic, Claude can write/create but not publish.
Always write in Claude. Publish via the manual bridge tool.
"""

MARKETING_DEPARTMENT_STACK = """# Claude Marketing Department — Nebula Adaptation

Source steal: UGC Ninja's department architecture: 50 agents, 150 prompts, 30 practical skills.
Nebula adaptation: keep the same operating map, but collapse it to the conversion-audit business.

## Department Map

### 1. Market Research
- Market Sizer: estimate how many prospects actively post about ad bleed + conversion failure.
- Trend Scanner: detect rising trigger phrases in Reddit/LinkedIn/HN.
- Demand Mapper: connect each trigger phrase to Nebula's audit/fix offer.
- Opportunity Ranker: sort channels by proof of active pain, not audience size.
- Market Brief Builder: produce the daily CEO acquisition brief.

### 2. Competitor Research
- Competitor Teardown: inspect audit/CRO/AI SDR offers for price, speed, and friction gaps.
- Positioning Mapper: name what they claim vs what Nebula can prove.
- Messaging Gap Finder: identify missing trigger-aware language.
- Pricing Benchmarker: compare self-serve $147 vs demo-gated retainers.
- Share of Voice Tracker: log competitor mentions from Reddit threads.

### 3. Customer Research
- ICP Builder: define by buying trigger, not demographics.
- Voice of Customer Miner: extract exact phrases like "clicks but no sales".
- Pain and Desire Mapper: map ad waste → page leak → fast fix.
- Objection Catalogue: agency trauma, DIY doubt, AI skepticism, price fear.
- Review Insight Extractor: turn testimonials/replies into proof snippets.

### 4. Marketing Strategy
- Positioning Builder: sharpen "your ads aren't broken; your page is leaking money".
- Offer Architect: package free audit → $147 fix pack → $1,497 retainer.
- Funnel Mapper: ensure every asset routes to audit, checkout, or reply handling.
- Channel Strategist: select source mix from actual reply/payment data.
- Campaign Planner: generate daily experiments with kill criteria.

### 5. Creative Strategy
- Hook Writer: pain-first hooks with numbers.
- Angle Generator: 10 angles per trigger class.
- Short Form Script Writer: build-in-public and case-study clips.
- Creative Brief Builder: page-specific creative direction from audit output.
- Content Calendar Builder: schedule proof assets, not generic tips.

## Execution Rule
Every agent output must end in one of: patch, send, queued lead, published asset, or ledger entry.
No research-only work.
"""

PGA_STRATEGY_STEALS = """# Premium Ghostwriting Academy — Nebula Steals

## Useful Patterns
1. Rename the category upward: freelancer → Premium Ghostwriter. Nebula equivalent: CRO freelancer/agency → Autonomous Conversion Leak Detector.
2. Sell education before implementation: Premium Ghostwriting = content that educates. Nebula equivalent: free audit + 5-day leak course educates before $147 ask.
3. Name the enemy: businesses are "leaking leads" by sending paid traffic to weak destinations. This maps exactly to Nebula's landing-page leak thesis.
4. Use proof ladder: founder story → revenue proof → student testimonials → outlier caveat → realistic guarantee. Nebula should use audit logs → before/after fixes → testimonials → no fake income claims.
5. Free Consulting approach: give a specific diagnosis before selling the package.
6. One-client math: one $5k client doubles income. Nebula equivalent: one recovered checkout/demo can pay for the $147 fix pack instantly.

## Nebula Implementation
- Reframe lead magnet from generic conversion tips to "Stop Leaking Paid Traffic".
- Add methodology-first emails before asking for payment.
- Keep claims ethical: no guaranteed revenue unless the guarantee is operationally true.
- Use "leaking leads" / "wrong destination" language in content and outbound.
"""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def system_path(base: Path) -> Path:
    path = base / SYSTEM_DIR
    path.mkdir(parents=True, exist_ok=True)
    return path


def write_if_missing(path: Path, content: str) -> None:
    if not path.exists():
        path.write_text(content)


def load_strategy(base: Path = DEFAULT_BASE) -> dict:
    """Create/load the Claude Project inputs: ICP, Positioning, Banned Words, Voice DNA, Skills, AskUserQuestions, ToolsMap."""
    gs = system_path(base)
    write_if_missing(gs / "ICP.md", ICP_TEXT)
    write_if_missing(gs / "Positioning.md", POSITIONING_TEXT)
    write_if_missing(gs / "Banned_Words.txt", "\n".join(BANNED_WORDS) + "\n")
    write_if_missing(gs / "Nebula_Voice_DNA.md", VOICE_DNA)
    write_if_missing(gs / "Nebula_Repurpose_Skill.md", REPURPOSE_SKILL)
    write_if_missing(gs / "Nebula_Audit_Skill.md", AUDIT_SKILL)
    write_if_missing(gs / "Nebula_Fix_Skill.md", FIX_SKILL)
    write_if_missing(gs / "Nebula_Compose_Skill.md", COMPOSE_SKILL)
    write_if_missing(gs / "Nebula_Score_Skill.md", SCORE_SKILL)
    write_if_missing(gs / "Nebula_Followup_Skill.md", FOLLOWUP_SKILL)
    write_if_missing(gs / "Ask_User_Questions.md", ASK_USER_QUESTIONS)
    write_if_missing(gs / "Tools_Map.md", TOOLS_MAP)
    write_if_missing(gs / "Claude_Marketing_Department.md", MARKETING_DEPARTMENT_STACK)
    write_if_missing(gs / "PGA_Strategy_Steals.md", PGA_STRATEGY_STEALS)
    return {
        "icp": (gs / "ICP.md").read_text(),
        "positioning": (gs / "Positioning.md").read_text(),
        "banned_words": [line.strip() for line in (gs / "Banned_Words.txt").read_text().splitlines() if line.strip()],
        "voice_dna": (gs / "Nebula_Voice_DNA.md").read_text(),
        "skills": ["audit", "fix", "compose", "score", "followup", "repurpose", "marketing_department", "pga_strategy"],
        "ask_user_questions": (gs / "Ask_User_Questions.md").read_text(),
    }


def build_content_calendar(days: int = 30) -> list[dict]:
    """Map 30 days of content before writing any single post.
    
    Includes AI-citation-optimized formats based on Meltwater 9.5M citation study:
    - Listicles (54% of most cited content)
    - Comparisons (high citation rate for B2B queries)
    - Decision frameworks (AI extracts structured comparison data)
    """
    jobs = ["Educational", "Testimonial", "Personal story", "Listicle", "Comparison"]
    calendar = []
    hooks = {
        "Educational": "Your ads are not broken by default. Your landing page is leaking the money.",
        "Testimonial": "A founder with clicks and no conversions needs a leak map, not more opinions.",
        "Personal story": "I am building Nebula as an autonomous revenue machine in public.",
        "Listicle": "5 landing page audit tools compared: self-serve speed vs sales-led depth.",
        "Comparison": "Nebula vs Zamp vs Oxygen: which landing page audit tool actually finds the leak?",
    }
    ctas = {
        "Educational": "Paste the URL. Get the free teardown.",
        "Testimonial": "Use the $147 fix pack when the leak is obvious.",
        "Personal story": "Follow the build: agents, offers, revenue proof.",
        "Listicle": "Full comparison published: 5 tools, 5 dimensions, 1 winner.",
        "Comparison": "See how they stack up on speed, depth, price, and AI readiness.",
    }
    angles = {
        "Educational": "Ad-burn conversion leak",
        "Testimonial": "Real founder with real ad spend, zero conversions",
        "Personal story": "Building Nebula in public",
        "Listicle": "Tool comparison series",
        "Comparison": "Self-serve vs sales-led audit",
    }
    for idx in range(days):
        job = jobs[idx % len(jobs)]
        angle_num = (idx // len(jobs)) + 1
        calendar.append({
            "day": idx + 1,
            "job": job,
            "hook": hooks[job],
            "angle": f"{angles[job]} #{angle_num}",
            "cta": ctas[job],
            "format": _citation_format_for_job(job),
            "freshness_signal": "As of July 2026",
        })
    return calendar


def _citation_format_for_job(job: str) -> str:
    """Return the AI-optimized content format for each job type."""
    formats = {
        "Educational": "how_to_guide",
        "Testimonial": "case_study",
        "Personal story": "build_in_public",
        "Listicle": "listicle",
        "Comparison": "comparison_matrix",
    }
    return formats.get(job, "article")


def _load_json_records(source: Path) -> list[dict]:
    if not source.exists():
        return []
    text = source.read_text().strip()
    if not text:
        return []
    if text.startswith("["):
        data = json.loads(text)
        return [item for item in data if isinstance(item, dict)]
    rows = []
    for line in text.splitlines():
        line = line.strip()
        if line:
            rows.append(json.loads(line))
    return rows


def append_jsonl(path: Path, rows: Iterable[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a") as f:
        for row in rows:
            f.write(json.dumps(row, sort_keys=True) + "\n")


def _prospect_key(row: dict) -> str:
    name = str(row.get("name", "")).strip().lower()
    company = str(row.get("company", "")).strip().lower()
    role = str(row.get("role", "")).strip().lower()
    return f"{name}|{company}|{role}"


def is_self_engager(row: dict) -> bool:
    """Suppress Mike/Nebula-owned accounts from DM queues."""
    name = str(row.get("name", "")).strip().lower()
    profile_url = str(row.get("profile_url") or row.get("url_profile") or "").lower()
    return (
        name in {"mike holownych", "mike h", "startup spotlight canada", "ai syndicate"}
        or "nebula components" in name
        or "mike-holownych" in profile_url
    )


def is_qualified_signal(row: dict) -> bool:
    """Keep only buyer-pain signals; drop generic LinkedIn feed noise."""
    text = f"{row.get('comment', '')} {row.get('role', '')}".lower()
    traffic_terms = [
        "paid ads", "ad spend", "google ads", "meta ads", "facebook ads", "budget", "traffic",
        "clicks", "cpc", "campaign", "campaigns", "wasted spend", "budget leaking",
    ]
    failure_terms = [
        "zero conversion", "zero conversions", "no conversion", "no conversions", "not converting",
        "didn't convert", "form didn't start", "form did not start", "no leads", "no demos",
        "no sales", "landing page", "bounce", "bounces", "leaking",
    ]
    generic_terms = ["fourth of july", "fireworks", "commercial heat pump", "factory-installed"]
    if any(term in text for term in generic_terms):
        return False
    return any(term in text for term in traffic_terms) and any(term in text for term in failure_terms)


def normalize_apify_engager(raw: dict) -> dict:
    """Normalize LinkedIn engager/post-search actor output into Nebula's canonical shape."""
    raw_author = raw.get("author")
    author: dict = raw_author if isinstance(raw_author, dict) else {}
    is_post_search = bool(author) and bool(raw.get("text")) and bool(raw.get("post_url"))
    engagement_type = str(raw.get("type") or raw.get("engagement_type") or ("linkedin_post_author" if is_post_search else "engaged")).strip().lower()
    verb = "commented on" if "comment" in engagement_type else "liked"
    name = raw.get("name") or raw.get("fullName") or raw.get("author_name") or author.get("name") or ""
    role = raw.get("role") or raw.get("subtitle") or raw.get("headline") or author.get("headline") or ""
    post_url = raw.get("post_url") or raw.get("post_Link") or raw.get("postLink") or raw.get("url") or ""
    profile_url = raw.get("profile_url") or raw.get("url_profile") or raw.get("profileUrl") or author.get("profile_url") or ""
    comment = raw.get("comment") or raw.get("text") or f"{verb} Mike's LinkedIn post about the Nebula autonomous revenue build."
    return {
        "name": name,
        "company": raw.get("company") or raw.get("companyName") or "",
        "role": role,
        "comment": comment,
        "post_url": post_url,
        "profile_url": profile_url,
        "engagement_type": engagement_type,
    }


def ingest_engagers(base: Path = DEFAULT_BASE, source: Path | None = None) -> list[dict]:
    """Load Apify/LinkedIn engager exports into the flat-file pipeline."""
    gs = system_path(base)
    source = source or (gs / "apify_linkedin_engagers.json")
    seen = set()
    pipeline_path = gs / "linkedin_engager_pipeline.jsonl"
    for existing in _load_json_records(pipeline_path):
        seen.add(_prospect_key(existing))
    rows = []
    for raw in _load_json_records(source):
        normalized = normalize_apify_engager(raw)
        if is_self_engager(normalized):
            continue
        if normalized.get("engagement_type") == "linkedin_post_author" and not is_qualified_signal(normalized):
            continue
        key = _prospect_key(normalized)
        if key in seen or key == "||":
            continue
        seen.add(key)
        rows.append({
            "timestamp": utc_now(),
            "name": normalized.get("name", ""),
            "company": normalized.get("company", ""),
            "role": normalized.get("role", ""),
            "comment": normalized.get("comment", ""),
            "post_url": normalized.get("post_url", ""),
            "profile_url": normalized.get("profile_url", ""),
            "engagement_type": normalized.get("engagement_type", ""),
            "stage": "engaged",
            "last_touch_at": utc_now(),
        })
    if rows:
        append_jsonl(gs / "linkedin_engager_pipeline.jsonl", rows)
    return rows


def _clean_banned(text: str, banned_words: list[str]) -> str:
    cleaned = text
    for banned in banned_words:
        cleaned = cleaned.replace(banned, "")
        cleaned = cleaned.replace(banned.title(), "")
        cleaned = cleaned.replace(banned.capitalize(), "")
    return " ".join(cleaned.split())


def concise_signal(text: str, max_chars: int = 170) -> str:
    """Keep only the first useful sentence/fragment for DM personalization."""
    text = " ".join(str(text).split()).strip().rstrip(". ")
    if not text:
        return "your landing page conversion issue"
    for marker in [". ", "\n", "? ", "! "]:
        if marker in text:
            first = text.split(marker, 1)[0].strip().rstrip(". ")
            if 20 <= len(first) <= max_chars:
                return first
    return text[:max_chars].rstrip()


def draft_dm(prospect: dict, strategy: dict | None = None) -> str:
    """Write one personalized DM under 150 words in Nebula voice."""
    strategy = strategy or load_strategy(DEFAULT_BASE)
    name = prospect.get("name") or "there"
    comment = concise_signal(prospect.get("comment") or "your landing page conversion issue")
    company = str(prospect.get("company") or "").strip()
    if company:
        traffic_clause = f"If {company} is paying for clicks and the page is not converting"
    else:
        traffic_clause = "If you're paying for clicks and the page is not converting"
    dm = (
        f"{name} — saw your note: {comment}. "
        f"{traffic_clause}, the leak is usually headline/CTA/proof mismatch. "
        f"I made a free teardown path to flag the top leaks before anyone spends more on traffic. "
        f"No call, no ask attached. Paste the URL if useful: {AUDIT_URL}"
    )
    dm = _clean_banned(dm, strategy.get("banned_words", []))
    words = dm.split()
    if len(words) > 150:
        dm = " ".join(words[:150])
    return dm


def write_dm_queue(base: Path, prospects: list[dict], strategy: dict) -> list[dict]:
    gs = system_path(base)
    rows = []
    for prospect in prospects:
        dm = draft_dm(prospect, strategy)
        row = {
            "timestamp": utc_now(),
            "name": prospect.get("name", ""),
            "company": prospect.get("company", ""),
            "role": prospect.get("role", ""),
            "comment": prospect.get("comment", ""),
            "dm": dm,
            "stage": "dm_written",
            "word_count": len(dm.split()),
        }
        rows.append(row)
    if rows:
        append_jsonl(gs / "dm_queue.jsonl", rows)
    return rows


def queue_followups(base: Path = DEFAULT_BASE, now: datetime | None = None) -> list[dict]:
    """Queue follow-ups for prospects silent for 5+ days."""
    now = now or datetime.now(timezone.utc)
    gs = system_path(base)
    pipeline = gs / "linkedin_engager_pipeline.jsonl"
    rows = _load_json_records(pipeline)
    followups = []
    for row in rows:
        stage = row.get("stage", "")
        if stage not in {"dm_sent", "dm_written"}:
            continue
        raw_touch = row.get("last_touch_at") or row.get("timestamp")
        if not raw_touch:
            continue
        try:
            last_touch = datetime.fromisoformat(str(raw_touch).replace("Z", "+00:00"))
        except Exception:
            continue
        if now - last_touch >= timedelta(days=5):
            followups.append({
                "timestamp": utc_now(),
                "name": row.get("name", ""),
                "company": row.get("company", ""),
                "reason": "silent_5_days",
                "dm": f"{row.get('name', 'there')} — leaving this here in case it helps: if the ad traffic is still not converting, run the free teardown here: {AUDIT_URL}. No ask attached.",
            })
    if followups:
        append_jsonl(gs / "followup_queue.jsonl", followups)
    return followups


def run_weekly_system(base: Path = DEFAULT_BASE, source: Path | None = None) -> dict:
    """Run the weekly Monday system: strategy, calendar, engager ingest, DM writing, followups, summary."""
    gs = system_path(base)
    strategy = load_strategy(base)
    calendar = build_content_calendar()
    (gs / "content_calendar_30d.json").write_text(json.dumps(calendar, indent=2))
    prospects = ingest_engagers(base, source)
    dms = write_dm_queue(base, prospects, strategy)
    followups = queue_followups(base)
    summary = {
        "timestamp": utc_now(),
        "system": "claude_growth_system",
        "engagers_ingested": len(prospects),
        "dms_written": len(dms),
        "followups_queued": len(followups),
        "calendar_days": len(calendar),
        "apify_token_configured": bool(os.getenv("APIFY_TOKEN") or os.getenv("APIFY_API_TOKEN")),
        "next_action": "Export LinkedIn/Apify engagers to growth_system/apify_linkedin_engagers.json, then rerun.",
    }
    (gs / "weekly_summary.json").write_text(json.dumps(summary, indent=2))
    append_jsonl(gs / "weekly_runs.jsonl", [summary])
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Nebula's flat-file Claude growth system")
    parser.add_argument("--base", default=str(DEFAULT_BASE))
    parser.add_argument("--source", default="")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    base = Path(args.base)
    source = Path(args.source) if args.source else None
    summary = run_weekly_system(base, source)
    if args.json:
        print(json.dumps(summary, indent=2))
    else:
        print(f"Engagers ingested: {summary['engagers_ingested']}")
        print(f"DMs written: {summary['dms_written']}")
        print(f"Followups queued: {summary['followups_queued']}")
        print(f"Calendar days: {summary['calendar_days']}")


if __name__ == "__main__":
    main()
