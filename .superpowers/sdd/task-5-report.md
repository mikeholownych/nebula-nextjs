
### `git status --short --untracked-files=no | grep -v '^.. customer-portal/\.next-broken' || true; git log -1 --oneline`

**Exit code:** 0

```text
M .superpowers/sdd/progress.md
M customer-portal/app/components/DashboardMockup.tsx
M customer-portal/app/components/HeroSection.tsx
M customer-portal/app/page.tsx
M ledgers/epistemic_observatory.json
M ledgers/repair_verification.json
M scripts/acquisition/reporting.py
M system_setup
M tests/platform_api/test_acquisition_pipeline.py
4c847c819 fix: close topic guide quality gate defects
```

The listed remaining modifications are pre-existing and unrelated to Task 5.


### Task 5 correction verification

Updated `customer-portal/__tests__/homepage-million-dollar-redesign.test.ts` to assert the governed hero paragraph currently rendered by `HeroSection.tsx`: `Paste your URL. Get a scored 9-signal diagnosis in under 2 minutes.` and `Every leak ranked by priority, backed by raw HTML evidence.` Existing hero, evidence, punctuation, workspace, layout, and diagnostic-frame invariants remain intact.

The full CI run also exposed a stale Learning Centre test fixture for the already-present nested Topic Guide routes. The test contract was corrected to discover nested article metadata and allow the governed `/learning-centre/topic-guides` hub in contextual links. No homepage source or Topic Guide content was modified.

#### Command: `cd /home/mike/nebula/customer-portal && npx jest __tests__/homepage-million-dollar-redesign.test.ts --runInBand`

**Exit code:** 0

```text
npm notice run nebula-customer-portal@2.0.0 npx
npm notice run 'jest' __tests__/homepage-million-dollar-redesign.test.ts --runInBand
Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        1.791 s
Ran all test suites matching __tests__/homepage-million-dollar-redesign.test.ts.
```

#### Command: `cd /home/mike/nebula/customer-portal && npm run ci`

An initial run after the hero assertion correction exited 1 because the Learning Centre contextual-links test did not account for nested Topic Guide routes. The failing assertion was `expect([...contextualHrefs].every((href) => validHrefs.has(href))).toBe(true)`, with 2 E2E failures, 52 passed. After the test-contract correction above, the exact gate was rerun.

**Exit code:** 0

