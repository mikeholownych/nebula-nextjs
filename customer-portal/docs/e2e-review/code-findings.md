# Code Findings (application correctness & maintainability)

## CODE-1 · Falsy-zero amount fallbacks (P2)
- `app/api/webhooks/stripe/route.ts:307,335,340,391`: `session.amount_total || 9700` — a legitimate $0.00 total (or null) is reported as $97 in ledger/GA4/HeyCatch. Same pattern for currency `|| 'usd'`.
- **Remediation:** REFACTOR to explicit nullish checks.

## CODE-2 · Subscription events silently dropped when email unresolvable (P2)
- `webhooks/stripe/route.ts:441-447`: no email ⇒ ack `{unbound:true}` and record nothing — subscription state exists only in Stripe; workspace billing view (`/api/billing/summary`) will not reflect it.
- **Remediation:** HARDEN (persist by customer id, reconcile later).

## CODE-3 · CRM status downgrade contradicts documented invariant (P2)
- `platform_api/services/crm_hooks.py:163-167` sets interested→cold on negative reply classification while the same file documents upgrade-only transitions (:88). Silent lifecycle regression of pipeline state.
- **Remediation:** decide + enforce one semantics.

## CODE-4 · Session hash re-EXPIRE extends all sessions (P2)
- `auth/jwt.py:158-162`: each login re-TTLs the whole `user:{id}:sessions` hash — old devices' windows extended indefinitely by new logins; combined with SEC-P1-2 logout guarantees weaken.
- **Remediation:** per-field TTL or session-index structure.

## CODE-5 · Newsletter resubscribe resets suppression (P3)
- `services/crm.py:66-76`: resubscribe clears `unsubscribed_at` and forces re-confirm — compliant (double opt-in) but silently revives hard-bounce-suppressed records unless provider-events suppression re-applies; verify ordering.

## CODE-6 · Follow-up selector targets aging sends indefinitely (P3)
- `followup_emails.py:45-60`: selects audits with `email_sent_at < threshold AND <3 followups` — as the population ages, every old audit accrues 3 followups regardless of engagement recency; naive utcnow (:41).
- **Remediation:** cap by audit age.

## CODE-7 · Dead/duplicated code paths (P3)
- `check_admission` unwired (DATA-6); legacy `infra/rate_limiter.py` unused; `/api/checkout` FastAPI stub returns 410 while Next owns checkout; duplicate pages checkout-v2/checkout-impulse/create-97-checkout/launch-page-97; `app/page.tsx.bak`, `sitemap.ts.bak`, `faq-schemas.ts.bak`, `.bak` files in tree; `.legacy/app` full copy in repo.
- **Remediation:** REMOVE after verification.

## CODE-8 · Offer-copy drift risk in code (P2)
- `$97` / "48 hours" strings hardcoded in `email_service.py:267,334` and `followup_emails.py:133`; canonical price locked through 2026-12-31 then rises to $147 on 2027-01-01 (CLAUDE.md) — hardcoded copies will silently contradict pricing pages at rollover. CI has a claims allowlist gate but these live in Python outside its scope.
- **Remediation:** centralize offer constants; add to drift checks.

## CODE-9 · Proxy/UI-only guards are correctly layered but coarse (P3)
- `proxy.ts:60-82` redirects/gates on cookie *presence* only (documented as non-boundary); actual routes verify via `requireWorkspaceUser` → upstream `/api/auth/me` with 5 s timeout — verified consistent across workspace routes sampled. Defense-in-depth acceptable; keep as-is.

## CODE-10 · Unlock-token design is sound (positive finding)
- HMAC-SHA256 over `${auditId}:${email}` with timing-safe compare, httpOnly+secure+lax cookie, 30-day maxAge, pruning to ≤5 cookies (`app/lib/audit-unlock-token.ts`, `audit-access.ts`). The D13 header-size incident was pre-pruning legacy bloat; current design bounds it.

## CODE-11 · Error handling hygiene (P3)
- 138 `except Exception` occurrences in platform_api; most are bounded best-effort analytics/side-effect guards (acceptable), several swallow without logging (spot: badge/cohort writes in `audit_db.py:575-615`). Standardize on logged-and-tagged swallow list.
