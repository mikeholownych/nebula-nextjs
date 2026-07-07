# Nebula Audit Pipeline Extension

## MANDATORY: Audit Pipeline Rules

When any task involves landing page audit delivery, you MUST follow these rules:

### Pre-Audit Checks (Inception)
- Verify `deliver_audit.py` exists at project root
- Check `agentic_server.py` is running on port 8765
- Verify AgentMail key exists at `~/.hermes/secrets/agentmail.key`
- Check `lead_store.py` SQLite is initialized
- **Do NOT send any email without first checking LeadStore.is_bounced()**

### Audit Execution
- Route audit through `deliver_audit.py` scoring engine (5 dimensions: clarity, CTA friction, trust gap, offer specificity, implementation difficulty)
- Always log to `audit_leads.jsonl` before sending
- Score gate: ALL delivered audits get pitched with score-appropriate framing (NEVER gate on score)

### Post-Audit
- Advance lead stage: `contacted → audit_delivered → pitch_sent`
- Write atomic JSON: write to `.tmp` then `os.rename()`
- Check `RECYCLE_SEQ` starts at Day 1 (24h nudge)

### Audit Trail
- Log in `aidlc-docs/audit.md` with ISO 8601 timestamps
- Capture complete raw user input — never summarize
