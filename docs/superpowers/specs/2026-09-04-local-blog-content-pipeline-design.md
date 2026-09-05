# Local Blog Content Pipeline Design

**Date:** 2026-09-04
**Status:** Design approved by Mike, implementation not started
**Repository:** `/home/mike/nebula`
**Primary application:** `/home/mike/nebula/customer-portal`

## Objective

Build a self-hosted, evidence-gated content pipeline for Nebula Components' new blog. The pipeline must support both search-driven buyer education and transparent company feature posts without depending on an external content generation or publishing service.

The pipeline must produce a durable, reviewable record from source evidence through publication and measurement. Automated steps may prepare work and block unsafe content. They may not publish content or alter production SEO without the required human and timing gates.

## Product and editorial strategy

The blog has two editorial lanes.

### Acquisition lane

Purpose: capture buyer-problem search demand and move qualified readers to the free audit.

Typical post types:

- diagnostic guide
- symptom explainer
- checklist
- comparison
- evidence-backed listicle

Primary measures:

- qualified search impressions
- clicks
- audit starts
- checkout starts
- attributable purchases

### Feature lane

Purpose: document how Nebula operates, what it is learning, and why the product can be trusted.

Typical post types:

- product progress
- building in public
- assumption report
- failure and correction report
- field note
- evidence-backed listicle

Primary measures:

- qualified engagement
- branded search
- return visits
- assisted audit starts
- replies
- purchases

Feature posts can support trust and assisted conversion. They cannot be used alone to justify an SEO intervention.

## Proposed architecture

Use local Markdown or MDX files in Git as the canonical content source. Next.js renders approved content as server-generated HTML.

```text
Local source data
  ├─ audit findings
  ├─ GSC, GA4, Bing, PostHog exports
  ├─ competitor SERP snapshots
  ├─ product and deployment records
  ├─ operational incidents
  └─ tested assumptions
       │
       ▼
Opportunity record
       │
       ▼
Brief with evidence requirements
       │
       ▼
Draft Markdown or MDX
       │
       ▼
Claim, structure, accessibility, and route validation
       │
       ▼
Human editorial approval
       │
       ▼
Git commit and guarded deployment
       │
       ▼
Live route, sitemap, schema, and rendered HTML verification
       │
       ▼
Measurement review and refresh decision
```

Opinly is a temporary migration dependency only. The target architecture must remove the Opinly SDK, content fetches, webhook, and runtime dependency from the blog. During migration, the existing Opinly route may remain available only until local route parity, sitemap parity, schema parity, and live verification are complete. No new content workflow may depend on Opinly.

## Repository layout

```text
content/
  briefs/
  drafts/
  published/
  archived/

content-ledger/
  opportunities.jsonl
  claims.jsonl
  publication-events.jsonl
  refresh-events.jsonl
  approvals.jsonl

scripts/content_pipeline/
  collect_sources.py
  score_opportunities.py
  generate_brief.py
  validate_claims.py
  validate_article.py
  publish_readiness.py
  refresh_review.py

customer-portal/app/blog/
  page.tsx
  [slug]/page.tsx

customer-portal/app/lib/blog/
  loader.ts
  schema.ts
  types.ts
```

The canonical local route is `/blog` and `/blog/[slug]`. The existing Opinly route is only a migration bridge and must be removed after local parity is verified. The loader must have one canonical source of truth and must not maintain a second hand-edited article index.

## Article frontmatter contract

Every article must declare:

```yaml
slug: landing-page-not-converting
status: draft
content_lane: acquisition
post_type: diagnostic-guide
author_id: mike-holownych
category: Landing Page Leaks
primary_query: landing page not converting
supporting_queries:
  - landing page conversion audit
  - paid traffic not converting
purpose: organic-discovery
commercial_role: audit-entry
evidence_level: first_party
source_refs:
  - audit-pattern-2026-09
published_at: null
updated_at: null
reviewed_by: null
```

Feature example:

```yaml
slug: what-we-got-wrong-about-filter-based-targeting
status: draft
content_lane: feature
post_type: assumption-report
author_id: mike-holownych
category: Assumption Reports
purpose: trust
commercial_role: assisted-conversion
evidence_level: first_party
source_refs:
  - acquisition-review-2026-09
```

Allowed statuses:

```text
idea
briefed
drafted
evidence_review
editorial_review
approved
published
refresh_due
archived
```

A post with `status: published` but without a matching approval and publication ledger record fails validation.

## Content requirements

Each published article must satisfy the attached Million-Dollar Blog Post requirements.

1. H1: a buyer or reader question that names the topic and context.
2. Byline: named author, credentials, photo or profile link where available.
3. Dateline: visible published and last-updated dates.
4. Answer block: a direct 40 to 60 word answer before the preamble.
5. Question H2s: headings phrased as real questions.
6. Self-contained sections: each section remains understandable when extracted alone.
7. Extractable sentences: direct claims that can be quoted without interpretation.
8. Original data: first-party numbers include method, date, sample, and limitation.
9. Source links: claims link to primary sources, not derivative summaries.
10. Comparison table: used for options, features, or tradeoffs when it improves the answer.
11. FAQ block: visible real questions and clean answers, with FAQ schema only when valid.
12. Schema: Article, Organization, and Person declarations, plus FAQPage where valid.
13. Build: server-rendered HTML, descriptive image alt text, crawlable content, and no JavaScript requirement for the article body.
14. Next step: descriptive internal links and one clear `/audit` CTA for acquisition-relevant posts.

