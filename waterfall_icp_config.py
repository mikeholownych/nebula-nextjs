#!/usr/bin/env python3
"""
waterfall_icp_config.py — Nebula Waterfall ICP Targeting Architecture

Based on the TAM Architecture Blueprint methodology (Antoine Blitz, April 2026).

Company-first + Waterfall ICP cascade for Nebula's ad-bleed/zero-conversion
buying trigger. Defines 6 priority levels with keyword architecture, exclusion
lists, routing logic, and discovery-rate tracking.

Usage:
    python3 waterfall_icp_config.py                  # print config + metrics
    python3 waterfall_icp_config.py --routing-table  # print routing map
    python3 waterfall_icp_config.py --validate       # validate all patterns
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────
NEBULA = Path("/home/mike/nebula")
CONFIG_PATH = NEBULA / "waterfall_icp_config.json"

# ══════════════════════════════════════════════════════════════════════════════
# 1. KEYWORD ARCHITECTURE
# ══════════════════════════════════════════════════════════════════════════════

# Positional prefixes — paired with domain keywords to form multi-match queries.
POSITIONAL_PREFIXES = {
    "c_level": [
        r"\bchief\b", r"\bcmo\b", r"\bcro\b", r"\bcgo\b",
        r"\bvice president\b", r"\bvp\b",
    ],
    "head": [
        r"\bhead\b", r"\bdirector\b", r"\bsenior director\b",
        r"\bmanaging director\b",
    ],
    "manager": [
        r"\bmanager\b", r"\blead\b", r"\bsenior manager\b",
        r"\bgrowth lead\b", r"\bteam lead\b",
    ],
    "founder_ceo": [
        r"\bfounder\b", r"\bco-founder\b", r"\bceo\b",
        r"\bcofounder\b", r"\bowner\b",
    ],
}

# Domain keywords — the functional area for Nebula's ICP.
DOMAIN_KEYWORDS = {
    "growth_marketing": [
        r"\bmarketing\b", r"\bgrowth\b", r"\bdemand gen\b",
        r"\bdigital marketing\b", r"\bperformance marketing\b",
        r"\bbrand marketing\b", r"\bmarketing operations\b",
    ],
    "revenue_conversion": [
        r"\brevenue\b", r"\bconversion\b", r"\bcro\b",
        r"\bacquisition\b", r"\bpipeline\b", r"\bfunnel\b",
    ],
    "ads_traffic": [
        r"\bad\b", r"\bads\b", r"\bppc\b", r"\bpaid\b",
        r"\btraffic\b", r"\bgoogle ads\b", r"\bfacebook ads\b",
        r"\bdigital ads\b",
    ],
    "product_founder": [
        r"\bproduct\b", r"\bsaas\b", r"\bsoftware\b",
        r"\bstartup\b", r"\bventure\b",
    ],
}

# ── Exclusion list (inversion principle) ──
# Exclusions are more powerful than inclusions.
# Keep this stable; update only when false positives appear.
EXCLUSIONS = {
    # Seniority — remove non-decision-makers
    "junior_intern": [
        r"\bintern\b", r"\btrainee\b", r"\bapprentice\b",
        r"\bjunior\b", r"\bjr\b", r"\bassistant\b",
    ],
    # Status — no budget authority
    "freelance_contractor": [
        r"\bfreelance\b", r"\bfreelancer\b", r"\bcontractor\b",
        r"\bconsultant\b", r"\bindependent\b",
    ],
    # Scope — narrow functional focus that doesn't own conversion
    "non_conversion_scope": [
        r"\bpr\b", r"\bpublic relations\b", r"\bevents\b",
        r"\bproduct marketing\b",  # product marketing owns positioning not conversion
        r"\bbrand ambassador\b", r"\binfluencer\b",
    ],
    # Status — currently not active
    "inactive": [
        r"\bstudent\b", r"\blooking for\b", r"\bopen to work\b",
        r"\bseeking\b",
    ],
    # Providers / tech agencies — noise for Nebula's ICP
    "agency_noise": [
        r"\bagency\b", r"\bads management\b", r"\bgoogle ads expert\b",
        r"\bfacebook ads expert\b", r"\bmanaged ads\b",
        r"\bfreelance ads\b",
    ],
}

# Flatten exclusions into a single compiled matcher.
_ALL_EXCLUSION_PATTERNS: list[tuple[str, re.Pattern]] = []
for _category, _patterns in EXCLUSIONS.items():
    for _p in _patterns:
        _ALL_EXCLUSION_PATTERNS.append((_category, re.compile(_p, re.IGNORECASE)))


def has_exclusion(text: str) -> tuple[bool, str]:
    """Check if text matches any exclusion pattern. Returns (matched, category or '')."""
    low = text.lower()
    for cat, pat in _ALL_EXCLUSION_PATTERNS:
        if pat.search(low):
            return True, cat
    return False, ""


def matches_any(text: str, patterns: list[str]) -> bool:
    """Check if text matches any regex in a list."""
    low = text.lower()
    return any(re.search(p, low) for p in patterns)


def keyword_coverage_score(title: str, headline: str = "") -> float:
    """
    Score how well a contact's title+headline match Nebula's keyword architecture.
    Returns 0.0–1.0 based on prefix + domain overlap.
    """
    text = f"{title} {headline}".lower()
    prefix_hits = 0
    for name, patterns in POSITIONAL_PREFIXES.items():
        if matches_any(text, patterns):
            prefix_hits += 1

    domain_hits = 0
    for name, patterns in DOMAIN_KEYWORDS.items():
        if matches_any(text, patterns):
            domain_hits += 1

    total_prefix = len(POSITIONAL_PREFIXES)
    total_domain = len(DOMAIN_KEYWORDS)

    if total_prefix == 0 or total_domain == 0:
        return 0.0

    prefix_score = prefix_hits / total_prefix
    domain_score = domain_hits / total_domain

    # Need both prefix AND domain for a qualified lead.
    if prefix_score == 0 or domain_score == 0:
        return 0.0

    # Weighted: prefix 40%, domain 60%. Domain match is more specific.
    return (prefix_score * 0.4) + (domain_score * 0.6)


# ══════════════════════════════════════════════════════════════════════════════
# 2. WATERFALL ICP — PRIORITY LEVELS
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class IcpLevel:
    """A single Waterfall ICP priority level."""
    level: int                          # 1-6
    label: str                          # human-readable
    target_description: str             # who this targets
    positional_prefixes: list[str]      # which prefix groups (keys from POSITIONAL_PREFIXES)
    domain_keywords: list[str]          # which domain groups (keys from DOMAIN_KEYWORDS)
    headline_fallback: bool = False     # also scan headline?
    department_sweep: bool = False      # catch-all for dept members?
    founder_fallback: bool = False      # CEO/founder if no one else?
    min_company_size: tuple[int, int] | None = (1, 200)  # (min, max) employees
    max_company_size: tuple[int, int] | None = None
    # ── Title-only shorthand patterns ──
    # For abbreviated C-level titles like "CMO", "CRO" that don't contain domain
    # keywords but unambiguously signal the domain context.
    title_shorthand_domain: dict[str, list[str]] | None = None

    def match_contact(self, title: str, headline: str = "",
                      company_size: int | None = None) -> float:
        """
        Returns a relevance score 0.0–1.0 for a contact at this level.
        0.0 = no match.
        """
        # Company size gate
        if company_size is not None:
            if self.min_company_size and company_size < self.min_company_size[0]:
                return 0.0
            if self.max_company_size and company_size > self.max_company_size[1]:
                return 0.0

        # Exclusion check
        excluded, _ = has_exclusion(f"{title} {headline}")
        if excluded:
            return 0.0

        text = title.lower()

        # Founder fallback level
        if self.founder_fallback:
            is_founder = matches_any(text, POSITIONAL_PREFIXES["founder_ceo"])
            is_small = company_size is not None and company_size <= 20
            if is_founder and is_small:
                return 0.6
            return 0.0

        # Department sweep — catch anyone in a matching domain
        if self.department_sweep:
            domain_match = any(
                matches_any(text, DOMAIN_KEYWORDS[d])
                for d in self.domain_keywords
            )
            if domain_match:
                return 0.4
            return 0.0

        # Headline fallback — scan headline for atypical titles
        if self.headline_fallback and headline:
            combined = f"{title} {headline}".lower()
            prefix_match = matches_any(combined, self._compiled_prefixes())
            domain_match = matches_any(combined, self._compiled_domains())
            if prefix_match and domain_match:
                return 0.5
            return 0.0

        # Standard ICP match
        prefix_match = matches_any(text, self._compiled_prefixes())
        domain_match = matches_any(text, self._compiled_domains())

        # Title-only shorthand: e.g. "CMO" → marketing domain without needing
        # a domain keyword in the title itself.
        shorthands = self.title_shorthand_domain or {}
        for short_domain, short_patterns in shorthands.items():
            if matches_any(text, short_patterns) and matches_any(text, self._compiled_prefixes()):
                domain_match = True
                break

        if prefix_match and domain_match:
            # Calculate how good the match is
            return keyword_coverage_score(title, headline)

        return 0.0

    def _compiled_prefixes(self) -> list[str]:
        result = []
        for key in self.positional_prefixes:
            result.extend(POSITIONAL_PREFIXES.get(key, []))
        return result

    def _compiled_domains(self) -> list[str]:
        result = []
        for key in self.domain_keywords:
            result.extend(DOMAIN_KEYWORDS.get(key, []))
        return result


# ── Nebula's ICP Priority Levels (6-level Waterfall) ──

NEBULA_WATERFALL_ICP = [
    IcpLevel(
        level=1,
        label="Specialized C-level / VP",
        target_description=(
            "CMO, VP Marketing, Chief Marketing Officer — owns the budget and the"
            " conversion problem. Direct escalation path."
        ),
        positional_prefixes=["c_level", "head"],
        domain_keywords=["growth_marketing", "revenue_conversion"],
        title_shorthand_domain={
            "marketing": [r"\bcmo\b", r"\bchief marketing\b"],
            "revenue": [r"\bcro\b", r"\bchief revenue\b"],
            "growth": [r"\bcgo\b", r"\bchief growth\b"],
        },
        min_company_size=(5, 200),
    ),
    IcpLevel(
        level=2,
        label="Director-level / Head of",
        target_description=(
            "Head of Marketing, Marketing Director, Director of Growth — owns execution"
            " and tool decisions. Often the one who raised the ad-spend flag."
        ),
        positional_prefixes=["head", "manager"],
        domain_keywords=["growth_marketing", "ads_traffic", "revenue_conversion"],
        min_company_size=(5, 200),
    ),
    IcpLevel(
        level=3,
        label="Manager + headline signal",
        target_description=(
            "Growth Manager, Head of Growth, Demand Gen — pushes the actual levers."
            " High influence on conversion tooling decisions."
        ),
        positional_prefixes=["head", "manager"],
        domain_keywords=["growth_marketing", "revenue_conversion", "ads_traffic"],
        headline_fallback=True,
        min_company_size=(5, 200),
    ),
    IcpLevel(
        level=4,
        label="Champions via headline (atypical titles)",
        target_description=(
            "Unconventional titles: 'Commercial Innovation Manager', 'Digital Growth"
            " Lead', 'Revenue Operations Director'. Often the internal champion who"
            " tests tools and shapes the deal."
        ),
        positional_prefixes=["c_level", "head", "manager", "founder_ceo"],
        domain_keywords=["growth_marketing", "revenue_conversion", "ads_traffic", "product_founder"],
        headline_fallback=True,
        min_company_size=(5, 200),
    ),
    IcpLevel(
        level=5,
        label="Department sweep (any Marketing/Growth)",
        target_description=(
            "Anyone in the marketing, growth, or demand generation function. Nurture"
            " track — not ready for direct outreach."
        ),
        positional_prefixes=[],
        domain_keywords=["growth_marketing", "revenue_conversion", "ads_traffic"],
        department_sweep=True,
        min_company_size=(5, 500),
    ),
    IcpLevel(
        level=6,
        label="Founder/CEO fallback (sub-20 emp)",
        target_description=(
            "In a startup too small to have a functional specialist, the founder IS"
            " the decision maker. Only at P6 because more relevant contacts at P1-P5"
            " should be exhausted first."
        ),
        positional_prefixes=[],
        domain_keywords=[],
        founder_fallback=True,
        min_company_size=(1, 20),
    ),
]

# Build lookup by level
ICP_BY_LEVEL: dict[int, IcpLevel] = {lvl.level: lvl for lvl in NEBULA_WATERFALL_ICP}


def cascade_match(title: str, headline: str = "",
                  company_size: int | None = None) -> dict | None:
    """
    Waterfall cascade: try levels P1→P6, return the first match.
    Returns {level: int, label: str, score: float} or None if no match.
    """
    for icp_level in NEBULA_WATERFALL_ICP:
        score = icp_level.match_contact(title, headline, company_size)
        if score > 0:
            return {
                "icp_priority": icp_level.level,
                "label": icp_level.label,
                "score": round(score, 3),
            }
    return None


# ══════════════════════════════════════════════════════════════════════════════
# 3. ROUTING TABLE — map ICP priority to funnel action
# ══════════════════════════════════════════════════════════════════════════════

ROUTING_TABLE = {
    1: {   # P1 — Specialized C-level
        "channel": "cold_email_multichannel",
        "route_to": "founder_direct",       # Mike handles high-value
        "message_type": "high_touch_audit",
        "offer": "free_audit_then_97",
        "cadence": "strategic_3_step",
        "target_response": "audit_tool_visit",
    },
    2: {   # P2 — Director-level
        "channel": "cold_email",
        "route_to": "growth_agent",
        "message_type": "personalized_audit",
        "offer": "free_audit_then_97",
        "cadence": "standard_5_step",
        "target_response": "audit_tool_visit",
    },
    3: {   # P3 — Manager + headline
        "channel": "cold_email",
        "route_to": "growth_agent",
        "message_type": "evangelistic_audit",
        "offer": "free_audit_then_nurture",
        "cadence": "nurture_7_step",
        "target_response": "audit_tool_visit_or_reply",
    },
    4: {   # P4 — Champions / atypical
        "channel": "cold_email_or_linkedin",
        "route_to": "growth_agent",
        "message_type": "bottom_up_enablement",
        "offer": "free_audit_then_nurture",
        "cadence": "educational_5_step",
        "target_response": "audit_tool_visit",
    },
    5: {   # P5 — Department sweep
        "channel": "automation_nurture",
        "route_to": "marketing_automation",
        "message_type": "educational_sequence",
        "offer": "long_term_nurture",
        "cadence": "monthly_educational",
        "target_response": "click_or_reply",
    },
    6: {   # P6 — Founder fallback
        "channel": "short_cold_email",
        "route_to": "growth_agent",
        "message_type": "qualification_redirect",
        "offer": "redirect_to_specialist",
        "cadence": "short_2_step",
        "target_response": "reply_for_qualification",
    },
}


def get_routing(icp_priority: int) -> dict:
    """Get the routing config for a given ICP priority level."""
    return ROUTING_TABLE.get(icp_priority, ROUTING_TABLE[6])


# ══════════════════════════════════════════════════════════════════════════════
# 4. NAME DROP TACTIC
# ══════════════════════════════════════════════════════════════════════════════

def prepare_name_drop(contacts: list[dict]) -> list[dict]:
    """
    Given a list of contacts from the same company with icp_priority and
    ranking scores, map the first name of a P3-P4 contact into a
    colleague_first_name variable on the P1-P2 rows.

    This is the Name Drop tactic from the TAM Blueprint — ~15-25% lift in
    reply rates on high-value account sequences.
    """
    if not contacts:
        return contacts

    # Find a P3 or P4 contact to use as the "name drop" source
    name_drop_source = None
    for c in sorted(contacts, key=lambda x: x.get("icp_priority", 99)):
        pri = c.get("icp_priority", 99)
        if pri in (3, 4):
            name_drop_source = c.get("first_name") or c.get("name", "").split()[0]
            break

    if not name_drop_source:
        return contacts

    # Inject name_drop into P1-P2 contacts
    enriched = []
    for c in contacts:
        c = dict(c)
        pri = c.get("icp_priority", 99)
        if pri in (1, 2) and name_drop_source:
            c["colleague_first_name"] = name_drop_source
        enriched.append(c)
    return enriched


# ══════════════════════════════════════════════════════════════════════════════
# 5. DISCOVERY RATE TRACKING
# ══════════════════════════════════════════════════════════════════════════════

def discovery_rate(matched: int, total_tam: int) -> float:
    """
    Track what % of your TAM is visible in your pipeline.
    Target: 80%+ (TAM Blueprint guidance).
    """
    if total_tam == 0:
        return 0.0
    return round(matched / total_tam * 100, 1)


def validate_contact(title: str, headline: str = "",
                     company_size: int | None = None) -> dict:
    """
    Full validation pipeline for a single contact.
    Returns match/score/routing/exclusion info.
    """
    # 1. Exclusion check
    excluded, exclusion_cat = has_exclusion(f"{title} {headline}")
    if excluded:
        return {
            "valid": False,
            "reason": f"excluded: {exclusion_cat}",
            "title": title,
            "headline": headline,
        }

    # 2. Waterfall cascade
    match = cascade_match(title, headline, company_size)
    if not match:
        return {
            "valid": False,
            "reason": "no_icp_match",
            "title": title,
            "headline": headline,
        }

    # 3. Routing
    routing = get_routing(match["icp_priority"])

    return {
        "valid": True,
        "title": title,
        "headline": headline,
        "icp_priority": match["icp_priority"],
        "icp_label": match["label"],
        "score": match["score"],
        "routing": routing,
    }


# ══════════════════════════════════════════════════════════════════════════════
# 6. CLI / CONFIG DUMP
# ══════════════════════════════════════════════════════════════════════════════

def dump_config() -> str:
    """Serialize the full config as JSON for tooling."""
    return json.dumps({
        "waterfall_icp": [asdict(lvl) for lvl in NEBULA_WATERFALL_ICP],
        "routing_table": {
            str(k): v for k, v in sorted(ROUTING_TABLE.items())
        },
        "exclusion_categories": {
            k: len(v) for k, v in EXCLUSIONS.items()
        },
        "positional_prefix_groups": list(POSITIONAL_PREFIXES.keys()),
        "domain_keyword_groups": list(DOMAIN_KEYWORDS.keys()),
    }, indent=2)


def print_routing_table() -> None:
    """Print the routing table as a markdown table."""
    header = f"{'P#':<4} {'Label':<32} {'Channel':<28} {'Route To':<20} {'Offer':<28}"
    sep = "─" * len(header)
    print(f"```\n{header}\n{sep}")
    for lvl in sorted(ROUTING_TABLE):
        r = ROUTING_TABLE[lvl]
        label = ICP_BY_LEVEL[lvl].label if lvl in ICP_BY_LEVEL else ""
        print(f"{lvl:<4} {label:<32} {r['channel']:<28} {r['route_to']:<20} {r['offer']:<28}")
    print("```")


def validate_all_patterns() -> list[dict]:
    """Run validation against a set of example contacts."""
    test_cases = [
        # (title, headline, company_size)
        ("CMO", "Chief Marketing Officer | B2B SaaS", 50),
        ("VP Marketing", "VP of Marketing at Acme Corp", 120),
        ("Head of Marketing", "demand gen, ABM, pipeline", 40),
        ("Marketing Director", "Director of Marketing, EMEA", 80),
        ("Growth Manager", "Growth Manager | Paid Acquisition", 30),
        ("Head of Growth", "growth, CRO, conversion optimization", 25),
        ("Digital Growth Lead", "performance marketing at ScaleForge", 60),
        ("Revenue Operations Director", "RevOps, pipeline analytics", 45),
        ("Commercial Innovation Manager", "B2B innovation, growth strategy", 35),
        ("Marketing Intern", "Marketing Intern at StartUp", 50),           # excluded
        ("Freelance Marketing Consultant", "helping B2B with ads", 10),     # excluded
        ("Founder & CEO", "building my SaaS", 5),
        ("Founder", "bootstrapped, 3 employees", 3),
        ("Product Manager", "product at tech company", 100),
        ("Software Engineer", "full stack dev", 200),
        ("Junior Marketing Assistant", "supporting marketing team", 60),    # excluded
        ("Head of Product Marketing", "product positioning, GTM", 80),      # excluded scope
        ("Chief Revenue Officer", "revenue, pipeline, growth", 150),
        ("VP of Demand Generation", "demand gen, paid, ABM", 90),
        ("Brand Manager", "brand strategy, events", 70),
    ]

    results = []
    for title, headline, size in test_cases:
        result = validate_contact(title, headline, size)
        results.append(result)

    matched = sum(1 for r in results if r.get("valid"))
    excluded_cases = sum(1 for r in results if not r.get("valid") and "excluded" in r.get("reason", ""))
    no_match = sum(1 for r in results if not r.get("valid") and "no_icp_match" in r.get("reason", ""))

    print(f"VALIDATION: {len(results)} test cases")
    print(f"  Matched:        {matched}")
    print(f"  Excluded:       {excluded_cases}")
    print(f"  No ICP match:   {no_match}")
    print()

    for r in results:
        icon = "✅" if r.get("valid") else "❌"
        pri = r.get("icp_priority", "-")
        score = r.get("score", "-")
        reason = r.get("reason", "")
        title = r["title"]
        if r.get("valid"):
            print(f"{icon} P{pri} [{score}] {title}")
        else:
            print(f"{icon} {reason:<20} {title}")

    return results


def main() -> None:
    args = set(sys.argv[1:])

    if "--routing-table" in args:
        print_routing_table()
        return

    if "--validate" in args:
        validate_all_patterns()
        return

    # Default: print config summary
    print("=" * 72)
    print("NEBULA WATERFALL ICP — Targeting Architecture")
    print("Methodology: TAM Architecture Blueprint (Antoine Blitz, April 2026)")
    print("=" * 72)
    print()
    print(f"Priority Levels: {len(NEBULA_WATERFALL_ICP)}")
    print(f"Positional Prefix Groups: {len(POSITIONAL_PREFIXES)}")
    print(f"Domain Keyword Groups: {len(DOMAIN_KEYWORDS)}")
    print(f"Exclusion Categories: {len(EXCLUSIONS)} ({sum(len(v) for v in EXCLUSIONS.values())} patterns)")
    print()
    print("── Waterfall ICP Cascade ──")
    for lvl in NEBULA_WATERFALL_ICP:
        routing = ROUTING_TABLE[lvl.level]
        route = routing["channel"]
        print(f"  P{lvl.level}: {lvl.label}")
        print(f"       Target: {lvl.target_description[:80]}...")
        print(f"       Route:  {route} → {routing['route_to']}")
        print()

    # Save to JSON for other tooling to consume
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONFIG_PATH.write_text(dump_config())
    print(f"Config saved to: {CONFIG_PATH}")
    print()
    print("Run with --routing-table for markdown routing table")
    print("Run with --validate to test contact matching")


if __name__ == "__main__":
    main()
