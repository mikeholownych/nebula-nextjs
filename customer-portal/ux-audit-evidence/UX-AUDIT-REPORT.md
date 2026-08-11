# Signup-Conversion UX Audit Report

**Target:** https://nebulacomponents.com
**Date:** 2026-08-05
**Method:** Playwright headless chromium, manual evidence review, server log analysis, source code inspection
**Viewports:** 390x844 (mobile), 768x1024 (tablet), 1440x900 (desktop)

---

## 1. Blocking Defects

| # | Stage | Severity | Description | Evidence |
|---|-------|----------|-------------|----------|
| B1 | S4 | **BLOCKING** | "View preview now" button (`processing/page.tsx:238–246`) calls `pushWithViewTransition(router, /audit/${auditId}/results)` without calling `/api/audit/unlock` first. The results page shell loads (HTTP 200) but its client fetch to `GET /api/audit/{id}` returns **401** - no unlock cookie exists. User sees "Error Loading Results - Failed to fetch audit." The route is correct (`/audit/{id}/results`); the defect is that the button skips the unlock step that sets the HMAC cookie. Fix: call `/api/audit/unlock` (or a lighter preview-token endpoint) before navigating, not just set a raw cookie. | `s4-preview-bypass.png` (shows error state), server log: `401 GET /api/audit/{id}` |
| B2 | S1 (mobile) | **BLOCKING** | Cookie consent banner (250px height, bottom-anchored) completely obscures the "Get My Score" URL input and CTA on 390x844 viewport. Banner occupies y=594→844; CTA input is at y=604. Users cannot begin the audit funnel without first dismissing the banner. | `s1-mobile-full.png` |
| B3 | Deploy | **BLOCKING (intermittent)** | Next.js `InvariantError: The client reference manifest for route "/login" does not exist` on all three authenticated routes (`/login`, `/checkout`, `/dashboard`) during deploys. 24 occurrences across two deploy windows in 48h (Aug 3 12:10, Aug 5 10:23). Produces 500 responses for seconds-to-minutes after each deploy. Root cause: the production server accepts requests while the new build's client manifest is still being written to disk - a race between traffic acceptance and filesystem readiness. A Playwright snapshot after recovery cannot detect this; server logs are the only reliable signal. | `journalctl -u nebula-nextjs.service`: "InvariantError" at noted timestamps |

---

## 2. Friction (ranked by conversion impact)

| # | Stage | Description | Impact | Evidence |
|---|-------|-------------|--------|----------|
| F1 | S1 | "Get My Score" CTA at y=604 on mobile requires scrolling past the full H1 + subtext. The nav "Free Audit" link (y=191) goes to `/audit` which shows the same input - a workaround exists, but the in-page hero CTA demands a scroll even without the cookie banner. | Medium | `s1-landing-mobile.png` |
| F2 | A3 | 32 interactive targets under 24x24 CSS px on 390px viewport (excluding the 1x1 skip link). Failures are overwhelmingly footer links (16px height), social icons (16x16), and inline content links - not the nav. Nav links at 142x43 **pass** WCAG 2.5.8 (AA, minimum 24x24). Worst offenders: social icons (16x16), footer "Privacy Policy" / "Terms of Service" (82x14, 99x14). The 44x44 figure from Apple HIG / WCAG 2.5.5 (AAA enhanced) is aspirational; the report measures against the AA minimum. | Low–Medium | `a3-touch-targets.png` |
| F3 | S6 | Price ($97) and product name ("One-Leak Repair Sprint") are visible on the results page only after unlock (line 1058 of ResultsClient.tsx renders `REPAIR_SPRINT_OFFER.priceUsd`). For the user who just submitted their email, this is fine. But a shared-link viewer or workspace user who bypasses the gate lands on results without the pricing CTA visible until they scroll to the remediation section. No price is visible **near** the per-finding "fix" teasers. | Low–Medium | `s6-kit-cta.png` |
| F4 | A2 | "Essential only" cookie banner button contrast ratio 1.47:1 (fg: `rgb(209,213,219)` on bg: `rgba(255,255,255,0.05)`). Fails WCAG AA 4.5:1. This is the only failure detected by computed-luminance sampling on flat backgrounds; the method cannot measure text over gradients, images, or overlays - scope accordingly. | Low | `s1-mobile-full.png` |

