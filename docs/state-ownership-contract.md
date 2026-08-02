# Nebula State and Ownership Contract

**Status:** observed contract with explicit gaps
**Verified:** 2026-08-02
**Machine-readable source:** `ops/state-ownership-ledger.json`

## Purpose

Important behavior must have a single owner, an explicit state model, and evidence for every meaningful transition. This document describes the current contract; it does not claim that every gap is already fixed.

## Transition rule

A transition is valid only when:

1. the previous state is allowed;
2. the owning component authorizes the decision;
3. required evidence exists;
4. external side effects are idempotent;
5. failure and retry behavior are bounded;
6. the resulting event or artifact is durable.

Unknown, conflicting, or incomplete evidence routes to review. It must not be inferred as success.

## Lifecycle owners

| Lifecycle | Owner | Primary evidence | Highest current gap |
|---|---|---|---|
| Audit | `platform-api` | `audits`, `findings`, events | Central transition enforcement is not yet unified |
| Payment | `stripe-webhook` | Stripe event, purchase row, advisory lock | Direct payment links can lack `audit_id` |
| Fulfillment | `mike-manual-delivery` | kickoff, scope, before/after, delivery artifact | No single canonical fulfillment store |
| Workspace identity | `customer-portal-auth` | server session or demo marker | `localStorage` email is not authorization |
| Lead | `growth-support-gates` | approved send/payment receipts | Legacy artifacts exist outside canonical store |
| Agent task | `ceo-reconciler-kanban` | kanban run and verification artifact | Some worker failures need review |
| AEO evaluation | `aeo-harness-human-review` | source hash, score, semantic report, rendered QA | Real engine adapters are not connected |

## Highest-priority gaps

### P0 — Bind payment to fulfillment

Every accepted payment must resolve to:

```text
purchase
→ audit
→ approved finding/scope
→ fulfillment record
→ delivery artifact
```

A paid receipt without `audit_id`, offer identity, or fulfillment scope remains `paid_review`, not delivered.

### P0 — Enforce workspace ownership

`nebula_ws_email` is a demo identity marker. It must not authorize access to another customer’s audits, billing, recommendations, or team data.

Required end state:

```text
signed server session
→ resolved owner
→ route-level ownership check
→ negative cross-owner test
```

### P1 — Centralize transitions

SOPs currently describe legal transitions, but the enforcement boundary is distributed. Introduce transition functions only where multiple callers need the same business decision. Do not create a generic state framework for its own sake.

### P1 — Bound operational failure evidence

Logs must be rotated and structured around correlation IDs, operation IDs, entity IDs, retry attempt, state before/after, and failure class. More unstructured output is not more observability.

## How to use the ledger

Before modifying a lifecycle:

1. Read its owner and source-of-truth entry.
2. Add or revise the legal transition before adding a caller.
3. Define required evidence and failure behavior.
4. Add a positive and negative test.
5. Verify the durable artifact after execution.
6. Update the ledger only when the live behavior is verified.

The ledger is not a task list. It is the contract against which implementation and operational claims are checked.
