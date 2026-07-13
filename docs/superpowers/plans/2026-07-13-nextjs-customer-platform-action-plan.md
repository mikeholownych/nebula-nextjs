# Nebula Customer Platform Detailed Action Plan

> **Execution method:** Use `subagent-driven-development` for each work package. One implementation agent performs the change, a specification reviewer checks requirement compliance, and a code-quality reviewer checks maintainability and security before the package is accepted.

**Goal:** Execute the approved Next.js customer-platform transformation through independently releasable, evidence-gated work packages while protecting the existing revenue, audit, SEO, and agent-discovery systems.

**Primary implementation plans:**

- [`2026-07-13-nextjs-customer-platform-roadmap.md`](2026-07-13-nextjs-customer-platform-roadmap.md)
- [`01-nextjs-public-site-migration.md`](01-nextjs-public-site-migration.md)
- [`02-platform-api-identity-tenancy.md`](02-platform-api-identity-tenancy.md)
- [`03-customer-dashboard-billing.md`](03-customer-dashboard-billing.md)
- [`04-agency-whitelabel-management.md`](04-agency-whitelabel-management.md)
- [`05-deployment-cutover-operations.md`](05-deployment-cutover-operations.md)

## 1. Execution authority and roles

| Role | Owner | Authority |
|---|---|---|
| Program owner | Hermes/CEO agent | Prioritization, sequencing, implementation orchestration, gate enforcement |
| Implementation worker | Ephemeral coding subagent | One bounded work package in an isolated worktree |
| Specification reviewer | Independent review subagent | Confirms package satisfies its plan, contracts, security invariants, and migration boundaries |
| Code-quality reviewer | Independent review subagent | Reviews tests, maintainability, failure handling, security, and operational impact |
| Production approver | Mike | External spend over $50, strategic direction changes, irreversible cutover, legal/data-processing commitments |
| Revenue-system owner | Existing Python services | Remain authoritative until an explicit tested cutover changes ownership |

No new persistent engineering-agent profile is required. Ephemeral workers are created per package and discarded after review.

## 2. Non-negotiable execution rules

1. **Security before transformation:** Customer provisioning cannot begin while unsigned Stripe webhook paths remain active.
2. **One package per worktree:** Each implementation package uses a dedicated branch/worktree and a small reviewable commit series.
3. **Tests before production code:** Every bugfix or feature begins with a failing test that proves the required behavior.
4. **No big-bang routing:** Cloudflare moves one route or page family at a time.
5. **No guessed tenant scope:** Backend derives identity and organization access from verified tokens and database memberships.
6. **No browser billing authority:** Stripe secrets, entitlement mutation, and portal-session authorization stay server-side.
7. **No route loss:** Existing `.html`, clean aliases, discovery paths, metadata, analytics events, and Stripe links are frozen before migration.
8. **No implicit customer claims:** Matching an identity-provider email to a purchase email never grants access automatically.
9. **No hidden proxy topology:** Caddy, Cloudflare, Next, Python, and platform API ownership is recorded before routing changes.
10. **No completion claim without evidence:** Every package records commands, exit codes, test counts, and affected routes.

## 3. Stop-the-line conditions

Immediately pause the current package and roll back the affected route when any of the following occurs:

- An unsigned or replayed Stripe event mutates state.
- A user reads or changes another tenant's data.
- A payment, webhook, audit, CRM, lead, or delivery regression appears.
- A migrated public route returns an unintended status, redirect, canonical, robots directive, or broken critical CTA.
- A build includes secrets, lead data, private audit artifacts, customer ledgers, or source maps not approved for deployment.
- A custom hostname serves the wrong tenant's branding or protected data.
- A migration cannot be restored from backup in staging.
- Production rollback has not been exercised for the release boundary being activated.

## 4. Critical path and execution waves

Assuming one primary implementation stream with two parallel review/research workers:

| Wave | Work | Estimated effort | Dependency |
|---|---|---:|---|
| 0 | Stripe containment, generator freeze, runtime topology | 2–4 working days | None |
| 1 | Next.js and platform API foundations | 3–5 working days | Wave 0 |
| 2 | Public content and identity/database foundations in parallel | 10–15 working days | Wave 1 |
| 3 | Customer dashboard, billing, interactive marketing | 8–12 working days | Wave 2 security gates |
| 4 | Agency management and white-label releases | 8–12 working days | Customer dashboard and tenant model |
| 5 | Final public cutover, rollback window, legacy retirement | 3–5 working days | All prior gates |

**Risk-adjusted critical path:** 34–53 working days, approximately 6.8–10.6 working weeks. Starting July 14, 2026, the modeled completion window is August 31–September 25, 2026. This is a planning range, not a delivery promise; identity-provider procurement, Cloudflare for SaaS capability, or discovered route drift can extend it.

## 5. Detailed work-package backlog

### Wave 0 — Stabilize before building

#### SEC-01 — Freeze current Stripe defects with isolated tests

- **Owner:** Implementation worker
- **Depends on:** None
- **Files:** `tests/platform_api/test_stripe_signature.py`, `tests/test_stripe_webhook_platform_sync.py`
- **Actions:**
  1. Run tests against temporary directories and mocked email/fulfillment adapters.
  2. Prove `agentic_server.py` and `webhook_server.py` currently accept unsigned Stripe-shaped JSON.
  3. Prove duplicate delivery can repeat a mutation.
  4. Prove the second `customer.subscription.updated` branch is unreachable.
- **Evidence:** Failing tests demonstrate all four defects without writing production ledgers or sending messages.
- **Exit gate:** Reviewers confirm tests are safe, deterministic, and fail for the intended reasons.

#### SEC-02 — Build the verified Stripe ingestion boundary

- **Owner:** Implementation worker
- **Depends on:** SEC-01, DATA-02 service scaffold
- **Files:** `platform_api/api/webhooks/stripe.py`, `platform_api/config.py`
- **Actions:**
  1. Read raw request bytes once.
  2. Require `Stripe-Signature`.
  3. Validate with Stripe's webhook constructor and configured endpoint secret.
  4. Return `400` with zero side effects for missing, stale, malformed, or mismatched signatures.
  5. Preserve request ID and livemode in the internal event envelope.
- **Evidence:** Signature-valid, signature-invalid, expired-timestamp, malformed-body, and wrong-secret tests pass.
- **Exit gate:** No JSON parsing occurs before signature verification.

#### SEC-03 — Add idempotency, normalized billing, and transactional outbox

- **Owner:** Implementation worker
- **Depends on:** SEC-02, DATA-03 database schema
- **Files:** `platform_api/services/stripe_event_processor.py`, `platform_api/services/outbox.py`, billing repositories
- **Actions:**
  1. Insert Stripe event ID under a unique database constraint.
  2. Apply payer/service-account billing state transactionally.
  3. Reject older events that would regress current state.
  4. Write an outbox record in the same transaction.
  5. Move legacy order, ledger, and email behavior behind an idempotent compatibility adapter.
  6. Remove duplicate subscription-update branching.
- **Evidence:** Duplicate, replayed, out-of-order, test/live mismatch, refund, dispute, and retry tests pass.
- **Exit gate:** Every valid event produces at most one billing mutation and one fulfillment action.

#### SEC-04 — Cut over `/stripe-webhook`

- **Owner:** Hermes/CEO agent with Mike notified before production routing change
- **Depends on:** SEC-03, OPS-03 route manifest, OPS-06 staging rollback
- **Actions:**
  1. Replay signed Stripe fixtures in staging.
  2. Verify raw body and signature survive Cloudflare routing.
  3. Change target ownership from `agentic_server` to `platform_api`.
  4. Disable old unsigned handlers only after target verification.
  5. Exercise emergency routing rollback without re-enabling unsigned processing.
- **Evidence:** Staging and production smoke evidence, event IDs, and one-time fulfillment counts.
- **Exit gate:** Customer provisioning remains disabled until this package passes.

