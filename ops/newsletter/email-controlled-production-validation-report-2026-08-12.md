# Nebula Newsletter Controlled Production Validation Report

Date: 2026-08-12
Scope: final controlled production validation. No real production subscriber was used. Test mailboxes were synthetic, explicitly authorized, and owned by the operator.

## 1. Final Verdict

**NOT PRODUCTION READY**

The implementation now matches AgentMail's documented Svix webhook contract and the deployed API route is live. A one-recipient controlled message was accepted, raw provider message MIME was retrieved, Reply-To and multipart structure were verified, unsubscribe suppression was proven, and signed bounce and complaint suppression paths were exercised. The P0 gate remains failed because the AgentMail raw-message endpoint returns the outbound `.eml`, not a recipient-side received copy. It therefore contains no Authentication-Results, DKIM-Signature, or Return-Path. Provider-generated bounce and complaint delivery were not triggered, only the verified signed endpoint paths were exercised.

The newsletter schedule remains disabled.

## 2. Deployment Evidence

- Repository: `/home/mike/nebula`
- Branch: `main`
- Remediation revisions:
  - `775de2f2` lock webhook verification dependency
  - `2e9d9c18` use valid AgentMail campaign client IDs
  - `dd4e8180` route newsletter sends through newsletter delivery scope
- Local production service: `nebula-platform-api.service`, active after restart.
- Public API evidence: `GET https://api.nebulacomponents.shop/openapi.json` returned HTTP 200 and exposed `/api/newsletter/provider-events`.
- Public event endpoint evidence: missing and invalid signatures returned HTTP 401.
- Public revision header: not exposed, so an independently verifiable platform revision identifier is unavailable.
- Public build endpoint: `GET https://api.nebulacomponents.shop/build-info` returned revision `c8b24c569ff1af42c70be6141da42551ea4c0dfd`.
- DB: `nebula_audit` on PostgreSQL port 5433 contains the release authority tables and transition guard. This proves the active host schema, not a separately managed remote database.
- Scheduler: `nebula-newsletter-autopilot` paused during validation. `weekly-roundup-email` was already paused.

## 3. AgentMail Event Contract

Authoritative AgentMail documentation confirms:

- Events: `message.sent`, `message.delivered`, `message.bounced`, `message.complained`, `message.rejected`, plus received and domain events.
- Payload identity: `event_type`, `event_id`, and event-specific `send`, `delivery`, `bounce`, `complaint`, or `reject` object.
- Stable message identity: nested event object `message_id`.
- Event recipient identity: nested `recipients`.
- Authentication: Svix signing headers `svix-id`, `svix-timestamp`, and `svix-signature`.
- Signature scheme: Svix `v1,<base64>` signatures over the raw request body.
- Replay behavior: the same `svix-id` is used for retries. The application deduplicates by provider event ID.
- Retry behavior: provider retries webhook delivery when acknowledgement is not received.
- Webhook configured: enabled, scoped to `hello@nebulacomponents.com`, subscribed to `message.sent`, `message.delivered`, `message.bounced`, `message.complained`, and `message.rejected`.
- Webhook ID: `[REDACTED]`.

The endpoint now uses the official Svix verifier and raw request body. A valid signed linked delivery event returned HTTP 204. Replaying the same signed event also returned HTTP 204 and created no duplicate event row. A valid signed event with an unknown provider message returned HTTP 409 without mutating state. Missing and invalid signatures returned HTTP 401.

## 4. Controlled Release

The final controlled run used exactly one eligible synthetic recipient. Other synthetic rows were administratively suppressed for test isolation. No real production subscriber was used.

- Release ID: `367feff6-e276-450c-8095-c8f8e1fdb4d4`
- Campaign ID: `controlled-validation-20260812-05`
- Recipient: one explicitly authorized synthetic Gmail alias, redacted
- Approved hash: `74f02c7e3401ba76ade9d93bed6ab06cb50f96ab140fecc3c5399a320c4137f3`
- Submitted hash: identical
- Provider message ID: `<0100019ff494a8ed-37c95fd2-aeb2-4282-8cde-48748ec494b0-000000@email.amazonses.com>`
- Provider state: `ACCEPTED`, then raw provider event reconciliation and suppression tests completed.
- Exactly one submission: **PASS**.
- No real production subscriber was used.

