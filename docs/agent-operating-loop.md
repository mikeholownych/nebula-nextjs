# Nebula agent operating loop

## Purpose

Nebula treats reports as inputs to an operating loop, not as completed work.
Every report-driven action must move through a durable queue and return a
verifiable result before it is considered complete.

```text
observe → report → validate freshness → derive directive → queue → dispatch
→ execute → verify artifact → reconcile → retry or escalate
```

## Boundaries

- The observer reads authoritative business files and does not invent metrics.
- The CEO directive records the evidence used for the decision.
- The API/data layer records events; agents interpret them.
- Workers receive an outcome contract: `for/g`, `verify`, and `constraints`.
- Buyer-facing sends, payments, production changes, and confidential-data access
  remain approval-gated until separately graduated.
- Empty/no-change cycles are silent; durable receipts are still written.

## Action contract

The machine-readable contract is:

```text
ops/agent-action-contract.schema.json
```

Each action includes:

- `goal`: the outcome, not an activity list.
- `verification`: the exact condition that proves completion.
- `required_artifacts`: paths or records that must exist.
- `evidence_strength`: observed, derived, inherited, or unknown.
- `retry_policy`: bounded attempts, backoff, and escalation threshold.
- `recheck_after_minutes`: when the action should be reconsidered.
- `constraints`: explicit side-effect limits.

The current directive is written to:

```text
ledgers/latest_ceo_directive.json
```

The append-only execution receipt is:

```text
ledgers/ceo-action-log.jsonl
```

## Retry and reconciliation rules

1. A fresh report is required; stale or missing reports produce no actions.
2. Idempotency keys prevent duplicate open work.
3. A running or pending action is not recreated.
4. A blocked action is not immediately storm-retried; it waits for its recheck
   window and remains visible as blocked.
5. A worker result is not accepted as completion unless kanban records a completed
   run and the verification artifact can be located or independently checked.
6. Repeated failure is escalated rather than retried forever.
7. The next CEO memo reports the prior action as completed, blocked, in progress,
   or superseded.

## Adoption decision

Nebula adopts the CRM repository's durable-agent patterns, but not its CRM,
mailbox access, auth model, or enrichment integrations. Those remain separate
because the CRM is deliberately single-tenant and grants every authenticated user
full read/write access.
