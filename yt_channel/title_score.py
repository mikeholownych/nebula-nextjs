#!/usr/bin/env python3
"""Title variant scoring — 'generate more, pick the strongest'.

Implements the title part of Shane Hummus' holy-trifecta system: generate
several title variants per video, score each for click potential with a
deterministic heuristic (no LLM needed), and pick the winner.

Evidence-based scoring (title_research 2026-08-09 + this playbook):
  - specific numbers sell ('a real specific slightly insane number')
  - question-first titles over-index in this niche (82x outlier)
  - pain-first beats domain-first for search intent
  - shorts titles are truncated ~60 chars in the UI
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass

# Keywords that signal search intent in this niche.
INTENT_KEYWORDS = (
    "landing page", "audit", "convert", "conversion", "cro", "sales",
    "visitors", "leads", "ads", "roi", "teardown", "review", "fix",
    "bleeding", "wasting", "hidden", "breakdown",
)

PAIN_WORDS = (
    "bleeding", "wasting", "killing", "losing", "leaving", "hidden",
    "costing", "invisible", "broken", "clicks", "no sales", "not converting",
)

# Dave Jeltema (JO2JSj3JU48) lessons 12-13: ACUTE pain beats chronic.
# 'Stop wasting 20 hours on videos that get 300 views. Do this first.'
# (acute, time-bound, urgent) beat 'How to make sure your next video
# gets views' (chronic, ongoing). Acute = happened/is happening right
# now, needs immediate action. Chronic = always present, someday.
ACUTE_WORDS = (
    "right now", "today", "this second", "now", "stop wasting",
    "stop losing", "3 seconds", "just", "already", "still", "immediately",
    "before", "do this first", "fix it", "left", "left already",
)

# Problem-aware beats solution-aware: speak to the problem they KNOW
# they have ('your CTA is invisible') not the solution they don't know
# exists ('how to increase conversion rates'). Detection: the title
# names a pain/state, not a how-to/solution framing.
SOLUTION_SIGNALS = (
    "how to", "guide", "tips", "tutorial", "learn how", "5 ways",
    "10 ways", "ways to", "strategy", "checklist", "system",
)


@dataclass
class TitleOption:
    title: str
    score: int
    reasons: list[str]


def _count_penalty(title: str, max_len: int, label: str) -> list[str]:
    reasons = []
    if len(title) > max_len:
        reasons.append(f"too long ({len(title)}>{max_len})")
    return reasons


def score_title(title: str, *, is_short: bool = True, domain: str = "",
                has_score: bool = True) -> TitleOption:
    """Score a title for click potential. Higher is better (0-10)."""
    t = title.lower()
    score = 0
    reasons: list[str] = []

    # 1. Specificity — a number in the title (score, %, etc.)
    if any(c.isdigit() for c in title):
        score += 2
        reasons.append("has number")
    if has_score and "/10" in t:
        score += 1
        reasons.append("score badge")

    # 2. Question form over-indexes in this niche (ICAHN evidence)
    if "?" in title:
        score += 1
        reasons.append("question form")

    # 3. Pain-first copy
    if any(w in t for w in PAIN_WORDS):
        score += 2
        reasons.append("pain-first")
    # 3b. Acute pain > chronic (Dave Jeltema lesson 12: 'what just
    #     happened to this person that makes them need this right now?')
    if any(w in t for w in ACUTE_WORDS):
        score += 2
        reasons.append("acute pain")
    # 3c. Problem-aware > solution-aware (lesson 13: speak to the
    #     problem they know they have, not the solution they don't).
    #     Penalize how-to/solution framing unless pain words present.
    if any(w in t for w in SOLUTION_SIGNALS):
        if not any(w in t for w in PAIN_WORDS) and "?" not in t:
            score -= 1
            reasons.append("solution-aware (prefer problem-aware)")
    # 4. Search-intent keyword
    if any(k in t for k in INTENT_KEYWORDS):
        score += 1
        reasons.append("intent keyword")

    # 5. Domain present → brand search + specificity
    if domain and domain.split(".")[0] in t:
        score += 1
        reasons.append("domain named")

    # 6. Length — shorts truncate ~60 chars, long-form ~70
    max_len = 60 if is_short else 70
    if len(title) <= max_len:
        score += 1
        reasons.append("right length")
    else:
        score -= 2
        reasons.append(f"too long ({len(title)}>{max_len})")

    # 7. Shorts marker
    if is_short and "#shorts" in t:
        score += 1
        reasons.append("#Shorts")

    return TitleOption(title=title, score=max(0, min(10, score)), reasons=reasons)


def pick_best(variants: list[str], *, is_short: bool = True, domain: str = "",
              has_score: bool = True, seed: str = "") -> TitleOption:
    """Score all variants, return the best (stable tie-break by seed)."""
    scored = [score_title(v, is_short=is_short, domain=domain, has_score=has_score)
              for v in variants]
    # Stable tie-break: md5(seed + title) so a given domain picks the same
    # winner every run (deterministic pipeline), while still preferring
    # the highest score first.
    scored.sort(key=lambda o: (-o.score, hashlib.md5(f"{seed}|{o.title}".encode()).hexdigest()))
    return scored[0]


def rank(variants: list[str], **kw) -> list[TitleOption]:
    """All variants sorted best-first (for logging)."""
    scored = [score_title(v, **kw) for v in variants]
    scored.sort(key=lambda o: -o.score)
    return scored


if __name__ == "__main__":
    # Smoke test
    sample = [
        "Your Landing Page Is Bleeding Money: www.shopify.com Audit (4/10) #Shorts",
        "Why Isn't Your Landing Page Converting? Fix It #Shorts",
        "Slow Page? Your Visitors Left 3 Seconds Ago #Shorts",
        "Landing Page Audit: www.shopify.com #Shorts",
    ]
    for o in rank(sample, domain="www.shopify.com"):
        print(f"{o.score:>2}  {o.title[:60]}  [{', '.join(o.reasons)}]")