---

## 3. Stage Table

| Stage | Status | Timing (unthrottled) | Timing (Slow 4G) | Evidence | Notes |
|-------|--------|---------------------|-------------------|----------|-------|
| **S1** Landing | COMPLETED | FMP: mobile 570ms, tablet 260ms, desktop 256ms | DOMContentLoaded 1050ms, networkidle 4544ms | `s1-landing-desktop.png`, `s1-landing-mobile.png`, `s1-landing-tablet.png`, `s1-mobile-full.png` | Page renders. Mobile: CTA below fold, obscured by cookie banner (B2). |
| **S2** URL Submit | COMPLETED | Input renders, validation fires on invalid URL | /audit load 1781ms | `s2-audit-page-desktop.png`, `s2-validation-test.png` | Form rejects empty/invalid URLs. Redirects to `/processing` on submit. |
| **S3** Processing | COMPLETED | ~12–15s | ~18.2s | `s3-running-initial.png`, `s3-completed.png` | Progress bar animates (10%→80%→100%), status text updates. Transitions in-place to gate. |
| **S4** Email Gate | COMPLETED | Gate appears on `/processing` URL after audit completes | - | `s4-results-page.png`, `s4-fresh-gate.png` | Name (optional) + Email (required). "Send Full Results" POSTs to `/api/audit/unlock` → 200, sets HMAC cookie, redirects to results. "View preview now" is **broken** (B1). |
| **S5** Full Report | COMPLETED | Immediate after gate submit | - | `s5-after-gate-submit.png` | Report renders with signal scores and findings. URL: `/audit/{id}/results`. The unlock handler calls an internal email service (see Unverifiable U1 below). |
| **S6** Kit CTA | COMPLETED | CTA present in remediation section | - | `s6-kit-cta.png` | Shows $97, "One-Leak Repair Sprint", 30-day re-audit term when unlocked. |
| **S7** Payment | COMPLETED | Redirects to Stripe Checkout | - | `checkout-page.png` (Stripe $97 kit), `m2-after-tier-click.png` (Stripe $29/mo Pro) | `s7-payment-form.png` is a blank capture from a script bug and does NOT establish this finding - `checkout-page.png` does. Stripe hosted checkout renders correctly for both the $97 one-time kit and the $29/mo Pro subscription. |
| **M1** Pricing | COMPLETED | - | - | `m1-pricing-desktop.png` | Pricing page loads. Tier structure visible (Free / $29 Pro / $79 Growth / $199 Agency). "Start Pro" button present. |
| **M2** Checkout | COMPLETED | Redirect to Stripe | - | `m2-after-tier-click.png` | "Start Pro" button navigates to `checkout.stripe.com` ($29/mo Nebula Pro subscription). No intermediate page. |
| **M3** Login | COMPLETED | - | - | `login-page.png` | Three auth methods: Google OAuth, GitHub OAuth, magic link email. Clean layout. |

---

## 4. Measurement Gaps

| # | Gap | Impact | Detail |
|---|-----|--------|--------|
| G1 | No custom funnel events for audit stages | **High** | GA4 and PostHog fire pageviews. PostHog captures `audit_results_unlocked` (server-side, in the unlock handler) and `audit_email_skipped` (client-side, on preview click). But there are no `audit_started`, `processing_complete`, `email_gate_shown`, or `email_submitted` events. Without these, you cannot measure the S2→S3→S4→S5 drop-off that B1 and B2 are currently causing - and you cannot confirm fixes worked. |
| G2 | No deploy-time health check | Medium | The InvariantError (B3) is invisible to any external monitor or screenshot audit. The server accepts requests and returns 500 during manifest loading. A deploy-time smoke test hitting `/login`, `/checkout`, `/dashboard` before rotating traffic would catch this. |

