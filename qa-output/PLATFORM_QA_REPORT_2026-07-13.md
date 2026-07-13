# Nebula Components — Full Platform QA Report

**Audit date:** 2026-07-13 UTC  
**Target:** https://nebulacomponents.shop  
**Scope:** public routes, buyer flows, APIs, security boundaries, Stripe contracts, mobile layout, accessibility, visual integrity, server behavior, and regression suite.

## Executive verdict

**PASS for public launch after remediation.**

All critical and high-severity defects found during this review were fixed and verified against the live tunnel. No broken public routes, broken internal links, unexpected Stripe links, WCAG contrast failures, JavaScript page errors, mobile overflow failures, or exposed internal ledgers remain in the tested surface.

## Final evidence

| Gate | Result |
|---|---:|
| Python regression suite | **117 passed** |
| Full-site Playwright visual/WCAG suite | **87 passed** |
| Critical-flow/mobile/animation/pricing Playwright suite | **36 passed** |
| Total Playwright checks | **123 passed** |
| Routes crawled | **36** |
| Route failures | **0** |
| Broken internal links | **0** |
| Broken fragment links | **0** |
| Missing titles | **0** |
| Pages without exactly one H1 | **0** |
| Missing image alt attributes | **0** |
| Pages with unlabeled controls | **0** |
| Unsafe `target="_blank"` links | **0** |
| Unexpected Stripe checkout slugs | **0** |
| Sensitive static paths tested | **6/6 return 404** |
| Stripe commercial contracts verified | **3/3 live** |

Primary machine-readable crawl evidence: `qa-output/artifacts/platform-crawl.json`.

## Critical/high defects fixed

### 1. Public exposure of source code and lead/customer data — CRITICAL

The server's `SimpleHTTPRequestHandler` fallback exposed project-root files publicly, including:

- `HOT_LEAD.json`
- `audit_leads.jsonl`
- `ops/company_brain.json`
- `agentic_server.py`
- `.git/config`
- `governance/ECONOMICS.md`

**Fix:** added a deny-by-default static-file gate. Only browser-safe asset extensions are served; source, ledgers, configuration, hidden paths, and internal directories are blocked.

**Live verification:** all six representative sensitive paths now return **404**, while HTML, CSS, JavaScript, images, and public case studies still return **200**.

### 2. Unauthenticated administrative CRM APIs — CRITICAL

Administrative CRM routes returned lead/client data without authentication.

**Fix:** administrative CRM endpoints and `lead-dashboard.html` now require a private bearer token stored with mode `0600` outside the web root.

**Verification:** unauthenticated routes return **401**; requests with the private bearer token return **200**.

### 3. Audit endpoint SSRF exposure — CRITICAL

User-controlled audit URLs could target loopback, private, link-local, or metadata-network addresses.

**Fix:** added scheme, hostname, DNS-resolution, IP-range, credential, and redirect-target validation. Redirects are followed manually and revalidated at every hop.

**Verification:** five SSRF regression tests pass; live requests to `127.0.0.1` fail closed with **400**.

### 4. Audit requests blocked the entire platform — HIGH

The server used single-threaded `TCPServer`; one slow audit fetch could block health checks and checkout traffic.

**Fix:** migrated to `ThreadingTCPServer`.

**Verification:** a live audit completed in approximately 0.3 seconds while a concurrent health request returned **200** in approximately 0.08 seconds.

### 5. Commercial contract drift — HIGH

Public pages contained legacy `$97` Fix Pack language and mixed 24-hour/72-hour delivery promises. Stripe's Fix Pack description promised 72 hours while the canonical offer promised 24 hours.

**Fixes:**

- Standardized public Fix Pack price to **$147**.
- Standardized delivery promise to **24 hours**.
- Updated active checkout links across public buyer pages.
- Updated Stripe's live Fix Pack product description to 24-hour delivery.
- Added regression tests blocking legacy `$97` and 72-hour Fix Pack copy.
- Updated `governance/ECONOMICS.md` to current price, Stripe fee, margin, and LTV math.

### 6. Stripe checkout mismatches — HIGH

All live commercial contracts were reverified through both Stripe's API and rendered checkout pages:

| Offer | Live contract |
|---|---|
| Conversion Fix Pack | **$147 one-time**, 24-hour delivery description |
| AI Ops Retainer | **$1,497/month**, charged immediately |
| Agency Partner | **$497/month**, **14 days free**, then monthly billing |

