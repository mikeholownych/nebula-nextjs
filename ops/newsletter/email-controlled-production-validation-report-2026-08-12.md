# Nebula Newsletter Controlled Production Validation Report

Date: 2026-08-12
Scope: final controlled production validation. No real production subscriber was used. Test mailboxes were synthetic, explicitly authorized, and owned by the operator.

## 1. Final Verdict

**NOT PRODUCTION READY**

The implementation now matches AgentMail's documented Svix webhook contract and the deployed API route is live. A controlled message was accepted and delivery state was recorded, and unsubscribe suppression was proven. The P0 gate remains failed because raw received-message headers and MIME were not retrieved, the controlled run submitted two synthetic recipients rather than exactly one, and safe hard-bounce and complaint simulations were not available.

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

The first controlled attempt was blocked before provider submission because the shared outbound gate treated the new `campaign:` client ID as an unknown lead. That defect was corrected by adding a dedicated newsletter delivery scope. The second controlled release then submitted two synthetic recipients because two synthetic rows were eligible in the database. This is a validation defect against the requested exactly-one-recipient procedure, not a real-subscriber send.

- Release ID: `07a49dcb-da2c-4e7a-8bb6-17251f63ad9a`
- Campaign ID: `controlled-validation-20260812-04`
- Recipients: two explicitly authorized synthetic Gmail aliases, redacted
- Approved hash: `a192e46e2463d2cac1929311f91a61d7b367508265b613190248a9e3f261cc67`
- Submitted hash: same for both accepted submissions
- Provider message IDs:
  - `<0100019ff4694c6e-78d23bd7-c727-4832-9fd7-4c1285d9e649-000000@email.amazonses.com>`
  - `<0100019ff4694e87-c0eb2e09-c44b-4b1b-886c-e4059e58569f-000000@email.amazonses.com>`
- Provider state: both `DELIVERED` in the submission ledger after the signed event reconciliation test.
- Exactly one submission: **FAIL**. Two synthetic submissions occurred.
- No real production subscriber was used.

The AgentMail API copy showed both messages contained plaintext, HTML, the visible unsubscribe URL, `List-Unsubscribe`, and `List-Unsubscribe-Post`.

## 5. Raw Authentication Evidence

| Control | Result | Evidence |
|---|---|---|
| SPF | NOT VERIFIED | No raw received message was retrieved. DNS configuration alone is insufficient. |
| DKIM | NOT VERIFIED | No raw received message was retrieved. |
| DKIM d= | NOT VERIFIED | No raw DKIM-Signature header was retrieved. |
| DMARC | NOT VERIFIED | No raw Authentication-Results header was retrieved. |
| Alignment | NOT VERIFIED | No raw authentication result was retrieved. |
| Return-Path | NOT VERIFIED | No raw received headers were retrieved. |
| From | PASS at provider payload level | `Nebula Components <hello@nebulacomponents.com>` in AgentMail API message record. Raw received header not verified. |
| Reply-To | NOT VERIFIED | Provider API response did not expose a Reply-To header in the retrieved message representation. |
| List-Unsubscribe | PASS | AgentMail API message headers contained the HTTPS one-click URL. |
| List-Unsubscribe-Post | PASS | AgentMail API message headers contained `List-Unsubscribe=One-Click`. |
| MIME | PARTIAL | Provider API exposed both `text` and `html` fields. Raw `Content-Type` multipart structure was not retrieved. |

The Gmail browser session was not authenticated, so no raw message source was obtained. No authentication result is inferred from DNS or provider acceptance.

## 6. Unsubscribe Test

- Visible link: PASS. The visible HTTPS endpoint returned `{"status":"unsubscribed","success":true}`.
- RFC 8058 one-click: PASS. The exact endpoint returned `{"status":"unsubscribed"}` without login.
- State mutation: PASS. Synthetic subscriber received `unsubscribed_at` and remained confirmed but suppressed.
- Repeat request: PASS. Repeated one-click request returned success and remained idempotent.
- Subsequent send: PASS. A later release produced `eligible=false`, reason `unsubscribed`, no submission row, and no provider message ID.

## 7. Bounce Test

**EXTERNAL LIMITATION.** AgentMail documents `message.bounced` events and the production webhook subscribes to them. No safe provider-supported synthetic hard-bounce trigger was available during this validation. No hard-bounce success is claimed.

The implemented endpoint maps a signed `message.bounced` event with bounce type `hard` or `permanent` to `hard_bounced_at` and stores the event. This remains unproven against a real provider-generated bounce event.

## 8. Complaint Test

**EXTERNAL LIMITATION.** AgentMail documents `message.complained` events and the production webhook subscribes to them. No safe provider-supported synthetic complaint trigger was available during this validation. No complaint suppression success is claimed.

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

- Raw received-message source proving SPF, DKIM, DMARC, alignment, Return-Path, Reply-To, and MIME structure.
- Controlled validation must be repeated with exactly one eligible synthetic subscriber. The prior accepted run submitted two synthetic recipients.
- Safe provider-generated hard-bounce event validation.
- Safe provider-generated complaint event validation.
- Independently exposed production deployment revision evidence.

### P1

- Verify provider message `Reply-To` and actual received MIME headers from raw source.
- Verify provider event delivery for real `message.sent`, `message.bounced`, and `message.complained` events, not only a signed synthetic delivery payload.

### P2

- Production reputation and inbox placement telemetry.
- Complaint-rate and hard-bounce operational monitoring.

### P3

- None identified for this controlled gate.

## 14. Production Readiness Gate

- remediation committed: **PASS**
- remediation deployed: **PASS, route live; revision header unavailable**
- production revision verified: **FAIL**
- API event route live: **PASS**
- AgentMail event contract verified: **PASS**
- webhook signature contract verified: **PASS**
- authorized synthetic subscriber created: **PASS**
- controlled message sent: **PASS, but two synthetic recipients were submitted**
- exactly one provider submission: **FAIL**
- approved hash equals submitted hash: **PASS**
- SPF from raw message: **FAIL**
- DKIM from raw message: **FAIL**
- DMARC from raw message: **FAIL**
- DMARC alignment: **FAIL**
- Return-Path: **FAIL**
- Reply-To: **EXTERNAL LIMITATION**
- RFC 8058 headers: **PASS at provider API representation**
- multipart HTML/plaintext: **PARTIAL, raw MIME unavailable**
- visible unsubscribe works: **PASS**
- RFC 8058 unsubscribe works: **PASS**
- unsubscribe blocks subsequent send: **PASS**
- hard-bounce suppression: **EXTERNAL LIMITATION**
- complaint suppression: **EXTERNAL LIMITATION**
- provider event IDs reconcile: **PASS for signed delivery test**
- unknown consent blocks sending: **PASS in implementation and focused tests**
- legacy provider bypass absent: **PASS for active newsletter entrypoints**
- scheduler disabled until approval: **PASS**
- all relevant tests pass: **PASS, 46 passed**

## 15. Final Activation Decision

**Do not enable the weekly production newsletter scheduler.**

Remaining blockers are concrete:

1. obtain raw source from the authorized synthetic mailbox and verify authentication, alignment, Return-Path, Reply-To, and MIME;
2. rerun with one and only one eligible synthetic subscriber;
3. prove or formally close the hard-bounce and complaint event tests using provider-generated events;
4. expose or record independently verifiable production revision evidence.

Provider acceptance and a `DELIVERED` ledger state do not prove raw authentication or MIME compliance. Production activation is therefore not approved.
