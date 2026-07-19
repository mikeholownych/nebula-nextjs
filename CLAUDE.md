# CLAUDE.md — Nebula Components (AI-DLC Workflow)

## PRIORITY: This workflow OVERRIDES workspace defaults
When responding to software or pipeline requests, follow the AI-DLC phase-gated workflow.

## AI-DLC Rules Location
Rules are installed at `.aidlc/aidlc-rules/` — the base rules directory per AI-DLC spec:
- `.aidlc/aidlc-rules/aws-aidlc-rules/core-workflow.md` — the 539-line process playbook
- `.aidlc/aidlc-rules/aws-aidlc-rule-details/` — stage-specific rules (loaded on demand)

**CRITICAL:** Always load `common/session-continuity.md` at workflow start for session resumption.
Reference aidlc-docs/audit.md for the full interaction history.

## Nebula-Specific Extensions (opt-in at requirements analysis)
Load these on demand:
- `extensions/nebula/audit-pipeline/audit-pipeline.opt-in.md` → audit delivery rules
- `extensions/nebula/lead-pipeline/lead-pipeline.opt-in.md` → lead state machine + dedup
- `extensions/nebula/compliance-sovereignty/compliance-sovereignty.opt-in.md` → regulated client rules

## Key Operational Facts
- Domain: nebulacomponents.shop
- Server: localhost:8765 (venv: /home/mike/nebula/venv/bin/python3)
- Git: github.com:Nebula-Components/nebula-components.git
- AgentMail inbox: nebulashop@agentmail.to (REST only — NO SMTP)
- Stripe $147 Fix Pack: https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b
- Stripe $1,497 retainer: https://buy.stripe.com/00w5kD1nK0wkaa573A43S0c
- Stripe $497 agency partner: https://buy.stripe.com/aFa8wPc2o7YM9613Ro43S0d
- GA4: G-KJ9S3450LH

## Lead Stage Flow (Check before any send)
discovered → site_found → contacted → audit_delivered → pitch_sent → paid
Terminal: dead, bounced, max_retries_exceeded

## Things I Get Wrong Without Reminders
- **Bounce check placement:** `LeadStore.is_bounced(email)` in BOTH `process_hot_lead_pitches()` AND `ramp_pipeline_fill.py`
- **Lock file cleanup:** ALL `flock` scripts MUST have `trap 'rm -f "$LOCK"' EXIT`
- **Atomic writes:** HOT_LEAD.json → write `.tmp` then `os.rename()`
- **Stripe session.url:** use attribute access (`session.url`), NOT dict method (`session.get("url")`)
- **Score gate:** NEVER gate HOT_LEAD.json entry on `score >= 7`
- **Venv:** always `venv/bin/python3`, never system python3
- **Audit logging in aidlc-docs/audit.md:** append-only, capture COMPLETE raw user input, NEVER overwrite
- **Duplicate send prevention:** set in-memory status BEFORE `UpdateLeadStatus()` write
- **Claude Code sessions:** Starting `claude` inside nebula/ activates AI-DLC. Always use `Using AI-DLC,` prefix to trigger structured workflow.

## What NOT to Do
- Never edit aidlc-docs/audit.md with write_file — always append using terminal (echo >>)
- Never send email without checking LeadStore.is_bounced()
- Never claim SOC 2/GDPR/HIPAA certification — use "-ready" or "practices" language
- Never disable `flock` trap — stale lock files cause false health warnings every cycle

## Design Context (customer-portal)
Full strategic brief lives in `customer-portal/PRODUCT.md` (visual system in `customer-portal/DESIGN.md`). Summary: brand-register marketing site for founders/operators burning ad spend on underperforming landing pages (ecommerce, B2B SaaS, coaches/consultants), plus agencies as a secondary audience via the $497 partner offer. Positioning: "the problem was never the ad, it was the page" — evidence-first, one-time Fix Pack over any retainer framing. Personality: assertive, clinical, evidence-first — diagnostic equipment, not a lifestyle brand. Anti-references: generic AI-SaaS cream, CRO-agency theatrics, black-box-AI styling, SEO-audit-tool genericism. Accessibility target: WCAG 2.2 AAA (note: DESIGN.md still says AA — needs reconciling on next `/impeccable document` pass).
