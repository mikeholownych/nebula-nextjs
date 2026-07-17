# Route Register

> **Purpose:** Authoritative inventory of all public routes, API endpoints, and static assets with ownership, lifecycle state, and canonical policy.
>
> **Generated:** 2026-07-17 (Task 2)
> **Commit:** e5f3f7ee (Task 1 containment)

---

## Summary

| Category | Total | Production | Archive | Unowned |
|----------|-------|------------|---------|---------|
| App Router pages | 77 | 51 | 26 | 16 |
| API routes | 6 | 6 | 0 | 1 |
| Public HTML files | 446 | 0 | 446 | — |
| Legacy archived pages | 28 | 0 | 28 | — |

---

## App Router Pages

### Production Routes (Core)

| Route | File | Owner | Canonical | Index | CTA/API Dependencies |
|-------|------|-------|-----------|-------|----------------------|
| `/` | `app/page.tsx` | Mike (founder) | Yes | Yes | Maintenance notice |
| `/audit` | `app/audit/page.tsx` | Mike (founder) | Yes | Yes | `/api/audit` (503) |
| `/pricing` | `app/pricing/page.tsx` | Mike (founder) | Yes | Yes | Stripe Payment Link |
| `/checkout` | `app/checkout/page.tsx` | Mike (founder) | Yes | Yes | `/api/checkout` |
| `/thank-you` | `app/thank-you/page.tsx` | Mike (founder) | Yes | Yes | Dynamic from Stripe |
| `/privacy-policy` | `app/privacy-policy/page.tsx` | Mike (founder) | Yes | Yes | None |
| `/terms` | `app/terms/page.tsx` | Mike (founder) | Yes | Yes | None |
| `/data-rights` | `app/data-rights/page.tsx` | Mike (founder) | Yes | Yes | None |
| `/unsubscribe` | `app/unsubscribe/page.tsx` | Mike (founder) | Yes | Yes | None |
| `/about` | `app/about/page.tsx` | Mike (founder) | Yes | Yes | None |
| `/about/team` | `app/about/team/page.tsx` | Mike (founder) | Yes | Yes | None |
| `/company/about` | `app/company/about/page.tsx` | Mike (founder) | Redirect to `/about` | No | None |
| `/company/team` | `app/company/team/page.tsx` | Mike (founder) | Redirect to `/about/team` | No | None |

### Production Routes (Learning Centre)

| Route | File | Owner | Canonical | Index |
|-------|------|-------|-----------|-------|
| `/learning-centre` | `app/learning-centre/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/b2b-saas-landing-page-not-converting` | `app/learning-centre/b2b-saas-landing-page-not-converting/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/before-you-raise-ad-budget` | `app/learning-centre/before-you-raise-ad-budget/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/cta-not-working` | `app/learning-centre/cta-not-working/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/ecommerce-landing-page-not-converting` | `app/learning-centre/ecommerce-landing-page-not-converting/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/facebook-ads-no-leads` | `app/learning-centre/facebook-ads-no-leads/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/founder-second-brain` | `app/learning-centre/founder-second-brain/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/google-ads-clicks-no-sales` | `app/learning-centre/google-ads-clicks-no-sales/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/google-ads-disapproved-ads-still-spending` | `app/learning-centre/google-ads-disapproved-ads-still-spending/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/google-ads-quality-score-low` | `app/learning-centre/google-ads-quality-score-low/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/high-cpc-low-conversion` | `app/learning-centre/high-cpc-low-conversion/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/landing-page-bounce-rate-high` | `app/learning-centre/landing-page-bounce-rate-high/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/landing-page-load-time-slow` | `app/learning-centre/landing-page-load-time-slow/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/landing-page-not-converting` | `app/learning-centre/landing-page-not-converting/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/linkedin-skill-engine` | `app/learning-centre/linkedin-skill-engine/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/message-match-checklist` | `app/learning-centre/message-match-checklist/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/meta-ads-high-frequency-not-converting` | `app/learning-centre/meta-ads-high-frequency-not-converting/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/mobile-landing-page-leaks` | `app/learning-centre/mobile-landing-page-leaks/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/no-testimonials-on-landing-page` | `app/learning-centre/no-testimonials-on-landing-page/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/pricing-page-not-converting` | `app/learning-centre/pricing-page-not-converting/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/proof-before-cta` | `app/learning-centre/proof-before-cta/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/retargeting-ads-not-converting` | `app/learning-centre/retargeting-ads-not-converting/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/specialist-ai-agent-library` | `app/learning-centre/specialist-ai-agent-library/page.tsx` | Mike (founder) | Yes | Yes |
| `/learning-centre/traffic-but-no-form-fills` | `app/learning-centre/traffic-but-no-form-fills/page.tsx` | Mike (founder) | Yes | Yes |