---

## 5. Unverifiable Claims

| # | Claim | What Was Verified | What Remains Unverified | Risk |
|---|-------|-------------------|------------------------|------|
| U1 | "Send Full Results" implies email delivery | The unlock handler (`/api/audit/unlock`, lines 87–109) POSTs to `http://127.0.0.1:8001/audit/email` and checks `delivery?.status === 'sent'`. The internal service accepted the request and returned success in my test. | Whether the message actually leaves your infrastructure, arrives in the recipient's inbox, and doesn't land in spam. `email_sent: true` is the handler reporting on its own HTTP call to an internal service - evidence *for* delivery, not evidence *of* it. | **High if mail silently fails.** "Send Full Results" becomes a false promise at the primary conversion point. A site that sells evidence integrity cannot afford an unverified claim at the moment of trust. Resolve with: (1) real inbox test (send to a monitored address, confirm arrival), (2) provider-side delivery/bounce logs. |
| U2 | Homepage counter ("116 real audits completed so far") is honest | Counter is DB-backed: `SELECT count(*) FILTER (WHERE status = 'completed') FROM audits` (`audit_db.py:880`). It is dynamic (value changed between test runs: 114→116). | (a) **No exclusion of internal/test runs.** The query counts every audit with `status = 'completed'` - no email filter, no internal flag. This audit's own test runs incremented the counter from 114 to 116. A public trust claim on a site that sells evidence integrity now includes synthetic traffic. (b) The removed "120+ landing page audits" claim (from `/7-systems`) may not have counted the same thing as this counter - it could have been cumulative across eras, or included manual audits. The inference "120 was inflated relative to 114" assumes they measure identically, which is unproven. | **Medium.** The counter is self-inflating on every test/demo/bot audit. Fix: add a `WHERE email IS NOT NULL AND email NOT LIKE '%@example.com%'` filter or an `is_internal` flag. |

---

## 6. Supplementary Checks

### JS-Disabled Pass
The `/audit` page renders headline, value props, and the URL input area container - but the `<input>` element itself requires JS hydration to become interactive. The primary conversion action (URL submission) is **impossible without JavaScript**. No `<noscript>` fallback or message exists.

**Evidence:** `js-disabled-audit.png`

### K15: Price / Scope / Re-audit Term Consistency

| Surface | $97 | "One-Leak Repair Sprint" | 30-day re-audit | Scope ("one bounded") |
|---------|-----|-----------------------------------|-----------------|-----------------------|
| `/pricing` | Yes | Yes | Yes (4 mentions) | Yes |
| `/results` (unlocked) | Yes (code line 1058) | Yes | Yes (line 1061) | Yes ("one high-confidence finding") |
| Stripe Checkout | Yes ($97 one-time) | "Repair Sprint" in description | Not visible on checkout page | Implied |
| `self-implementation-kit-offer.ts` | 97 | "One-Leak Repair Sprint" | "Same-scope re-audit within 30 days" | "one specific failing signal" |

**Verdict:** Consistent across all surfaces. No contradictions found. The 30-day term does not appear on the Stripe checkout page itself (Stripe shows only the product name and price), which is expected and not actionable.

### Warm Cache Pass
**Not run.** The Slow 4G pass used a cold cache. A warm-cache pass was not separately timed. The rationale that "pre-rendered HTML makes warm equal cold" does not hold - JS bundle and font caching change second-visit timings materially. This is an unmet requirement of the audit spec.

### Meta Ads / G3 Resolution
Zero Meta/Facebook ad traffic detected in 30 days of PostHog UTM data. Only organic social (LinkedIn 10 sessions, X 2, one referral). `fbq` is not defined. **No Meta ads are running - G3 is not a defect and is removed from the gap list.**

