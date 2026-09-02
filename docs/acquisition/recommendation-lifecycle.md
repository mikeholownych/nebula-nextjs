# Acquisition Recommendation Lifecycle & Review Workflow

## 1. Recommendation State Machine

Every candidate recommendation traverses a strict, versioned lifecycle governed by immutable database records:

```text
[ EVALUATION ENGINE ]
        │
        ▼
   (GENERATED) ───────────► (PENDING_REVIEW)
                                 │
         ┌───────────────────────┼────────────────────────┐
         │                       │                        │
         ▼                       ▼                        ▼
    (ACCEPTED)              (REJECTED)               (DEFERRED)
         │                       │                        │
         ▼                       ▼                        ▼
 [CREATE EXPERIMENT DRAFT]  [90-DAY SUPPRESSION]    [HOLD FOR FUTURE WINDOW]
         │
         ▼
(PHASE 5 DRAFT EXPERIMENT)
```

### State Definitions

- `GENERATED`: The recommendation has been deterministically produced and persisted in `acquisition_recommendations`.
- `PENDING_REVIEW`: The candidate is awaiting formal evaluation by an authorized human operator.
- `ACCEPTED`: The recommendation rationale was reviewed and approved as a valid hypothesis for experimental validation.
- `REJECTED`: The recommendation was evaluated and rejected (e.g. intentional brand copy, out-of-scope intent). Enforces a 90-day suppression.
- `DEFERRED`: The recommendation is acknowledged but deferred to a future decision cycle pending additional data.
- `SUPERSEDED`: A newer measurement window evaluated the target and produced an updated candidate record.

---

## 2. Human Decision Review Actions

The system exposes 4 explicit review actions via the CLI (`scripts/acquisition_cli.py recommendations-review`):

1. **`ACCEPT`**:
   - Updates lifecycle status to `ACCEPTED`.
   - Authorizes the candidate to be converted into a Phase 5 controlled experiment draft.
   - Requires reviewer identity and rationale notes.

2. **`REJECT`**:
   - Updates lifecycle status to `REJECTED`.
   - Automatically inserts a 90-day row into `recommendation_suppressions` for `(target_type, target_id, recommendation_class)`.
   - Prevents nagging or duplicate candidates during subsequent measurement runs.

3. **`DEFER`**:
   - Updates lifecycle status to `DEFERRED`.
   - Keeps the candidate visible in review queues without triggering suppression.

4. **`REQUEST_MORE_EVIDENCE`**:
   - Leaves lifecycle status in `PENDING_REVIEW`.
   - Logs review feedback requiring additional temporal observation before a decision is reached.

---

## 3. Bridge to Phase 5 Controlled Experiments

An accepted recommendation does not alter production code. It bridges into Phase 5 through the deterministic function `create_experiment_draft_from_recommendation`:

### Invariants of the Experiment Bridge

1. **Explicit Hypothesis Construction**:
   - Translates the recommendation reason code, detected condition, and primary metric into a pre-registered falsifiable hypothesis statement.
2. **Draft State Enforcement**:
   - Inserts the experiment into `acquisition_experiments` with `approval_status = 'DRAFT'`.
   - Sets `approved_by = NULL`, `approved_at = NULL`, and `effective_change_at = NULL`.
3. **Traceable Candidate Linkage**:
   - Populates `acquisition_recommendations.experiment_candidate_id` with the new experiment ID.
4. **Separation of Roles**:
   - Creating the draft experiment does not activate holdouts or schedule code releases. Formal Phase 5 approval (`exp-approve`) and change registration (`change-register`) remain strictly required.
