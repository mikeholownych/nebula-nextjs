# Subagent-driven development progress

## Workspace

- Branch: `feat/claude-seo-action-plan`
- Worktree: `/home/mike/nebula/.worktrees/claude-seo-action-plan`
- Source plan: `/home/mike/nebula/competitor-analysis/claude-seo-full-site-review-2026-07-26.md`
- Implementation plan: `docs/superpowers/plans/2026-07-26-claude-seo-action-plan-implementation.md`

## Baseline

- Full Jest: 21 suites passed, 1 suite failed; 143 tests passed, 1 failed.
- Known pre-existing failure: 15 Learning Centre article directories lack `meta.json`, excluding them from the hub and sitemap.
- `npm run check:citable-projection`: passed.
- `npm run check:evidence-atoms`: passed.

## Task ledger

| Task | Implementer | Review | Status | Notes |
|---|---|---|---|---|
| 1. Learning Centre inventory | /root/implement_lc_inventory | /root/review_lc_inventory | approved | Commits d5d36502, e3402ab4; 45/45 article sidecars valid; malformed-metadata fixture isolated |
| 2. Canonical public facts | /root/implement_public_facts | /root/review_public_facts_final | approved | Commits f176a744, ef47513c, 9573855a, fa39ebe9, fbb904f0; registry `price_data`, advisory-lock recovery, provider receipt idempotency, canonical success labels, and hard request-time expiry |
| 3. Crawl and reliability gates | /root/implement_crawl_reliability | /root/review_crawl_reliability | approved | Raw hub HTML, contextual target validation, strict XML sitemap-route smoke gate, and self-contained smoke dependencies |
| 4. Citable route registry/shell | /root/implement_citable_ia_jobs | /root/implement_citable_ia_jobs/review_citable_ia_jobs | approved | Atomic registry, shared shell/proof units, concise hub, and registry-derived sitemap |
| 5. Citable quick start/jobs | /root/implement_citable_ia_jobs | /root/implement_citable_ia_jobs/review_citable_ia_jobs | approved | Quick start and five job pages; compare/releases remain planned for Task 6 |
| 6. Comparison/releases | /root/implement_citable_compare_release | /root/implement_citable_compare_release/review_citable_compare_release | approved | Category/workflow states, synchronized current release, controlled assets, and explicit unavailable workflow/deployment proof |
| 7. Editorial/performance | /root/finish_editorial_performance + /root | /root/review_editorial_performance | approved | Four answer-first articles; fixed Lighthouse lab gates; consent, header, FAQ-schema, and prefetch performance fixes |
| 8. Proof scaffolding | /root/implement_public_proof | /root/implement_public_proof/review_public_proof | approved | Generated single-authority cases/benchmarks; actual-clock expiry, dynamic proof surfaces, deterministic diagnostics/drift gate; current counts remain zero |
| 9. Final verification | /root | /root/final_branch_review | blocked | Code review approved with no findings and repository CI green; Lighthouse TBT and live-origin 502 gates remain blocked; no deployment |

## Decisions

- The current accordion already emits eligible article anchors in server HTML. Missing metadata, not client-only mounting, is the current discovery blocker.
- Citable release facts remain sourced from `data/citable-release.json`.
- Production workflow status is unknown without a committed fresh receipt.
- Public case studies and benchmarks remain unpublished until the evidence compiler accepts them.
- The active Fix Pack is `$97` through 2026-12-31: automated tailored prompt-pack delivery within minutes; the customer or developer implements without Nebula site access.
- Missing, expired, incomplete, or unsupported offer/proof facts are omitted rather than replaced with fallback claims.
- Automatic fulfillment uses immutable canonical receipt facts and does not depend on the date-sensitive public availability window.
- Fulfillment receipt history is append-only: changing the current offer must preserve retired tuples for delayed/retried paid receipts.
- The purchases insert outcome is the webhook side-effect claim; duplicate Stripe sessions do not repeat delivery, alerting, or purchase analytics.
- The public CTA creates Stripe Checkout Sessions through `/api/checkout`; Stripe collects email and the server supplies canonical offer metadata and registry-derived price data.
- Fix Pack Checkout Sessions use registry-derived `price_data` and card payments only; no opaque Stripe Price ID controls the canonical amount.
- Canonical webhook fulfillment uses `pending/failed → processing → delivered`; failures return to `failed` for Stripe retry, while concurrent events cannot claim twice.
- Prompt-pack delivery idempotency is keyed by Stripe session ID, not customer email.
- Canonical webhook delivery is serialized by a same-connection PostgreSQL advisory lock; a crashed worker releases the lock with its connection, and a retry may safely resume any non-delivered row.
- AgentMail receives `fix-pack:<stripe_session_id>` as its provider idempotency key, and receipt replay detection runs before bounce-store access.
- Public case and benchmark proof is authored only in `data/public-proof-surfaces.json`, compiled against governed claims/evidence, and consumed only through `data/public-proof.generated.json`.
- Public-proof expiry uses the actual UTC date at compile/check time and a projected `validUntil` at request time; proof-bearing case, Citable, and sitemap routes are dynamic to prevent stale expired proof.
- Checkout requires the exact completed audit ID and its signed unlock cookie before Stripe session creation; fulfillment accepts only that immutable audit ID from Stripe metadata and never guesses by email.
- Consent-gated Google Analytics and PostHog loading, WebMCP registration, navigation, Learning Centre accordions, and footer links use server-rendered/native controls on audited static routes to minimize hydration work.

## Task 9 verification receipts

- `npm run ci`: passed — typecheck, lint, evidence/public-proof/Citable/intelligence projections, production build, 33 Jest suites / 301 tests, and 44 Playwright tests.
- `node scripts/validate-governance.mjs`: passed — 31 checks, 2 existing warnings, 0 failures.
- `/home/mike/nebula/venv/bin/python3 -m unittest tests.test_deliver_prompt_pack`: passed — 9 tests.
- `git diff --check`: passed.
- Independent final code review: approved — no Critical, Important, or Minor findings.
- Lighthouse CI (three lab runs per route): failed only the fixed TBT ≤ 200 ms budget. Medians were 289 ms (`/learning-centre`), 296.7 ms (representative article), 307 ms (`/resources/citable`), and 256.5 ms (representative Citable job). Other configured assertions passed.
- Production sitemap-route checker: three consecutive runs against `https://nebulacomponents.shop` each failed at sitemap fetch with HTTP 502, so route-level 200 receipts could not be collected.
- Deployment: not performed.