---

## 7. Resolved Items (from initial report)

| Original # | Original Claim | Resolution |
|-------------|----------------|------------|
| G1 (old) | PostHog not firing | **Not a defect.** PostHog loads via reverse proxy (`/ingest/*` rewrite). `window.posthog.capture` callable, distinct_id assigned, `has_opted_in_capturing()` returns true. |

---

## 8. Recommendations (priority-ordered)

### P0 - Same-day

1. **Fix cookie banner mobile overlap (B2).** CSS-only fix. Options:
   - Compact single-line banner on mobile (`max-height: 80px`, inline buttons)
   - Move banner to top of viewport
   - Reduce content so "Get My Score" input sits above y=594

2. **Fix deploy-time 500s (B3).** Every deploy during this remediation sprint puts a 500 on `/checkout` - expected revenue loss over a two-week sprint exceeds anything F1–F4 costs. Reliable fix: **atomic deploy with health-gated cutover** - build to a new directory, verify `/login`, `/checkout`, `/dashboard` return 200, then symlink-swap and restart. `output: 'standalone'` is not equivalent - it changes bundling, not the race between the server accepting connections and the manifest being written. Do not let it into the ticket as if it were.

### P0 - Fix before confirming with analytics

3. **Resolve B1 root cause.** The preview button skips `/api/audit/unlock`. Two paths:
   - **(a)** Button calls a lightweight unlock variant (no email, just set the HMAC cookie) then navigates - preserves "try before you give email" UX
   - **(b)** Remove "View preview now" entirely, make email gate mandatory - simpler, raises email capture

   Decide on funnel economics (email capture rate vs. preview-to-convert rate), not implementation ease.

### P1 - Required for measurement

4. **Instrument funnel events (G1).** Add PostHog captures:
   - `audit_started` (URL form submit)
   - `processing_complete` (progress reaches 100%)
   - `email_gate_shown` (gate renders)
   - `email_submitted` (form submit, before API call)
   - `preview_clicked` (already exists as `audit_email_skipped` - rename for clarity)

   Without these, you cannot see the B1/B2 drop-off or confirm fixes worked. Ship immediately after fixes so before/after is measurable.

### P1 - Claim integrity

5. **Verify email delivery end-to-end (U1).** Send a test audit to a monitored inbox. Confirm arrival + non-spam placement. Pull provider-side delivery/bounce logs. Until verified, "Send Full Results" carries risk of being a false promise at the primary conversion point.

6. **Exclude test/internal audits from the homepage counter (U2).** Current query: `SELECT count(*) FILTER (WHERE status = 'completed') FROM audits` - no exclusion. This audit's own test runs incremented the counter from 114→116. Add a filter (e.g. `WHERE email IS NOT NULL AND email NOT LIKE '%example.com'`) or an `is_internal` boolean. A self-inflating proof number on a site that sells evidence integrity is the finding you'd flag on a competitor.

### P2 - Polish

7. **Fix "Essential only" button contrast (F4).** Currently 1.47:1; needs 4.5:1 minimum. Change text to white or increase background opacity.

8. **Add `<noscript>` message on `/audit`.** "JavaScript is required to run the audit." - prevents dead-end for non-JS visitors.

---

## Evidence Manifest

