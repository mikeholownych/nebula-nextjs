# INC-0002: Audit Unlock Cookie Gated Access By Presence, Not Validity

**Status:** Resolved
**Date Detected:** 2026-07-23
**Date Resolved:** 2026-07-23
**Author:** Claude (repo review)
**Severity:** Medium

---

## Situation

Found during a full repo security review. `POST /api/audit/unlock` set an `audit_unlock_{id}` cookie after a visitor submitted their email, intended to gate access to the full (paid-tier) audit results. The cookie value was `base64url(audit_id:email)` - described in a code comment as "anti-forgery." But `app/audit/[id]/results/page.tsx` only checked whether the cookie *existed* (`cookieStore.get(...) !== undefined`); it never decoded or validated the value.

## Impact

Any visitor could set `audit_unlock_{id}` to any value themselves (e.g. via browser devtools or a raw HTTP request with a hand-set `Cookie` header) and view another party's gated audit results without ever calling `/api/audit/unlock` or providing an email. Low-severity in practice - this gates a free audit's detailed results, not payment or account data - but the code's own claim of being "anti-forgery" was false, and the intended email-capture gate had no enforcement at all.

## Root Cause

Two independent mistakes compounding: (1) the "signing" was reversible base64, not an HMAC, so even a value-aware check would have been forgeable; (2) the verifying side never checked the value at all, just presence - so even proper signing on the write side would have been moot without a corresponding read-side check. The second mistake is the one that actually mattered here.

## Evidence

`app/api/audit/unlock/route.ts:91-95` (pre-fix):
```ts
// This is anti-forgery, not full auth - the user's email is the secret.
const token = Buffer.from(`${audit_id}:${email}`).toString('base64url')
```
`app/audit/[id]/results/page.tsx:34-35` (pre-fix):
```ts
const cookieUnlocked = cookieStore.get(`audit_unlock_${id}`) !== undefined
```

## Fix

Added `app/lib/audit-unlock-token.ts` with `signAuditUnlock`/`verifyAuditUnlock`, using HMAC-SHA256 over `${auditId}:${email}` with a secret from `AUDIT_UNLOCK_SECRET`, `timingSafeEqual` for comparison, and binding the token to the specific `audit_id` it was issued for. The unlock route now signs; the results page now verifies, not just checks presence.

## Verification

5 new tests in `__tests__/audit-unlock-token.test.ts`: valid token verifies, token rejected for a different audit_id, a hand-crafted unsigned (old-format) token is rejected, a token signed with a different secret is rejected, and a missing token is rejected. All pass, plus the existing `audit-unlock-route.test.ts` suite (updated to set `AUDIT_UNLOCK_SECRET` for the test environment). Full suite: 72/72 passing.

## Prevention

The new tests lock this in directly - a regression to presence-only checking would fail `audit-unlock-token.test.ts`'s "rejects a hand-crafted unsigned token" case.

## Rollback

Revert `app/api/audit/unlock/route.ts` and `app/audit/[id]/results/page.tsx` to the pre-fix versions (not recommended - this reopens the bypass and removes the containment tests).

## Audit Trail

- **Commit:** 7593dd8c
- **Files changed:** app/api/audit/unlock/route.ts, app/audit/[id]/results/page.tsx, app/lib/audit-unlock-token.ts (new), __tests__/audit-unlock-token.test.ts (new), __tests__/audit-unlock-route.test.ts, .env.example
- **Related:** RETRO-0001
