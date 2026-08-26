# Workspace Overhaul Plan (app.nebulacomponents.com)

Status: PROPOSAL, awaiting Mike sign-off. Nothing here has been built.
Source requirements: `docs/workspace/REQUIREMENTS-v1.md` (128 sections, saved verbatim 2026-08-22).
Grounding: schema verified live against `nebula_platform` + `nebula_audit` on 2026-08-23.

---

## What exists today (verified in the databases)

| Spec concept | Current state |
|---|---|
| User / Organization | `users`, `organizations`, `memberships` (role: enum on membership), `subscriptions` (org-linked) |
| Workspace members | `workspace_members` keyed by **workspace_email** strings, not FKs. Legacy shape. |
| Findings | JSONB snapshot columns on `audits`. No durable finding identity, no lifecycle states, no history. |
| Monitoring | `monitored_pages` (email-keyed, has baseline_score/alert_threshold) + `monitor_events` |
| API keys | `api_keys`, `api_key_usage` exist |
| Audit log / activity feed | None anywhere |
| Sessions / MFA / invitations lifecycle | `workspace_members.invitation_status` only; no session table, no MFA |
| Entitlements | Plan gates hardcoded (`canAccess(planLevel, 'pro')` patterns in components) |

Honest label for today's workspace per the spec's own acceptance gate (#128): **professional and production-grade is reachable; "enterprise-grade" is premature** and we should not claim it.

---

## Product thesis this plan implements

The workspace is a longitudinal system of record:

```
Property -> Audit -> Finding -> Action -> Verification -> Baseline -> Monitoring -> Regression
```

Not a repository of audit PDFs. Every phase below serves that spine.

---

## Phasing (each phase ships production-ready or it does not ship)

### Phase 0 - Foundations (no user-visible change)
1. Split app surface to `app.nebulacomponents.com`
   - Cloudflare DNS + proxy route to same origin initially; marketing stays on apex.
   - Host-only auth cookies scoped to `app.` host (spec #1). Audit every cookie set site-wide first.
   - `/workspace` on apex becomes a 301 to `app.nebulacomponents.com/workspace`.
   - CSP, security headers, noindex, cache rules applied at the app host (spec #57, #106, #107).
   - Zero-downtime cutover: deploy dual-host support BEFORE flipping DNS.
2. Correlation IDs end to end (spec #43): request ID middleware in FastAPI, client header capture, error pages show `req_...`. Cheap, unblocks all future support/debug work.
3. Release identification: `X-App-Revision` header + visible build SHA in workspace footer (spec #71).
4. Structured audit-log table + write paths for security-relevant actions (spec #27): login, role change, key create/revoke, billing events, exports. Append-only.

### Phase 1 - Tenancy made real
1. Reconcile the two member models into org-FK memberships with roles (spec #2, #12):
   Owner / Admin / Billing Admin / Member / Viewer baseline. Server-side authorization middleware on EVERY platform route (actor x tenant x resource x action). No route trusts client-supplied org ids.
2. Workspace selector in shell (spec #3): switching updates scope server-side, deep links carry context.
3. Invitation lifecycle done properly: token, expiry, single-use, tenant binding, audit trail (spec #14).
4. Ownership rules incl. last-owner protection (spec #13).
5. Negative tests as first-class deliverables: tenant isolation suite (A cannot read/mutate/enumerate B) (spec #114, #115).

### Phase 2 - The findings spine (the product decision)
1. Durable finding identity: `findings` table with stable public IDs (NBL-xxxx), severity, category, resource, evidence provenance, lifecycle states New/Acknowledged/In Progress/Resolved/Accepted Risk/Ignored/Regressed (spec #18).
2. Finding history events (spec #19). Regressions re-open, never delete.
3. Evidence taxonomy surfaced in UI: Observed / Calculated / Inferred / Recommended (spec #80, #81). No fake precision percentages.
4. Audits gain job-state UX: explicit status/started/duration/failure reason, idempotent creation (spec #15, #16, #17).
5. URL-driven filters on findings tables (spec #55, #100). This is where tonight's tab/project fix generalizes.

### Phase 3 - Monitoring & baselines
1. Baselines become first-class: created/source/set-by, audited changes (spec #23).
2. Regression detection feeds finding lifecycle automatically.
3. Notification center: persistent history, four notification classes, deep links, email/in-app config (spec #24, #25).

### Phase 4 - Account operations
1. Sessions UI + real server-side revocation (spec #11). TOTP MFA (spec #10).
2. Usage surfaces (spec #32) and entitlement layer replacing `plan === 'pro'` checks (spec #33).
3. Billing state machine reconciled from Stripe webhooks with event-id dedupe (spec #34, #78). Explicit cancellation UX (spec #36).
4. API key management hardening: scopes, prefix display, last-used, rotation (spec #28, #29). Webhooks if customers ask (spec #30).

### Phase 5 - Enterprise readiness (only when revenue justifies)
SAML/OIDC/SCIM, domain verification, audit export/SIEM, data residency modeling, org suspension semantics, security posture page (specs #88, #87, #92, #90, #123, #91).

Deliberately NOT scheduled until a paying customer needs them: SSO federation, SCIM, SIEM export, residency claims. The acceptance gate says calling this enterprise-grade before those exist would be false advertising.

---

## Cross-cutting standards adopted from day one of Phase 0

- Empty states with explanation + CTA (spec #7); loading/stale/error as distinct states (spec #47, #48)
- Error taxonomy with customer-visible classes, never raw stack traces, never just "Something went wrong" (spec #45)
- WCAG 2.2 AA target (spec #50); keyboard nav; tables with sort/filter/paginate (spec #54)
- UTC storage, timezone-aware rendering (spec #56)
- Idempotency on anything that costs money or duplicates work (spec #17)
- Optimistic UI forbidden for billing/security/destructive ops (spec #46)
- Confirmation proportional to consequence (spec #98)
- Design system primitives before screen proliferation (spec #95), keeping the existing Nebula design language per Mike's direction
- Performance budgets instrumented from Phase 0 (spec #93)
- Tenant-isolation negative tests in CI from Phase 1 onward (spec #114)

## IA target (Nebula-specific, from spec's own proposal)

OVERVIEW / AUDITS (New, History, Findings, Reports) / MONITORING (Overview, Pages, Regressions, Baselines, Alerts) / WORKSPACE (Projects, Team) / DEVELOPER (API Keys, Webhooks, Docs) / ACTIVITY (Feed, Audit Log) / ACCOUNT (Plan & Usage, Billing, Security, Notifications, Data & Privacy) / SUPPORT (Docs, Contact, Status)

Current tabs map onto this with ~60% reuse of view code; the rebuild is navigation, tenancy, and the findings model, not a rewrite of every screen.

## Sequencing rationale

Phase 0 items are chosen because they are cheap, invisible if done right, catastrophic to retrofit later (cookie domain, correlation IDs, audit log), and required before any subdomain cutover can be called safe. Phase 1 next because everything else depends on tenancy being true. Phase 2 is the product differentiator and the thing worth building carefully. 3-5 follow value.

## Open decisions for Mike

1. Confirm `app.` subdomain now vs after Phase 2 content work. (Recommendation: do it in Phase 0 while surface area is small; retrofitting cookie/CSP boundaries later touches everything.)
2. Single-tenant-first simplification: keep current email-keyed workspace_members running during Phase 1 migration window, or freeze new workspace shares until cutover?
3. Findings backfill: generate NBL ids retroactively for existing audits' JSONB signals, or start clean going forward?

## Verification contract for this whole effort

Every phase ends with: live HTTP receipts on both hosts, journalctl clean, regression set green, tenant-isolation tests passing, and a demo path Mike can click himself. Same doctrine as always: not 100% ready = not shipped.
