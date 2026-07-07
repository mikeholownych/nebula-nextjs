# MANDATORY: Audit Pipeline Rules

## Pre-Audit Checks
1. Verify `deliver_audit.py` exists at project root
2. Confirm `agentic_server.py` running on port 8765
3. Confirm AgentMail key at `~/.hermes/secrets/agentmail.key`
4. Check `LeadStore.is_bounced()` before any send
5. Verify lead stage state — do not re-send to `pitch_sent` leads

## Scoring
- 5 dimensions: clarity, CTA friction, trust gap, offer specificity, implementation difficulty
- Each dimension: 0-10 score + evidence + fix + difficulty rating
- Score tiers: <6 = critical framing, 6-7.9 = fixable, >=8 = fine-tuning
- ALL delivered audits get pitched with score-appropriate framing

## Delivery
- Compose via `deliver_audit.py:compose_email()`
- Send via AgentMail REST API (`nebulashop@agentmail.to` inbox)
- Atomic writes: write `.tmp` then `os.rename()`
- Append to `audit_leads.jsonl` before send completes

## Post-Delivery
- Advance lead: `contacted → audit_delivered → pitch_sent`
- Recycle sequence starts at Day 1 (24h nudge)
- Night-watch re-scan after 7 days
- Always check `LeadStore.is_bounced()` before Day 3 follow-up

## Audit Trail Format
```markdown
## [Stage Name]
**Timestamp**: YYYY-MM-DDTHH:MM:SSZ
**User Input**: "Complete raw input"
**Action**: What was done
**Result**: Outcome + evidence
```