#### BASE-01 — Pause generators and stabilize the content inventory

- **Owner:** Hermes/CEO agent
- **Depends on:** None
- **Actions:**
  1. Identify cron, process, and script owners for case-study and learning-centre generation.
  2. Pause bounded generators without deleting data.
  3. Capture two complete inventories separated by a verification interval.
  4. Require identical HTML, route, case-study source, and generated-output counts.
- **Evidence:** Two timestamped inventory files with identical counts and checksums.
- **Exit gate:** No route manifest is generated while counts are changing.

#### BASE-02 — Freeze public route and SEO behavior

- **Owner:** Implementation worker
- **Depends on:** BASE-01
- **Actions:** Capture every reachable path, status, redirect, canonical, robots directive, title, description, H1s, JSON-LD types, OG/Twitter metadata, internal links, assets, analytics events, and Stripe links—including ignored/generated production pages.
- **Evidence:** `config/public-route-manifest.json` and passing manifest-contract tests.
- **Exit gate:** Every known current production route has an explicit expected behavior.

#### OPS-01 — Capture live routing and process topology

- **Owner:** Operations implementation worker
- **Depends on:** None
- **Actions:**
  1. Record processes, ports, bind addresses, systemd units, Caddy configuration, and Cloudflare ingress.
  2. Probe representative public, API, Stripe, tracking, CRM, stats, and discovery paths.
  3. Map each route to the component that actually serves it.
  4. Record rollback commands before modifying anything.
- **Evidence:** `docs/architecture/request-routing.md` and machine-readable service-route manifest.
- **Exit gate:** No unknown proxy layer or route owner remains.

### Wave 1 — Establish buildable foundations

#### WEB-01 — Create isolated Next.js application

- **Owner:** Frontend implementation worker
- **Depends on:** BASE-02
- **Actions:** Create `web/` with Next.js 16.2.10, React 19, strict TypeScript, standalone output, lint, typecheck, Vitest, health/readiness routes, security headers, and loopback port 3000.
- **Evidence:** `npm --prefix web run lint`, `typecheck`, `test`, and `build` all exit `0`; standalone server starts and responds.
- **Exit gate:** No existing route has moved yet.

#### WEB-02 — Prove `.html` compatibility

- **Owner:** Frontend implementation worker
- **Depends on:** WEB-01
- **Actions:** Implement a strict internal legacy-path rewrite for a compatibility probe, preserving query string, external browser URL, and canonical while excluding API, discovery, asset, and traversal paths.
- **Evidence:** Unit and Playwright probe tests.
- **Exit gate:** If URL/canonical preservation fails, stop and revise routing before content migration.

#### WEB-03 — Build shared public primitives

- **Owner:** Frontend implementation worker
- **Depends on:** WEB-01
- **Actions:** Add design tokens, header, footer, analytics consent, safe JSON-LD, metadata helper, site configuration, error/not-found behavior, and Server-Component defaults.
- **Evidence:** Unit accessibility tests and homepage metadata fixture parity.
- **Exit gate:** No site redesign is introduced during parity migration.

#### DATA-01 — Complete the identity-provider spike and ADR

- **Owner:** Identity implementation worker
- **Depends on:** None
- **Actions:** Evaluate Clerk, WorkOS AuthKit, and Auth0; prove sign-in, Python JWKS verification, invite/accept, account switching, logout/revocation, MFA capability, and branded-login behavior.
- **Decision:** Choose the highest-scoring provider within delegated spend. Escalate if recurring spend exceeds $50 or contractual/data-processing terms require Mike.
- **Evidence:** `docs/architecture/adr-001-identity-provider.md` with executed spike results.
- **Exit gate:** Database remains authorization truth; provider organizations and email do not become tenant keys.

#### DATA-02 — Scaffold bounded platform API