The AgentMail raw `.eml` contained plaintext, HTML, the visible unsubscribe URL, `List-Unsubscribe`, `List-Unsubscribe-Post`, and `Reply-To: hello@nebulacomponents.com`.

## 5. Raw Authentication Evidence

| Control | Result | Evidence |
|---|---|---|
| SPF | NOT VERIFIED | AgentMail `/raw` returned outbound `.eml`, not recipient-side headers. |
| DKIM | NOT VERIFIED | No recipient-side DKIM-Signature was available. |
| DKIM d= | NOT VERIFIED | No recipient-side DKIM-Signature was available. |
| DMARC | NOT VERIFIED | No recipient-side Authentication-Results was available. |
| Alignment | NOT VERIFIED | No recipient-side authentication result was available. |
| Return-Path | NOT VERIFIED | Outbound `.eml` omitted recipient-side Return-Path. |
| From | PASS | Raw outbound `.eml`: `Nebula Components <hello@nebulacomponents.com>`. |
| Reply-To | PASS | Raw outbound `.eml`: `hello@nebulacomponents.com`. |
| List-Unsubscribe | PASS | Raw outbound `.eml` contained the HTTPS one-click URL. |
| List-Unsubscribe-Post | PASS | Raw outbound `.eml` contained `List-Unsubscribe=One-Click`. |
| MIME | PASS | Raw outbound `.eml` was `multipart/alternative` with `text/plain` and `text/html`. |

The AgentMail raw endpoint was authenticated and used. It returned a signed download URL for the outbound `.eml`; this is not a recipient-side received copy. The Gmail browser session was not authenticated. No authentication result is inferred from DNS, provider acceptance, or outbound MIME.

## 6. Unsubscribe Test

- Visible link: PASS. The visible HTTPS endpoint returned `{"status":"unsubscribed","success":true}`.
- RFC 8058 one-click: PASS. The exact endpoint returned `{"status":"unsubscribed"}` without login.
- State mutation: PASS. Synthetic subscriber received `unsubscribed_at` and remained confirmed but suppressed.
- Repeat request: PASS. Repeated one-click request returned success and remained idempotent.
- Subsequent send: PASS. A later release produced `eligible=false`, reason `unsubscribed`, no submission row, and no provider message ID.

## 7. Bounce Test

**PARTIAL, signed-path verified.** A valid Svix-signed `message.bounced` payload with `type=hard` was accepted with HTTP 204, persisted, and set `hard_bounced_at`. A later release produced zero submissions for that subscriber. AgentMail-generated delivery of a real bounce event was not triggered.

The implemented endpoint maps a signed `message.bounced` event with bounce type `hard` or `permanent` to `hard_bounced_at` and stores the event. This remains unproven against a real provider-generated bounce event.

## 8. Complaint Test

**PARTIAL, signed-path verified.** A valid Svix-signed `message.complained` payload was accepted with HTTP 204, persisted, and set `complained_at`. A later release produced zero submissions for that subscriber. AgentMail-generated delivery of a real complaint event was not triggered.

The implemented endpoint maps a signed `message.complained` event to `complained_at` and stores the event. This remains unproven against a real provider-generated complaint event.

## 9. Event Reconciliation

Observed valid signed event:

`svix-id msg_validation_linked_01`
→ `newsletter_event.provider_event_id = msg_validation_linked_01`
→ `provider_message_id = <0100019ff4694c6e-78d23bd7-c727-4832-9fd7-4c1285d9e649-000000@email.amazonses.com>`
→ `newsletter_submission` for the controlled release
→ `newsletter_recipient_decision` with `eligible=true`
→ `newsletter_release` `07a49dcb-da2c-4e7a-8bb6-17251f63ad9a`

The replay created no duplicate event. Unknown message identity returned HTTP 409 and did not create an orphan event.

## 10. Consent Governance

The existing legacy subscriber was not modified or used. The controlled rows used `consent_state=VERIFIED`, `consent_source=synthetic_validation`, and confirmed state.

