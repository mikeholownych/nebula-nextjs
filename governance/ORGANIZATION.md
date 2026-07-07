# ORGANIZATION — Nebula Components Department Map

**Last updated:** 2026-07-07
**Status:** Active
**Update cadence:** When agents, crons, or ownership changes

---

## Structure

Nebula operates as 13 departments managed by the Hermes CEO Agent with delegated sub-agents and cron jobs. This document maps each department to its owner, execution mechanism, KPIs, and living docs.

### Department Legend

- **Agent:** Autonomous sub-agent profile (runs on schedule/trigger)
- **Cron:** Scheduled job (runs on crontab or Hermes cron)
- **Script:** On-demand or event-triggered script
- **File:** Living document / source of truth

---

## Departments

### CEO Office

**Owner:** CEO Agent (Hermes)
**Mechanism:** Hermes session (with SOUL.md system prompt) + daily cadence

| Function | Mechanism | Schedule | Location |
|---|---|---|---|
| Strategic direction | CEO Agent reasoning | Per session | `SOUL.md` (system prompt) |
| Daily priority setting | CEO Agent | 9 AM ET | Decision communicated to agents |
| 6 PM decision memo | CEO Agent output | 6 PM ET | Delivered to Mike via Telegram |
| Spend approval (> $50) | CEO Agent → Mike | As needed | Escalation log |
| Decision log | CEO Agent | Per decision | `governance/DECISIONS/` |
| Retrospective | CEO Agent | Every 30 days | `governance/RETROSPECTIVES/` |

**KPIs:** MRR, pipeline velocity, decision accuracy, escalation rate
**Living docs:** `governance/MISSION.md`, `governance/VALUES.md`, `governance/ORGANIZATION.md`

---

### Sales

**Owner:** growth agent
**Mechanism:** Cron jobs + scripts

| Function | Mechanism | Schedule | Owner |
|---|---|---|---|
| Lead generation (Apify LinkedIn) | `apify_linkedin_pipeline.py` | On demand / cron | growth |
| Lead generation (Reddit) | `reddit_trigger_monitor.py` | Every 4h | growth |
| Trigger-aware email outreach | `trigger_lead_engine.py` | Daily (9 AM) | growth |
| Prospect enrichment | `prospect_scraper_v2.py` | Per batch | growth |
| Quality scoring | `claude_growth_system.py` | On lead creation | growth |
| LinkedIn engager monitoring | `linkedin_post_monitor.py` | Every 2h | growth |
| Cold email frameworks | `cold_email_frameworks.json` | Reference | growth |
| Outreach prompt architecture | `outreach_prompt_architecture.md` | Reference | growth |

**KPIs:** MQLs created, lead score distribution, audit requests generated
**Targets:** 25+ new qualified leads/week, 100+ free audits delivered/mo
**Living docs:** `growth_system/cold_email_frameworks.json`, `growth_system/ICP_MEMO.md`

---

### Marketing

**Owner:** growth agent (content sub-function)
**Mechanism:** Cron jobs + scheduled posts

| Function | Mechanism | Schedule | Owner |
|---|---|---|---|
| Daily LinkedIn post | `linkedin-post-of-the-day` cron | Daily (11:00 UTC) | growth |
| LinkedIn engagement routine | Manual (guided by `daily_engagement_routine.md`) | Daily | Mike |
| Content calendar | `content_calendar_30d.json` | Reference | growth |
| GTM content angles | `linkedin_gtm_framework.md` | Reference | growth |
| Voice enforcement | `Nebula_Voice_DNA.md` | Per post | growth |
| Lead magnet | Free audit at nebulacomponents.shop/audit | Always live | Product (shared) |

**KPIs:** Post engagement rate, content-driven audit requests, follower growth
**Targets:** 5-7 posts/week, each with specific CTA (never "what do you think?")
**Living docs:** `growth_system/Nebula_Voice_DNA.md`, `growth_system/content_calendar_meta.json`

---

### Customer Success

**Owner:** support agent
**Mechanism:** Inbox monitoring + automated replies

| Function | Mechanism | Schedule | Owner |
|---|---|---|---|
| Inbox monitoring | `reply-monitor` cron | Every 15 min | support |
| Audit delivery | `deliver_audit.py` | Trigger (on request) | support |
| Reply classification | support agent reasoning | Real-time | support |
| Objection handling | `linkedin_reply_templates.json` | Reference | support |
| Warm DM sequence | 3-touch flow in `reply_templates.json` | Per lead | support |