### Production Routes (Educational/SEO — Require Owner Assignment)

| Route | File | Owner | Canonical | Index | Notes |
|-------|------|-------|-----------|-------|-------|
| `/7-systems` | `app/7-systems/page.tsx` | **UNASSIGNED** | Yes | Yes | Educational landing page |
| `/ai-sdr-vs-audit` | `app/ai-sdr-vs-audit/page.tsx` | **UNASSIGNED** | Yes | Yes | Comparison page |
| `/concepts` | `app/concepts/page.tsx` | **UNASSIGNED** | Yes | Yes | Concepts landing |
| `/editorial-standards` | `app/editorial-standards/page.tsx` | **UNASSIGNED** | Yes | Yes | Editorial policy |
| `/headline-optimization` | `app/headline-optimization/page.tsx` | **UNASSIGNED** | Yes | Yes | SEO article |
| `/message-match-checklist` | `app/learning-centre/message-match-checklist/page.tsx` | Mike (founder) | Yes | Yes | Duplicate of learning-centre |
| `/mobile-landing-page-optimization` | `app/mobile-landing-page-optimization/page.tsx` | **UNASSIGNED** | Yes | Yes | SEO article |
| `/og-card-source` | `app/og-card-source/page.tsx` | **UNASSIGNED** | Yes | Yes | OG card resource |
| `/page-speed-conversion` | `app/page-speed-conversion/page.tsx` | **UNASSIGNED** | Yes | Yes | SEO article |
| `/roas-cliff` | `app/roas-cliff/page.tsx` | **UNASSIGNED** | Yes | Yes | SEO article |
| `/social-proof-landing-page` | `app/social-proof-landing-page/page.tsx` | **UNASSIGNED** | Yes | Yes | SEO article |
| `/what-is-landing-page-audit` | `app/what-is-landing-page-audit/page.tsx` | **UNASSIGNED** | Yes | Yes | Educational page |
| `/cta-optimization` | `app/cta-optimization/page.tsx` | **UNASSIGNED** | Yes | Yes | SEO article |

### Archive Routes (Task 1 Quarantined)

| Route | File | Owner | Canonical | Index | Containment Reason |
|-------|------|-------|-----------|-------|---------------------|
| `/accessible-nebula` | `app/accessible-nebula/page.tsx` | quarantine-task1 | No | No | Expired $7 offer, countdown, unsupported guarantee |
| `/ad-burn-leaderboard` | `app/ad-burn-leaderboard/page.tsx` | quarantine-task1 | No | No | Missing submission endpoint, query-string email flow |
| `/agency-partner` | `app/agency-partner/page.tsx` | quarantine-task1 | No | No | Unverified white-label/fulfillment claims |
| `/ai-ops-retainer` | `app/ai-ops-retainer/page.tsx` | quarantine-task1 | No | No | Unsupported monitoring/savings/response-time claims |
| `/audit-dashboard` | `app/audit-dashboard/page.tsx` | quarantine-task1 | No | No | Hard-coded audit scores, password bypass |
| `/audit/results` | `app/audit/results/page.tsx` | quarantine-task1 | No | No | Stale score renderer, email gate |
| `/audit/sample` | `app/audit/sample/page.tsx` | quarantine-task1 | No | No | Unsupported sample scores |
| `/audit-lander` | `app/audit-lander/page.tsx` | quarantine-task1 | No | No | Redirect to `/audit` maintenance |
| `/audits` | `app/audits/page.tsx` | quarantine-task1 | No | No | Unauthenticated customer UI |
| `/beta-tester` | `app/beta-tester/page.tsx` | quarantine-task1 | No | No | PII form without API, unsupported fulfillment |
| `/case-studies/[slug]` | `app/case-studies/[slug]/page.tsx` | quarantine-task1 | No | No | Fabricated case study, unsupported schema |
| `/checkout-impulse` | `app/checkout-impulse/page.tsx` | quarantine-task1 | No | No | Card-entry prototype, PAN/CVC in React state |
| `/checkout-v2` | `app/checkout-v2/page.tsx` | quarantine-task1 | No | No | Duplicate prototype checkout |
| `/component-showcase` | `app/component-showcase/page.tsx` | quarantine-task1 | No | No | Public prototype with misleading controls |
| `/create-97-checkout` | `app/create-97-checkout/page.tsx` | quarantine-task1 | No | No | Stale price-inconsistent checkout |
| `/dashboard` | `app/dashboard/page.tsx` | quarantine-task1 | No | No | Mock account state, false subscription |
| `/demo` | `app/demo/page.tsx` | quarantine-task1 | No | No | Fabricated logos/testimonials/metrics |
| `/generator` | `app/generator/page.tsx` | quarantine-task1 | No | No | Stale $7 upsell, retired links |
| `/growth-launch` | `app/growth-launch/page.tsx` | quarantine-task1 | No | No | Unsupported $997 purchase/fulfillment claims |
| `/growth-launch-confirmation` | `app/growth-launch-confirmation/page.tsx` | quarantine-task1 | No | No | Direct-visit payment confirmation, stale PII |
| `/index-old` | `app/index-old/page.tsx` | quarantine-task1 | No | No | Redirect to `/audit` |
| `/launch-page-97` | `app/launch-page-97/page.tsx` | quarantine-task1 | No | No | Unsupported launch offer |
| `/lead-dashboard` | `app/lead-dashboard/page.tsx` | quarantine-task1 | No | No | Public operational controls, missing APIs |
| `/marketing-ops` | `app/marketing-ops/page.tsx` | quarantine-task1 | No | No | Claims audit/pipeline operational |
| `/organization` | `app/organization/page.tsx` | quarantine-task1 | No | No | Mock member management, stale PII |
| `/part-after` | `app/part-after/page.tsx` | quarantine-task1 | No | No | Orphaned audit form fragment |
| `/part-before` | `app/part-before/page.tsx` | quarantine-task1 | No | No | Orphaned audit metadata fragment |
| `/subscription` | `app/subscription/page.tsx` | quarantine-task1 | No | No | Prototype plans, incorrect Payment Link |

