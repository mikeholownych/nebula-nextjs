# Autonomous Skill Architecture Review → Nebula Business OS

Reviewed repo: `aniket-work/autonomous-skill-architecture` at commit `e6103dc`.
Smoke test: cloned to `/tmp/autonomous-skill-architecture`, installed `requirements.txt` in `/tmp/asa-venv`, ran `python main.py` successfully.

## Verdict
Use the repo as an **architecture pattern**, not as production code.

It has the right 4-step shape:
1. Market Pulse → identify external demand
2. Gap Finder → compare current capability vs demand
3. Roadmap Maker → build a phased learning plan
4. Source Finder → attach resources

But the implementation is a static PoC:
- hardcoded market skills
- hardcoded user profile
- fake resource URLs
- no persistence
- no feedback loop
- no tests
- no agent runtime integration

## Best adaptation for Nebula
Convert the repo's career-upskilling loop into a **Business OS Agent Skill Loop**:

```
External business objective
  ↓
Skill Pulse: what does this agent need to execute today?
  ↓
Capability Gap Finder: what does this agent currently lack?
  ↓
Skill Roadmap Maker: what skills/runbooks/tools should be loaded or created?
  ↓
Skill Scout: map to Hermes skills, docs, scripts, examples, or new-skill tasks
  ↓
Execution + scorecard
  ↓
Promote reusable learning into skill/memory; retire useless skills
```

## Agent-specific skill matrix

### CEO / default
Purpose: decision quality, bottleneck removal, evidence integrity.

Required skills:
- `autonomous-business-os`
- `autonomous-business-execution`
- `rapid-revenue-challenge`
- `break_even_analysis`
- `revenue_tracking`
- `repository-quality-review`
- `verification-before-completion`

Learning signals:
- daily memo misses bottleneck
- agent repeats same failed channel
- decision not backed by ledger evidence
- cron lacks required toolsets/skills

### Growth Agent
Purpose: trigger-aware lead acquisition and outbound execution.

Required skills:
- `trigger-aware-lead-gen-pipeline`
- `high-intent-outreach`
- `cold-email-campaigns`
- `prospect-list-verification`
- `audit_email_replies`
- `watchers`
- `scrapling`
- `domain-intel`

Learning signals:
- low reply rate after 2 waves
- bounce/complaint spike
- leads do not match buying trigger
- emails contain friction like “reply yes” instead of direct checkout/audit path

### Market Agent
Purpose: ICP validation, buying-trigger mapping, opportunity scoring.

Required skills:
- `competitor-analysis`
- `keyword-research`
- `serp-analysis`
- `content-gap-analysis`
- `domain-intel`
- `polymarket` when market probabilities matter
- `osint-investigation` when public-company/customer research matters

Learning signals:
- targeting based on demographics instead of trigger
- weak/no commercial signal
- ICP definition fails to predict pain or urgency

### Support Agent
Purpose: inbox triage, audit fulfillment, reply classification.

Required skills:
- `agentmail-automation`
- `email`
- `himalaya`
- `audit_email_replies`
- `dual_funnel_autoresponder`
- `mail-delivery-troubleshooting`
- `agentmail-authentication`

Learning signals:
- hot reply not classified within SLA
- autoresponder fails
- audit delivery blocked
- warm lead left without checkout/self-serve path

### Ops-Finance Agent
Purpose: ledger integrity, revenue/cost truth, break-even status.

Required skills:
- `revenue_tracking`
- `break_even_analysis`
- `stripe-link-cli`
- `chief-of-staff-brief`
- `verification-before-completion`

Learning signals:
- revenue claim not backed by Stripe/ledger
- missing cost entry
- customer ledger inconsistent with webhook events
- daily report mixes FACT/INFERENCE/SPECULATION

## Implementation recommendation

### P0: Wire skill manifests into each autonomous run
Every cron/agent prompt should include a `skills=[...]` list and `enabled_toolsets=[...]`. Do not rely on the model remembering.

Current observation from `cronjob list`:
- Challenge day jobs already have useful skill lists.
- Several watchdog/script jobs are script-only, which is fine.
- `ceo-daily-memo` and `challenge_self_audit_6h` have no skills attached; acceptable only if prompts are fully self-contained, but better to attach `autonomous-business-os`, `revenue_tracking`, `break_even_analysis`, `verification-before-completion`.

### P1: Add a Skill Gap Ledger
Create `/home/mike/nebula/ledgers/skill-gap-ledger.jsonl`.

Schema:
```json
{
  "ts": "ISO-8601",
  "agent": "growth|market|support|ops-finance|ceo",
  "objective": "what the agent had to do",
  "failure_or_gap": "specific observed weakness",
  "needed_skill": "existing Hermes skill or new skill name",
  "evidence": "file/log/url/cron id",
  "action": "loaded_skill|patched_skill|created_skill|retired_skill|no_action",
  "status": "open|closed"
}
```

### P2: Add a daily Skill Pulse step to CEO memo
Before deciding next actions, CEO should ask:
1. Which business outcome failed or stalled today?
2. Which agent owned it?
3. Was the failure due to missing skill, missing tool, bad prompt, bad data, or external blocker?
4. Which skill should be attached, patched, created, or removed?
5. What evidence will prove tomorrow that the fix worked?

### P3: Convert repeated fixes into Hermes skills
Rule:
- If an agent hits the same failure twice, patch an existing skill.
- If a workflow takes 5+ tool calls and will recur, create a new skill.
- If a skill produces no useful execution after 3 uses, retire or rewrite it.

## Do not copy from the repo
Do not copy its code into production directly. The useful asset is the orchestration model. Its concrete Python is demo-only.

## Recommended next action
Patch the two CEO cron jobs to attach the core operating skills:
- `autonomous-business-os`
- `revenue_tracking`
- `break_even_analysis`
- `verification-before-completion`

Then create `skill-gap-ledger.jsonl` and require every daily memo to include one line: `Skill architecture decision: <attach|patch|create|retire|none> ...`.