**KPIs:** Reply time (< 30 min), objection-to-resolution rate, customer satisfaction
**Targets:** Reply within 1h during waking hours, 80%+ issue resolution at first touch
**Living docs:** `growth_system/linkedin_reply_templates.json`, `growth_system/Nebula_Followup_Skill.md`

---

### Engineering

**Owner:** CEO Agent (executes via terminal + cron)
**Mechanism:** Direct implementation, testing, deployment

| Function | Mechanism | Schedule | Owner |
|---|---|---|---|
| Feature development | CEO Agent | Per session | CEO |
| Testing | `tests/` (pytest) | On commit | CEO |
| Code review | Self-review + style checks | On commit | CEO |
| CI/CD | git + cron deployment | On commit | CEO |
| Automation improvements | CEO Agent | Per iteration | CEO |
| Infrastructure maintenance | CEO Agent | As needed | CEO |

**KPIs:** Test coverage, deployment reliability, feature velocity, bug rate
**Targets:** Tests pass before every commit, zero regressions
**Living docs:** `/home/mike/nebula/CLAUDE.md`, `coding_patterns.md`

---

### Operations

**Owner:** ops-finance agent
**Mechanism:** Cron jobs + automated monitoring

| Function | Mechanism | Schedule | Owner |
|---|---|---|---|
| Tunnel monitoring | `tunnel_liveliness_check.py` | Every 5 min | ops-finance |
| Pipeline health checks | `pipeline_health_check.py` | Every 6h | ops-finance |
| Nightly ops report | `night_watch.py` | Every night (2 AM) | ops-finance |
| SRE recovery | `sre_responder.py` | Every 6h | ops-finance |
| Bounce detection | `bounce_detector.py` | Per send | ops-finance |
| Follow-up sequence | `followup_sequence.py` | Every 6h | ops-finance |
| Ramp pipeline fill | `ramp_pipeline_fill.py` | Every 2h | ops-finance |
| Website uptime | Server health check | Every 5 min | ops-finance |

**KPIs:** Uptime (99.9%+), pipeline health pass rate, recovery time from failure
**Targets:** Self-heal 90%+ of incidents without escalation
**Living docs:** `governance/SOPs/`, `governance/INCIDENTS/`

---

### Finance

**Owner:** ops-finance agent
**Mechanism:** Manual tracking + automated data collection

| Function | Mechanism | Schedule | Owner |
|---|---|---|---|
| Cost monitoring | `night_watch_report.json` | Daily | ops-finance |
| Revenue tracking | Stripe dashboard | Per transaction | ops-finance |
| Budget enforcement | Per VALUES.md | Per spend decision | ops-finance |
| Financial reporting | `governance/ECONOMICS.md` | Weekly | ops-finance |

**KPIs:** Burn rate vs budget, revenue captured, cost anomalies detected
**Targets:** Zero cost surprises, all spend traceable to a decision log
**Living docs:** `governance/ECONOMICS.md`

---

### Legal & Compliance

**Owner:** CEO Agent (with Mike escalation for contracts)
**Mechanism:** File-based + pre-commit checklist

| Function | Mechanism | Schedule | Owner |
|---|---|---|---|
| Privacy | Data privacy in `deliver_audit.py` | Baked into code | CEO |
| Licensing | Open source compliance | On dependency add | CEO |
| Terms | Present on site | On deploy | CEO |
| Third-party risk | Tracked in `governance/ECONOMICS.md` | Ongoing | ops-finance |
| AI compliance | UCP endpoint, compliance footer | Baked into system | CEO |

**KPIs:** Compliance issues found, data privacy complaints, license violations
**Targets:** Zero compliance violations, all third-party dependencies license-checked
**Living docs:** Notion (external reference)

---

### Analytics

**Owner:** ops-finance agent (data collection) + CEO Agent (analysis)
**Mechanism:** Cron jobs + periodic reports

| Function | Mechanism | Schedule | Owner |
|---|---|---|---|
| Metrics collection | `metrics_puller.py` | Daily | ops-finance |
| Attribution tracking | `attribution_report.py` | Daily | ops-finance |
| Pipeline health | `pipeline_health_check.py` | Every 6h | ops-finance |
| Conversion metrics | `get_conversion_metrics.py` | Daily | ops-finance |
| Copy fatigue detection | `copy_fatigue_detector.py` | Weekly | CEO |

**KPIs:** Metric completeness, report timeliness, data accuracy
**Targets:** Every significant action produces a metric, zero blind spots
**Living docs:** `metrics_tracker.json`, `pipeline_health.json`

---

### Research

**Owner:** market agent
**Mechanism:** Web extraction + cron + manual study