- **Owner:** Backend implementation worker
- **Depends on:** DATA-01 interface definition
- **Actions:** Add FastAPI on `127.0.0.1:8770`, strict settings, request IDs, JSON error envelope, bounded bodies, health/readiness, restricted CORS, and provider-neutral JWT verification.
- **Evidence:** Authentication, key-rotation, issuer, audience, expiry, timeout, CORS, health, and readiness tests.
- **Exit gate:** Existing `agentic_server.py` is not expanded with customer-platform routes.

#### DATA-03 — Create PostgreSQL tenant schema and RLS

- **Owner:** Backend implementation worker
- **Depends on:** DATA-02
- **Actions:** Create users, identity mappings, organizations, memberships, agency-client relationships, payer/service subscriptions, entitlements, brands, brand assignments, domains, audit records, webhook records, and outbox records with Alembic and restricted runtime roles.
- **Evidence:** Upgrade/downgrade/upgrade test, schema constraints, RLS isolation tests, and backup/restore test.
- **Exit gate:** Runtime role cannot bypass RLS or modify schema.

#### OPS-02 — Establish local service supervision

- **Owner:** Operations implementation worker
- **Depends on:** WEB-01, DATA-02, OPS-01
- **Actions:** Add hardened systemd definitions; bind Next, Python, and platform API to loopback; run Cloudflare as an unprivileged account; prevent duplicate processes; document Caddy disposition.
- **Evidence:** `systemd-analyze verify`, port/bind checks, health checks, and restart-limit tests.
- **Exit gate:** Services recover from a controlled restart without exposing internal ports.

### Wave 2 — Build public content and tenant foundations in parallel

#### WEB-04 — Migrate case studies

- **Owner:** Frontend/content implementation worker
- **Depends on:** WEB-02, WEB-03, BASE-02
- **Actions:** Export privacy-safe typed records, validate with Zod, render one list/detail template, generate all slugs, preserve canonical `.html` behavior, and keep legacy HTML generation available for rollback.
- **Evidence:** Source count equals rendered slug count; no duplicate canonical; sampled route/metadata/visual/accessibility parity passes.
- **Exit gate:** Activate only a case-study canary route, then the family after production smoke.

#### WEB-05 — Migrate repeatable content families

- **Owner:** Frontend/content implementation worker
- **Depends on:** WEB-04 patterns
- **Actions:** Migrate learning centre, articles, comparisons, products, lead magnets, and passive marketing pages to typed content and shared templates; preserve UK/US and raw-path aliases explicitly.
- **Evidence:** Family-level route, metadata, internal-link, accessibility, and visual parity.
- **Exit gate:** Each family can roll back independently.

#### DATA-04 — Implement authorization matrix

- **Owner:** Backend implementation worker
- **Depends on:** DATA-03
- **Actions:** Add explicit permissions, organization/client scoping, active agency relationships, payer/service billing permissions, last-owner protection, step-up hooks for sensitive operations, and audit events.
- **Evidence:** Full role/permission matrix, IDOR matrix, repository-scope assertions, and RLS defense-in-depth tests.
- **Exit gate:** Foreign resource identifiers consistently return 404.

#### DATA-05 — Add account, membership, invitation, and client APIs

- **Owner:** Backend implementation worker
- **Depends on:** DATA-04
- **Actions:** Add `/me`, organization/account, membership, invitation, and agency-client operations with cursor pagination, optimistic locking for sensitive mutations, role ceilings, and AgentMail invitation delivery.
- **Evidence:** API contract snapshot and tests for duplicate, expired, replayed, unauthorized, escalation, pagination, and delivery-failure cases.
- **Exit gate:** No provider or browser field can raise effective authority.

#### DATA-06 — Reconcile existing customers safely

- **Owner:** Backend/data implementation worker
- **Depends on:** DATA-03, DATA-05
- **Actions:** Snapshot ledgers/orders, import to staging tables, reconcile Stripe IDs and payer/service organizations, quarantine conflicts/test records, and produce explicit invitations or operator-reviewed claims.
- **Evidence:** Two identical dry-run reports and a reviewed quarantine report.
- **Exit gate:** Email matching alone cannot create membership.