The service evaluates unknown or non-verified consent as ineligible. No unknown-consent rows were present in the active local authority database at validation time. Legacy subscriber retention requires explicit reconfirmation or defensible provenance evidence. Consent must not be backfilled from assumption.

## 11. Scheduler State

- Enabled: **NO**
- `weekly-roundup-email`: paused
- `nebula-newsletter-autopilot`: paused during validation
- Authoritative path: wrappers invoke `scripts/send_weekly_roundup.py` or `newsletter_autopilot.py`, which delegate to `newsletter_release_service.py`.
- Provider bypass scan: active historical sender entrypoints are wrappers or authority code. The shared AgentMail client still contains the generic provider transport, but newsletter calls use the dedicated `send_newsletter` scope and `campaign:` IDs.
- Scheduler safety: schedule is not enabled until the P0 gate passes.

## 12. Test Results

Focused validation suite:

```text
PYTHONPATH=/home/mike/nebula .venv/bin/pytest -q \
  tests/test_agentmail_release_gate.py \
  tests/test_newsletter_release_service.py \
  tests/test_newsletter_event_security.py \
  tests/test_newsletter_autopilot.py \
  tests/test_newsletter_authority_static.py
```

Result: **46 passed in 0.69s**.

Compilation of the changed Python modules passed. `git diff --check` passed before commits. Live event security tests passed for missing signature, invalid signature, valid signed event, unknown message rejection, and replay idempotency.

## 13. Remaining Gaps

### P0

- Recipient-side raw message source proving SPF, DKIM, DMARC, alignment, and Return-Path.
- Provider-generated, as opposed to manually signed, bounce and complaint delivery remains unobserved.

### P1

- Obtain an authenticated recipient mailbox export or provider-supported received-message trace.
- Observe AgentMail-generated bounce and complaint webhooks if AgentMail provides a safe test mechanism.

### P2

- Production reputation and inbox placement telemetry.
- Complaint-rate and hard-bounce operational monitoring.

### P3

- None identified for this controlled gate.

## 14. Production Readiness Gate

- remediation committed: **PASS**
- remediation deployed: **PASS**
- production revision verified: **PASS, `/build-info` returned `c8b24c569ff1af42c70be6141da42551ea4c0dfd`**
- API event route live: **PASS**
- AgentMail event contract verified: **PASS**
- webhook signature contract verified: **PASS**
- authorized synthetic subscriber created: **PASS**
- controlled message sent: **PASS, one synthetic recipient**
- exactly one provider submission: **PASS**
- approved hash equals submitted hash: **PASS**
- SPF from raw message: **FAIL**
- DKIM from raw message: **FAIL**
- DMARC from raw message: **FAIL**
- DMARC alignment: **FAIL**
- Return-Path: **FAIL**
- Reply-To: **PASS, raw outbound `.eml`**
- RFC 8058 headers: **PASS, raw outbound `.eml`**
- multipart HTML/plaintext: **PASS, raw outbound `.eml`**
- visible unsubscribe works: **PASS**
- RFC 8058 unsubscribe works: **PASS**
- unsubscribe blocks subsequent send: **PASS**
- hard-bounce suppression: **PASS, signed endpoint path; provider-generated event not observed**
- complaint suppression: **PASS, signed endpoint path; provider-generated event not observed**
- provider event IDs reconcile: **PASS for signed delivery test**
- unknown consent blocks sending: **PASS in implementation and focused tests**
- legacy provider bypass absent: **PASS for active newsletter entrypoints**
- scheduler disabled until approval: **PASS**
- all relevant tests pass: **PASS, 46 passed**

## 15. Final Activation Decision

**Do not enable the weekly production newsletter scheduler.**

Remaining blockers are concrete:

1. obtain recipient-side raw source from the authorized mailbox and verify SPF, DKIM, DMARC, alignment, and Return-Path;
2. observe provider-generated bounce and complaint webhook deliveries, or obtain AgentMail's explicit test-event evidence.

Provider acceptance and a `DELIVERED` ledger state do not prove raw authentication or MIME compliance. Production activation is therefore not approved.
