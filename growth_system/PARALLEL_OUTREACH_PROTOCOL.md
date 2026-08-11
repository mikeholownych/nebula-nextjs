# Parallel Outreach Orchestration Protocol

## Objective

Run independent trigger-source lanes concurrently, then merge through one deterministic quality and delivery gate. Parallelize discovery and analysis; never parallelize the final AgentMail send path.

## Architecture

```text
Lane A: Google → Reddit pain signals ┐
Lane B: LinkedIn post engagers       ├─> Parent merge/dedup → trigger gate → content firewall → ICP gate → centralized delivery
Lane C: Job boards + new launches    ┘
```

## Lane contracts

### Lane A - Reactive pain signals

- **Scope:** Google-indexed Reddit/IndieHackers/HN/X posts.
- **Authoritative code:** `ramp_pipeline_fill.py`, `trigger_lead_engine.py`.
- **Done:** Returns new candidate records with source URL, trigger evidence, site hint, and source attribution.
- **Failure:** Returns an explicit zero-candidate/source-health report; zero is not silently treated as healthy.

### Lane B - Warm LinkedIn engagers

- **Scope:** Existing Apify exports of Mike/Nebula post likers and commenters.
- **Authoritative code:** `linkedin_ingest_monitor.py`, `growth_system/apify_raw/`.
- **Done:** Returns normalized, self-engager-suppressed candidates with comment/post evidence.
- **Failure:** Returns missing/stale-export evidence; does not fabricate profiles or emails.

### Lane C - Operational buying triggers

- **Scope:** CRO/landing-page job posts and newly launched products.
- **Authoritative code:** `wave4_scraper.py` and related source ledgers.
- **Done:** Returns candidates whose titles or launch context meet the explicit trigger gate.
- **Failure:** Returns source/API failure evidence and no candidates.

## Parent merge gate

Only the parent/orchestrator may combine lane outputs. It must:

1. Deduplicate by canonical domain, source URL, and existing lead identity.
2. Require demonstrated buying-trigger evidence.
3. Apply the content firewall and ICP quality gate.
4. Check opt-out, terminal stage, bounce state, and prior-send dedup.
5. Write approved drafts/evidence atomically.
6. Route final delivery through the existing centralized AgentMail path.

## Non-negotiable delivery boundary

Subagents **must not send email, DMs, audits, or payment links**. AgentMail enforces a five-minute send window; concurrent senders create duplicate/rate-limit risk. The parent delivers serially using the existing trickle path only after supervised proof.

## Hermes delegation template

Use one `delegate_task(tasks=[...])` batch so all lanes launch concurrently. Every task must be self-contained and follow the Nebula completion contract:

```text
for/g: <source-specific measurable outcome>
verify: <artifact path, counts, freshness, failure evidence>
constraints: read/write scope; no sends; no secrets; no fabricated contacts
```

Recommended lane split:

1. `market` role: source discovery and trigger evidence.
2. `growth` role: scoring, content-firewall, and ICP qualification.
3. `support/ops` role: bounce, dedup, compliance, and delivery-readiness review.

For a single batch, use isolated read-only subagents for all three checks. For production source ingestion, give each lane a separate output file under `growth_system/parallel_runs/<run_id>/`; the parent is the only writer to canonical ledgers.

## Supervised-proof gate

Before scheduling:

- Run one representative candidate through each lane.
- Run one failure/zero-result case per lane.
- Verify no subagent sent anything.
- Verify parent dedup produces one canonical lead per person/domain.
- Verify a bounced/opted-out lead is blocked.
- Verify AgentMail delivery remains serial and respects the five-minute window.

Only after those checks may the pattern become a cron/kanban workflow.

## Rollback

This protocol is additive. Disable parallel execution by reverting to the existing single-process pipeline; canonical ledgers and delivery paths remain unchanged because lane workers never write to them directly.