#### OPS-03 — Generate and validate service-route manifest

- **Owner:** Operations implementation worker
- **Depends on:** OPS-01, WEB-01, DATA-02
- **Actions:** Inventory every dynamic route and define current/target ownership. Validate Cloudflare rule ordering and exact Go-regex behavior.
- **Evidence:** `cloudflared tunnel ingress validate` plus representative `tunnel ingress rule` results.
- **Exit gate:** Every dynamic route reaches Python/platform API; only approved public routes reach Next.

### Wave 3 — Customer application and remaining public interactions

#### DASH-01 — Release authenticated dashboard shell

- **Owner:** Frontend application worker
- **Depends on:** WEB-01, DATA-05
- **Actions:** Add protected route group, server-only API client, no-store protected responses, tenant switcher, accessible navigation, explicit loading/error/empty states, and session revocation behavior.
- **Evidence:** Anonymous redirect, authorized rendering, unauthorized tenant selection, caching, keyboard, and API-failure tests.
- **Exit gate:** Internal Nebula tenant only.

#### DASH-02 — Add account and team administration

- **Owner:** Full-stack implementation worker
- **Depends on:** DASH-01, DATA-05
- **Actions:** Build profile, membership, invite, role change, revoke, and destructive-action confirmation flows.
- **Evidence:** End-to-end invite/accept/revoke and role-ceiling tests.
- **Exit gate:** One internal test organization completes the lifecycle.

#### DASH-03 — Add billing self-service

- **Owner:** Full-stack implementation worker
- **Depends on:** SEC-04, DASH-01, DATA-04
- **Actions:** Display normalized subscription/entitlement state and freshness; authorize payer organization; create short-lived Stripe Customer Portal sessions with an allowlisted return URL; prevent duplicate submissions.
- **Evidence:** Stripe test-mode checkout → signed webhook → entitlement → portal sequence.
- **Exit gate:** A client administrator cannot view agency invoices when the agency is payer.

#### DASH-04 — Add audit and delivery visibility

- **Owner:** Full-stack implementation worker
- **Depends on:** DASH-01, DATA-04
- **Actions:** Project existing audit/delivery evidence into customer-safe DTOs, redact internal lead/email details, and show processing/delivered/failed status with freshness.
- **Evidence:** Foreign audit ID returns 404; pagination stays tenant-scoped; source freshness is explicit.
- **Exit gate:** One test customer validates displayed evidence against backend records.

#### WEB-06 — Migrate interactive marketing routes

- **Owner:** Frontend implementation worker
- **Depends on:** WEB-03, OPS-03
- **Actions:** Migrate audit, free-kit, newsletter, ROI, pricing generator, beta, intake, unsubscribe, attribution, and leaderboard interactions using narrow Client Components and allowlisted same-origin API adapters.
- **Evidence:** Existing Python payload/response contracts, GA4 event names, validation, accessibility, timeout, retry, and duplicate-submit tests pass.
- **Exit gate:** Python behavior remains unchanged.

#### OPS-04 — Establish CI and immutable artifacts

- **Owner:** Operations implementation worker
- **Depends on:** WEB-01, DATA-03
- **Actions:** Add frontend, Python, migration, integration, browser, secret, vulnerability, and artifact jobs; build once and promote the same digest.
- **Evidence:** Clean CI run, artifact SHA-256, SBOM, provenance, no high/critical unapproved findings, and clean working tree after build.
- **Exit gate:** Production never runs `git pull`, dependency install, or compilation in the live release directory.

### Wave 4 — Agency and white-label releases

#### AGENCY-01 — Release agency-client administration

- **Owner:** Full-stack implementation worker
- **Depends on:** DATA-05, DASH-01
- **Actions:** Implement invited/active/suspended/unlinked relationship state, capability checks, audit reasons, and tenant-safe client list/detail pages.
- **Evidence:** Transition, duplicate, role, self-access, and cross-agency IDOR tests.
- **Exit gate:** One internal agency with two isolated test clients.

#### BRAND-01 — Release safe branding and assets

