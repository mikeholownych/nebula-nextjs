# Nebula AI operations controls

`company_os/controls.py` implements five enforceable patterns:

- **Critic gate:** fixed-list, fail-closed checks for unsupported guarantees, call-first outreach CTAs, secrets, and unbound fulfillment. `OutboundReleaseGate.reserve(..., draft=...)` checks before a mailbox reservation.
- **Bounded self-improvement:** only `critic_rules`, `model_tier`, and `memory_ttl_days` may be proposed; one proposal at a time; literal `APPROVE` plus a better score is required.
- **Memory lifecycle:** registered facts expire after 90 days unless renewed or pinned. Reconciliation marks facts expired and never deletes them.
- **Revert gate:** approved changes are atomic, scored before/after, and retain a rollback backup.
- **Model routing:** task classes map to existing `model_router.py` tiers and record critic/human-approval requirements. Unknown tasks fail closed to deep + both gates.

Receipts are append-only in `company_os/control_receipts.jsonl` and are runtime evidence, not source-controlled content.

```bash
venv/bin/python3 company_os/controls.py --critic 'draft' --kind outreach
PYTHONPATH=/home/mike/nebula venv/bin/python3 company_os/controls.py --route outreach_draft
venv/bin/python3 company_os/controls.py --memory-reconcile
venv/bin/python3 -m pytest -q tests/test_company_os_controls.py tests/test_outbound_release_gate.py tests/test_ops_company_os.py
```