| Function | Mechanism | Schedule | Owner |
|---|---|---|---|
| ICP research | `ICP_MEMO.md` | Periodic | market |
| Competitor analysis | `competitive/*.jsonl` | Per source reviewed | market |
| Buying trigger mapping | `waterfall_icp_config.py` | Ongoing | market |
| User research (Cookiy) | `cookiy-user-research` skill | On demand | market |
| Content gap analysis | `keyword_gaps.md` | Periodic | market |
| AI citation research | `ai_citation_score.py` | Periodic | market |

**KPIs:** Actionable insights generated, experiments informed by research
**Targets:** Every research output produces at least one concrete implementation
**Living docs:** `growth_system/ICP_MEMO.md`, `competitive/`

---

### Growth

**Owner:** growth agent
**Mechanism:** Cron jobs + iterative optimization

| Function | Mechanism | Schedule | Owner |
|---|---|---|---|
| Lead scoring | `linkedin_post_monitor.py` | Every 2h | growth |
| Pipeline fill | `ramp_pipeline_fill.py` | Every 2h | growth |
| Upwork job scraping | `upwork_bidder.py` | Every 2h | growth |
| Retainer upsell | `retainer_upsell.py` | Every 6h | growth |
| Content optimization | A/B post testing | Per post | growth |
| Trigger refinement | Signal strength scoring | Per iteration | growth |

**KPIs:** Pipeline velocity, lead-to-audit conversion rate, cost per lead
**Targets:** 10%+ week-over-week pipeline growth, < $5 cost per qualified lead
**Living docs:** `growth_system/`, `linkedin_post_monitor.py`

---

### Infrastructure

**Owner:** ops-finance agent
**Mechanism:** Automated monitoring + self-healing

| Function | Mechanism | Schedule | Owner |
|---|---|---|---|
| Server uptime | `agentic_server.py` (running on port 8765) | 24/7 | ops-finance |
| Tunnel stability | `tunnel_monitor_daemon.py` | 24/7 | ops-finance |
| Backup (git) | `git push` | On commit | CEO |
| Recovery runbooks | `governance/SOPs/` | Reference | ops-finance |
| Performance monitoring | `tunnel_metrics.json` | Ongoing | ops-finance |

**KPIs:** Server uptime, tunnel uptime, recovery time from failure
**Targets:** 99.9% uptime, recovery in < 5 min for common failures
**Living docs:** `governance/SOPs/`, `tunnel_alert.py`

---

## Agent-to-Department Mapping

| Agent Profile | Departments Owned | Reports To |
|---|---|---|
| CEO Agent (Hermes) | CEO Office, Engineering, Legal | Mike (strategic) |
| growth agent | Sales, Marketing, Growth | CEO Agent |
| market agent | Research | CEO Agent |
| ops-finance agent | Operations, Finance, Analytics, Infrastructure | CEO Agent |
| support agent | Customer Success | CEO Agent |

## Escalation Path

| Issue | Escalate To | Method |
|---|---|---|
| Spend > $50 | Mike | Telegram DM |
| Legal risk | Mike | Telegram DM |
| Irreversible action | Mike | Telegram DM |
| Strategic direction change | Mike | Telegram DM |
| Routine execution issue | Self-recover or SOP | Automation |
| Performance optimization | CEO Agent | Reasoning |
| Cross-agent coordination | CEO Agent | Task delegation |

## Living Documents Index

| Document | Location | Owner | Update Cadence |
|---|---|---|---|
| MISSION.md | `governance/` | CEO | Quarterly |
| VALUES.md | `governance/` | CEO | Quarterly |
| ECONOMICS.md | `governance/` | ops-finance | Weekly |
| ORGANIZATION.md | `governance/` | CEO | Monthly |
| Offer architecture | `growth_system/OFFER_MEMO.md` | market | Per change |
| ICP research | `growth_system/ICP_MEMO.md` | market | Per research cycle |
| Voice DNA | `growth_system/Nebula_Voice_DNA.md` | growth | Per improvement |
| Cold email frameworks | `growth_system/cold_email_frameworks.json` | growth | Per experiment |
| Reply templates | `growth_system/linkedin_reply_templates.json` | support | Per experiment |
| Content calendar | `growth_system/content_calendar_meta.json` | growth | Monthly |
| Competitive intel | `competitive/*.jsonl` | market | Per source |
| Decision log | `governance/DECISIONS/` | CEO | Per decision |
| Experiment log | `governance/EXPERIMENTS/` | CEO | Per experiment |
| Incident log | `governance/INCIDENTS/` | ops-finance | Per incident |
| SOPs | `governance/SOPs/` | ops-finance | Per improvement |
| Retrospectives | `governance/RETROSPECTIVES/` | CEO | Every 30 days |
