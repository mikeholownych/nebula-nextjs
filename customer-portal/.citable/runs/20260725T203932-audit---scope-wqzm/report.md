# Citable audit report

- Run: `20260725T203932-audit---scope-wqzm`
- Command: `audit --scope`
- Target: url — https://nebulacomponents.shop
- Timestamp: 2026-07-25T20:39:32.275Z
- Tool version: 1.13.1; commit: c43f0c7844a6ba57aea7b15d98afad5f6b47ea88 (dirty)

> Findings describe observed conditions and probabilities. Nothing in this report guarantees crawling, indexing, ranking, citation, recommendation, or conversion outcomes.

## Summary

| Metric | Value |
| --- | --- |
| Total findings | 29 |
| Deterministic observations | 17 |
| Heuristic / semantic findings | 12 |
| high | 3 |
| medium | 20 |
| low | 6 |

## Separate eligibility and observation states

| Dimension | Result | Evidence |
| --- | --- | --- |
| Retrieval eligibility | partial | 11 finding(s); 0 skipped check(s) |
| Source extraction and support | not_established | 16 finding(s); 1 skipped check(s) |
| Observed citation behavior | not_evidenced | 0 controlled observation(s); property citation rate: not evidenced |

These states are not combined into an AI visibility score. Readiness does not establish retrieval selection or citation behavior.

## Skipped checks

- `LIFE-006`: missing context: snapshots
- `MEAS-001`: missing context: promptResults

## Findings

### HIGH · CLAIM-004 · performance claim "We have helped founders stop burning budget on ads that never convert …" has no supporting evidence

- Subject: `claims/claim-founders-stop-burning`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: legal:high, reputational:medium
- Evidence:
  - claims/claim-founders-stop-burning: claim_type=performance, evidence=[]
- Remediation: Gather methodology-backed evidence, or mark the claim insufficient_evidence and remove it from publication surfaces.
- Verify: Performance/comparative claims all reference evidence. (rerun `CLAIM-004`)

### HIGH · SCHEMA-007 · 5/5 FAQ schema questions not found in visible content

- Subject: `https://nebulacomponents.shop/learning-centre/message-match-checklist#FAQPage`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: legal:medium, ranking:medium
- Evidence:
  - not visible: "What is message match in advertising?"
  - not visible: "How do I check message match on my landing page?"
  - not visible: "Does message match affect Google Ads Quality Score?"
- Remediation: Only mark up FAQs that are visible, substantive page content.
- Verify: Every FAQPage question string appears in visible text. (rerun `SCHEMA-007`)

### HIGH · SCHEMA-007 · 4/4 FAQ schema questions not found in visible content

- Subject: `https://nebulacomponents.shop/learning-centre/proof-before-cta#FAQPage`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: legal:medium, ranking:medium
- Evidence:
  - not visible: "Why does proof placement affect conversion rate?"
  - not visible: "What types of social proof increase conversion rate the most?"
  - not visible: "Where exactly should proof be placed on a landing page?"
