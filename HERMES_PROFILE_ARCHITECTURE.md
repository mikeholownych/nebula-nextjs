# HERMES PROFILE ARCHITECTURE — AUTONOMOUS BUSINESS OS

## Critical Insight from Profiles Guide

Running everything in one profile = **no isolation, no security, no scalability.**

Each operational boundary needs its own profile:
- Own config
- Own secrets/API keys
- Own skills/procedures
- Own memory
- Own gateway bots
- Own cron jobs

---

## Current State (PROBLEM)

```
~/.hermes/default/
  ├── All personal work (Mike)
  ├── All business OS code (Autonomous agent)
  ├── All cron jobs (Campaign + accountability)
  ├── All secrets (Personal + business)
  └── All memory (Personal + business mixed)
```

**Issues:**
- Business agent has access to personal secrets
- Personal memory gets contaminated with business data
- Can't isolate customer data if we sell this
- No clean separation between experiments and production
- If default profile breaks, entire system fails

---

## Target State (FIXED)

```
~/.hermes/profiles/

default/
  ├── Personal assistant (Mike's work)
  ├── Personal secrets
  ├── Personal skills
  └── Personal cron jobs (not business-related)

business-os/                    ← PRODUCTION
  ├── Autonomous business agent
  ├── Business-only secrets (AgentMail key, Stripe key, etc.)
  ├── Business skills (audit automation, email sending, etc.)
  ├── Business cron jobs (campaigns, audits, checkpoints)
  ├── Business memory (customer data, offer performance, etc.)
  └── Business sessions (only business transcripts)

customer-1/                     ← FUTURE: If we onboard customers
  ├── Customer 1's bot
  ├── Customer 1's API keys (ONLY)
  ├── Customer 1's skills
  ├── Customer 1's memory (isolated from other customers)
  └── Customer 1's cron jobs

testing/                        ← For risky experiments
  ├── Experimental MCP servers
  ├── New model tests
  ├── Dangerous automations
  └── Isolated from production

researcher/                     ← Already exists
  ├── Research assistant (separate model)
```

---

## Migration Plan (Next Challenge Iteration)

### Phase 1: Create business-os profile (DONE)
```bash
hermes profile create business-os
```

### Phase 2: Move business secrets to business-os profile
```bash
# Copy only business-related secrets
hermes -p business-os secrets setup
# Add: AGENTMAIL_API_KEY, STRIPE_KEY, etc.
```

### Phase 3: Move business skills to business-os profile
```bash
# Move these skills to ~/.hermes/profiles/business-os/skills/:
# - send_audit_blast.py
# - auto_respond_to_audit_interest.py
# - monitor_inbox.py
# - etc.
```

### Phase 4: Recreate business cron jobs in business-os profile
```bash
hermes -p business-os cron create ...
# Copy all 10 cron jobs from default to business-os
# Then delete them from default
```

### Phase 5: Test business-os profile independently
```bash
hermes -p business-os status
hermes -p business-os cron list
```

### Phase 6: Set business-os as primary for business operations
```bash
# For CEO scripts: always use -p business-os flag
# hermes -p business-os chat -q "..."
# hermes -p business-os cron run <job_id>
```

---

## Why This Matters for the 72-Hour Challenge

**Current:** Running in default profile
- Pro: Already working, live, no disruption needed
- Con: Mixing business and personal context

**For next iteration:** Separate business-os profile
- Pro: Clean isolation, safer, more professional, scalable to customers
- Con: One-time migration effort (1-2 hours)

**Recommendation:** Finish this challenge in default profile (already deployed). When we do post-mortem, create business-os profile and migrate everything for the next 72-hour iteration.

---

## Security Checklist (From Profiles Guide)

Before shipping business-os to customers, verify:

- **Secrets:** Does business-os/.env contain ONLY business keys?
  - AgentMail API key: ✓
  - Stripe key: ✓
  - Personal GitHub key: ✗ (should NOT be here)
  - Personal AWS keys: ✗ (should NOT be here)

- **Tools:** Are terminal, browser, file tools enabled only when necessary?
  - Terminal: ✓ (needed for email scripts)
  - Browser: ✓ (could be useful)
  - File: ✓ (needed for tracking)
  - MCP: ✗ (disable for production)

- **Skills:** Are business-specific skills stored under business-os?
  - Audit automation skills: ✓ (move to business-os)
  - Email sending: ✓ (move to business-os)
  - Personal writing helper: ✗ (keep in default)

- **Memory:** Does business-os memory contain only business data?
  - Customer info: ✓
  - Revenue numbers: ✓
  - Personal notes: ✗ (should NOT be here)

- **Gateway:** Is the bot token unique to this profile?
  - Business email: ✓ (nebulashop@agentmail.to, isolated in business-os)

- **Delivery:** Are cron jobs pointed at the intended output?
  - Cron jobs deliver to origin: ✓ (Telegram)

---

## The Bigger Picture: Multi-Agent Product Architecture

When we turn this into a product:

```
SaaS Platform (business-os as template)
  ├── Each customer gets a separate profile: customer-X
  ├── Each customer's data isolated
  ├── Shared skills (audit automation, email sending)
  ├── Shared backend (Stripe, database)
  ├── Separate memory per customer
  └── Separate cron jobs per customer instance
```

This is how Hermes profiles unlock **multi-tenant autonomous agents at scale.**

We're not just building one business OS. We're building infrastructure for dozens of business OSs running in parallel, each in its own profile, completely isolated.

---

## Next Steps

1. ✅ **This challenge (72h):** Keep in default profile (working)
2. ✅ **Post-mortem (72h+ 6h):** Create business-os profile
3. ✅ **Next iteration:** Migrate all business code to business-os
4. ⏳ **Future:** Template business-os for multi-customer SaaS
5. ⏳ **Scale:** Run 100s of isolated business agents simultaneously

The profile system makes this possible.