```text
npm notice run nebula-customer-portal@2.0.0 ci
npm notice run npm run typecheck && npm run lint && npm run check:content && npm run check:brand && npm run check:analytics-governance && npm run check:signal-canon && npm run check:claims && npm run check:opportunity-governance && npm run check:evidence-atoms && npm run check:public-proof && npm run check:citable-projection && npm run check:intelligence-stack && npm run build && npm run test && npm run test:e2e
npm notice run nebula-customer-portal@2.0.0 typecheck
npm notice run tsc --noEmit
npm notice run nebula-customer-portal@2.0.0 lint
npm notice run eslint .
npm notice run nebula-customer-portal@2.0.0 check:content
npm notice run node scripts/check-banned-strings.mjs
Content guard passed: scanned stories and generated Storybook shell output
npm notice run nebula-customer-portal@2.0.0 check:brand
npm notice run node scripts/check-brand-projections.mjs
brand_version: v2
favicon: PASS
apple_touch_icon: PASS
manifest_icons: PASS
default_og_image: PASS
twitter_image: PASS
organization_schema_logo: PASS
theme_color: PASS
deprecated_brand_asset_references: 0
npm notice run nebula-customer-portal@2.0.0 check:analytics-governance
npm notice run node scripts/check-analytics-governance.mjs
🔍 Validating Canonical Analytics Registry & Governance Rules...
✅ Analytics Governance Passed: 18 canonical events validated.
npm notice run nebula-customer-portal@2.0.0 check:signal-canon
npm notice run node scripts/check-signal-canon.mjs
✓ Signal canon check passed - all content consistent with config/signals.canon.json
npm notice run nebula-customer-portal@2.0.0 check:claims
npm notice run node scripts/check-claims.mjs
✓ Claim lint passed - no unsupported causal/commercial language detected
npm notice run nebula-customer-portal@2.0.0 check:opportunity-governance
npm notice run node scripts/check-opportunity-governance.mjs
Opportunity governance enforcement passed (I1/I2/I3, as of 2026-09-03)
npm notice run nebula-customer-portal@2.0.0 check:evidence-atoms
npm notice run node scripts/compile-evidence-atoms.mjs --check
Evidence atom projection current: 0 published, 1 omitted
npm notice run nebula-customer-portal@2.0.0 check:public-proof
npm notice run node scripts/compile-public-proof.mjs --check
Public proof projection current: 0 cases, 0 benchmarks, 0 omitted
npm notice run nebula-customer-portal@2.0.0 check:citable-projection
npm notice run node scripts/sync-citable-projection.mjs --check
Citable projection current: v1.14.0
npm notice run nebula-customer-portal@2.0.0 check:intelligence-stack
npm notice run node scripts/package-landing-page-intelligence-stack.mjs --check
Landing page intelligence stack projection is current
npm notice run nebula-customer-portal@2.0.0 prebuild
npm notice run npm test -- --runInBand __tests__/teardown-screenshot-integrity.test.ts
npm notice run nebula-customer-portal@2.0.0 test
npm notice run NODE_ENV=test NODE_OPTIONS=--experimental-vm-modules jest --runInBand __tests__/teardown-screenshot-integrity.test.ts
Test Suites: 1 passed, 1 total
Tests:       38 passed, 38 total
Snapshots:   0 total
Time:        1.787 s
Ran all test suites matching __tests__/teardown-screenshot-integrity.test.ts.
npm notice run nebula-customer-portal@2.0.0 build
npm notice run node scripts/generate-build-info.mjs && node scripts/generate-learning-centre-md.mjs && next build
[build-info] Generated immutable build-info.json: 4c847c819d71131e0a394015447ad2152b2d835b (production) at 2026-09-03T18:00:21.082Z
Generated 51 learning-centre markdown mirrors -> data/learning-centre-md.json
▲ Next.js 16.3.2 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 71ms

  Creating an optimized production build ...
✓ Compiled successfully in 3.1s
  Running TypeScript ...
  Finished TypeScript in 14.1s ...
  Collecting page data using 11 workers ...
[PostgreSQL] Connected to nebula_audit
[PostgreSQL] Connected to nebula_audit
[PostgreSQL] Connected to nebula_audit
[PostgreSQL] Connected to nebula_audit
[PostgreSQL] Connected to nebula_audit
[PostgreSQL] Connected to nebula_audit
[PostgreSQL] Connected to nebula_audit
  Generating static pages using 11 workers (0/354) ...
  Generating static pages using 11 workers (88/354)
[PostgreSQL] Connected to nebula_audit
[PostgreSQL] Connected to nebula_audit
  Generating static pages using 11 workers (176/354)
  Generating static pages using 11 workers (265/354)
✓ Generating static pages using 11 workers (354/354) in 3.9s
  Finalizing page optimization ...

Route (app)                                                                         Revalidate  Expire
┌ ○ /
├ ○ /_not-found
├ ƒ /[...path]
├ ○ /7-systems
├ ○ /about
├ ○ /about/team
├ ○ /accessible-nebula
├ ○ /ad-burn-leaderboard
├ ○ /ads-getting-clicks-but-no-sales
├ ○ /ads-not-converting-two-percent
├ ○ /agency-partner
├ ○ /ai-ops-retainer
├ ○ /ai-readiness-landing-page
├ ○ /ai-readiness-landing-page-check
├ ○ /ai-sdr-vs-audit
├ ƒ /api/ab-tests
├ ƒ /api/ab-tests/[testId]
├ ƒ /api/ab-tests/[testId]/results
├ ƒ /api/agent/register
├ ƒ /api/ai-recommendations
├ ƒ /api/ai/insights/[auditId]
├ ƒ /api/ai/insights/[auditId]/[signalKey]
├ ƒ /api/analytics
├ ƒ /api/analytics/benchmarks/me
├ ƒ /api/analytics/funnel
├ ƒ /api/analytics/funnel-report
├ ƒ /api/analytics/program
├ ƒ /api/analytics/program/dismiss
├ ƒ /api/audit/[id]
├ ƒ /api/audit/[id]/page-intent
├ ƒ /api/audit/[id]/pdf
├ ƒ /api/audit/[id]/share-token
├ ƒ /api/audit/[id]/status
├ ƒ /api/audit/claim
├ ƒ /api/audit/compare
├ ƒ /api/audit/diff
├ ƒ /api/audit/email
├ ƒ /api/audit/lab
├ ƒ /api/audit/rewrites
├ ƒ /api/audit/rewrites/generate
├ ƒ /api/audit/run
├ ƒ /api/audit/schedules
├ ƒ /api/audit/schedules/[id]
├ ƒ /api/audit/start
├ ƒ /api/audit/stats
├ ƒ /api/audit/stats/benchmarks
├ ƒ /api/audit/stats/recent-finding
├ ƒ /api/audit/unlock
├ ƒ /api/audits/by-domain
├ ƒ /api/audits/by-email
├ ƒ /api/auth/github
├ ƒ /api/auth/github/callback
├ ƒ /api/auth/google
├ ƒ /api/auth/google/callback
├ ƒ /api/auth/logout
├ ƒ /api/auth/magic-link
├ ƒ /api/auth/me
├ ƒ /api/auth/verify
├ ƒ /api/badge/[id]
├ ƒ /api/badges
├ ƒ /api/benchmarks/compare
├ ƒ /api/benchmarks/industries
├ ƒ /api/benchmarks/industries/[industry]
├ ƒ /api/benchmarks/summary
├ ƒ /api/billing-portal
├ ƒ /api/billing/summary
├ ○ /api/bimi
├ ƒ /api/bing/oauth
├ ƒ /api/bing/oauth/callback
├ ƒ /api/build-info
├ ƒ /api/builder-integration
├ ƒ /api/builder-integration/[builder]
├ ƒ /api/checkout
├ ƒ /api/churn
├ ƒ /api/churn/at-risk
├ ƒ /api/churn/retention
├ ƒ /api/competitor
├ ƒ /api/competitor/[competitorId]
├ ƒ /api/competitor/[competitorId]/compare
├ ƒ /api/competitor/[competitorId]/history
├ ƒ /api/competitor/[competitorId]/intelligence
├ ƒ /api/competitor/intelligence
├ ƒ /api/competitor/metrics
├ ƒ /api/competitors
├ ƒ /api/competitors/[id]
├ ƒ /api/competitors/comparison
├ ƒ /api/competitors/comparison/[trackingId]
├ ƒ /api/conversion
├ ƒ /api/conversion/audit/start
├ ƒ /api/conversion/email
├ ƒ /api/conversion/purchase
├ ƒ /api/customer-success
├ ƒ /api/customer-success/overview
├ ƒ /api/dashboard
├ ƒ /api/data-rights/export
├ ƒ /api/email-automation
├ ƒ /api/email/process
├ ƒ /api/exit-intent
├ ƒ /api/experiments
├ ƒ /api/experiments/[id]
├ ƒ /api/experiments/[id]/refresh
├ ƒ /api/fix-library
├ ƒ /api/funnel/runs
├ ƒ /api/funnel/runs/status
├ ƒ /api/ga4/callback
├ ƒ /api/ga4/connect
├ ƒ /api/ga4/correlation/[auditId]
├ ƒ /api/ga4/disconnect
├ ƒ /api/ga4/properties
├ ƒ /api/ga4/select
├ ƒ /api/ga4/status
├ ƒ /api/growth/config
├ ƒ /api/growth/track
├ ƒ /api/growth/triggers/[auditId]
├ ƒ /api/gsc/callback
├ ƒ /api/gsc/connect
├ ƒ /api/gsc/disconnect
├ ƒ /api/gsc/inspect
├ ƒ /api/gsc/metrics
├ ƒ /api/gsc/sitemap
├ ƒ /api/gsc/status
├ ƒ /api/gsc/submit-index
├ ƒ /api/healthz
├ ƒ /api/hooks/[...path]
├ ƒ /api/integrations
├ ƒ /api/lab-experiments
├ ƒ /api/lab-experiments/[id]
├ ƒ /api/lead-gen/rb2b-event
├ ƒ /api/lead-nurturer
├ ƒ /api/leads/[leadId]
├ ƒ /api/leads/metrics
├ ƒ /api/leads/score
├ ƒ /api/leads/tier/[tier]
├ ƒ /api/leads/top
├ ƒ /api/metrics
├ ƒ /api/monetization
├ ƒ /api/monetization/audit/[shareToken]
├ ƒ /api/monetization/key
├ ƒ /api/monitors-engine
├ ƒ /api/monitors-engine/[id]
├ ƒ /api/monitors-engine/create
├ ƒ /api/mpp/audit
├ ƒ /api/mpp/audit-compat
├ ƒ /api/newsletter/confirm
├ ƒ /api/newsletter/subscribe
├ ƒ /api/onboarding
├ ƒ /api/onboarding/advance
├ ƒ /api/readyz
├ ƒ /api/recommendations
├ ƒ /api/recommendations/[id]
├ ƒ /api/referral
├ ƒ /api/referral/[code]
├ ƒ /api/referral/summary/[code]
├ ƒ /api/referral/validate/[code]
├ ƒ /api/report-automation
├ ƒ /api/report/pdf
├ ƒ /api/revenue
├ ƒ /api/revenue/funnel
├ ƒ /api/revenue/pipeline
├ ƒ /api/revenue/source
├ ƒ /api/revenue/trend
├ ƒ /api/share/audit/[auditId]
├ ƒ /api/share/iframe/[auditId]
├ ƒ /api/share/widget/[auditId]
├ ƒ /api/shared
├ ƒ /api/subscribe
├ ƒ /api/team
├ ƒ /api/teardowns
├ ƒ /api/teardowns/[slug]
├ ƒ /api/teardowns/[slug]/claim/dns-check
├ ƒ /api/teardowns/[slug]/claim/dns-start
├ ƒ /api/teardowns/[slug]/claim/email-request
├ ƒ /api/teardowns/[slug]/claim/email-verify
├ ƒ /api/teardowns/[slug]/claim/gsc-check
├ ƒ /api/teardowns/[slug]/response
├ ƒ /api/teardowns/claims
├ ƒ /api/tenant/comparison
├ ƒ /api/tenant/report
├ ƒ /api/tenant/summary
├ ƒ /api/tenant/weak-spots
├ ƒ /api/timeline
├ ƒ /api/v1
├ ƒ /api/v1/fixes
├ ƒ /api/v1/fixes/[auditId]
├ ƒ /api/webhooks/rb2b
├ ƒ /api/webhooks/stripe
├ ƒ /api/whitelabel
├ ƒ /api/widget/audit
├ ƒ /api/workspace/api-keys
├ ƒ /api/workspace/api-keys/[keyId]
├ ƒ /api/workspace/assistant
├ ƒ /api/workspace/delete-account
├ ƒ /api/workspace/dispatch
├ ƒ /api/workspace/export
├ ƒ /api/workspace/preferences
├ ƒ /api/workspace/team
├ ƒ /api/workspace/team/accept
├ ƒ /api/workspace/verify
├ ○ /audit                                                                                  5m      1y
├ ○ /audit-dashboard
├ ○ /audit-lander
├ ƒ /audit/[id]/processing
├ ƒ /audit/[id]/results
├ ○ /audit/compare
├ ○ /audit/results
├ ○ /audit/sample
├ ○ /audits
├ ○ /benchmarks                                                                             5m      1y
├ ○ /best-landing-page-audit-tools
├ ○ /beta-tester
├ ○ /brand
├ ƒ /case-studies
├ ● /case-studies/[slug]
├ ƒ /checkout
├ ○ /checkout-impulse
├ ○ /checkout-v2
├ ○ /company/about
├ ○ /company/team
├ ○ /compare
├   /compare/[slug]
│ ├ ● /compare/unbounce
│ ├ ● /compare/instapage
│ ├ ● /compare/pagespeed-insights
│ └ ● [+4 more paths]
├ ○ /component-showcase
├ ○ /concepts
├ ○ /conversion-rate-optimization-audit
├ ○ /crawler-policy
├ ○ /create-97-checkout
├ ○ /cro-agency-alternative
├ ○ /cta-optimization
├ ○ /dashboard
├ ○ /data-rights
├ ○ /demo
├ ○ /ecommerce-landing-page-audit
├ ○ /editorial-standards
├ ○ /faq
├ ○ /fix-conversion-leak-before-campaign
├ ƒ /fix-library
├   /for/[vertical]
│ ├ ● /for/saas
│ ├ ● /for/ecommerce
│ ├ ● /for/agencies
│ └ ● [+5 more paths]
├ ○ /free-landing-page-audit-tools-startups
├ ○ /funnel-audit
├ ○ /generator
├ ƒ /gone
├ ○ /growth-launch
├ ○ /growth-launch-confirmation
├ ○ /headline-optimization
├ ○ /how-nebula-audits
├ ○ /index-old
├ ○ /lab
├ ○ /landing-page-audit-tools-pricing
├ ○ /landing-page-code-fixes
├ ○ /landing-page-cta-audit
├ ○ /landing-page-message-match
├ ○ /landing-page-mistakes
├ ○ /landing-page-performance-analysis
├ ○ /landing-page-trust-signals
├ ○ /launch-page-97
├ ○ /lead-dashboard
├ ○ /lead-generation-landing-page-audit
├ ○ /leak-index
├ ○ /learning-centre
├ ○ /learning-centre/above-fold-landing-page
├ ○ /learning-centre/ad-says-one-thing-page-says-another
├ ○ /learning-centre/agency-handoff-debt
├ ○ /learning-centre/b2b-saas-landing-page-not-converting
├ ○ /learning-centre/before-you-raise-ad-budget
├ ○ /learning-centre/coach-consultant-landing-page
├ ○ /learning-centre/confessions
├ ○ /learning-centre/cpc-break-even-landing-page
├ ○ /learning-centre/cta-below-fold-mobile
├ ○ /learning-centre/cta-not-working
├ ○ /learning-centre/cta-not-working-7-fixes
├ ○ /learning-centre/ecommerce-landing-page-not-converting
├ ○ /learning-centre/facebook-ads-no-leads
├ ○ /learning-centre/form-has-zero-friction
├ ○ /learning-centre/ghost-variant-ab-test
├ ○ /learning-centre/google-ads-clicks-no-sales
├ ○ /learning-centre/google-ads-disapproved-ads-still-spending
├ ○ /learning-centre/google-ads-high-ctr-low-conversion
├ ○ /learning-centre/google-ads-quality-score-low
├ ○ /learning-centre/headline-cta-mismatch
├ ○ /learning-centre/headline-fails-message-match
├ ○ /learning-centre/high-cpc-low-conversion
├ ○ /learning-centre/landing-page-bounce-rate-high
├ ○ /learning-centre/landing-page-conversion-rate-benchmark
├ ○ /learning-centre/landing-page-headline-formula
├ ○ /learning-centre/landing-page-intelligence-stack
├ ○ /learning-centre/landing-page-lcp
├ ○ /learning-centre/landing-page-load-time-slow
├ ○ /learning-centre/landing-page-not-converting
├ ○ /learning-centre/landing-page-speed-test
├ ○ /learning-centre/linkedin-ad-copy-landing-page-mismatch
├ ○ /learning-centre/linkedin-ads-not-converting
├ ○ /learning-centre/linkedin-authority-gap
├ ○ /learning-centre/message-match-checklist
├ ○ /learning-centre/meta-ads-high-frequency-not-converting
├ ○ /learning-centre/mobile-landing-page-leaks
├ ○ /learning-centre/paid-traffic-leak-map
├ ○ /learning-centre/pricing-page-not-converting
├ ○ /learning-centre/proof-before-cta
├ ○ /learning-centre/retargeting-ads-not-converting
├ ○ /learning-centre/slow-landing-page-causes
├ ○ /learning-centre/social-proof-above-fold
├ ○ /learning-centre/social-proof-backfire
├ ○ /learning-centre/the-11pm-founder-spiral
├ ○ /learning-centre/tiktok-ads-not-converting
├ ○ /learning-centre/tiktok-landing-page-scroll-speed-gap
├ ○ /learning-centre/tiktok-trust-collapse
├ ○ /learning-centre/topic-guides
├ ○ /learning-centre/topic-guides/ad-spend-roi-improvement
├ ○ /learning-centre/topic-guides/ai-traffic-optimization-vs-landing-page-builders
├ ○ /learning-centre/topic-guides/conversion-rate-optimization-tools
├ ○ /learning-centre/topic-guides/landing-page-conversion-leaks
├ ○ /learning-centre/traffic-but-no-form-fills
├ ○ /learning-centre/types-of-social-proof
├ ○ /learning-centre/what-is-message-match
├ ○ /learning-centre/what-is-social-proof-landing-page
├ ○ /login
├ ○ /manifest.webmanifest
├ ○ /marketing-ops
├ ƒ /md/learning-centre/[slug]
├ ƒ /md/teardowns/[slug]
├ ○ /mobile-landing-page-audit
├ ○ /mobile-landing-page-optimization
├ ○ /mobile-viewport-conversion-rates
├ ○ /newsletter
├ ○ /newsletter/confirmed
├ ○ /no-retainer-cro-tools
├ ○ /observatory                                                                            1h      1y
├ ○ /og-card-source
├ ○ /opengraph-image
├ ○ /organization
├ ○ /page-intent-aware-audit
├ ○ /page-speed-conversion
├ ○ /paid-traffic-leak-scorecard
├ ○ /part-after
├ ○ /part-before
├ ○ /playbooks
├ ○ /playbooks/founder-second-brain
├ ○ /playbooks/linkedin-skill-engine
├ ○ /playbooks/specialist-ai-agent-library
├ ○ /press
├ ○ /pricing
├   /pricing-guides/[slug]
│ ├ ● /pricing-guides/crazy-egg-pricing
│ ├ ● /pricing-guides/hotjar-pricing
│ ├ ● /pricing-guides/semrush-pricing
│ └ ● /pricing-guides/unbounce-pricing
├ ○ /privacy-policy
├ ○ /proof                                                                                  5m      1y
├ ○ /repair-sprint
├ ○ /repair-sprint/example
├ ○ /research/landing-page-performance-q3-2026
├ ○ /resources
├ ƒ /resources/citable
├ ƒ /resources/citable/compare
├ ○ /resources/citable/generator
├ ƒ /resources/citable/jobs/[slug]
├ ƒ /resources/citable/quick-start
├ ƒ /resources/citable/releases
├ ○ /roas-cliff
├ ○ /roi-calculator
├ ○ /saas-landing-page-audit
├ ○ /score
├ ƒ /shared/[token]
├ ○ /signals
├   /signals/[slug]
│ ├ ● /signals/message-match
│ ├ ● /signals/trust-signals
│ ├ ● /signals/mobile-cta
│ └ ● [+6 more paths]
├ ƒ /sitemap.xml
├ ○ /social-proof-landing-page
├ ○ /spec/landing-page-diagnostic-v1
├ ○ /status
├ ○ /subscription
├ ○ /teardowns                                                                              5m      1y
├ ƒ /teardowns/[slug]
├ ƒ /teardowns/[slug]/claim
├ ○ /terms
├ ○ /thank-you
├ ○ /unsubscribe
├ ○ /vs
├   /vs/[slug]
│ ├ ● /vs/pagespeed-insights
│ ├ ● /vs/hubspot-website-grader
│ ├ ● /vs/silktide
│ └ ● [+8 more paths]
├ ○ /what-is-landing-page-audit
├ ○ /what-is-nebula-components
├ ○ /why-cro-agencies-dont-work
├ ○ /why-is-my-landing-page-not-converting
└ ƒ /workspace


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand

npm notice run nebula-customer-portal@2.0.0 test
npm notice run NODE_ENV=test NODE_OPTIONS=--experimental-vm-modules jest
(node:1455886) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.

Test Suites: 99 passed, 99 total
Tests:       8 skipped, 806 passed, 814 total
Snapshots:   0 total
Time:        13.089 s
Ran all test suites.
npm notice run nebula-customer-portal@2.0.0 test:e2e
npm notice run playwright test
[WebServer] npm notice run nebula-customer-portal@2.0.0 npx

[WebServer] npm notice run 'next' start -p 4173


Running 54 tests using 6 workers

[1/54] [desktop] › e2e/audit-report-responsive.spec.ts:70:7 › audit results page has no horizontal overflow at 320px
[2/54] [desktop] › e2e/audit-report-responsive.spec.ts:53:7 › audit landing page has no horizontal overflow at 320px
[3/54] [desktop] › e2e/audit-report-responsive.spec.ts:31:5 › audit report contains horizontal navigation and long evidence on mobile
[4/54] [desktop] › e2e/audit-report-responsive.spec.ts:70:7 › audit results page has no horizontal overflow at 375px
[5/54] [desktop] › e2e/checkout-cta.spec.ts:13:5 › checkout CTA hydrates and issues POST /api/checkout
[6/54] [desktop] › e2e/audit-report-responsive.spec.ts:53:7 › audit landing page has no horizontal overflow at 375px
[7/54] [desktop] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable/quick-start renders one canonical answer-first page
[8/54] [desktop] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable renders one canonical answer-first page
[9/54] [desktop] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable/jobs/technical-retrieval-audit renders one canonical answer-first page
[10/54] [desktop] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable/jobs/claim-evidence-governance renders one canonical answer-first page
[11/54] [desktop] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable/jobs/answer-extractability-audit renders one canonical answer-first page
[12/54] [desktop] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable/jobs/entity-narrative-audit renders one canonical answer-first page
[13/54] [desktop] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable/jobs/release-deployment-verification renders one canonical answer-first page
[14/54] [desktop] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable/compare renders one canonical answer-first page
[15/54] [desktop] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable/releases renders one canonical answer-first page
[16/54] [desktop] › e2e/citable-information-architecture.spec.ts:70:5 › overview links every published supporting page
[17/54] [desktop] › e2e/citable-information-architecture.spec.ts:79:5 › comparison and release pages preserve their explicit evidence boundaries
[18/54] [desktop] › e2e/citable-information-architecture.spec.ts:100:5 › unknown Citable job slugs return 404
[19/54] [desktop] › e2e/citable-information-architecture.spec.ts:105:5 › case-study routes reflect the empty governed projection
[20/54] [desktop] › e2e/landing-page-intelligence-stack.spec.ts:14:5 › renders the inspectable stack and direct conversion path
[21/54] [desktop] › e2e/learning-centre-contextual-links.spec.ts:28:5 › maps every article from the hub and only serves contextual Learning Centre links to real articles
[22/54] [desktop] › e2e/learning-centre-crawlability.spec.ts:21:5 › serves every Learning Centre article link in the hub response before client JavaScript
[23/54] [desktop] › e2e/nav-overlap.spec.ts:12:7 › header does not overlap main content on /
[24/54] [desktop] › e2e/nav-overlap.spec.ts:12:7 › header does not overlap main content on /learning-centre
[25/54] [desktop] › e2e/nav-overlap.spec.ts:12:7 › header does not overlap main content on /audit
[26/54] [desktop] › e2e/nav-overlap.spec.ts:12:7 › header does not overlap main content on /resources
[27/54] [desktop] › e2e/nav-overlap.spec.ts:12:7 › header does not overlap main content on /thank-you
[28/54] [mobile] › e2e/audit-report-responsive.spec.ts:31:5 › audit report contains horizontal navigation and long evidence on mobile
[29/54] [mobile] › e2e/audit-report-responsive.spec.ts:53:7 › audit landing page has no horizontal overflow at 320px
[30/54] [mobile] › e2e/audit-report-responsive.spec.ts:70:7 › audit results page has no horizontal overflow at 320px
[31/54] [mobile] › e2e/audit-report-responsive.spec.ts:53:7 › audit landing page has no horizontal overflow at 375px
[32/54] [mobile] › e2e/audit-report-responsive.spec.ts:70:7 › audit results page has no horizontal overflow at 375px
[33/54] [mobile] › e2e/checkout-cta.spec.ts:13:5 › checkout CTA hydrates and issues POST /api/checkout
[34/54] [mobile] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable renders one canonical answer-first page
[35/54] [mobile] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable/quick-start renders one canonical answer-first page
[36/54] [mobile] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable/jobs/technical-retrieval-audit renders one canonical answer-first page
[37/54] [mobile] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable/jobs/claim-evidence-governance renders one canonical answer-first page
[38/54] [mobile] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable/jobs/answer-extractability-audit renders one canonical answer-first page
[39/54] [mobile] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable/jobs/entity-narrative-audit renders one canonical answer-first page
[40/54] [mobile] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable/jobs/release-deployment-verification renders one canonical answer-first page
[41/54] [mobile] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable/compare renders one canonical answer-first page
[42/54] [mobile] › e2e/citable-information-architecture.spec.ts:43:7 › /resources/citable/releases renders one canonical answer-first page
[43/54] [mobile] › e2e/citable-information-architecture.spec.ts:70:5 › overview links every published supporting page
[44/54] [mobile] › e2e/citable-information-architecture.spec.ts:79:5 › comparison and release pages preserve their explicit evidence boundaries
[45/54] [mobile] › e2e/citable-information-architecture.spec.ts:100:5 › unknown Citable job slugs return 404
[46/54] [mobile] › e2e/citable-information-architecture.spec.ts:105:5 › case-study routes reflect the empty governed projection
[47/54] [mobile] › e2e/landing-page-intelligence-stack.spec.ts:14:5 › renders the inspectable stack and direct conversion path
[48/54] [mobile] › e2e/learning-centre-contextual-links.spec.ts:28:5 › maps every article from the hub and only serves contextual Learning Centre links to real articles
[49/54] [mobile] › e2e/learning-centre-crawlability.spec.ts:21:5 › serves every Learning Centre article link in the hub response before client JavaScript
[50/54] [mobile] › e2e/nav-overlap.spec.ts:12:7 › header does not overlap main content on /
[51/54] [mobile] › e2e/nav-overlap.spec.ts:12:7 › header does not overlap main content on /learning-centre
[52/54] [mobile] › e2e/nav-overlap.spec.ts:12:7 › header does not overlap main content on /audit
[53/54] [mobile] › e2e/nav-overlap.spec.ts:12:7 › header does not overlap main content on /resources
[54/54] [mobile] › e2e/nav-overlap.spec.ts:12:7 › header does not overlap main content on /thank-you
  54 passed (28.9s)
```

