# Nebula Components - Operational Context

**Last updated**: 2026-08-09
**Stack**: Python 3.12 / FastAPI / PostgreSQL (asyncpg) / Next.js 15 / TypeScript
**Team**: Mike Holownych (Founder/CRO) + Sedrick Murphy (Growth Agent / Hermes)
**Stage**: Phase 1 - first paying customer, $0 revenue
**One metric**: Active outreach sequences → first 5 wins

---

## System Architecture

```
nebulacomponents.com (Cloudflare CDN)
  ├── customer-portal/     Next.js 15 app  → nebula-nextjs.service (:3000)
  ├── platform_api/        FastAPI         → nebula-platform-api.service (:8001)
  ├── lead_gen/            Outreach engine (SQLite: lead_state.db)
  └── yt_channel/          Video pipeline + delivery workflows
```

### Databases
- `nebula_audit` (PostgreSQL :5433) - audits, customers, CRM, purchases, newsletter
- `nebula_platform` (PostgreSQL :5433) - auth, organizations (DO NOT mix with nebula_audit)
- `lead_gen/lead_state.db` (SQLite) - contacts, sequence_state, visitor_events

### Key services (systemd)
- `nebula-nextjs` - Next.js production build, RestartSec=10
- `nebula-platform-api` - FastAPI + uvicorn, drop-ins in `.service.d/`
- `cloudflared-tunnel` - Cloudflare tunnel for public ingress

---

## Revenue Flow

```
Signal found (IH/X/HN)
  → email verified (Hunter.io)
  → D1 cold email (sequence_engine.send_d1())
  → D7 follow-up (auto, sequence_engine cron every 6h)
  → reply detected (reply-monitor cron every 15m)
  → manual Sedrick follow-up (within 4h of reply)
  → prospect runs free audit (nebulacomponents.com/audit)
  → Stripe checkout ($97)
  → charge.succeeded webhook → /api/stripe/webhook
  → purchase_completed() → CRM updated + delivery triggered
  → DeliveryWorkflow.handle_stripe_charge_success()
  → Email 1: fix pack (5 min) → Email 2 (Day 1) → Email 3 (Day 7) → Email 4 (Day 30)
  → Day 30 re-audit → Pro upsell ($29-199/mo)
```

---

## Critical Rules (Do Not Violate)

1. **Never push to `origin`** - always `nebula-origin`
2. **Never mix nebula_audit and nebula_platform data** - separate DBs, separate concerns
3. **Anonymous audits** use `anonymous+<uuid>@invalid.nebulacomponents.com` - never real emails
4. **Reddit is PERMANENTLY DEAD** - IP-level shadowban, all accounts affected
5. **AgentMail REST only** - never SMTP for outbound (550 errors poison suppression list permanently)
6. **Outreach gate** - `OUTREACH_DISABLED` file blocks sends when present
7. **CI has 6 checks** - all must pass before merge
8. **Pre-existing test failures must be fixed** - never label and leave

---

## Active Cron Jobs (critical path)

| Job | Schedule | Purpose |
|-----|----------|---------|
| outreach-sequence-engine | every 6h | D7/D17 auto-sends + reply detection |
| reply-monitor | every 15m | AgentMail inbox → CRM sync |
| nebula-support-inbox | every 15m | Support email classification |
| signal-watcher | every 30m | IH/HN/PH signal discovery → signal_queue.jsonl |
| hot-audit-lead-scanner | every 30m | Audit results → outreach candidates |
| crm-data-decay | 6am daily | Stale prospects → cold status |
| nebula-marketing-alerts | every 15m | CVR/drought/objection anomaly detection |
| sre-responder | every 15m | Service health checks |
| nebula-watchdog | every 5m | System health |

---

## Deployment Workflow

```bash
# Standard deploy
git add . && git commit -m "..." && git push nebula-origin main
sudo systemctl restart nebula-nextjs  # if Next.js changed
sudo systemctl restart nebula-platform-api  # if FastAPI changed
```

Cloudflare cache purge after static asset changes:
```bash
# .com zone: 6c3cbc0c403d0c1b9fd58e46143eedf3
```

---

## Known Paid Tool Trigger Thresholds

| Threshold | Action |
|-----------|--------|
| 200 D1 sends + reply_rate < 5% | Upgrade to Apollo API ($49/mo) |
| active_sequences >= 50 | Migrate to Smartlead ($39/mo) |
| Stripe events/month >= 20 | Deploy self-hosted Metabase |

---

## Outreach Queue State (Aug 9, 2026)

5 active sequences:
1. Edgar Conejo - hello@edgarconejo.com - adcopystyles.com - D7 due Aug 16
2. PostClaw - admin@postclaw.io - D7 due Aug 16
3. qria.io - hello@qria.io - D7 due Aug 16
4. Postessia - support@postessia.in - D7 due Aug 16
5. meetsoto - meetsoto.app@gmail.com - D7 due Aug 16

---

## Architecture Decisions (ADRs)

**ADR-001**: Custom PostgreSQL CRM over HubSpot/Airtable
*Reason*: Zero external dependency, direct SQL queries, programmatic PMF diagnostics

**ADR-002**: AgentMail over SendGrid/SES
*Reason*: Already configured, reply threading, label-based state machine

**ADR-003**: SQLite for outreach state over PostgreSQL
*Reason*: Simple, single-process, no connection pool needed for low-volume outreach

**ADR-004**: Systemd over Docker for service management
*Reason*: Lower overhead, native restart policies, drop-in env injection

**ADR-005**: Signal score floor removed from PH
*Reason*: Generic PH launches are noise - only emit PH posts with explicit conversion pain language
