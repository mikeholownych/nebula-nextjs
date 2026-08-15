# Nebula W6: Audit to Payment

Status: active operating workflow
Date: 2026-08-15

## Objective

Turn a qualified signal or approved lead-list row into one attributable $97 payment without confusing activity with revenue.

## Canonical chain

```text
signal or approved candidate
→ account and page evidence
→ audit finding
→ contactability and sender-risk checks
→ value-first message
→ audit start or reply
→ audit delivered
→ $97 offer
→ checkout start
→ payment
→ outcome feedback
```

## Stage authority

| Stage | Required evidence | Owner |
|---|---|---|
| candidate | source provenance, email, company URL | acquisition |
| researched | live page fetch and account context | research |
| audited | stored audit result and top finding | audit pipeline |
| risk_checked | Hunter and MailCheck persisted independently | contactability |
| ready | Nebula release gate passes at send time | release gate |
| contacted | provider receipt, timestamp, message ID | sender |
| audit_engaged | audit start, submission, reply, or delivered report | funnel |
| offer_presented | $97 offer shown after value or explicit interest | conversion |
| checkout_started | Stripe checkout event | payments |
| paid | successful Stripe payment | revenue |

## Message rule

The first message delivers one observed finding and one audit link. It does not lead with a generic service pitch, unsupported proof, or a payment link.

The $97 offer follows value delivery, an audit result, a reply, or explicit implementation interest.

## Provider boundary

Hunter and MailCheck return observations. Nebula decides whether to release a contact.

MailCheck is a risk and reputation layer, not a sales-conversion engine. Its beta metrics are:

1. Hard-bounce rate among MailCheck-cleared contacts.
2. Hunter-valid contacts blocked by MailCheck, recorded as risky averted.
3. Hunter false-valid rate.
4. MailCheck false-invalid or unnecessary-block rate.
5. Reputation incidents prevented.
6. Inbox and sender-health stability.
7. Evidence quality on delivery failure.

`CONFIRMED_INVALID` is an unconditional hard block. `ACCEPT_ALL` and unresolved provider states describe uncertainty and remain policy decisions.

## Daily execution

1. Process fresh approved candidates without using active-sequence count as an acquisition stop condition.
2. Run or reuse a live audit and preserve the top finding.
3. Run Hunter and MailCheck for every email lookup.
4. Apply suppression, deduplication, compliance, send window, and Nebula release gate immediately before sending.
5. Record provider receipt or exact non-send reason.
6. Process replies and audit engagement before generating a payment ask.
7. Reconcile Stripe checkout and payment events to the source, message, audit, and offer.
8. At the end of the run, report both operational movement and commercial movement.

## Weekly decision rule

Review by source, signal, message angle, and stage:

- A sent message without delivery evidence is not a success.
- Delivery without reply is diagnostic.
- Reply without audit engagement is a message or value problem.
- Audit engagement without checkout is an offer transition problem.
- Checkout without payment is a checkout or trust problem.
- Payment is the only completed commercial conversion.

After 20 comparable sends, kill or rewrite angles with zero purchases unless a different stage clearly explains the failure.

## Required report

```text
candidates:
audits:
risk_checked:
ready:
sent:
delivered:
replied:
audit_engaged:
offer_presented:
checkout_started:
paid:
revenue:
mailcheck_risky_averted:
mailcheck_hard_blocks:
next_decision:
```
