# Task 2 Report: Database tables and TeardownDB service

Branch: `feat/teardown-claims`
Commit: `56daf322e` - "feat: teardowns + teardown_claims tables and TeardownDB service" (exactly 3 files staged)
Status: **DONE_WITH_CONCERNS** (brief's code had 2 bugs in the smoke path; fixes were minimal and confined to non-production-critical paths)

---

## Files created

1. `platform_api/migrations/20260822120000_teardown_claims.sql` - verbatim from brief
2. `platform_api/services/teardown_db.py` - brief's code with the SECOND simplified `update_response` (single field per call) as instructed, plus one minimal robustness fix (see Concern 2)
3. `scripts/teardown_db_smoke.py` - brief's code with one fix (see Concern 1)

## Step 1-2: Migration applied to live nebula_audit

Command:

```
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" \
  -f platform_api/migrations/20260822120000_teardown_claims.sql
```

Output (verbatim):

```
CREATE TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
```

### `\d teardowns` (verbatim)

```
                            Table "public.teardowns"
     Column      |           Type           | Collation | Nullable |   Default   
-----------------+--------------------------+-----------+----------+-------------
 slug            | text                     |           | not null | 
 name            | text                     |           | not null | 
 url             | text                     |           | not null | 
 domain          | text                     |           | not null | 
 score           | numeric(3,1)             |           |          | 
 grade           | text                     |           |          | 
 audited_at      | timestamp with time zone |           |          | 
 summary         | text                     |           |          | 
 context         | text                     |           |          | 
 findings        | jsonb                    |           | not null | '[]'::jsonb
 screenshot_path | text                     |           |          | 
 created_at      | timestamp with time zone |           | not null | now()
 updated_at      | timestamp with time zone |           | not null | now()
Indexes:
    "teardowns_pkey" PRIMARY KEY, btree (slug)
    "idx_teardown_claims_domain_lookup" btree (domain)
Referenced by:
    TABLE "teardown_claims" CONSTRAINT "teardown_claims_slug_fkey" FOREIGN KEY (slug) REFERENCES teardowns(slug)
```

### `\d teardown_claims` (verbatim)

```
                              Table "public.teardown_claims"
       Column        |           Type           | Collation | Nullable |      Default      
---------------------+--------------------------+-----------+----------+-------------------
 id                  | uuid                     |           | not null | gen_random_uuid()
 slug                | text                     |           | not null | 
 claimed_by_email    | text                     |           | not null | 
 verification_method | text                     |           | not null | 
 verified_at         | timestamp with time zone |           | not null | now()
 status              | text                     |           | not null | 'active'::text
 response_text       | text                     |           |          | 
 response_status     | text                     |           |          | 
 response_updated_at | timestamp with time zone |           |          | 
 private_context     | text                     |           |          | 
 created_at          | timestamp with time zone |           | not null | now()
 updated_at          | timestamp with time zone |           | not null | now()
Indexes:
    "teardown_claims_pkey" PRIMARY KEY, btree (id)
    "idx_teardown_claims_email" btree (claimed_by_email)
    "uq_teardown_claims_active_slug" UNIQUE, btree (slug) WHERE status = 'active'::text
Check constraints:
    "teardown_claims_response_status_check" CHECK (response_status = ANY (ARRAY['visible'::text, 'auto_hidden'::text, 'removed'::text]))
    "teardown_claims_status_check" CHECK (status = ANY (ARRAY['active'::text, 'revoked'::text, 'superseded'::text]))
    "teardown_claims_verification_method_check" CHECK (verification_method = ANY (ARRAY['email_domain'::text, 'dns_txt'::text, 'gsc'::text]))
Foreign-key constraints:
    "teardown_claims_slug_fkey" FOREIGN KEY (slug) REFERENCES teardowns(slug)
```

Expected result confirmed: tables created; unique partial index `uq_teardown_claims_active_slug ... WHERE status = 'active'` listed.

## Step 4: Smoke test

Command: `uv run --project /home/mike/nebula python scripts/teardown_db_smoke.py`

Final run output (verbatim):

```
SMOKE OK
```

Covered: upsert seed, get_teardown with claim=None, create_claim active, ClaimConflict for second email, idempotent same-email re-claim (same id), list_teardowns shows `claimed is True`.

### Intermediate failed runs (disclosed, per no-fabrication rule)

- Run 1: `asyncpg.exceptions.DataError: invalid input for query argument $7: '2026-08-22' (expected a datetime.date or datetime.datetime instance, got 'str')` -> fixed smoke script to pass `datetime(2026, 8, 22, tzinfo=timezone.utc)` (Concern 1). No DB rows written by this run.
- Run 2: crashed in `list_teardowns` (`KeyError: 'findings'`) AFTER writing teardown + claim rows -> left orphan qa-smoke rows; cleaned via the brief's DELETE statements before re-run (Concern 2 fix applied first).
- Run 3 (clean): `SMOKE OK`.

## Cleanup (brief-specified DELETEs only)

```
DELETE 1
DELETE 1
 claims_left 
-------------
           0
(1 row)

 teardowns_left 
----------------
           0
(1 row)
```

No smoke data remains in production. Total production DDL/DML executed: the migration file exactly as written, plus the two brief-specified qa-smoke DELETE pairs.

## Step 5: Commit

Staged only the three task files (verified via `git status --porcelain` before commit); none of the unrelated modified runtime files (ledgers/, CLAUDE.md, aidlc-docs/, memory/, error_enricher_state.json, etc.) were touched or committed.

```
[feat/teardown-claims 56daf322e] feat: teardowns + teardown_claims tables and TeardownDB service
 3 files changed, 274 insertions(+)
```

---

## Concerns for Task 3+ owners

1. **Smoke script deviation**: brief's smoke passed `"2026-08-22"` (string) as `audited_at`; asyncpg requires real datetime objects for timestamptz. Fixed inside the smoke script only. **Implication for Task 3**: whatever seeds teardowns via `upsert_teardown` must pass `datetime` objects for `audited_at`, not ISO strings.
2. **Service deviation (one line)**: `_with_claim` used `d["findings"]` but `list_teardowns` does not SELECT findings, so every list call raised KeyError. Changed to `d.get("findings")` (platform_api/services/teardown_db.py:57). Behavior identical wherever findings exists.
3. **jsonb codec note (inherited from brief, unchanged)**: asyncpg returns jsonb as `str` unless a codec is registered, so `_with_claim` collapses findings to `[]` on read paths. If Task 3 needs findings content from `get_teardown`, register an asyncpg jsonb codec or parse there. Flagging so it is a decision, not a surprise.

## Fix round 1

Date: 2026-08-22
Branch: feat/teardown-claims
Files changed: platform_api/services/teardown_db.py, scripts/teardown_db_smoke.py

### Changes

1. platform_api/services/teardown_db.py:
   - Moved `import json` from function-local to module top.
   - Added `_init_conn(self, conn)` which registers a jsonb pg_catalog codec via `conn.set_type_codec("jsonb", encoder=lambda v: json.dumps(v), decoder=lambda s: json.loads(s), schema="pg_catalog")`.
   - Passed `init=self._init_conn` to `asyncpg.create_pool`.
   - `upsert_teardown` now passes the raw findings list (codec encoder serializes). Passing a pre-dumped JSON string with the codec active double-encoded it into a jsonb string scalar (`jsonb_typeof` = string), which the decoder returned as a str and `_with_claim` coerced to []. Caught on first smoke run and fixed.
   - `_with_claim` list-coercion kept as defensive fallback.
2. scripts/teardown_db_smoke.py: added post-get assertions `isinstance(got["findings"], list)` and `got["findings"] == [{"key": "k"}]`.

### Verification

First run (pre-fix of upsert path, documented failure):

```
$ uv run --project /home/mike/nebula python scripts/teardown_db_smoke.py
Traceback (most recent call last):
  File "/home/mike/nebula/scripts/teardown_db_smoke.py", line 45, in <module>
    raise SystemExit(asyncio.run(main()))
  ...
  File "/home/mike/nebula/scripts/teardown_db_smoke.py", line 27, in main
    assert got["findings"] == [{"key": "k"}], got["findings"]
AssertionError: []
exit=1

DB state at that point:
 slug   | ftype  | findings
--------+--------+----------------------
 qa-smoke | string | "[{\"key\": \"k\"}]"
(1 row)
```

Final run after passing raw list to upsert:

```
$ uv run --project /home/mike/nebula python scripts/teardown_db_smoke.py
SMOKE OK
exit=0
```

Post-run DB check confirmed proper storage:

```
psql ... -c "SELECT slug, jsonb_typeof(findings) FROM teardowns WHERE slug='qa-smoke';"
 slug   | jsonb_typeof
--------+--------------
 qa-smoke | array
(1 row)
```

### Cleanup

qa-smoke rows removed exactly per brief:

```
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" -c "DELETE FROM teardown_claims WHERE slug='qa-smoke'; DELETE FROM teardowns WHERE slug='qa-smoke';"
DELETE 1
DELETE 1
```

### Commit

```
$ git commit -m "fix: decode jsonb findings via pg_catalog codec"
[feat/teardown-claims 10a2d127b] fix: decode jsonb findings via pg_catalog codec
 2 files changed, 11 insertions(+), 3 deletions(-)

$ git log --oneline -1
10a2d127b fix: decode jsonb findings via pg_catalog codec
```

Not pushed. No other files touched or staged.