---

## API Routes

| Route | File | Owner | Lifecycle | Method | Auth | Status |
|-------|------|-------|-----------|--------|------|--------|
| `/api/audit` | `app/api/audit/route.ts` | Mike (founder) | production | POST | None required | **503 maintenance** — `AUDIT_REBUILD_IN_PROGRESS` |
| `/api/audit/email` | `app/api/audit/email/route.ts` | Mike (founder) | production | POST | None required | **503 maintenance** — `AUDIT_EMAIL_CAPTURE_REBUILD_IN_PROGRESS` |
| `/api/checkout` | `app/api/checkout/route.ts` | Mike (founder) | production | POST | None required | Require `offer_key`, fail closed without |
| `/api/email/process` | `app/api/email/process/route.ts` | Mike (founder) | production | POST | Bearer token required | Queue email processing |
| `/api/webhooks/rb2b` | `app/api/webhooks/rb2b/route.ts` | Mike (founder) | production | POST | HMAC signature required | RB2B inbound events |
| `/api/analytics` | `app/api/analytics/route.ts` | **UNASSIGNED** | production | GET/POST | TBD | Analytics proxy |

---

## Public HTML Files

**Status:** All 446 public HTML files are blocked at the HTTP boundary by `proxy.ts`.

Requests to `*.html` return:
- HTTP 404
- `X-Robots-Tag: noindex, nofollow`

These files are legacy/static artifacts from pre-App Router and must not be indexed or directly accessible.

---

## Sitemap

**File:** `app/sitemap.ts`

### Included Routes

| Route | Priority | Change Frequency |
|-------|----------|-------------------|
| `/` | 1.0 | weekly |
| `/pricing` | 0.9 | weekly |
| `/audit` | 0.9 | weekly |
| `/audit-lander` | 0.9 | weekly |
| `/privacy-policy` | 0.9 | weekly |
| `/data-rights` | 0.9 | weekly |
| `/learning-centre` | 0.9 | weekly |
| `/learning-centre/*` (22 articles) | 0.7 | monthly |

### Excluded Routes

- All archive routes (26 quarantined)
- `/case-studies/*` (removed 2026-07-16)
- `/checkout` (transactional, no SEO value)
- `/thank-you` (transactional)
- `/unsubscribe` (transactional)

---

## Internal Links

| Component | File | Notes |
|-----------|------|-------|
| Footer | `components/Footer.tsx` | No blocked links after Task 1 |
| Navigation | None (SPA) | Single-page navigation |
| BreadCrumbs | `components/Breadcrumb.tsx` | Auto-generated from route |

---

## Validation Rules

1. **Production routes must have:**
   - Owner assigned
   - Canonical URL defined
   - Indexability decision (yes/no)
   - Test file in `__tests__/`

2. **Archive routes must have:**
   - `notFound()` or redirect implementation
   - `robots: { index: false, follow: false }` metadata
   - Original source archived in `.legacy/app/`

3. **API routes must have:**
   - Owner assigned
   - Auth requirement documented
   - Fail-closed behavior when dependencies unavailable

4. **No production route may link to an archive route.**

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-07-17 | Initial ROUTE_REGISTER.md created (Task 2) | Hermes |
| 2026-07-17 | Task 1 quarantine: 26 routes moved to archive | Hermes |