- **Owner:** Full-stack implementation worker
- **Depends on:** AGENCY-01
- **Actions:** Add strict brand schemas, fixed CSS variables, isolated preview, PNG/JPEG/WebP signed uploads, MIME/dimension/size checks, randomized tenant object keys, and explicit brand assignments.
- **Evidence:** XSS, CSS injection, MIME spoofing, replay, cross-tenant asset, and contrast tests.
- **Exit gate:** Arbitrary CSS, HTML, JavaScript, and SVG remain prohibited.

#### BRAND-02 — Release managed subdomains

- **Owner:** Full-stack and operations workers
- **Depends on:** BRAND-01, OPS-03
- **Actions:** Add normalized unique slugs, strict host parsing, host-to-tenant resolution, tenant-keyed caches, and branded shell for `{slug}.app.nebulacomponents.shop`.
- **Evidence:** Two agencies cannot share branding, protected data, assets, or cached HTML.
- **Exit gate:** Managed subdomains pass staging and one controlled production tenant.

#### BRAND-03 — Complete Cloudflare for SaaS capability gate

- **Owner:** Hermes/CEO agent
- **Depends on:** BRAND-02
- **Actions:** Verify account-plan capability, cost, certificate behavior, hostname limits, API access, and rollback. Escalate costs over $50 or contractual changes.
- **Evidence:** Capability decision record and staging hostname lifecycle.
- **Exit gate:** Custom domains do not proceed if capability or cost is unresolved.

#### BRAND-04 — Release verified custom domains

- **Owner:** Full-stack and operations workers
- **Depends on:** BRAND-03
- **Actions:** Implement DNS token hashing, ownership verification, certificate state machine, idempotent reconciliation, disable/delete behavior, audit history, and unknown-host denial.
- **Evidence:** Duplicate, wildcard, confusable, private/internal target, timeout, certificate failure, cache isolation, and rollback tests.
- **Exit gate:** Traffic activates only after ownership and certificate status are both active.

#### OPS-05 — Add observability and freshness

- **Owner:** Operations implementation worker
- **Depends on:** OPS-02, DASH-03
- **Actions:** Correlate request IDs, structured logs, process health, dependency readiness, Stripe/identity webhook lag, subscription freshness, audit freshness, and tenant-safe identifiers.
- **Evidence:** Intentionally stale data reports `available=true` and `fresh=false`; secrets/PII are absent from logs.
- **Exit gate:** Numeric alerts are derived from staging measurements and committed before production.

### Wave 5 — Final public cutover and retirement

#### WEB-07 — Migrate homepage last

- **Owner:** Frontend implementation worker
- **Depends on:** WEB-05, WEB-06
- **Actions:** Decompose homepage into focused sections, preserve all CTA/analytics behavior, and run complete legacy-versus-Next parity.
- **Evidence:** Route, canonical, metadata, schema, visual, accessibility, analytics, Stripe-link, console, and network tests.
- **Exit gate:** Homepage canary passes before hostname default changes to Next.

#### OPS-06 — Exercise staging rollback

- **Owner:** Operations implementation worker
- **Depends on:** All release candidates
- **Actions:** Activate and roll back every page family, dashboard flag, managed hostname, custom hostname, and Stripe route boundary while preserving active sessions and event processing.
- **Evidence:** Timestamped rollback evidence bundle with artifact digests and database revisions.
- **Exit gate:** No production activation without successful staging rollback of the same boundary.

#### OPS-07 — Execute production cutover

- **Owner:** Hermes/CEO agent; Mike approves irreversible final cutover
- **Depends on:** WEB-07, OPS-04, OPS-05, OPS-06
- **Actions:** Activate case studies → learning centre → repeatable content → static marketing → interactive marketing → homepage. Enable dashboard internal tenant → test customer → entitled customers. Enable managed subdomains before custom domains.
- **Evidence:** Post-activation smoke for status, canonical, CTA, analytics, Stripe, accessibility, console/network, health, readiness, and freshness after every boundary.
- **Exit gate:** Any stop-the-line condition triggers immediate route rollback.