### Remediation correction

The prior homepage assertion correction was invalid because it bound the test to uncommitted `HeroSection.tsx` copy. Commit `31881683b` keeps the approved committed homepage baseline unchanged:

```text
Find the page failure before you spend another dollar on traffic.
Free audit. Raw evidence. Ranked fixes.
```

#### Command: `cd /home/mike/nebula/.task5-baseline/customer-portal && npx jest __tests__/homepage-million-dollar-redesign.test.ts --runInBand`

**Exit code:** 0

```text
Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        1.728 s
Ran all test suites matching __tests__/homepage-million-dollar-redesign.test.ts.
```

#### Final committed-revision build and CI verification

The first direct working-tree `npm run ci` used the protected uncommitted homepage copy and failed only the corrected homepage contract. It was not used as final evidence:

#### Command: `cd /home/mike/nebula/customer-portal && npm run build > /tmp/task5-build-final.log 2>&1; build_status=$?; printf "BUILD_EXIT=%s\\n" "$build_status"; if [ $build_status -ne 0 ]; then exit $build_status; fi; npm run ci > /tmp/task5-ci-final.log 2>&1; ci_status=$?; printf "CI_EXIT=%s\\n" "$ci_status"; exit $ci_status`

**Exit code:** 1 (`BUILD_EXIT=0`, `CI_EXIT=1`)

