# GTM Skills Review — Nebula Extraction

Source reviewed: https://github.com/gtm-skills/gtm @ `6e42775`
Review date: 2026-07-04

## Verdict for Nebula

Do **not** adopt as a dependency or mass-import its skill fleet.

Adopt only the operating pattern:

1. Stage-specific agents
2. Explicit handoff queues
3. Heartbeat checklist
4. Signal-trigger routing
5. Daily bottleneck report

## Why

The repo is a polished GTM content/platform project, not a production-ready autonomous revenue engine for Nebula.

Useful pieces:
- `openclaw-skills/deployment/HEARTBEAT.md` — simple recurring agent checklist
- `openclaw-skills/deployment/WORKING.md` — pipeline handoff board
- `src/app/api/v1/agents/orchestrate/route.ts` — keyword-based agent routing
- Agent split: Scout → Writer → Rep → Closer

Rejected pieces:
- Human/contact-heavy closer motion
- Meeting/proposal/deal-stage CRM flow
- High-frequency LLM cron heartbeat pattern
- Root-based deployment script
- Broad prompt catalog as an operating dependency

## Nebula adaptation

Map GTM stages to Nebula agents:

| GTM Pattern | Nebula Agent | Nebula Job |
|---|---|---|
| Scout | market | Find buying-trigger sources and score signal quality |
| Writer | growth | Produce value-first audit artifacts and outreach copy |
| Rep | growth/support | Send/monitor outreach and classify replies |
| Closer | support/ops-finance | Route to self-serve checkout, delivery, ledger proof |
| Mission Control | CEO/default | Kill/scale decision memo from evidence |

## New operating rule

Every lead must move through these fields before outreach:

```json
{
  "lead_url": "",
  "trigger_source": "",
  "trigger_quote": "",
  "signal_strength": "strong|medium|weak",
  "audit_artifact_path": "",
  "checkout_path_available": true,
  "next_owner": "market|growth|support|ops-finance|default"
}
```

No `trigger_quote` = no outreach.
No `audit_artifact_path` = no pitch.
No checkout path = no outbound.

## Kanban card template

Use this for Nebula Kanban tasks:

```text
Title: <stage> — <specific outcome>
Assignee: market|growth|support|ops-finance|default
Priority: 0-3
Body:
- Objective:
- Input evidence:
- Required output artifact:
- Ledger file to update:
- Kill criteria:
- Handoff owner:
```

## Immediate extracted checklist

### market heartbeat
- Find public buying-trigger posts.
- Capture exact quote + source URL.
- Reject weak/no-trigger leads.
- Handoff only scored leads to growth.

### growth heartbeat
- Build one concrete audit artifact per strong lead.
- Write opener from exact trigger quote.
- No generic pitch.
- Handoff sent/audit-ready leads to support.

### support heartbeat
- Monitor replies.
- Classify: audit request, pricing intent, objection, unsubscribe, noise.
- Deliver self-serve path; avoid calls/calendars.
- Handoff payment/delivery evidence to ops-finance.

### ops-finance heartbeat
- Verify revenue from payment provider/ledger only.
- Track send → reply → audit → payment conversion.
- Flag weak-signal dilution separately.

### CEO heartbeat
- Every day: identify bottleneck, kill/scale decision, next 24h priority.

## Guardrails copied from review

- Do not run root-based setup scripts.
- Do not install MCP server until dependency audit is fixed.
- Do not expose unauthenticated API routes with broad CORS for mutation paths.
- Do not store OAuth tokens without explicit encryption/RLS verification.
- Do not let heartbeat crons fire every 15 minutes with LLM calls; use Kanban + fewer CEO synthesis jobs.
