# Teardown Claims: Company Ownership and Tiered Management

Date: 2026-08-22
Status: Approved design, pending implementation plan
Phase: 1 of 5 (Claim bridge + claimed/free tier)

## Problem and motivation

Public teardowns at `/teardowns/[slug]` are static TypeScript objects with no database presence. A representative of the featured company has no way to claim the teardown of their own site or manage it in their account. This spec defines a claim system with tiered ownership verification so that:

1. Unclaimed teardowns remain fully valuable public content (findings, evidence, severity, conversion impact, screenshots, remediation guidance).
2. Claimed teardowns gain an owner who can manage remediation state, re-run audits, compare before/after, receive regression alerts, add company context, and keep a historical record, all free.
3. Paid tiers arrive in later phases behind server-side entitlement checks.

## Product tiers

| Tier | Capabilities |
| --- | --- |
| Unclaimed (public) | Findings, evidence, severity, likely conversion impact, screenshots, concrete remediation guidance. Standalone value independent of Nebula commercial goals. |
| Claimed / free | Ownership verification, saved remediation state, mark findings addressed, re-run audits, before/after comparison, regression alerts, public company response plus private context, historical record. |
| Paid | Continuous monitoring, deeper diagnostics, funnel-wide analysis, competitor/peer benchmarking, prioritized remediation programs, collaboration, integrations, API access, exports, higher-frequency and higher-depth audits. |

Phase 1 builds no paid gating whatsoever: no entitlement fields, no dead schema. Entitlement columns and checks arrive with phase 2 when something enforces them.

## Phase decomposition (dependency order)

1. **Phase 1 (this spec)**: claim bridge + claimed/free tier.
2. **Phase 2**: billing + entitlements spine (Stripe subscription, server-side gating at every API boundary).
3. **Phase 3**: paid analytics surfaces (deeper diagnostics, funnel-wide analysis, benchmarking, prioritized programs).
4. **Phase 4**: collaboration + integrations (team seats, additional data sources).
5. **Phase 5**: developer surface (productized API keys, exports, higher audit quotas).

Each phase ships only when 100% complete and verified against production.

## Chosen architecture

DB-backed teardowns. Teardown content migrates from `customer-portal/app/teardowns/[slug]/data.ts` into Postgres, claims live alongside as structured state, pages render from the database through the existing BFF pattern (portal never touches Postgres directly).

Rejected alternatives:

- Minimal bridge (static content + claims table): cheaper now but rebuilds again in phase 3 when teardowns must become dynamic.
- Org-model claims in `nebula_platform`: forces an organization migration ahead of its phase 4 need; the entire live surface is email-keyed today.

## Data model

Two new tables in `nebula_audit`.

### `teardowns`

One row per teardown, seeded idempotently from `data.ts` (upsert by slug):

| Column | Type | Notes |
| --- | --- | --- |
| slug | text PK | unchanged URL slug |
| name | text | company name |
| url | text | audited site URL |
| domain | text | normalized registered domain (public-suffix aware) |
| score | numeric | |
| grade | text | |
| audited_at | timestamptz | |
| summary | text | |
| context | text | |
| findings | jsonb | Finding objects verbatim; no relational decomposition |
| screenshot_path | text | existing `/teardown-screenshots/*.webp` assets stay put |
| created_at / updated_at | timestamptz | |

### `teardown_claims`

Zero or one active claim per slug, enforced by a unique partial index on `slug WHERE status = 'active'`:

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK | |
| slug | text FK -> teardowns.slug | |
| claimed_by_email | text | workspace email of verified owner |
| verification_method | text | `email_domain`, `dns_txt`, or `gsc` |
| verified_at | timestamptz | |
| status | text | `active`, `revoked`, or `superseded` |
| response_text | text nullable | public company response |
| response_status | text nullable | `visible`, `auto_hidden`, `removed`; null until first response |
| response_updated_at | timestamptz nullable | |
| private_context | text nullable | workspace-only notes |
| created_at / updated_at | timestamptz | |

The 9 index-only slugs that currently 404 (`loom`, `linear`, `miro`, `clickup`, `airtable`, `pipedrive`, `mixpanel`, `amplitude`, `drift`) are dropped from the index rather than migrated; removal fixes broken links. `data.ts` and `.bak` copies archive to `.legacy/` with an `ARCHIVE_INVENTORY.md` entry.

## Rendering and API surface

- URLs unchanged: `/teardowns` and `/teardowns/[slug]`.
- Pages switch from SSG to ISR with `revalidate = 300`. If Postgres or the platform API is down, Next serves last-good cached renders instead of erroring.
- `generateMetadata` reads from the DB row via the API.
- FastAPI endpoints (internal-service guarded, proxied by portal routes under `app/api/teardowns/*`):
  - `GET /teardowns/` index rows
  - `GET /teardowns/{slug}` full record plus visible claim badge/response if present
- The teardown index generates entries from canonical DB rows, eliminating the hand-maintained duplicate list that caused the desync.

