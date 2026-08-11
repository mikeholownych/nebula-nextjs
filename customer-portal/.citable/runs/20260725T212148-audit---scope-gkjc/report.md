# Citable audit report

- Run: `20260725T212148-audit---scope-gkjc`
- Command: `audit --scope`
- Target: url - https://nebulacomponents.shop
- Timestamp: 2026-07-25T21:21:48.592Z
- Tool version: 1.13.1; commit: c43f0c7844a6ba57aea7b15d98afad5f6b47ea88 (dirty)

> Findings describe observed conditions and probabilities. Nothing in this report guarantees crawling, indexing, ranking, citation, recommendation, or conversion outcomes.

## Summary

| Metric | Value |
| --- | --- |
| Total findings | 36 |
| Deterministic observations | 24 |
| Heuristic / semantic findings | 12 |
| medium | 30 |
| low | 6 |

## Separate eligibility and observation states

| Dimension | Result | Evidence |
| --- | --- | --- |
| Retrieval eligibility | partial | 21 finding(s); 0 skipped check(s) |
| Source extraction and support | partial | 13 finding(s); 0 skipped check(s) |
| Observed citation behavior | not_evidenced | 0 controlled observation(s); property citation rate: not evidenced |

These states are not combined into an AI visibility score. Readiness does not establish retrieval selection or citation behavior.

## Skipped checks

- `MEAS-001`: missing context: promptResults

## Findings

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/ad-says-one-thing-page-says-another`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/ad-says-one-thing-page-says-another; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/b2b-saas-landing-page-not-converting`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/b2b-saas-landing-page-not-converting; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/coach-consultant-landing-page`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/coach-consultant-landing-page; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/cpc-break-even-landing-page`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/cpc-break-even-landing-page; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/cta-below-fold-mobile`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/cta-below-fold-mobile; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/form-has-zero-friction`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/form-has-zero-friction; no matching page found
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

- Subject: `https://nebulacomponents.shop/learning-centre/google-ads-high-ctr-low-conversion`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/google-ads-high-ctr-low-conversion; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/headline-cta-mismatch`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/headline-cta-mismatch; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/linkedin-ad-copy-landing-page-mismatch`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/linkedin-ad-copy-landing-page-mismatch; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/linkedin-ads-not-converting`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/linkedin-ads-not-converting; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/linkedin-authority-gap`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/linkedin-authority-gap; no matching page found
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

- Subject: `https://nebulacomponents.shop/learning-centre/social-proof-backfire`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/social-proof-backfire; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/tiktok-ads-not-converting`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/tiktok-ads-not-converting; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/tiktok-landing-page-scroll-speed-gap`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/tiktok-landing-page-scroll-speed-gap; no matching page found
- Remediation: Regenerate sitemaps from live canonical URLs; remove retired URLs.
- Verify: Resolve every sitemap URL against the built output or deployed site. (rerun `TECH-010`)

### MEDIUM · TECH-010 · Sitemap URL not present in audited output

- Subject: `https://nebulacomponents.shop/learning-centre/tiktok-trust-collapse`
- Type: deterministic_observation; confidence: confirmed; deterministic: true
- Impact: retrieval:medium
- Evidence:
  - sitemap https://nebulacomponents.shop/sitemap.xml lists https://nebulacomponents.shop/learning-centre/tiktok-trust-collapse; no matching page found
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

### MEDIUM · PAGE-002 · 2 pages share the title "Landing Page Audit - Find What’s Killing Your Ads | Nebula"

- Subject: `title:Landing Page Audit - Find What’s Killing Your Ads | Nebula`
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
  - passage: "Yes, directly. A 2017 Google/SOASTA study found that 53% of mobile users abandoned pages taking longer than 3 seconds to load - and that figure is from 2017, be"
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

- Subject: `description:Find the conversion leaks wasting paid t`
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