```
ux-audit-evidence/
├── s1-landing-desktop.png        # S1 desktop 1440x900
├── s1-landing-mobile.png         # S1 mobile 390x844
├── s1-landing-tablet.png         # S1 tablet 768x1024
├── s1-mobile-full.png            # S1 mobile - cookie banner overlapping CTA (B2)
├── s1-mobile-above-fold.png      # S1 mobile above-fold content
├── s2-audit-page-desktop.png     # S2 audit input page
├── s2-validation-test.png        # S2 validation behavior
├── s3-running-initial.png        # S3 processing 20%
├── s3-completed.png              # S3 processing 50%
├── s4-results-page.png           # S4 email gate "Your Audit Is Ready"
├── s4-fresh-gate.png             # S4 gate on fresh audit (inputs confirmed)
├── s4-preview-bypass.png         # S4 "View preview" → 401 → Error (B1)
├── s4-results-direct.png         # S4 direct /results without auth → same error
├── s4-gate-inspection.png        # S4 DOM inspection of gate
├── s4-after-email-submit.png     # S4→S5 transition (POST 200, redirect)
├── s5-after-gate-submit.png      # S5 full results rendered after email submit
├── s5-full-report.png            # S5 (processing state screenshot, not results)
├── s6-kit-cta.png                # S6 "One-Leak Repair Sprint" CTA
├── s7-payment-form.png           # VOID - blank capture from script bug
├── checkout-page.png             # S7 EVIDENCE - Stripe $97 kit checkout
├── m1-pricing-desktop.png        # M1 pricing page with tiers
├── m2-after-tier-click.png       # M2 Stripe $29/mo Pro checkout
├── login-page.png                # M3 login page (Google/GitHub/magic link)
├── a3-touch-targets.png          # A3 touch target audit (mobile)
├── a11y-audit-mobile.png         # Accessibility mobile view
├── js-disabled-audit.png         # JS-disabled: content renders, input non-functional
├── throttled-landing-mobile.png  # Slow 4G landing page
├── known-defect-checkout.png     # /checkout at time of capture (200)
├── known-defect-dashboard.png    # /dashboard at time of capture (200)
├── known-defect-login.png        # /login at time of capture (200)
└── report.json                   # Machine-readable initial findings (pre-correction)
```

---

## Methodology Notes

- All browser tests run with fresh context (no cookies/session) unless noted
- S4→S5 email submission verified: POST to `/api/audit/unlock` returns 200, response includes `email_sent: true`, redirect to `/audit/{id}/results` with full report content
- B1 root cause confirmed via: (1) Playwright navigation log showing correct URL `/audit/{id}/results` with HTTP 200, (2) network interception showing `GET /api/audit/{id}` returning 401, (3) source code inspection of `processing/page.tsx:238–242` confirming no unlock call
- PostHog verification: `window.posthog.capture` callable, distinct_id assigned, opted-in, `/ingest/*` proxy confirmed via network interception (3 requests on page load)
- Email code path confirmed by reading `/api/audit/unlock/route.ts` lines 87–109: handler POSTs to `http://127.0.0.1:8001/audit/email`. Whether email actually arrives in an inbox is unverified (see U1).
- Contrast measured via computed-style luminance calculation (WCAG 2.1 relative luminance formula) - cannot detect failures over gradients/images/overlays
- Touch targets measured via `getBoundingClientRect()` at 390px viewport; 24x24 threshold per WCAG 2.5.8 (AA); 1x1 skip link excluded from failure count
- Deploy-time errors identified via `journalctl -u nebula-nextjs.service --since "2 days ago"` - 24 InvariantError occurrences across 2 windows
- Throttled pass: Chromium DevTools Protocol `Network.emulateNetworkConditions` with 1.5 Mbps down, 750 Kbps up, 300ms latency (Slow 4G profile)
- Warm cache pass: **not run** (unmet requirement)
- Audit counter provenance traced to source: `audit_db.py:880` - `count(*) FILTER (WHERE status = 'completed') FROM audits`, no internal/test exclusion
- "One-Leak Repair Sprint" used throughout per canonical product name in `self-implementation-kit-offer.ts`; "Fix Pack" is an internal key only (`key: 'fix-pack'` in the offer object)

---

## Process Note

This report got right what the first version got wrong because it went to the server - journalctl, route handlers, source lines, SQL queries - instead of stopping at the rendered surface. The two claims that still required correction (U1, U2) are both places where the audit went back to the surface (a success response, a displayed number) and treated that as proof. A success status is evidence about the caller, never about the outcome. Worth encoding in future audit prompts.
