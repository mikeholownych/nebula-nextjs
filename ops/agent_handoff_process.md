# Nebula Agent Handoff Process

Source extracted from `gtm-skills/gtm`, adapted for Nebula. Use this as the operating contract, not the upstream repo.

## Default buyer path

`trigger evidence -> automated audit/tool -> self-serve checkout -> automated delivery/ledger`

Forbidden gates: calendar, book a call, manual review, reply yes.

## Stage map

| Stage | Agent | Owns | Handoff to | Acceptance |
|---|---|---|---|---|
| Scout | market | Public buying-trigger evidence, weak-signal rejection | growth | URL, contact route, trigger_type, trigger_excerpt, signal_strength >= 6 |
| Writer/Rep | growth | Value-first artifact/outreach from trigger evidence | support | outreach/audit row includes trigger_context + self-serve CTA |
| Closer/Delivery | support | Inbox classification, audit delivery, checkout handoff, fulfillment queue | ops-finance | customer ledger + HOT_LEAD state advanced |
| Mission Control Evidence | ops-finance | Revenue truth, attribution, incidents, kill criteria | CEO | company_brain matches ledgers; test revenue excluded |
| Mission Control Decision | CEO | Bottleneck decision and kill/scale orders | agents | latest_ceo_directive has bottleneck, decision, next orders |

## Heartbeat checklist

Each agent run must report:

1. Inputs inspected.
2. Artifact produced.
3. Handoff target.
4. Ledger/file written.
5. Blocker or next action.

Agent-specific checklists are machine-readable at:

- `/home/mike/nebula/ops/agent_heartbeat_checklists.json`

Live handoff queue is machine-readable at:

- `/home/mike/nebula/ops/handoff_queues.json`

Latest CEO directive is machine-readable at:

- `/home/mike/nebula/ops/latest_ceo_directive.json`

## Current kill logic

- 30 sends + 0 warm replies -> kill/rewrite targeting or offer angle.
- 3 audits delivered + 0 payments -> kill/rewrite audit-to-payment conversion.
- Any overdue `pitch_due_at` -> support must pitch or log incident.
- Revenue must be Stripe/payment-ledger real revenue; test revenue is excluded.

## Run sync

```bash
cd /home/mike/nebula
python3 ops_company_os.py --json
```

This regenerates:

- `ops/company_brain.json`
- `ops/agent_scores.json`
- `ops/handoff_queues.json`
- `ops/agent_heartbeat_checklists.json`
- `ops/latest_ceo_directive.json`
- append-only ops ledgers
