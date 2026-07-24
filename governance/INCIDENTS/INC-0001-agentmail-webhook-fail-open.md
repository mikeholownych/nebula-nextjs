# INC-0001: AgentMail Webhook Accepted Unsigned Requests

**Status:** Resolved
**Date Detected:** 2026-07-23
**Date Resolved:** 2026-07-23
**Author:** Claude (repo review)
**Severity:** High

---

## Situation

Found during a full repo security review, not by a live exploit report. `webhook_server.py`'s `_handle_agentmail` verified the HMAC signature on inbound AgentMail webhook events *only if* a signature header was present (`if sig_header: ... verify ...`). If both `X-AgentMail-Signature` and `X-Webhook-Signature` were simply omitted from the request, the code fell straight through to processing the event with no rejection and no log of the anomaly.

## Impact

Any request reaching `POST /webhook/agentmail` (fronted by the Cloudflare tunnel) could forge events with no authentication at all:
- A forged `message.received` event with a "how do I pay" style body would make the business's real AgentMail inbox send the live $97 checkout link to an arbitrary attacker-chosen address — an open send relay from a trusted sending identity.
- A forged `message.complained` event would mark an arbitrary email address as bounced/blocklisted, letting an attacker poison the lead pipeline or permanently suppress a real prospect's address.

No evidence was found that this was actually exploited — found via code review, not incident report. Treated as High rather than Critical because exploitation requires knowing/guessing the webhook URL and there's no sign of scanning traffic in the logs reviewed.

## Root Cause

The signature check was written as "verify if present" instead of "require and verify." Contrast with `_handle_stripe` in the same file, which correctly rejects with 400 whenever the `Stripe-Signature` header is absent — the two handlers were inconsistent, and the AgentMail one was the outlier.

## Evidence

`webhook_server.py:586-598` (pre-fix):
```python
secret = load_key(WH_SECRET_FILE)
if secret:
    sig_header = self.headers.get("X-AgentMail-Signature", "") or \
                 self.headers.get("X-Webhook-Signature", "")
    if sig_header:
        expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        ...
```
`if sig_header:` guarding the entire verification block means an absent header skips verification entirely rather than failing it.

## Fix

Rejected with 401 whenever `sig_header` is empty, mirroring the Stripe handler's fail-closed pattern:
```python
if not sig_header:
    print("[agentmail] ⚠️  No signature header - rejecting")
    self._send_json(401, {"error": "missing signature"})
    return
```

## Verification

Manual code inspection confirms the new code path rejects before any event processing when the header is missing. No existing test covered this path; none of the 283 Python tests reference `_handle_agentmail` signature behavior directly.

## Prevention

No automated test currently locks this in — a genuine gap. A follow-up should add a unit test asserting `_handle_agentmail` returns 401 for a request with a valid body but no signature header, so this can't silently regress.

## Rollback

Revert `webhook_server.py` to restore the `if sig_header:` guard (not recommended — this reopens the vulnerability).

## Audit Trail

- **Commit:** 7593dd8c
- **Files changed:** webhook_server.py
- **Related:** RETRO-0001
