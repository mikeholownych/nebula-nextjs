# Job Board Filtering System

## Core Purpose
Qualify leads from job boards using title-first, strict filtering

## Three-Layer ICP Gate

### Layer 1: Hard Reject
Negative title keywords (industry/intent mismatch):
- "lead gen", "lead generation", "scraper", "scraping", "data collect"
- "data entry", "database", "web research", "researcher", "amazon"
- "linkedin", "instagram", "social media", "healthcare", "mortgage"
- "real estate", "e-commerce product", "shopify product"

### Layer 2: Hard Gate  
Title MUST contain positive ICP keyword:
- "landing page", "conversion rate", "cro", "conversion optimiz"
- "squeeze page", "sales page", "funnel optim", "a/b test"
- "ab test", "split test", "ppc landing", "page not converting"

### Layer 3: Score Threshold
Only queue jobs above minimum score:
```python
MIN_SCORE = 80  # desc keywords boost above base 50; weak fits don't queue

def qualify(job):
    title = (job.get("title") or "").lower()
    # Layer 1: reject
    if any(kw in title for kw in TITLE_REJECT):
        return False, 0
    # Layer 2: title gate (desc match alone is NOT sufficient)
    if not any(kw in title for kw in TITLE_MUST_MATCH):
        return False, 0
    # Layer 3: score (desc boost keywords accumulate)
    score = 50  # base
    desc = (job.get("description") or "").lower()
    for kw in DESC_BOOST_KEYWORDS:
        if kw in desc:
            score = min(score + 10, 100)
    return score >= MIN_SCORE, score
```

## Quality Gates
- Title match is prerequisite (description match alone insufficient)
- Score threshold must be enforced
- Negative keywords must reject immediately

## Implementation Pattern
Use intent-specific queries to pre-filter at source:
- "\"landing page not converting fix\""
- "\"CRO audit landing page optimization\""