## Claim and verification flows

Entry point: "Own this site? Claim this teardown" CTA on every teardown page, leading to `/teardowns/[slug]/claim`. Any single passing path activates the claim:

1. **Email at domain** (default). Rep enters an email; backend normalizes both sides to registered domains using public-suffix logic, rejects free-mail providers (gmail, outlook, yahoo, icloud, proton and peers), then sends a 15-minute HMAC-signed token link via AgentMail `send_transactional` with `client_id` dedupe, mirroring the existing magic-link flow. Clicking verifies domain control and activates the claim.
2. **DNS TXT**. UI shows `_nebula-verify.<domain> TXT nebula=<hex token>`. Pending token lives in Redis with a 48 hour TTL. Backend resolves TXT via dnspython behind a "check now" poll button with bounded timeout.
3. **GSC match**. If the signed-in user's `gsc_connections.gsc_site_url` (`sc-domain:<domain>`) matches the teardown domain, instant verify. Otherwise route through the existing GSC connect flow and re-check on return.

Constraints:

- One active claim per slug, enforced at the database level so races resolve cleanly.
- A second rep from the same company receives an explicit rejection (team seats are phase 4).
- Revoked claims block silent re-claim by the same email; legitimate recovery goes through a support path.
- All verification endpoints rate-limited per IP and per domain.

## Workspace linkage, remediation state, alerts

Claim activation adds read paths only; nothing destructive happens to existing rows:

- New endpoint `GET /audit/by-domain?domain=` returns audits whose URL host resolves to the registered domain. Whole-domain attach: the claiming email sees every existing and future audit of their domain across workspace tabs, plus a claimed-teardown card at the top of Site Health.
- Mark-findings-addressed becomes the first write path into `fix_implementations`: the claiming email marks a recommendation implemented capturing `score_before`; the next re-audit fills `score_after`. Existing fix-library and fix-effectiveness surfaces begin receiving real writes.
- Before/after comparison and activity timeline already exist in workspace and become populated via whole-domain attach.
- Regression alerts: monitors remain free in phase 1. Claimed owners create a monitor from workspace; alerts land in the verified inbox via the existing monitor alert email path.

## Public responses and moderation

- Public responses render on the teardown page as an attributed block ("Response from the `<name>` team") with a verified-owner badge, visually distinct from Nebula findings. Accent `#c7ff2f` only; no em-dashes anywhere in shipped copy.
- Deterministic auto-filter runs on save: hard length cap around 1000 characters, more than 3 links auto-hides, denylisted patterns (legal threats, contact-farming and spam phrasing) auto-hide. Flagged responses set `response_status = auto_hidden` and never render publicly.
- Auto-hides trigger an AgentMail internal notification with a review link.
- Takedown is founder-only (the founder account is already hard-flagged in code) and flips status to `removed` from the workspace view.
- Owners edit their response at any time; edits re-run the filter. Owners see their own hidden response marked "under review" with an edit path; the founder can restore it.

## Failure modes

| Failure | Behavior |
| --- | --- |
| Postgres or platform API outage | Public pages serve last-good ISR render; claim/workspace endpoints return explicit retry-later errors. No 500s on public surfaces. |
| Verification email send failure | Redis token deleted immediately (magic-link precedent). |
| DNS check timeout | Bounded timeout, pending token survives 48 hours, retry-safe. |
| GSC token expired | Reroute through reconnect automatically. |
| Simultaneous claim attempts | Unique partial index decides; loser gets a clean rejection message. |
| Filter false positive | Owner sees "under review" with edit path; founder can restore. |
| Rollback | Seed script is purely additive; portal deploy revert restores SSG build from git. No destructive migration. |

## Verification plan

1. **HTML parity diff**: curl all teardown URLs from live before cutover; after cutover diff each page. Allowed delta: claim CTA block only. Index delta: exactly the 9 dead links removed.
2. **Unit tests**: registered-domain normalization edge cases, free-mail rejection, HMAC tokens, every auto-filter rule.
3. **Integration tests**: teardown endpoints plus all three verification paths against a test DB (mocked mailer and resolver, GSC fixture), including race behavior on double claim.
4. **Production DoD artifacts**: HTTP 200 for `/`, `/audit`, `/workspace`, and all teardown URLs; zero new journalctl errors on `nebula-platform-api.service` and `nebula-nextjs.service`; live end-to-end claim executed on `gofaultline.dev` proving email-path activation, workspace attach, monitor alert delivery, and a filtered-response case.

Ship order within phase 1: tables + seed script, API endpoints, portal read switch (parity-gated), claim flows, workspace linkage, moderation controls.

## Out of scope (later phases)

Stripe billing and entitlement enforcement, paywalled monitors, deeper diagnostics, funnel-wide analysis, competitor/peer benchmarking, prioritized remediation programs, team seats and roles, additional integrations, productized API keys, exports, higher-frequency/deeper audit quotas.