```text
[build-info] Generated immutable build-info.json: 4c847c819d71131e0a394015447ad2152b2d835b (production) at 2026-09-03T18:12:10Z
Test Suites: 1 failed, 98 passed, 99 total
Tests:       1 failed, 8 skipped, 805 passed, 814 total
expect(hero).toContain('Find the page failure before you spend another dollar on traffic.')
```

The final gate ran from a detached worktree at committed revision `8ee8e653d0a1bdafbd008993d4d8c84898130cda`, with the ignored local `seo-reports` evidence directory copied for the existing governance check. No ignored artifact was staged.

#### Command: `cd /home/mike/nebula/.task5-final/customer-portal && npm run build > /tmp/task5-final-build.log 2>&1; build_status=$?; printf "BUILD_EXIT=%s\\n" "$build_status"; if [ $build_status -ne 0 ]; then exit $build_status; fi; npm run ci > /tmp/task5-final-ci.log 2>&1; ci_status=$?; printf "CI_EXIT=%s\\n" "$ci_status"; exit $ci_status`

**Exit code:** 0 (`BUILD_EXIT=0`, `CI_EXIT=0`)

```text
[build-info] Generated immutable build-info.json: 8ee8e653d0a1bdafbd008993d4d8c84898130cda (production) at 2026-09-03T18:22:24.387Z
✓ Compiled successfully in 1868ms
Content guard passed: scanned stories and generated Storybook shell output
Opportunity governance enforcement passed (I1/I2/I3, as of 2026-09-03)
Landing page intelligence stack projection is current
Test Suites: 99 passed, 99 total
Tests:       8 skipped, 806 passed, 814 total
Ran all test suites.
54 passed (24.5s)
```

