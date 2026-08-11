# Nebula Evidence Dispatch System

## Purpose

Evidence Dispatch is Nebula's repeatable owned-content format. It turns verified observations into useful public artifacts and measures whether those artifacts create qualified demand.

It is not a generic AI trend newsletter and it is not an autonomous outbound sender.

## Formats

- `audit_pattern` - one recurring conversion problem supported by live page evidence;
- `founder_teardown` - a named founder/product with a public pain trigger and a current-page audit;
- `ai_visibility_check` - what AI engines mention, cite, omit, or misstate;
- `build_note` - a Nebula product or operating-system change with verified before/after evidence.

## Data flow

```text
verified trigger
→ evidence capture
→ bounded finding
→ one fix
→ approved publication/distribution
→ existing teardown ledger
→ propagation and qualified-funnel measurement
→ review or retry
```

## Ownership

| Stage | Owner | Output |
|---|---|---|
| Trigger selection | Mike / market | source URL and exact trigger |
| Evidence capture | audit engine / operator | quote, locator, timestamp, optional hash |
| Finding and fix | Mike / growth | bounded statement, limitation, fix |
| Approval | Mike | approved/rejected decision |
| Publication | customer-portal | live URL |
| Distribution | growth, approval-gated | channel receipt |
| Measurement | ops-finance | ledger update and propagation review |

## Measurement

Use `audit-system/channel1/teardown_ledger.jsonl` as the measurement source for teardown-style dispatches. Do not create a second funnel ledger.

Track:

```text
founder response
founder share
referral visits
search impressions
audit starts
audit completions
repair purchases
```

A zero is a valid observation. Missing data is `unknown`, not zero.

## Gate rules

Do not publish when:

- the finding was not re-verified against the current page;
- a negative HTML result was obtained only through a fragile grep;
- the statement implies causation not established by evidence;
- the founder identity or contact path is guessed;
- the CTA or distribution channel has not been verified;
- approval is missing for an external side effect;
- the ledger slug or baseline is absent.

Do not start a new dispatch merely because an existing dispatch has no propagation. First retry the distribution path or repair the CTA according to the ledger's propagation check.

## Artifacts

- Contract: `ops/evidence-dispatch.schema.json`
- Authoring template: `content/evidence-dispatch/TEMPLATE.md`
- Validator: `scripts/validate_evidence_dispatch.py`
- Existing propagation ledger: `audit-system/channel1/teardown_ledger.jsonl`
- Existing tracker: `audit-system/channel1/teardown_tracker.py`

## Success definition

The system succeeds when a dispatch produces a measurable qualified signal:

```text
verified artifact
→ relevant visitor
→ audit start
→ audit completion
→ purchase or meaningful founder response
```

Content volume, impressions, likes, and pageviews without qualified movement are not success evidence.
