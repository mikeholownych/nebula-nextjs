# Acquisition Learning System: Disaster Recovery and Data Protection Protocol

This document establishes the recovery objectives, automated backup architecture, restoration procedures, and verified recovery drills for the Acquisition Learning System.

---

## 1. Recovery Objectives and Policy

- **Recovery Point Objective (RPO)**: 24 hours (governed by the daily automated backup cycle at 03:12 UTC).
- **Recovery Time Objective (RTO)**: Under 30 minutes for complete PostgreSQL schema and state restoration.
- **Backup Location Class**: Local persistent filesystem snapshot directory (`/home/mike/nebula/backups/`) with automated 14-day rotation.
- **Off-Site Storage**: Remote replication to object storage is categorized as `DEFERRED` for organizational roadmap.

---

## 2. Automated Backup Architecture

Automated daily backup is executed via `scripts/backup_databases.py` triggered by system cron:

```text
12 3 * * * /home/mike/.local/bin/uv run --project /home/mike/nebula python /home/mike/nebula/scripts/backup_databases.py >> /home/mike/nebula/backups/backup.log 2>&1
```

### Snapshot Contents:
1. **PostgreSQL Databases**:
   - `nebula_platform.sql.gz`: All 13 acquisition tables, views, foreign keys, constraints, and immutability triggers.
   - `nebula_audit.sql.gz`: Customer, audit, and badge records.
2. **SQLite State**:
   - `lead_state.db`, `nebula.db`, `outbound_delivery.db` (via SQLite online backup API).
3. **Ledgers**:
   - `HOT_LEAD.json` and `ledgers/` directory.

---

## 3. Step-by-Step Restoration Procedure

### Step 1: Identify Target Backup Snapshot
```bash
ls -lt /home/mike/nebula/backups/
# Example target: /home/mike/nebula/backups/2026-09-02T14-18-57Z/
```

### Step 2: Restore PostgreSQL Database
```bash
# Stop application services to prevent conflicting writes
sudo systemctl stop nebula-platform-api.service
sudo systemctl stop nebula-nextjs.service

# Decompress and restore nebula_platform snapshot
gunzip -c /home/mike/nebula/backups/2026-09-02T14-18-57Z/nebula_platform.sql.gz | \
  PGPORT=5433 PGHOST=/var/run/postgresql psql -U postgres -d nebula_platform
```

### Step 3: Verify Integrity Controls and Triggers
Execute the verification query to prove triggers were restored:

```bash
PGPORT=5433 PGHOST=/var/run/postgresql psql -U postgres -d nebula_platform -c "
SELECT tgname, relname 
FROM pg_trigger t 
JOIN pg_class c ON t.tgrelid = c.oid 
WHERE tgname LIKE 'trg_%_immutable';
"
```

Expected triggers:
- `trg_acq_meas_immutable` on `acquisition_measurements`
- `trg_decision_rules_immutable` on `decision_rule_sets`
- `trg_meas_versions_immutable` on `measurement_versions`
- `trg_page_meas_immutable` on `page_measurements`
- `trg_query_meas_immutable` on `query_measurements`
- `trg_state_trans_immutable` on `acquisition_state_transitions`

### Step 4: Restart Application Services
```bash
sudo systemctl start nebula-platform-api.service
sudo systemctl start nebula-nextjs.service

# Verify health endpoint
curl -s http://localhost:8001/readyz
```

---

## 4. Verified Recovery Drills

### Drill A: Failed Weekly Ingestion Recovery
1. **Simulation**: Pipeline terminated mid-run due to transient API timeout.
2. **Result**: Incomplete measurement remains unfinalized or rolls back within transaction.
3. **Recovery**: Execute `uv run python scripts/acquisition_cli.py run --days 28`. The database idempotency keys (`UNIQUE (effective_period_start, effective_period_end)`) prevent duplicate rows.

### Drill B: Out-of-Band State Mutation Attempt
1. **Simulation**: Attempt direct `UPDATE` on `acquisition_measurements`.
2. **Result**: PostgreSQL trigger `trg_prevent_mutation_acq_facts()` raises `RESTRICTED_MUTATION` exception. Historical integrity remains intact.