Feature posts may use a different primary purpose, but they still require the byline, dateline, answer block, extractable sections, provenance, schema, server rendering, and internal navigation.

## Evidence and provenance rules

Every material claim must be classified as one of:

- first-party measured data
- first-party observation
- primary external source
- clearly labelled illustration or composite
- unsupported and blocked

The pipeline must reject:

- invented testimonials
- fabricated customer stories
- invented spend, conversion, or recovery numbers
- anonymous claims presented as customer evidence
- competitor ranking data presented as competitor traffic or revenue
- statistics without a source and measurement boundary
- conclusions that exceed the evidence

Feature assumption reports use this required structure:

```text
Assumption
Why we believed it
Expected result
Observed result
Evidence and time window
What changed
Next bounded test
```

## Opportunity scoring and timing

The pipeline consumes existing local sources and does not create a second analytics system.

Priority inputs:

1. real audit findings
2. registered buyer-trigger keywords
3. GSC impressions, clicks, and ranking pages
4. repeated competitor SERP snapshots
5. support, sales, and founder-observed questions
6. product, operational, and assumption records for feature posts

The existing acquisition timing gates remain authoritative:

- daily or alert-driven operational failure: `INVESTIGATE`
- fewer than 100 impressions: `OBSERVE`
- one competitor win: `OBSERVE`
- two completed competitor snapshots: alignment review
- completed 28-day evidence window: prerequisite for production SEO change
- 84 days, or three completed 28-day cycles: prerequisite for consolidation or retirement

A scheduled pipeline may create an opportunity, brief, draft, or blocked report. It may not publish automatically.

## Validation gates

### Gate 1: source completeness

Verify every source reference exists and is readable. Verify the content lane and post type are valid.

### Gate 2: claim integrity

Verify that every number, customer statement, outcome, and external claim has provenance. Block unsupported or synthetic evidence.

### Gate 3: intent and cannibalization

Verify the primary query is in the canonical registry or explicitly marked as a feature query. Check that no existing page owns the same intent. Emit `REVIEW_CANNIBALIZATION` when overlap is unresolved.

### Gate 4: article structure

Verify H1, answer block length, question-based H2s, self-contained sections, FAQ visibility, CTA, internal links, and minimum readable depth.

### Gate 5: metadata and schema

Verify canonical URL, title, description, author, publisher, dates, Article schema, Organization schema, Person schema, and valid FAQ schema when present.

### Gate 6: accessibility and rendering

Verify semantic headings, keyboard-reachable links, image alt text, no client-only article body, and no duplicate navigation or footer. Use the existing Nebula design tokens and `#c7ff2f` accent.

### Gate 7: publication readiness

Produce a per-route report. Only `PASS` permits human approval. The report must include the exact source files, claim findings, route, canonical URL, schema result, links, and known limitations.

### Gate 8: human approval and deployment

Approval is recorded separately from the draft. Deployment requires the approved commit, build output, service restart evidence, live HTTP status, rendered HTML evidence, sitemap evidence, and rollback reference.

## Scheduling

Do not add autonomous publishing cron until supervised proof is complete.

Initial schedule:

- daily: collect source and operational signals, generate no more than one alert report
- weekly: generate opportunity and brief queue from the last completed measurement window
- weekly: run publish-readiness checks for explicitly approved drafts
- every 28 days: run content decision review
- every 84 days: run lifecycle review

The first production version should run in report-only mode. It should not write published content or deploy. After one representative success case and one failure case are verified, the supervised workflow can be promoted to draft generation.

## Testing and verification

Unit tests must cover:

- frontmatter parsing
- status transitions
- source reference validation
- claim provenance blocking
- synthetic testimonial blocking
- question heading detection
- answer block length
- FAQ visibility and schema parity
- canonical URL generation
- duplicate intent detection
- timing gate outcomes
- atomic ledger writes

Integration tests must cover:

- local article discovery
- server-rendered article HTML
- blog index filtering by lane
- sitemap inclusion
- metadata and JSON-LD output
- missing article 404 behavior
- blocked draft exclusion from the public route
- duplicate navigation and footer prevention

Live verification must cover:

- blog index HTTP status
- one acquisition article HTTP status and rendered H1
- one feature article HTTP status and rendered H1
- canonical link and JSON-LD in returned HTML
- sitemap inclusion
- `/audit` CTA destination
- service logs after deployment

No test may create a live Stripe session, payment, synthetic lead, or fabricated analytics event.

## Success criteria

The first implementation is successful when:

1. Both lanes can be represented in the same local content model.
2. A real evidence-backed acquisition brief can become a reviewed draft.
3. A real Nebula progress or assumption record can become a reviewed feature draft.
4. Unsupported claims and synthetic stories are blocked.
5. All 14 attached requirements are machine-checked where possible and manually reported where necessary.
6. Drafts do not appear publicly before approval.
7. Approved articles render as server HTML with valid metadata, schema, links, and sitemap entries.
8. The pipeline produces timing-aware recommendations without bypassing `RECOMMEND != APPROVE != EXECUTE`.
9. The first live release is verified through HTTP, rendered HTML, sitemap, and service evidence.

## Explicit non-goals

- No external AI content-generation service
- No external CMS dependency for the initial implementation
- No autonomous publishing
- No automatic production SEO rewrites
- No competitor scraping without a lawful, verified source
- No fake social proof or synthetic case studies
- No new analytics source that competes with the internal ledger
- No broad topic expansion before acquisition evidence supports it