#### RETIRE-01 — Close rollback window and retire legacy paths

- **Owner:** Implementation and operations workers
- **Depends on:** Stable production evidence and Mike approval
- **Actions:** Archive legacy HTML with manifest/checksums, stop full-document generators, remove old static branches and email-token client auth, retain evidence ledgers, and verify archive restoration.
- **Evidence:** Full test suite, route manifest, archive restore, database backup restore, and zero legacy HTML generation.
- **Exit gate:** No legacy code is deleted until the rollback window closes.

## 6. Package execution protocol

For every work package:

1. Create or reuse the dedicated transformation worktree.
2. Read the package and linked implementation-plan task.
3. Record prerequisite state and affected production boundaries.
4. Write the failing test.
5. Run it and capture the expected failure.
6. Implement the smallest complete change.
7. Run focused tests.
8. Run adjacent regression tests.
9. Run specification review.
10. Fix specification gaps.
11. Run code-quality/security review.
12. Fix review findings.
13. Run final focused and global applicable gates.
14. Commit only package files.
15. Push and verify remote revision.
16. Activate only the approved canary or feature flag.
17. Capture production evidence or roll back.
18. Mark the work package complete in the execution ledger.

## 7. Required evidence record

Each package appends a record containing:

```json
{
  "package_id": "SEC-02",
  "revision": "git revision",
  "files_changed": [],
  "tests": [{"command": "exact command", "exit_code": 0, "result": "summary"}],
  "security_invariants": [],
  "routes_activated": [],
  "database_revision": "revision or none",
  "artifact_sha256": "digest or none",
  "rollback_exercised": true,
  "review_findings_closed": [],
  "approved_by": "role",
  "completed_at": "UTC timestamp"
}
```

Secrets, tokens, customer emails, raw webhook payloads, and lead data are excluded.

## 8. Daily operating cadence during implementation

- **Start of day:** Review security blockers, active package, failing gates, production health, and stale data sources.
- **During execution:** Only one package may own a production route boundary at a time.
- **After each package:** Update execution ledger, architecture decisions, test evidence, and rollback status.
- **End of day:** Publish concise memo: completed evidence, current blocker, next package, unresolved risk, and whether revenue/customer systems changed.
- **Weekly:** Re-estimate the critical path from completed throughput and discovered scope; do not preserve obsolete estimates.

## 9. First seven actions

1. **SEC-01:** Freeze current unsigned/idempotency defects in isolated tests.
2. **BASE-01:** Pause generators and obtain stable content counts.
3. **OPS-01:** Capture Caddy/Cloudflare/systemd/port topology.
4. **DATA-01:** Run identity-provider spike and cost gate.
5. **WEB-01:** Scaffold Next.js after the public baseline exists.
6. **DATA-02:** Scaffold the bounded platform API.
7. **DATA-03 + SEC-02/03:** Establish PostgreSQL and complete verified/idempotent Stripe processing before customer provisioning.

These actions may run in parallel only where their dependencies allow. The first production-impacting change is SEC-04, and it occurs only after staging verification and rollback evidence.

## 10. Definition of complete

The transformation is complete only when:

- Every frozen public route has approved status, canonical, metadata, schema, link, analytics, accessibility, and conversion behavior.
- Existing Python audit, CRM, lead, delivery, discovery, and SSRF contracts pass.
- Stripe events are signature verified, idempotent, ordered safely, and fulfilled once.
- All customer and agency data is PostgreSQL-backed, tenant-scoped, and protected by application authorization plus RLS.
- Legacy email-plus-token customer authentication is retired.
- Customer billing uses payer authorization and Stripe Customer Portal.
- Managed and custom hostnames cannot cross tenant, brand, data, asset, or cache boundaries.
- Health, readiness, and data freshness are separate and monitored.
- Backups restore successfully.
- Every production route boundary has an exercised rollback.
- Legacy HTML generation is archived and retired only after the rollback window closes.
