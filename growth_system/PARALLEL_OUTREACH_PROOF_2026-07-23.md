# Parallel Outreach Supervised Proof - 2026-07-23

## Verdict

**Parallel fan-out works. Production outreach scheduling is blocked.**

Three isolated, read-only agents completed concurrently:

1. Source-supply health
2. Lead quality and scoring readiness
3. Delivery/compliance readiness

No agent sent outreach, made network calls, or wrote canonical lead ledgers.

## Parent-verified evidence

### Current artifacts

| Artifact | Count/state |
|---|---:|
| `signal_queue.jsonl` | 101 rows |
| `HOT_LEAD.json` | 48 rows |
| `ledgers/leads.json` | 112 records |
| `ledgers/leads-journal.jsonl` | 136 events |
| `nebula_leads.db` | 0 bytes |
| `audit_leads.jsonl` | absent |
| `contacted.json` | absent |
| `trigger_leads.jsonl` | absent |
| `firewall_blocked.jsonl` | absent |
| `outreach_evidence.jsonl` | absent |
| `dm_queue.jsonl` | absent |

These counts overlap and are not a unique-lead total.

### Quality gates

Parent source inspection confirmed:

- `ramp_pipeline_fill.py:58-90` implements buying-trigger qualification.
- `ramp_pipeline_fill.py:975-1009` runs content-firewall and ICP checks before audit delivery.
- Firewall import failure currently **fails open** with score 100 at `ramp_pipeline_fill.py:977`.

### Delivery boundary

Parent source inspection confirmed:

- `AgentMailClient.send()` supports a deterministic `client_id` idempotency key (`agentmail_client.py:137-147`).
- `deliver_audit.py:1131-1159` retries 5xx errors but does not implement compliant 429 cooldown/retry behavior.
- The audited `deliver_audit.py` call does not pass `client_id` to `AgentMailClient.send()`.

## Consolidated findings

- Product-launch records are fresh but do not demonstrate the core ad-spend + zero-conversion buying trigger.
- Google/Reddit, LinkedIn engager, and job-board lanes are stale or blocked by source/API failures.
- Current queue records do not persist firewall/ICP provenance.
- Bounce suppression, opt-out/state checks, deduplication, and rate limiting are fragmented across send paths.
- Multiple send paths lack a shared mailbox-wide lock, atomic send reservation, and fail-closed release predicate.

## Required before production scheduling

1. Restore a high-intent Google-indexed pain-signal source.
2. Persist firewall and ICP decisions on every candidate.
3. Route every send through one AgentMail REST boundary.
4. Fail closed when suppression/state checks fail.
5. Add mailbox-wide five-minute serialization and 429 handling.
6. Reserve sends atomically and pass deterministic `client_id` values.
7. Restore and test one canonical bounce/reply processor.
8. Test representative, zero-result, bounced, opted-out, crash/retry, concurrency, and 429 cases.

## Decision

The parallel discovery/review pattern is accepted as a reusable orchestration pattern. Autonomous outbound activation is rejected until the delivery safety gates above pass independent verification.
