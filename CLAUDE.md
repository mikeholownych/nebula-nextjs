# Nebula Components — Agent Context

## Stack
- Python 3.12, FastAPI, SQLite (`lead_state.db`), SMTP via AgentMail
- Stripe SDK (`stripe==15.2.1`) for payments + webhooks
- Apify CLI for lead scraping (Reddit, LinkedIn)
- Cloudflare tunnel (`nebula_watchdog`) exposes `nebulacomponents.shop`
- Venv: `venv/` — always run with `venv/bin/python3`, never system python
- See `agentic_server.py` for HTTP server, `stripe_webhook.py` for payment handling

## What this codebase does
Autonomous outbound sales pipeline for Nebula Components:
1. Scrape trigger-aware leads (founders burning money on ads)
2. Send free audit outreach → deliver audit → send $97 pitch → collect payment
3. Follow up via timed email sequences (Day 1/3/7)
4. Track everything in `lead_state.db` (SQLite, single source of truth)

## Key files
- `lead_store.py` — SQLite lead state. Use `LeadStore()` for all lead reads/writes. Never write to `audit_leads.jsonl` directly for new leads (legacy).
- `followup_sequence.py` — Day 1/3/7 email sequences. Runs every 6h via cron. Idempotent via `followup_state.jsonl`.
- `ramp_pipeline_fill.py` — Scrapes + sends initial outreach. Runs every 2h. Uses `flock` lock at `.pipeline_ramp.lock` (deleted on exit via `trap`).
- `pipeline_health_check.py` — 15 checks. Always exits 0 (warnings in stdout only). Run to verify state.
- `surge_high_pain_outreach.py` — Manual/weekly surge outreach. Dedupes against `outreach_evidence.jsonl` + `HOT_LEAD.json` + `lead_state.db`.
- `deliver_audit.py` — Sends the free audit PDF to a lead.
- `stripe_webhook.py` — Handles `checkout.session.completed`, `.expired`, abandoned cart recovery.
- `bounce_detector.py` — Scans AgentMail SMTP inbox for NDR/DSN bounce signals.
- `signal_scrapers.py` — Always-on signal scrapers (hiring, job-change, competitor launches, G2 reviews, events). Outputs to `signal_leads.jsonl` + `signal_insights.jsonl`. Runs daily 08:00 UTC via cron `signal-scrapers` (id: `8906e420729f`).
- `signal_leads.jsonl` — New leads from signal scrapers (hiring triggers, event attendees, job-changers).
- `signal_insights.jsonl` — Competitive intelligence (G2 pain themes, competitor launches).
- `signal_dedup.jsonl` — Dedup keys for signal scrapers (prevents re-scraping same records).

## Lead stage flow
`contacted` → `audit_delivered` → `pitch_sent` → `paid`
Bounced leads: stage=`bounced`, bounce_type=`hard`|`soft` in `lead_state.db`

## Things to get right (I get these wrong without reminders)

**Bounce checks must happen in EVERY email-sending path.**
Always call `LeadStore().is_bounced(email)` before any `smtplib.sendmail()`. Missing this was a recurring bug — bounced leads were re-pitched after being marked in the DB.

**Lock file must be deleted on exit, not just released.**
`flock` releases the lock when fd closes but does NOT delete the file. Always use `trap 'rm -f "$LOCK"' EXIT` in shell scripts. A lock file with no running process = false positive in health check.

**`lead_state.db` is the source of truth. `HOT_LEAD.json` + `audit_leads.jsonl` are secondary.**
When a lead is missing from DB but present in JSON files, add them to the DB — don't just patch the JSON. The DB has `is_bounced()`, `mark_bounced()`, stage queries.

**`RECYCLE_SEQ` Day 1 (24h nudge) must exist.**
Pitch-sent leads need a touch at 24h. Without it, leads go silent from pitch time until 72h recycle. The Day 1 nudge in `RECYCLE_SEQ` must be the first entry.

**`pipeline_health_check.py` exits 0 always.**
Failures are stdout warnings, not exit codes. Exit 1/2 causes noisy cron alerts. Never change exit behavior.

**HOT_LEAD.json writes must be atomic.**
Always write to `.json.tmp` then `os.rename()`. Never write directly to `HOT_LEAD.json` — concurrent cron runs will corrupt it.

**Cron `no_agent=True` jobs require a `.sh` file path, not a shell command string.**
Scripts live in `~/.hermes/scripts/`. Always create a wrapper `.sh` and point `script=` at the path.

Outbound email.
FROM: `ops@launchcrate.io` via AgentMail REST API (no SMTP — blocked).
Org API key at `~/.hermes/secrets/agentmail_org.key`.
Inbox key (scoped) at `~/.hermes/secrets/agentmail.key`.
All outbound scripts should use `agentmail_client.py` (REST) or direct REST calls.
Followup sequence uses `agentmail_client.py` internally — updated Dec 2025.

**Apify actor IDs (don't guess).**
- Reddit: `harshmaur/reddit-scraper`, `trudax/reddit-scraper-lite`
- LinkedIn engagers: `scraping_solutions/linkedin-posts-engagers-likers-and-commenters-no-cookies`
- LinkedIn posts search: `apimaestro/linkedin-posts-search-scraper-no-cookies`
- LinkedIn profile+email: `harvestapi/linkedin-profile-scraper`
- LinkedIn company: `harvestapi/linkedin-company`
- LinkedIn jobs: `curious_coder/linkedin-jobs-scraper`
- G2 reviews: `zen-studio/g2-reviews-scraper`
- Web scraper: `apify/web-scraper`

**Stripe webhook secret in env, not hardcoded.**
Webhook endpoint ID: `we_1TpvxcEINR1kU9chEzxagrFK`. Secret in env var `STRIPE_WEBHOOK_SECRET`.

## How to run things
```bash
# Always use venv
venv/bin/python3 pipeline_health_check.py

# Dry-run followup (check before firing)
venv/bin/python3 followup_sequence.py --dry-run

# Manual ramp (clear lock first if stale)
rm -f .pipeline_ramp.lock && venv/bin/python3 ramp_pipeline_fill.py

# Check lead state
python3 -c "import sqlite3; c=sqlite3.connect('lead_state.db'); print(list(c.execute('SELECT stage,COUNT(*) FROM leads GROUP BY stage')))"
```

## Cron schedule
| Job | Schedule | Script |
|-----|----------|--------|
| pipeline-ramp | every 2h | `pipeline_ramp.sh` |
| followup-sequence | every 6h | `followup_sequence.sh` |
| bounce-scan | every 30m | `bounce_scan_cron.py` |
| health-check | every 15m | `pipeline_health_check.sh` |
| surge-weekly | Mon 09:00 UTC | `surge_weekly.sh` |
| testimonial+abandoned-cart | every 2h | `testimonial_queue.sh` |
| signal-scrapers | daily 08:00 UTC | `signal_scrapers.sh` |

## What NOT to do
- Never write to `lead_state.db` with raw SQL outside `lead_store.py`
- Never send email without checking `is_bounced()` first
- Never delete `.pipeline_ramp.lock` manually during a live run (check `ps` first)
- Never use system python — always `venv/bin/python3`
- Never modify `followup_state.jsonl` directly — it's the idempotency guard
- Never write to `HOT_LEAD.json` without atomic `.tmp` → rename