## Task 5 exact evidence (2026-09-05)

- RED first: `pytest tests/test_content_pipeline_workflow.py -q` -> exit 1, 5 failed because the four requested executors did not exist.
- Focused green: `pytest tests/test_content_pipeline_workflow.py tests/test_content_pipeline_validation.py -q` -> exit 0, 32 passed.
- Full relevant green: `.venv/bin/python -m pytest -q` -> exit 0, 907 passed, 3 warnings.
- Python compile: `python -m py_compile scripts/content_pipeline/*.py` -> exit 0.
- Malformed probes: missing draft and approval -> exit 1, named `INPUT_ERROR`, `MISSING_APPROVAL`, `MISSING_DRAFT`.
- Customer portal: `npm run typecheck` -> exit 0; `npm run lint` -> exit 0; `npm run build` -> exit 0; `npm run check:blog-content` -> exit 0, 32 passed; `npm test -- --runInBand __tests__/blog-publish-readiness.test.tsx` -> exit 0, 2 passed.
- `git diff --check` and `python -m json.tool customer-portal/package.json` -> exit 0.

### Lifecycle artifact

Local temporary fixture lifecycle completed: create -> `v001.md` plus provenance sidecar -> review returned named `DATELINE` finding without changing bytes -> edit -> immutable `v002.md` with parent hash and edit record -> approval hash gate -> `publish_article.py --dry-run` returned `DRY_RUN`. No published directory was created and no analytics files were changed.

### Scope and concerns

Changed only Task 5 implementation, tests, CI wiring, and runbook. Pre-existing dirty paths were not staged. The system-wide pytest run with `/usr/bin/python3` was attempted and failed during collection from missing ambient dependencies; the repository `.venv` run passed all 907 tests. The build generated existing customer-portal build artifacts that remain outside the Task 5 commit scope.
