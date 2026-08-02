# Nebula Production Change Contract

**Machine-readable schema:** `ops/production-change-contract.schema.json`

Use this contract before any production change that affects:

- payments or fulfillment;
- authentication or authorization;
- customer or prospect data;
- audit scoring, findings, or evidence;
- outbound messages or external side effects;
- state transitions or reconciliation;
- production infrastructure.

## Required intent

Every change must state:

```text
Goal: what must be true when complete
Owner: who owns the decision and result
Risk: low / medium / high / critical
Affected lifecycles: which state contracts change
In scope: what will be changed
Out of scope: what will not be changed
Constraints: explicit prohibitions
Assumptions: claims requiring verification
```

## Required verification

A change is not complete when the code exists. It is complete only when:

1. positive behavior passes;
2. negative or unauthorized behavior is rejected;
3. runtime or rendered behavior is exercised;
4. the required artifact exists;
5. live state is checked after deployment;
6. the result is reconciled against the expected state.

## Required rollback

Every high-risk or critical change must define:

```text
Trigger: what evidence causes rollback
Procedure: exact reversible steps
Evidence: how rollback success is proven
```

“Revert the commit” is not sufficient for a payment, data, auth, or external-side-effect change.

## Approval gate

Approval is required when a change can:

- charge or refund money;
- send a buyer-facing or prospect-facing message;
- access confidential customer data;
- change production data ownership;
- deploy a customer-facing production change;
- weaken a security or compliance control.

The contract must name the approver and list the side effects.

## Template

Create an instance from `ops/production-change-contract.schema.json` with this shape:

```json
{
  "change_id": "example-change",
  "goal": "State the measurable production outcome.",
  "owner": "profile-or-person",
  "risk_class": "high",
  "affected_lifecycles": ["payment"],
  "scope": {
    "in_scope": ["Specific route or transition"],
    "out_of_scope": ["Unrelated cleanup"]
  },
  "constraints": ["Do not send messages", "Do not mutate unrelated records"],
  "assumptions": ["All accepted receipts include canonical metadata"],
  "tests": {
    "positive": ["Valid receipt reaches expected state"],
    "negative": ["Missing metadata remains in review"],
    "runtime": ["Run the deployed webhook and inspect the receipt"]
  },
  "verification": {
    "done_when": "The expected state and artifact are independently confirmed.",
    "artifacts": ["Test output", "Database/event receipt"],
    "live_checks": ["Deployed endpoint", "Downstream state"]
  },
  "rollback": {
    "trigger": ["Unauthorized side effect", "State mismatch"],
    "procedure": ["Disable path", "Restore prior behavior", "Reconcile records"],
    "evidence": "Rollback receipt and clean downstream state"
  },
  "approval": {
    "required": true,
    "approver": "Mike",
    "side_effects": ["Payment state mutation"]
  },
  "evidence": {
    "before": ["Baseline artifact or state query"],
    "after": [],
    "decision": "planned"
  }
}
```

## Relation to agent tasks

The production-change contract governs *what may change*. The agent action contract governs *how bounded work is dispatched and reconciled*. Both are required when an agent performs a production change.

```text
production-change contract
→ agent action contract
→ implementation
→ tests
→ live verification
→ approval/reconciliation
```