- Remediation: Only mark up FAQs that are visible, substantive page content.
- Verify: Every FAQPage question string appears in visible text. (rerun `SCHEMA-007`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/b2b-saas-landing-page-not-converting`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/b2b-saas-landing-page-not-converting; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/founder-second-brain`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/founder-second-brain; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/google-ads-disapproved-ads-still-spending`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/google-ads-disapproved-ads-still-spending; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/linkedin-skill-engine`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/linkedin-skill-engine; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/meta-ads-high-frequency-not-converting`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/meta-ads-high-frequency-not-converting; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/pricing-page-not-converting`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/pricing-page-not-converting; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/specialist-ai-agent-library`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/specialist-ai-agent-library; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · CRAWL-002 · Vendor "Microsoft" has search-crawler access allowed but no recorded model-training decision

- Subject: `Microsoft`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: legal:high, representation:low
- Evidence:
  - crawlers registry contains no purpose=model_training entry for vendor Microsoft
- Remediation: Record an explicit allow/block decision, owner, and legal rationale for each training-purpose crawler of vendors whose search crawlers are allowed.
- Verify: Confirm a crawler registry entry with purpose model_training exists for the vendor. (rerun `CRAWL-002`)

### MEDIUM · CRAWL-002 · Vendor "Perplexity" has search-crawler access allowed but no recorded model-training decision

- Subject: `Perplexity`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: legal:high, representation:low
- Evidence:
  - crawlers registry contains no purpose=model_training entry for vendor Perplexity
- Remediation: Record an explicit allow/block decision, owner, and legal rationale for each training-purpose crawler of vendors whose search crawlers are allowed.
- Verify: Confirm a crawler registry entry with purpose model_training exists for the vendor. (rerun `CRAWL-002`)

### MEDIUM · CRAWL-004 · robots.txt has 9 parse problem(s)

- Subject: `https://nebulacomponents.shop/robots.txt`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - line 28: unknown directive "Content-Signal"
  - line 32: unknown directive "Content-Signal"
  - line 36: unknown directive "Content-Signal"
  - line 40: unknown directive "Content-Signal"
  - line 44: unknown directive "Content-Signal"
  - line 48: unknown directive "Content-Signal"
  - line 52: unknown directive "Content-Signal"
  - line 56: unknown directive "Content-Signal"
  - line 61: unknown directive "Content-Signal"
- Remediation: Fix the malformed lines; regenerate robots.txt from the crawler policy registry.
- Verify: Re-parse robots.txt and confirm zero errors. (rerun `CRAWL-004`)

### MEDIUM · PAGE-002 · 2 pages share the title "Free Landing Page Audit — Stop Burning Ad Budget | Nebula Components"

- Subject: `title:Free Landing Page Audit — Stop Burning Ad Budget | Nebula Components`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: ranking:medium
- Evidence:
  - https://nebulacomponents.shop/
  - https://nebulacomponents.shop/
- Remediation: Differentiate titles to reflect each page’s distinct intent.
- Verify: Confirm title uniqueness across index targets. (rerun `PAGE-002`)

### MEDIUM · ANS-005 · Relative quantity asserted without baseline or timeframe in the same passage

- Subject: `https://nebulacomponents.shop/learning-centre/landing-page-bounce-rate-high`
- Type: probabilistic_inference; confidence: medium; deterministic: false
- Impact: citation:medium, legal:medium, reputational:medium
- Evidence:
  - passage: "Yes, directly. A 2017 Google/SOASTA study found that 53% of mobile users abandoned pages taking longer than 3 seconds to load — and that figure is from 2017, be"
- Remediation: State the baseline, measurement period, and test conditions adjacent to the number, or remove the figure.
- Verify: Confirm baseline/conditions appear adjacent to each relative quantity. (rerun `ANS-005`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · ANS-005 · Relative quantity asserted without baseline or timeframe in the same passage

- Subject: `https://nebulacomponents.shop/learning-centre/landing-page-load-time-slow`
- Type: probabilistic_inference; confidence: medium; deterministic: false
- Impact: citation:medium, legal:medium, reputational:medium
- Evidence:
  - passage: "Multiple studies show a consistent relationship. Portent's 2022 analysis of 100M+ page views found that B2B lead generation pages loading in 1 second have a con"
- Remediation: State the baseline, measurement period, and test conditions adjacent to the number, or remove the figure.
- Verify: Confirm baseline/conditions appear adjacent to each relative quantity. (rerun `ANS-005`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · CLAIM-007 · Superlative "the fastest" with no registered comparative claim for this page

- Subject: `https://nebulacomponents.shop/learning-centre/agency-handoff-debt`
- Type: probabilistic_inference; confidence: high; deterministic: false
- Impact: legal:medium, reputational:medium, citation:low
- Evidence:
  - matched: "the fastest"
  - no comparative claim lists this page as a publication surface
- Remediation: Remove the superlative, or register a comparative claim with a defined comparison set and evidence.
- Verify: Superlatives on the page map to registered, evidenced comparative claims. (rerun `CLAIM-007`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · CLAIM-007 · Superlative "the top" with no registered comparative claim for this page

- Subject: `https://nebulacomponents.shop/learning-centre/ghost-variant-ab-test`
- Type: probabilistic_inference; confidence: high; deterministic: false
- Impact: legal:medium, reputational:medium, citation:low
- Evidence:
  - matched: "the top"
  - no comparative claim lists this page as a publication surface
- Remediation: Remove the superlative, or register a comparative claim with a defined comparison set and evidence.
- Verify: Superlatives on the page map to registered, evidenced comparative claims. (rerun `CLAIM-007`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · CLAIM-007 · Superlative "the top" with no registered comparative claim for this page

- Subject: `https://nebulacomponents.shop/learning-centre/landing-page-not-converting`
- Type: probabilistic_inference; confidence: high; deterministic: false
- Impact: legal:medium, reputational:medium, citation:low
- Evidence:
  - matched: "the top"
  - no comparative claim lists this page as a publication surface
- Remediation: Remove the superlative, or register a comparative claim with a defined comparison set and evidence.
- Verify: Superlatives on the page map to registered, evidenced comparative claims. (rerun `CLAIM-007`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · CLAIM-007 · Superlative "the fastest" with no registered comparative claim for this page

- Subject: `https://nebulacomponents.shop/learning-centre/mobile-landing-page-leaks`
- Type: probabilistic_inference; confidence: high; deterministic: false
- Impact: legal:medium, reputational:medium, citation:low
- Evidence:
  - matched: "the fastest"
  - no comparative claim lists this page as a publication surface
- Remediation: Remove the superlative, or register a comparative claim with a defined comparison set and evidence.
- Verify: Superlatives on the page map to registered, evidenced comparative claims. (rerun `CLAIM-007`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · CLAIM-007 · Superlative "the top" with no registered comparative claim for this page

- Subject: `https://nebulacomponents.shop/learning-centre/cta-not-working`
- Type: probabilistic_inference; confidence: high; deterministic: false
- Impact: legal:medium, reputational:medium, citation:low
- Evidence:
  - matched: "the top"
  - no comparative claim lists this page as a publication surface
- Remediation: Remove the superlative, or register a comparative claim with a defined comparison set and evidence.
- Verify: Superlatives on the page map to registered, evidenced comparative claims. (rerun `CLAIM-007`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · CLAIM-007 · Superlative "the fastest" with no registered comparative claim for this page

- Subject: `https://nebulacomponents.shop/learning-centre/before-you-raise-ad-budget`
- Type: probabilistic_inference; confidence: high; deterministic: false
- Impact: legal:medium, reputational:medium, citation:low
- Evidence:
  - matched: "the fastest"
  - no comparative claim lists this page as a publication surface
- Remediation: Remove the superlative, or register a comparative claim with a defined comparison set and evidence.
- Verify: Superlatives on the page map to registered, evidenced comparative claims. (rerun `CLAIM-007`)
- Limitations: heuristic detection; verify manually before acting

### MEDIUM · CLAIM-007 · Superlative "the top" with no registered comparative claim for this page

- Subject: `https://nebulacomponents.shop/learning-centre/landing-page-conversion-rate-benchmark`
- Type: probabilistic_inference; confidence: high; deterministic: false
- Impact: legal:medium, reputational:medium, citation:low
- Evidence:
  - matched: "the top"
  - no comparative claim lists this page as a publication surface
- Remediation: Remove the superlative, or register a comparative claim with a defined comparison set and evidence.
- Verify: Superlatives on the page map to registered, evidenced comparative claims. (rerun `CLAIM-007`)
- Limitations: heuristic detection; verify manually before acting

### LOW · PAGE-004 · 2 pages share the same meta description

- Subject: `description:Evidence-backed landing page conversion `
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: conversion:low
- Evidence:
  - https://nebulacomponents.shop/
  - https://nebulacomponents.shop/
- Remediation: Write distinct descriptions per page.
- Verify: Confirm description uniqueness. (rerun `PAGE-004`)

### LOW · PAGE-006 · Heading hierarchy skips from H1 to H3 ("Above The Fold: The 3-Second Window That Determines If Paid ")

- Subject: `https://nebulacomponents.shop/learning-centre`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: citation:low
- Evidence:
  - sequence: H1 → H3
- Remediation: Restructure headings to descend one level at a time.
- Verify: Walk heading sequence and confirm no level is skipped. (rerun `PAGE-006`)

### LOW · PAGE-006 · Heading hierarchy skips from H2 to H4 ("Install")

- Subject: `https://nebulacomponents.shop/resources/citable`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: citation:low
- Evidence:
  - sequence: H2 → H4
- Remediation: Restructure headings to descend one level at a time.
- Verify: Walk heading sequence and confirm no level is skipped. (rerun `PAGE-006`)

### LOW · LINK-004 · Exact-match anchor repeated 36 times sitewide: terms of service

- Subject: `terms of service→https://nebulacomponents.shop/terms`
- Type: probabilistic_inference; confidence: medium; deterministic: false
- Impact: ranking:low, reputational:low
- Evidence:
  - 36 occurrences across 36 pages
- Remediation: Vary contextual anchors naturally; keep repeated labels to navigation chrome only.
- Verify: Re-measure anchor repetition after cleanup. (rerun `LINK-004`)
- Limitations: heuristic detection; verify manually before acting

### LOW · AGENT-003 · llms.txt not discovered during crawl

- Subject: `/llms.txt`
- Type: probabilistic_inference; confidence: medium; deterministic: false
- Evidence:
  - No /llms.txt found in crawl results or site metadata
- Remediation: Create /llms.txt at your site root with: site purpose, key pages list with descriptions, and optionally /llms-full.txt with complete content. See https://llmstxt.org/ for spec.
- Verify: Fetch /llms.txt and confirm it returns 200 with Markdown content. (rerun `AGENT-003`)
- Limitations: heuristic detection; verify manually before acting

### LOW · AGENT-006 · No Markdown content negotiation support detected

- Subject: `site`
- Type: probabilistic_inference; confidence: medium; deterministic: false
- Evidence:
  - Content-Type does not include text/markdown
  - Vary header: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch (does not indicate Accept negotiation)
  - No .md pages found in crawl
- Remediation: Enable via Cloudflare (automatic with Cloudflare proxying) or serve .md variants of key pages. See https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/.
- Verify: Run `curl -H "Accept: text/markdown" <page-url>` and confirm Markdown response. (rerun `AGENT-006`)
- Limitations: heuristic detection; verify manually before acting