Active slugs:

- Fix Pack: `6oUfZh7M87YM5TPgEa43S0b`
- Retainer: `00w5kD1nK0wkaa573A43S0c`
- Partner: `aFa8wPc2o7YM9613Ro43S0d`

### 7. Dead newsletter flow — HIGH

The public newsletter form posted to an unimplemented route.

**Fix:** implemented validated subscriber capture with deduplication and a subscriber ledger outside the public surface.

### 8. Broken demo-booking handler — HIGH

The booking handler accepted empty payloads, returned success prematurely, and read a deleted `/tmp/am_key` secret.

**Fix:** added JSON/email validation, current AgentMail secret resolution, correct success/error statuses, and safe error responses.

### 9. Broken canonical and lead-magnet routes — HIGH

Published aliases and clean lead-magnet URLs could redirect to 404s.

**Fix:** added canonical aliases, deprecated-checkout redirects, and `.html` fallback resolution for clean lead-magnet URLs.

**Verification:** crawler reports zero broken internal links.

### 10. Mobile overflow and hidden CTAs — HIGH

- Homepage price-comparison grid overflowed at 375px.
- Growth Launch comparison table expanded the document to 550px.
- GSAP temporarily forced revenue-critical header CTAs to `opacity: 0`.

**Fixes:** responsive one-column homepage grid, bounded horizontal table scroller, and transform-only CTA animation with visible default state.

**Verification:** all 11 critical mobile routes pass at 375×812; homepage CTAs and pricing cards remain visible.

### 11. WCAG contrast failures — HIGH

The expanded visual suite found failures across editorial pages, dashboard labels, generated case studies, CTA buttons, and muted text.

**Fix:** theme-aware contrast corrections plus generator-template corrections so regenerated case studies retain compliant colors.

**Verification:** **87/87 full-site pages pass** the final visual/contrast suite with zero page errors.

### 12. Generated case-study index emitted invalid CSS — HIGH

The index generator emitted literal doubled braces (`{{ ... }}`), causing browsers to ignore its styles.

**Fix:** corrected generator interpolation and regenerated/fixed the public index. Added compliant CTA colors to the generator source.

## Other remediations

- Fixed `/api/leaderboard` handling of `None` values.
- Added accessible labels to homepage, checkout, hero generator, and pricing-generator controls.
- Added `rel="noopener noreferrer"` to external blank-target links.
- Redirected deprecated checkout variants to canonical `/checkout.html`.
- Moved an import-time n8n probe out of pytest discovery and made it use `N8N_API_KEY` explicitly.
- Added crawler handling for expected 404 probes and Cloudflare email-protection links.
- Added offer-integrity, route-contract, SSRF, ICP-gate, source-outcome, and critical browser-flow regression coverage.
- Moved client CRM credentials from URL query parameters to `Authorization` and `X-Client-Email` headers; legacy credential URLs now return **400**.
- Replaced dashboard placeholders with `/api/stats` operational metrics, added a 24-hour freshness warning, and explicitly labeled GA4 behavior data as unavailable.
- Replaced all 22 inert `href="#"` demo links with semantic buttons or non-interactive text.
- Added source-level label associations to all 36 pricing-generator controls; both static crawling and runtime accessibility checks now pass.

## Remaining non-blocking items

| Severity | Item | Impact / recommendation |
|---|---|---|
| Medium | Operational `stats.json` was last refreshed on 2026-07-05 | The dashboard now marks this as **Stale data** instead of presenting it as current. Refresh the stats producer from active ledgers before using those values operationally. |
| Medium | GA4 Data API is not connected | The dashboard now shows verified live operational metrics and does not invent traffic data. Connect GA4 Data API for page-view, visitor, scroll-depth, and bounce-rate reporting. |

## Regression commands

```bash
venv/bin/python3 -m pytest -q
BASE_URL=https://nebulacomponents.shop npx playwright test tests/all-pages-audit.spec.ts
BASE_URL=https://nebulacomponents.shop npx playwright test tests/platform-critical-flows.spec.ts
venv/bin/python3 scripts/qa_platform_crawl.py
```

## Launch decision

**Public funnel: GO.**  
**Internal dashboard connection: GO; underlying operational snapshot currently stale.**  
**GA4 traffic/behavior analytics: NOT YET.**
