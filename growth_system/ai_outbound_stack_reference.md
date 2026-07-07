# AI Outbound Stack — Nebula Quick Reference

**Source:** The AI Outbound Stack (Notion, meadow-leader-47c)
**Stolen:** 15 prospecting templates across 7 methods. Full extraction in competitive artifact.
**Nebula gap filled:** Creator post comment scraping (Method 2) — highest intent signal, lowest competition.

## Method Overview

| # | Method | Intent | Volume | Nebula Status |
|---|---|---|---|---|
| 1 | Job Post Scraping | HIGH | Medium | Not implemented — tangential to ICP |
| 2 | **LinkedIn Comment Scraping** | **HIGHEST** | **Low** | **NEW — CREATOR_POSTS config added** |
| 3 | Funding Alerts | HIGH | Medium | Not implemented — better for later stage |
| 4 | Website Visitor ID | HIGHEST | Low | Exists via RB2B integration |
| 5 | Tech Stack Targeting | MED-HIGH | Medium | Not implemented |
| 6 | Sales Navigator Filters | MEDIUM | High | Not implemented (no Sales Nav) |
| 7 | Google Maps | MEDIUM | Very High | Not implemented (not ICP) |

## Recommended Stack for Nebula

Primary: **Method 2 (Comment Scraping)** — Add 3-5 CRO creator post URLs to CREATOR_POSTS
Secondary: **Method 4 (Visitor ID)** — Already wired via RB2B
Volume filler: **Existing trigger-aware outbound** + Reddit monitor

## Critical Timing Rule

> Post comment sections die in 48-72 hours. Reach out while the conversation is fresh. After 72 hours, they've moved on.

Nebula's existing every-2h monitor already beats this window. The gap is adding CREATOR_POSTS to the monitored URLs.

## Personalization Formula (Method 2)

```
[FIRST NAME], saw your comment on [CREATOR]'s post about [TOPIC].
[ONE SENTENCE showing you read their comment and have a relevant take].
[SOFT CTA — "Curious what you're running into?"]
```

## Key Files

- `linkedin_post_monitor.py` — CREATOR_POSTS config, get_source_type(), creator score boost
- `growth_system/linkedin_reply_templates.json` — `creator_comment_outreach` template + `dm_creator_template`
- `growth_system/cold_email_frameworks.json` — `linkedin_comment_outreach` framework
- `competitive/ai-outbound-stack.jsonl` — full extraction
