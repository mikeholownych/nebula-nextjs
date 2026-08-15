# MailCheck beta canonical definition

Status: canonical
Date: 2026-08-15
Owner: Nebula design partner feedback relay

## Category

MailCheck is a risk and reputation layer for outbound contact decisions.

> MailCheck helps outbound systems decide who is safe to contact and how much uncertainty remains before sending.

MailCheck is not a sales-conversion engine, a Hunter replacement, or a people-graph enrichment product. Sales, replies, checkout starts, and payments are downstream outcomes. They are not MailCheck's primary job.

## Evidence from the 93-contact comparison

- 43 `HIGH_CONFIDENCE_VALID`
- 26 `ACCEPT_ALL`
- 17 `CONNECTION_FAILED`
- 4 probable or temporarily unverifiable
- 2 `CONFIRMED_INVALID`
- 1 unavailable
- 41 contacts cleared by both providers and Nebula policy
- 52 contacts held by provider uncertainty or policy

The two `CONFIRMED_INVALID` results are direct risk protection. `ACCEPT_ALL` and unresolved classifications are risk classification, not sales objections. They describe how much uncertainty remains before sending.

## Canonical beta success metrics

1. Hard-bounce rate among MailCheck-cleared contacts.
2. Hunter-valid contacts blocked by MailCheck, recorded as risky averted.
3. Hunter false-valid rate.
4. MailCheck false-invalid or unnecessary-block rate.
5. Reputation incidents prevented.
6. Inbox and sender-health stability.
7. Evidence quality on delivery failure.

## Measurement rules

- Provider acceptance is not delivery proof.
- `contact_admissible` is technical contactability only, not send authorization.
- `CONFIRMED_INVALID` is an unconditional hard block.
- `ACCEPT_ALL`, connection failure, probable validity, and temporary unverifiability are uncertainty states. Nebula policy decides what happens next.
- Hunter and MailCheck results remain independently persisted.
- Commercial outcomes may be recorded as downstream context, but must not be used as MailCheck product-success metrics.
- No superiority claim is permitted until observed delivery and reputation outcomes exist.

## Product-boundary note

Post-beta verified enrichment remains a separate roadmap hypothesis: role intent joined to observed mail evidence. It is not part of the beta success definition and should not displace risk and reputation measurement.
