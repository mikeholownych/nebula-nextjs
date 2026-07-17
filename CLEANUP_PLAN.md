# Repo Cleanup Plan — Post-Next.js Cutover

**Date:** 2026-07-17
**Status:** Ready for execution
**Goal:** Remove deprecated HTML/Python web server, preserve business logic, clean repo structure

---

## What Changed

- **Before:** Python server on port 8765 served 1,560 HTML files
- **After:** Next.js on port 3000 serves 77 pages from `customer-portal/`
- **Legacy services:** `nebula-site.service` and `nebula-webhook.service` disabled

---

## Categories of Files

### 1. KEEP (Active Business Logic)

**Python (lead-gen, email, pipeline):**
- `hot_lead_watcher.py` — cron job, active
- `followup_sequence.py` — cron job, active
- `trigger_lead_engine.py` — cron job, active
- `tunnel_liveliness_check.py` — cron job, active
- `lead_store.py` — used by above
- `agentmail_client.py` — email integration
- `reply_monitor.py` — inbox monitoring
- `sales_pipeline_orchestrator.py` — pipeline logic
- `pipeline_health_check.py` — monitoring
- `ramp_pipeline_fill.py` — lead engine
- `check_agentmail_inbox.py` — inbox check

**Directories:**
- `customer-portal/` — **MAIN APP**, Next.js site
- `web/` — can be removed (empty scaffold, not used)
- `.aidlc/` — AI-DLC workflow rules
- `ledgers/` — log files for cron jobs
- `audit_pipeline/` — audit delivery logic
- `.worktrees/` — git worktrees for development
- `.github/` — CI/CD workflows
- `platform_api/` — FastAPI scaffold (merged from worktree)

**Configs:**
- `.gitignore`, `.prettierrc`, `.eslintrc*` — keep
- `requirements*.txt` — keep for Python deps
- `package.json` at root — keep if exists

### 2. ARCHIVE (Deprecated Web Server)

**HTML files (root):**
- All `*.html` at repo root (42 files)
- These were served by Python server, now replaced by `customer-portal/app/`

**Python web server:**
- `agentic_server.py` — main server, deprecated
- `stripe_webhook.py` — webhook handler, deprecated (webhooks now in platform_api/)
- `agentic_seo_server.py` — SEO server, deprecated
- `test_server.py` — test server, deprecated

**Stripe setup scripts (one-time use):**
- `create_997_stripe.py`
- `fix_stripe.py`
- `setup_97_stripe.py`
- `setup_stripe.py`
- `setup_webhook.py`

**Pytest cache:**
- `.pytest_cache/` — can archive

**Systemd service files (moved to .legacy):**
- `nebula-site.service` — disabled
- `nebula-webhook.service` — disabled

### 3. REMOVE (Temporary/Generated)

- `.next/` at root — old build cache (if exists)
- `__pycache__/` — Python bytecode cache
- `node_modules/` at root — if exists (customer-portal has its own)
- `*.pyc`, `*.pyo` — compiled Python
- `.DS_Store`, `Thumbs.db` — OS files
- `*.log` at root — move to ledgers/ or delete

### 4. REVIEW (Uncertain)

- `scripts/` at root — may contain utility scripts still in use
- `adapters/` — check if used by Next.js app
- `archived/` — already archived content
- `auto-responder/` — may still be active
- `docs/` — documentation, review relevance
- Various `.md` files — review and update

---

## Execution Plan

### Phase 1: Safe Archive (No deletion)

```bash
# Create archive directory
mkdir -p .legacy/html-site
mkdir -p .legacy/python-web-server
mkdir -p .legacy/stripe-setup

# Move HTML files
mv *.html .legacy/html-site/

# Move deprecated Python
mv agentic_server.py stripe_webhook.py agentic_seo_server.py .legacy/python-web-server/

# Move Stripe setup scripts
mv create_997_stripe.py fix_stripe.py setup_*.py .legacy/stripe-setup/

# Move systemd service files
mv nebula-site.service nebula-webhook.service .legacy/ 2>/dev/null || true

# Create inventory
find .legacy -type f > .legacy/ARCHIVE_INVENTORY.txt
```

### Phase 2: Clean Temporary Files

```bash
# Remove Python cache
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null
find . -name "*.pyc" -delete

# Remove old build caches
rm -rf .next/ .pytest_cache/

# Remove empty directories
find . -type d -empty -delete 2>/dev/null
```

### Phase 3: Update .gitignore

Add to `.gitignore`:
```
# Archived legacy content
.legacy/

# Python
__pycache__/
*.pyc
*.pyo
.pytest_cache/

# Next.js build
.next/

# OS files
.DS_Store
Thumbs.db
```

### Phase 4: Update Cron Jobs (Manual)

Review which Python scripts are still needed:
- Keep: `hot_lead_watcher.py`, `followup_sequence.py`, `trigger_lead_engine.py`, `tunnel_liveliness_check.py`
- Review: others may need updating to work with Next.js API routes

### Phase 5: Remove web/ Scaffold

The `web/` directory is an empty scaffold created during transformation. The real app is `customer-portal/`.

```bash
# Move to archive (don't delete yet)
mv web/ .legacy/web-scaffold/
```

---

## Verification

After cleanup:

```bash
# Verify Next.js still works
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/

# Verify tunnel still routes correctly
curl -s -o /dev/null -w "%{http_code}" https://nebulacomponents.shop/

# Verify cron jobs still running
systemctl status cron

# Check repo size
du -sh .
```

---

## Rollback Plan

If anything breaks:

```bash
# Restore archived files
cp -r .legacy/html-site/*.html .
cp -r .legacy/python-web-server/*.py .

# Re-enable systemd services (if needed)
sudo systemctl enable nebula-site.service
sudo systemctl start nebula-site.service
```

---

## Estimated Impact

- **Files archived:** ~100
- **Space freed:** ~50-100 MB (HTML + Python + caches)
- **Risk:** Low — all archived, not deleted
- **Reversible:** Yes — all files in `.legacy/`

---

## Approval Required

Before executing:
1. Confirm lead-gen cron jobs don't depend on deprecated Python files
2. Confirm `customer-portal/` is fully functional
3. Confirm no other services depend on port 8765
4. User approval to proceed
