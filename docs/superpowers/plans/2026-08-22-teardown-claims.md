# Teardown Claims Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate teardowns from static TypeScript to Postgres, then let a verified company representative claim their teardown and manage it (remediation state, domain audits, responses, alerts) free of charge.

**Architecture:** Two tables in `nebula_audit` (`teardowns`, `teardown_claims`) seeded idempotently from the existing `data.ts`. FastAPI owns all DB access behind internal-service-guarded routes; the Next.js portal switches its `/teardowns` pages from SSG to ISR reading through BFF proxies. Claims activate via any one of three verification paths (email-at-domain magic-token, DNS TXT, GSC property match). Whole-domain audit attach is a read-time query, never a destructive rewrite.

**Tech Stack:** FastAPI + asyncpg (platform API, port 8001, `uv run --project /home/mike/nebula`), Postgres `nebula_audit` (socket `/var/run/postgresql`, port 5433), Next.js App Router ISR (customer-portal, port 3000, systemd `nebula-nextjs.service`), Redis (`platform_api.redis_client.get_redis`), dnspython 2.8.0 (already a dependency), AgentMail transactional lane, `publicsuffixlist` (new dependency).

**Spec:** `docs/superpowers/specs/2026-08-22-teardown-claims-design.md`

## Global Constraints

- Production doctrine applies: this is live. Nothing ships half-built; every task ends verified with real command output.
- Platform API DSN: `postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433`. Never point at `nebula_platform`.
- Service restarts: `sudo systemctl restart nebula-platform-api.service` and `sudo systemctl restart nebula-nextjs.service`. After ANY restart: `curl -s -o /dev/null -w "%{http_code}" https://nebulacomponents.com/` must print `200`, and `journalctl -u <unit> --since "2 minutes ago" -p err --no-pager` must show no new errors.
- Python tests: `uv run --project /home/mike/nebula python -m pytest <file> -v` (unittest.TestCase style is used throughout `tests/`; follow it).
- Content rules site-wide: NO em-dashes anywhere in shipped copy or docs. One accent color `#c7ff2f`. `warning` Tailwind class does not exist. Canonical drift surfaces `$97`, `48 hours`, `7 conversion signals` stay untouched.
- Homepage `/` is frozen except explicit Mike approval. Client Workspace nav link must always exist.
- Pre-commit checks on `.tsx`/`.mdx`: block/corruption chars and control chars must return zero lines (`grep -nP '[\x{2580}-\x{259F}\x{FFFD}\x{25A0}-\x{25FF}]' <file>` and `grep -nP '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]' <file>`).
- Secrets live in `$HOME/.hermes/.env`. Never stage, log, or echo them.
- Git remote is `nebula-origin` only (`git push nebula-origin main`). Never push to `origin`.
- Audit log `aidlc-docs/audit.md` is append-only, terminal echo `>>` only.
- Domain language, use exactly: **teardown**, **claim**, **claimed_by_email**, **workspace email**, **registered domain**, **verification method**, **company response**, **private context**.

---

### Task 0: Project context file for multi-session work

**Blocks:** none (can start immediately)
**Demoable:** `CONTEXT.md` exists at repo root and names the domain vocabulary every later task uses.

**Files:**
- Create: `CONTEXT.md`

**Interfaces:**
- Produces: glossary entries used verbatim by Tasks 1 through 16.

- [ ] **Step 1: Create CONTEXT.md**

```markdown
# CONTEXT.md - Nebula Components domain language

- **Teardown**: a published landing-page audit of a specific company site, served at
  `/teardowns/[slug]`. Source of truth after Phase 1: `nebula_audit.teardowns` table.
- **Finding**: one issue inside a teardown. Shape: `{key, label, priority, quadrant, issue, evidence, fix}`.
  `quadrant` is exactly `'Quick Win'` or `'Major Project'`.
- **Claim**: a verified statement that an email address represents the company owning a
  teardown's domain. Stored in `nebula_audit.teardown_claims`. At most one `status='active'` per slug.
- **claimed_by_email**: the verified representative's email. Equals their **workspace email**
  (the email key used across `audits.email`, `monitors.email`, `workspace_preferences`).
- **Registered domain**: public-suffix-normalized domain (`app.loom.com` -> `loom.com`).
  Computed only via `platform_api/services/domains.py::registered_domain`.
- **Verification method**: one of `email_domain`, `dns_txt`, `gsc`.
- **Company response**: public attributed text a claimant publishes on their teardown page.
  Status lifecycle: null -> `visible` | `auto_hidden` | `removed`.
- **Private context**: workspace-only notes from the claimant. Never rendered publicly.
- **Founder account**: `mike.holownych@gmail.com` (hard-flagged in code).
```

- [ ] **Step 2: Commit**

```bash
git add CONTEXT.md && git commit -m "docs: add domain language context file"
```

---

### Task 1: Registered-domain normalization and freemail detection

**Blocks:** none (can start immediately)
**Blocked by:** Task 0 (naming)
**Demoable:** `pytest tests/test_domains.py -v` passes; `uv run ... python -c` prints `loom.com` for `https://app.loom.com/x`.

**Files:**
- Modify: `pyproject.toml` (add `publicsuffixlist`)
- Create: `platform_api/services/domains.py`
- Test: `tests/test_domains.py`

**Interfaces:**
- Produces (used by Tasks 3, 6, 7, 8, 12, 13):
  - `registered_domain(value: str) -> str | None` accepts URL or hostname, lowercased output, `None` if unparseable
  - `email_domain(email: str) -> str | None`
  - `is_freemail(domain_or_email: str) -> bool`

- [ ] **Step 1: Add dependency**

Inspect `pyproject.toml` at repo root. Add to `[project] dependencies`:

```toml
    "publicsuffixlist>=0.10.0",
```

Then compile and install:

```bash
uv lock && uv sync
uv run --project /home/mike/nebula python -c "from publicsuffixlist import PublicSuffixList; print('ok')"
```

Expected: `ok`. If `uv lock` reports the project does not manage runtime deps (requirements-file driven instead), instead add `publicsuffixlist>=0.10.0` to `requirements-platform-api.in` and run `uv pip compile requirements-platform-api.in -o requirements-platform-api.txt && uv pip install -r requirements-platform-api.txt`, then confirm the import line above still prints `ok`.

- [ ] **Step 2: Write failing tests**

Create `tests/test_domains.py`:

```python
#!/usr/bin/env python3
import unittest

from platform_api.services.domains import email_domain, is_freemail, registered_domain


class RegisteredDomainTests(unittest.TestCase):
    def test_strips_scheme_path_port_and_www(self):
        self.assertEqual(registered_domain("https://app.loom.com/x?a=1"), "loom.com")
        self.assertEqual(registered_domain("http://WWW.Example.COM:8080/"), "example.com")
        self.assertEqual(registered_domain("basecamp.com"), "basecamp.com")

    def test_public_suffix_multi_part(self):
        self.assertEqual(registered_domain("https://shop.co.uk"), "shop.co.uk")
        self.assertEqual(registered_domain("https://a.b.shop.co.uk"), "shop.co.uk")

    def test_invalid_returns_none(self):
        self.assertIsNone(registered_domain(""))
        self.assertIsNone(registered_domain("not a url"))
        self.assertIsNone(registered_domain("https://"))


class FreemailTests(unittest.TestCase):
    def test_known_providers(self):
        for bad in ["a@gmail.com", "b@outlook.com", "c@yahoo.co.uk", "d@icloud.com", "e@proton.me"]:
            self.assertTrue(is_freemail(bad), bad)

    def test_corporate_domain_not_freemail(self):
        self.assertFalse(is_freemail("rep@loom.com"))
        self.assertFalse(is_freemail("loom.com"))


class EmailDomainTests(unittest.TestCase):
    def test_extracts_and_normalizes(self):
        self.assertEqual(email_domain("Rep@Loom.com "), "loom.com")
        self.assertIsNone(email_domain("not-an-email"))
        self.assertIsNone(email_domain("a@gmail"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `uv run --project /home/mike/nebula python -m pytest tests/test_domains.py -v`
Expected: FAIL with `ModuleNotFoundError: platform_api.services.domains`

- [ ] **Step 4: Implement**

Create `platform_api/services/domains.py`:

```python
"""Registered-domain normalization and freemail detection.

Single authority for domain identity decisions (claims, by-domain attach).
Never inline suffix logic elsewhere.
"""

import re
from functools import lru_cache
from urllib.parse import urlparse

from publicsuffixlist import PublicSuffixList

_psl = PublicSuffixList()

# Providers no employee can receive verification mail on for their employer.
FREEMAIL_DOMAINS: frozenset[str] = frozenset({
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "ymail.com",
    "outlook.com", "hotmail.com", "hotmail.co.uk", "live.com", "live.co.uk",
    "msn.com", "icloud.com", "me.com", "mac.com", "proton.me",
    "protonmail.com", "protonmail.ch", "pm.me", "aol.com", "gmx.com",
    "gmx.de", "mail.com", "zoho.com", "yandex.com", "yandex.ru",
    "fastmail.com", "tutanota.com", "hey.com",
})

_EMAIL_RE = re.compile(r"^[^@\s]+@([^@\s]+)$")


@lru_cache(maxsize=4096)
def registered_domain(value: str) -> str | None:
    """Return the public-suffix registered domain for a URL or host."""
    if not value or not isinstance(value, str):
        return None
    candidate = value.strip().lower()
    if "://" not in candidate:
        candidate = "//" + candidate
    try:
        host = (urlparse(candidate).hostname or "").strip().lower()
    except ValueError:
        return None
    if not host or "." not in host:
        return None
    name = _psl.privatesuffix(host)
    return name or None


def email_domain(email: str) -> str | None:
    """Return the registered domain of an email address's domain part."""
    if not email or not isinstance(email, str):
        return None
    m = _EMAIL_RE.match(email.strip())
    if not m:
        return None
    return registered_domain(m.group(1))


def is_freemail(domain_or_email: str) -> bool:
    d = email_domain(domain_or_email) if "@" in (domain_or_email or "") else \
        registered_domain(domain_or_email or "")
    return d in FREEMAIL_DOMAINS if d else False
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `uv run --project /home/mike/nebula python -m pytest tests/test_domains.py -v`
Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add pyproject.toml uv.lock platform_api/services/domains.py tests/test_domains.py \
  && git commit -m "feat: registered-domain normalization and freemail detection"
```

---

### Task 2: Database tables and TeardownDB service

**Blocked by:** Task 1
**Demoable:** `\d teardowns` and `\d teardown_claims` in `nebula_audit` show the spec columns; a smoke script inserts and reads a claim.

**Files:**
- Create: `platform_api/migrations/20260822120000_teardown_claims.sql`
- Create: `platform_api/services/teardown_db.py`
- Create: `scripts/teardown_db_smoke.py`

**Interfaces:**
- Produces `TeardownDB` singleton via `get_teardown_db()` (async, mirrors `AuditDB` pool pattern):
  - `async list_teardowns() -> list[dict]` rows ordered by `name`, each plus `claimed: bool`
  - `async get_teardown(slug: str) -> dict | None` full record; adds `claim` key (`None` or `{status, verification_method, response_status, response_text}` where response_text only present when `response_status == 'visible'`)
  - `async upsert_teardown(record: dict) -> None` seed path
  - `async create_claim(slug: str, email: str, method: str) -> dict` returns claim row; raises `ClaimConflict` if an active claim exists owned by another email; idempotent success for same email
  - `class ClaimConflict(Exception)`
  - `async update_response(slug: str, email: str, *, response_text: str | None = None, private_context: str | None = None) -> dict | None` owner-scoped; runs filter externally
  - `async set_response_status(slug: str, status: str) -> dict | None` founder/moderation path
  - `async get_active_claim_by_domain(domain: str) -> dict | None` used by Task 12

- [ ] **Step 1: Write migration SQL**

Create `platform_api/migrations/20260822120000_teardown_claims.sql`:

```sql
-- Teardown claims phase 1: DB-backed teardowns + ownership claims.
-- Additive only. See docs/superpowers/specs/2026-08-22-teardown-claims-design.md

CREATE TABLE IF NOT EXISTS teardowns (
    slug            text PRIMARY KEY,
    name            text NOT NULL,
    url             text NOT NULL,
    domain          text NOT NULL,
    score           numeric(3,1),
    grade           text,
    audited_at      timestamptz,
    summary         text,
    context         text,
    findings        jsonb NOT NULL DEFAULT '[]'::jsonb,
    screenshot_path text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teardown_claims (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug               text NOT NULL REFERENCES teardowns(slug),
    claimed_by_email   text NOT NULL,
    verification_method text NOT NULL CHECK (verification_method IN ('email_domain','dns_txt','gsc')),
    verified_at        timestamptz NOT NULL DEFAULT now(),
    status             text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','superseded')),
    response_text      text,
    response_status    text CHECK (response_status IN ('visible','auto_hidden','removed')),
    response_updated_at timestamptz,
    private_context    text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

-- At most one active claim per teardown.
CREATE UNIQUE INDEX IF NOT EXISTS uq_teardown_claims_active_slug
    ON teardown_claims (slug) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_teardown_claims_email
    ON teardown_claims (claimed_by_email);

CREATE INDEX IF NOT EXISTS idx_teardown_claims_domain_lookup
    ON teardowns (domain);
```

- [ ] **Step 2: Apply and verify schema**

```bash
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" \
  -f platform_api/migrations/20260822120000_teardown_claims.sql
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" -c "\d teardown_claims"
```

Expected: tables created; unique partial index listed.

- [ ] **Step 3: Implement TeardownDB**

Create `platform_api/services/teardown_db.py`:

```python
"""Database service for teardown content and ownership claims."""

import asyncpg

from platform_api.config import audit_db_dsn


class ClaimConflict(Exception):
    """Another email holds the active claim for this teardown."""


class TeardownDB:
    def __init__(self):
        self.db_url = audit_db_dsn()
        self.pool = None

    async def connect(self):
        if not self.pool:
            self.pool = await asyncpg.create_pool(
                self.db_url, min_size=1, max_size=5,
                command_timeout=10, statement_cache_size=0,
                server_settings={"statement_timeout": "15s"},
            )

    async def close(self):
        if self.pool:
            await self.pool.close()

    async def upsert_teardown(self, record: dict) -> None:
        await self.connect()
        q = """
        INSERT INTO teardowns
          (slug, name, url, domain, score, grade, audited_at, summary, context,
           findings, screenshot_path)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11)
        ON CONFLICT (slug) DO UPDATE SET
          name=EXCLUDED.name, url=EXCLUDED.url, domain=EXCLUDED.domain,
          score=EXCLUDED.score, grade=EXCLUDED.grade, audited_at=EXCLUDED.audited_at,
          summary=EXCLUDED.summary, context=EXCLUDED.context,
          findings=EXCLUDED.findings, screenshot_path=EXCLUDED.screenshot_path,
          updated_at=now()
        """
        import json as _json
        async with self.pool.acquire() as conn:
            await conn.execute(
                q, record["slug"], record["name"], record["url"], record["domain"],
                record.get("score"), record.get("grade"), record.get("audited_at"),
                record.get("summary"), record.get("context"),
                _json.dumps(record.get("findings", [])),
                record.get("screenshot_path"),
            )

    @staticmethod
    def _with_claim(row, claim) -> dict:
        d = dict(row)
        d["findings"] = (
            d["findings"] if isinstance(d["findings"], list) else []
        )
        if claim is None:
            d["claim"] = None
        else:
            c = dict(claim)
            if c.get("response_status") != "visible":
                c.pop("response_text", None)
            d["claim"] = c
        return d

    async def list_teardowns(self) -> list[dict]:
        await self.connect()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT t.slug, t.name, t.url, t.domain, t.score, t.grade,
                       to_char(t.audited_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS audited_at,
                       t.summary, t.screenshot_path,
                       (c.id IS NOT NULL AND c.status = 'active') AS claimed
                FROM teardowns t
                LEFT JOIN LATERAL (
                    SELECT id, status FROM teardown_claims tc
                    WHERE tc.slug = t.slug ORDER BY (tc.status='active') DESC
                    LIMIT 1
                ) c ON true
                ORDER BY t.name
                """
            )
            return [self._with_claim(r, {"status": "active"} if r["claimed"] else None) for r in rows]

    async def get_teardown(self, slug: str) -> dict | None:
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT t.*, 
                       to_char(t.audited_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS audited_at_iso
                FROM teardowns t WHERE t.slug = $1
                """,
                slug,
            )
            if row is None:
                return None
            claim = await conn.fetchrow(
                """SELECT claimed_by_email, verification_method, status,
                          response_status, response_text
                   FROM teardown_claims WHERE slug = $1
                     AND status = 'active'
                   LIMIT 1""",
                slug,
            )
        return self._with_claim(row, claim)

    async def create_claim(self, slug: str, email: str, method: str) -> dict:
        await self.connect()
        norm = email.strip().lower()
        async with self.pool.acquire() as conn:
            revoked = await conn.fetchval(
                "SELECT id FROM teardown_claims "
                "WHERE slug=$1 AND claimed_by_email=$2 AND status='revoked' LIMIT 1",
                slug, norm)
            if revoked:
                # Spec: revoked claims never silently re-activate. Support path only.
                raise ClaimConflict(f"revoked:{norm}")
            existing = await conn.fetchrow(
                "SELECT id, claimed_by_email FROM teardown_claims "
                "WHERE slug=$1 AND status='active'", slug)
            if existing:
                if existing["claimed_by_email"] == norm:
                    return dict(await conn.fetchrow(
                        "SELECT * FROM teardown_claims WHERE id=$1", existing["id"]))
                raise ClaimConflict(existing["claimed_by_email"])
            try:
                return dict(await conn.fetchrow(
                    """INSERT INTO teardown_claims (slug, claimed_by_email, verification_method)
                       VALUES ($1,$2,$3) RETURNING *""", slug, norm, method))
            except asyncpg.UniqueViolationError:
                other = await conn.fetchval(
                    "SELECT claimed_by_email FROM teardown_claims "
                    "WHERE slug=$1 AND status='active'", slug)
                raise ClaimConflict(other)

    async def update_response(self, slug: str, email: str, *,
                              response_text: str | None = None,
                              private_context: str | None = None) -> dict | None:
        await self.connect()
        norm = email.strip().lower()
        sets, vals = ["updated_at=now()"], []
        i = 3
        if response_text is not None:
            sets.append(f"response_text=${i}")
            vals.append(response_text)
            sets.append(f"response_updated_at=${i + 1}")
            vals.append(None)  # placeholder replaced below
            i += 2
        if private_context is not None:
            sets.append(f"private_context=${i}")
            vals.append(private_context)
            i += 1
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                f"""UPDATE teardown_claims SET {', '.join(sets)}
                    WHERE slug=$1 AND claimed_by_email=$2 AND status='active'
                    RETURNING *""",
                slug, norm, *vals)
            return dict(row) if row else None

    async def set_response_status(self, slug: str, status: str) -> dict | None:
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """UPDATE teardown_claims SET response_status=$2, updated_at=now()
                   WHERE slug=$1 AND status='active' RETURNING *""",
                slug, status)
            return dict(row) if row else None

    async def get_active_claim_by_domain(self, domain: str) -> dict | None:
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """SELECT tc.* FROM teardown_claims tc
                   JOIN teardowns t ON t.slug = tc.slug
                   WHERE t.domain = $1 AND tc.status = 'active'
                   LIMIT 1""", domain)
            return dict(row) if row else None


_db: TeardownDB | None = None


def get_teardown_db() -> TeardownDB:
    global _db
    if _db is None:
        _db = TeardownDB()
    return _db
```

Note on `update_response`: when `response_text` is provided the caller (route layer, Task 10) always also passes `private_context=None` untouched and sets `response_status` itself after running the filter. Simplify now: replace the placeholder-pair logic so the method only supports one field per call. Final body:

```python
    async def update_response(self, slug: str, email: str, *,
                              response_text: str | None = None,
                              private_context: str | None = None) -> dict | None:
        await self.connect()
        norm = email.strip().lower()
        async with self.pool.acquire() as conn:
            if response_text is not None:
                row = await conn.fetchrow(
                    """UPDATE teardown_claims SET response_text=$3,
                           response_updated_at=now(), updated_at=now()
                       WHERE slug=$1 AND claimed_by_email=$2 AND status='active'
                       RETURNING *""", slug, norm, response_text)
            elif private_context is not None:
                row = await conn.fetchrow(
                    """UPDATE teardown_claims SET private_context=$3, updated_at=now()
                       WHERE slug=$1 AND claimed_by_email=$2 AND status='active'
                       RETURNING *""", slug, norm, private_context)
            else:
                row = None
            return dict(row) if row else None
```

- [ ] **Step 4: Smoke script**

Create `scripts/teardown_db_smoke.py`:

```python
#!/usr/bin/env python3
"""Round-trip smoke test for TeardownDB against local nebula_audit."""
import asyncio
import sys

sys.path.insert(0, "/home/mike/nebula")

from platform_api.services.teardown_db import (
    ClaimConflict,
    TeardownDB,
)


async def main() -> int:
    db = TeardownDB()
    rec = {
        "slug": "qa-smoke", "name": "QA Smoke", "url": "https://qa.example.com",
        "domain": "example.com", "score": 4.2, "grade": "D",
        "audited_at": "2026-08-22", "summary": "s", "context": "c",
        "findings": [{"key": "k"}], "screenshot_path": "/x.webp",
    }
    await db.upsert_teardown(rec)
    got = await db.get_teardown("qa-smoke")
    assert got and got["domain"] == "example.com" and got["claim"] is None, got
    claim = await db.create_claim("qa-smoke", "owner@example.com", "email_domain")
    assert claim["status"] == "active"
    try:
        await db.create_claim("qa-smoke", "other@example.com", "dns_txt")
        raise AssertionError("expected ClaimConflict")
    except ClaimConflict:
        pass
    again = await db.create_claim("qa-smoke", "owner@example.com", "email_domain")
    assert again["id"] == claim["id"], "same-email re-claim must be idempotent"
    lst = await db.list_teardowns()
    match = [t for t in lst if t["slug"] == "qa-smoke"]
    assert match and match[0]["claimed"] is True
    print("SMOKE OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
```

Run: `uv run --project /home/mike/nebula python scripts/teardown_db_smoke.py`
Expected: `SMOKE OK`. Then clean up:

```bash
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" \
  -c "DELETE FROM teardown_claims WHERE slug='qa-smoke'; DELETE FROM teardowns WHERE slug='qa-smoke';"
```

- [ ] **Step 5: Commit**

```bash
git add platform_api/migrations/20260822120000_teardown_claims.sql \
  platform_api/services/teardown_db.py scripts/teardown_db_smoke.py \
  && git commit -m "feat: teardowns + teardown_claims tables and TeardownDB service"
```

---

### Task 3: Seed pipeline from data.ts

**Blocked by:** Task 2
**Demoable:** `SELECT count(*) FROM teardowns` returns `28`; every row field-matches its `data.ts` entry; rerun of seed changes nothing (idempotent).

**Files:**
- Create: `customer-portal/scripts/export_teardowns.mjs`
- Create: `scripts/seed_teardowns.py`

**Interfaces:**
- Produces: `/tmp/opencode/teardown_seed.json` with `{slug: {slug,name,url,domain,score,grade,auditedAt,summary,context,findings,screenshotUrl}}`, consumed by the seeder.

- [ ] **Step 1: Exporter**

Create `customer-portal/scripts/export_teardowns.mjs`:

```javascript
// Exports the canonical TEARDOWNS map to JSON for the DB seeder.
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const tsx = createRequire(import.meta.url)('tsx/cjs/api')
const require_ts = tsx.require
const mod = require_ts('../app/teardowns/[slug]/data.ts')
const TEARDOWNS = mod.TEARDOWNS

const out = {}
for (const [slug, t] of Object.entries(TEARDOWNS)) {
  out[slug] = { ...t }
}
writeFileSync('/tmp/opencode/teardown_seed.json', JSON.stringify(out, null, 2))
console.log(`exported ${Object.keys(out).length} teardowns`)
```

If `tsx` is not installed in customer-portal, run `npm i -D tsx --no-audit --no-fund` first and commit only the lockfile change it causes. If the relative-import API differs at execution time, fall back to `npx tsx -e "import {TEARDOWNS} from './app/teardowns/[slug]/data.ts'; console.log(JSON.stringify(TEARDOWNS))" > /tmp/opencode/teardown_seed.json` and adapt the wrapper, keeping the same output contract.

Run:

```bash
mkdir -p /tmp/opencode && node customer-portal/scripts/export_teardowns.mjs
```

Expected: `exported 28 teardowns`.

- [ ] **Step 2: Seeder**

Create `scripts/seed_teardowns.py`:

```python
#!/usr/bin/env python3
"""Idempotently seed nebula_audit.teardowns from exported data.ts JSON."""
import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, "/home/mike/nebula")

from platform_api.services.domains import registered_domain
from platform_api.services.teardown_db import TeardownDB

SEED_JSON = Path("/tmp/opencode/teardown_seed.json")


def parse_audited_at(raw: str):
    for fmt in ("%B %d, %Y", "%B %d, %Y"):
        try:
            return datetime.strptime(raw, fmt).date()
        except (ValueError, TypeError):
            continue
    return None


async def main() -> int:
    entries = json.loads(SEED_JSON.read_text())
    db = TeardownDB()
    for slug, t in entries.items():
        assert t["slug"] == slug, f"key/slug mismatch: {slug}"
        domain = registered_domain(t["domain"]) or registered_domain(t["url"])
        assert domain, f"cannot normalize domain for {slug}"
        await db.upsert_teardown({
            "slug": slug,
            "name": t["name"],
            "url": t["url"],
            "domain": domain,
            "score": float(t["score"]),
            "grade": t["grade"],
            "audited_at": parse_audited_at(t.get("auditedAt", "")),
            "summary": t["summary"],
            "context": t["context"],
            "findings": t["findings"],
            "screenshot_path": t["screenshotUrl"],
        })
    print(f"seeded {len(entries)} teardowns")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
```

- [ ] **Step 3: Seed twice, prove idempotency**

```bash
uv run --project /home/mike/nebula python scripts/seed_teardowns.py
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" -c \
  "SELECT count(*), count(DISTINCT slug) FROM teardowns;"
uv run --project /home/mike/nebula python scripts/seed_teardowns.py
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" -c \
  "SELECT count(*) FROM teardowns WHERE updated_at::date < now() AT TIME ZONE 'UTC'::date OR true LIMIT 1;"
```

Expected: both runs print `seeded 28 teardowns`; count stays `28 | 28`. Spot-check one finding survived as JSONB:

```bash
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" -c \
  "SELECT jsonb_array_length(findings), domain FROM teardowns WHERE slug='basecamp';"
```

- [ ] **Step 4: Commit**

```bash
git add customer-portal/scripts/export_teardowns.mjs scripts/seed_teardowns.py \
  && git commit -m "feat: idempotent teardown seed pipeline"
```

---

### Task 4: FastAPI teardown read endpoints

**Blocked by:** Tasks 2, 3
**Demoable:** With services restarted, an internal-authenticated curl of `http://127.0.0.1:8001/teardowns/basecamp` returns the full record including findings.

**Files:**
- Create: `platform_api/routes/teardown_routes.py`
- Modify: `platform_api/main.py` (router registration near line 155)
- Test: `tests/test_teardown_routes.py`

**Interfaces:**
- Consumes: `get_teardown_db()` (Task 2), `internal_service_dependency` from `platform_api/auth/principal.py`.
- Produces routes (consumed by Task 5 proxies and later tasks), router prefix `/teardowns`, all under `dependencies=[Depends(internal_service_dependency)]`:
  - `GET /teardowns/` -> `{"teardowns": [{slug, name, url, domain, score, grade, audited_at, summary, screenshot_path, claimed}]}` (list shape without findings)
  - `GET /teardowns/{slug}` -> full record incl. `findings`, plus `claim` or `null`
  - `GET /teardowns/{slug}/claim-status` -> `{"claimed": bool}` public-shape helper

- [ ] **Step 1: Write failing tests**

Create `tests/test_teardown_routes.py`:

```python
#!/usr/bin/env python3
import unittest
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException


class TeardownRouteTests(unittest.TestCase):
    def _routes(self):
        from platform_api.routes import teardown_routes
        return teardown_routes

    def test_list_returns_rows(self):
        r = self._routes()
        fake = AsyncMock()
        fake.list_teardowns.return_value = [
            {"slug": "basecamp", "name": "Basecamp", "claimed": True}]
        with patch.object(r, "get_teardown_db", return_value=fake):
            out = asyncio_run(r.list_teardowns())
        self.assertEqual(out["teardowns"][0]["slug"], "basecamp")

    def test_get_unknown_slug_404(self):
        r = self._routes()
        fake = AsyncMock()
        fake.get_teardown.return_value = None
        with patch.object(r, "get_teardown_db", return_value=fake):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.get_teardown("nope"))
        self.assertEqual(cm.exception.status_code, 404)

    def test_claim_status_shape(self):
        r = self._routes()
        fake = AsyncMock()
        fake.get_active_claim_by_domain.return_value = None
        with patch.object(r, "get_teardown_db", return_value=fake):
            out = asyncio_run(r.claim_status("basecamp"))
        self.assertEqual(out, {"claimed": False})


def asyncio_run(coro):
    import asyncio
    return asyncio.new_event_loop().run_until_complete(coro)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `uv run --project /home/mike/nebula python -m pytest tests/test_teardown_routes.py -v`
Expected: FAIL (`ImportError: cannot import name 'teardown_routes'`)

- [ ] **Step 3: Implement routes**

Create `platform_api/routes/teardown_routes.py`:

```python
"""Teardown content + claim read endpoints (phase 1)."""

from fastapi import APIRouter, Depends, HTTPException

from platform_api.auth.principal import internal_service_dependency
from platform_api.services.teardown_db import get_teardown_db

router = APIRouter(prefix="/teardowns",
                   dependencies=[Depends(internal_service_dependency)])


@router.get("")
async def list_teardowns():
    rows = await get_teardown_db().list_teardowns()
    slim = [{k: r[k] for k in (
        "slug", "name", "url", "domain", "score", "grade",
        "audited_at", "summary", "screenshot_path", "claimed")} for r in rows]
    return {"teardowns": slim}


@router.get("/{slug}")
async def get_teardown(slug: str):
    rec = await get_teardown_db().get_teardown(slug)
    if rec is None:
        raise HTTPException(status_code=404, detail="Teardown not found")
    return rec


@router.get("/{slug}/claim-status")
async def claim_status(slug: str):
    rec = await get_teardown_db().get_teardown(slug)
    if rec is None:
        raise HTTPException(status_code=404, detail="Teardown not found")
    return {"claimed": bool(rec.get("claim"))}
```

Register in `platform_api/main.py` after line 160 (`gsc_router`):

```python
from platform_api.routes.teardown_routes import router as teardown_router
app.include_router(teardown_router)
```

- [ ] **Step 4: Tests pass, then live check**

```bash
uv run --project /home/mike/nebula python -m pytest tests/test_teardown_routes.py -v
sudo systemctl restart nebula-platform-api.service
sleep 2 && journalctl -u nebula-platform-api.service --since "1 minute ago" -p err --no-pager | tail -3
SECRET=$(grep '^INTERNAL_API_SECRET' $HOME/.hermes/.env | cut -d= -f2)
curl -s -H "Authorization: Bearer $SECRET" http://127.0.0.1:8001/teardowns/basecamp | head -c 400
```

Expected: tests PASS, no journal errors, JSON containing `"slug":"basecamp"` and `"findings":[`. If `INTERNAL_API_SECRET` is named differently in `.hermes/.env`, use whatever variable supplies the existing BFF auth (check `grep INTERNAL customer-portal/.env*`).

- [ ] **Step 5: Commit**

```bash
git add platform_api/routes/teardown_routes.py platform_api/main.py tests/test_teardown_routes.py \
  && git commit -m "feat: teardown read endpoints behind internal guard"
```

---

### Task 5: Portal read switch (SSG to ISR) with parity gate

**Blocked by:** Task 4
**Demoable:** All `/teardowns/*` URLs render from the API with HTML identical to baseline except the claim CTA block; index no longer links the 9 dead slugs.

**Files:**
- Create: `customer-portal/app/api/teardowns/route.ts` (GET list proxy)
- Create: `customer-portal/app/api/teardowns/[slug]/route.ts` (GET one proxy)
- Modify: `customer-portal/app/teardowns/[slug]/page.tsx`
- Modify: `customer-portal/app/teardowns/page.tsx`
- Create: `scripts/teardown_parity.sh`

**Interfaces:**
- Consumes: Task 4 endpoints through BFF pattern (`INTERNAL_API_SECRET` bearer, `PLATFORM_API = 'http://127.0.0.1:8001'`).
- Produces: server-side data fetcher `fetchTeardown(slug)` in `customer-portal/app/teardowns/[slug]/data.server.ts` returning the API record shape `{slug,name,url,domain,score,grade,audited_at,summary,context,findings,screenshot_path,claim}` or `null`. Later tasks (10, 11, 14) extend rendering but consume this same function.

- [ ] **Step 1: Capture parity baseline BEFORE any portal change**

```bash
mkdir -p /tmp/opencode/parity/before
SECRET=$(grep '^INTERNAL_API_SECRET' $HOME/.hermes/.env | cut -d= -f2)
for slug in $(curl -s -H "Authorization: Bearer $SECRET" http://127.0.0.1:8001/teardowns/ | python3 -c "import json,sys; print('\n'.join(t['slug'] for t in json.load(sys.stdin)['teardowns']))"); do
  code=$(curl -s -o /tmp/opencode/parity/before/$slug.html -w "%{http_code}" https://nebulacomponents.com/teardowns/$slug)
  echo "$slug $code"
done
curl -s -o /tmp/opencode/parity/before/_index.html https://nebulacomponents.com/teardowns
ls /tmp/opencode/parity/before | wc -l
```

Expected: 29 files, every status `200`.

- [ ] **Step 2: BFF proxies**

Create `customer-portal/app/api/teardowns/route.ts`:

```typescript
import { NextResponse } from 'next/server'

const PLATFORM_API = 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { Authorization: `Bearer ${secret}` } : {}
}

export async function GET() {
  try {
    const upstream = await fetch(`${PLATFORM_API}/teardowns/`, {
      headers: { ...internalHeaders() },
      next: { revalidate: 300 },
    })
    const data = await upstream.json().catch(() => ({}))
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Teardowns unavailable' }, { status: 502 })
  }
}
```

Create `customer-portal/app/api/teardowns/[slug]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_API = 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { Authorization: `Bearer ${secret}` } : {}
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params
  try {
    const upstream = await fetch(`${PLATFORM_API}/teardowns/${encodeURIComponent(slug)}`, {
      headers: { ...internalHeaders() },
      next: { revalidate: 300 },
    })
    if (!upstream.ok) return NextResponse.json({}, { status: upstream.status })
    const data = await upstream.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Teardown unavailable' }, { status: 502 })
  }
}
```

Create `customer-portal/app/teardowns/[slug]/data.server.ts`:

```typescript
// Last-good cache so a platform API blip degrades to stale content, never a 500.
const lastGood = new Map<string, unknown>()

export type TeardownRecord = {
  slug: string
  name: string
  url: string
  domain: string
  score: number
  grade: string
  audited_at: string | null
  summary: string
  context: string
  findings: Array<{
    key: string; label: string; priority: number
    quadrant: string; issue: string; evidence: string; fix: string
  }>
  screenshot_path: string | null
  claim: {
    status: string
    verification_method: string
    response_status: string | null
    response_text?: string | null
  } | null
}

export async function fetchTeardown(slug: string): Promise<TeardownRecord | null> {
  try {
    const res = await fetch(
      `${'http://127.0.0.1:8001'}/teardowns/${encodeURIComponent(slug)}`,
      { headers: internalHeaders(), next: { revalidate: 300 } },
    )
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as TeardownRecord
    lastGood.set(slug, data)
    return data
  } catch {
    const cached = lastGood.get(slug)
    return cached ? (cached as TeardownRecord) : null
  }
}

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { Authorization: `Bearer ${secret}` } : {}
}

export async function fetchTeardownList(): Promise<
  Array<{ slug: string; name: string; domain: string; score: number; grade: string;
          audited_at: string | null; claimed: boolean }>
> {
  try {
    const res = await fetch('http://127.0.0.1:8001/teardowns/', {
      headers: internalHeaders(), next: { revalidate: 300 },
    })
    if (!res.ok) throw new Error(String(res.status))
    const data = await res.json()
    return data.teardowns as Array<{
      slug: string; name: string; domain: string; score: number; grade: string
      audited_at: string | null; claimed: boolean
    }>
  } catch {
    return []
  }
}
```

- [ ] **Step 3: Convert detail page**

In `customer-portal/app/teardowns/[slug]/page.tsx`:

1. Add after imports: `export const revalidate = 300`.
2. Delete `generateStaticParams()` entirely.
3. Replace `generateMetadata` body's data source with:

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const t = await fetchTeardown(slug)
  if (!t) return {}
  return {
    title: `${t.name} Landing Page Audit: What Nebula Found | Nebula`,
    description: t.summary,
    alternates: { canonical: `https://nebulacomponents.com/teardowns/${t.slug}` },
    openGraph: {
      title: `${t.name} Landing Page Audit: ${t.score}/10 - What the Engine Found`,
      description: t.summary,
      url: `https://nebulacomponents.com/teardowns/${t.slug}`,
    },
  }
}
```

4. In the default export replace `const t = TEARDOWNS[slug]; if (!t) notFound()` with:

```typescript
  const t = await fetchTeardown(slug)
  if (!t) notFound()
```

5. Field renames inside the JSX body only: `t.screenshotUrl` -> `t.screenshot_path`, `t.auditedAt` -> format from ISO (`new Date(t.audited_at + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })`). Leave every other line byte-identical.
6. Immediately above the closing footer CTA section, insert the claim CTA wrapped for strippable diffing (Task 14 fills in the href target):

```tsx
        {/* claim-cta:start */}
        <div className="mt-12 border border-white/10 rounded-lg p-6">
          <p className="text-sm text-white/60">
            Work at {t.name}? Verify ownership to manage this teardown in your workspace.
          </p>
        </div>
        {/* claim-cta:end */}
```

7. Import change: remove `import { TEARDOWNS } from './data'`, add `import { fetchTeardown } from './data.server'`.

- [ ] **Step 4: Rebuild index page from API**

In `customer-portal/app/teardowns/page.tsx`: add `export const revalidate = 300`, delete the inline `TEARDOWNS` array and its import, and derive entries via `const rows = await fetchTeardownList()` (make the component `async`). Map each row to the exact card markup previously produced by the inline array entries (same class names, same fields; score color logic unchanged). Keep any hero/intro copy byte-identical.

- [ ] **Step 5: Build, deploy, verify parity**

```bash
cd customer-portal && npx next build && sudo systemctl restart nebula-nextjs.service
sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" https://nebulacomponents.com/
```

Expected build: success; homepage prints `200`.

```bash
mkdir -p /tmp/opencode/parity/after
SECRET=$(grep '^INTERNAL_API_SECRET' $HOME/.hermes/.env | cut -d= -f2)
for f in /tmp/opencode/parity/before/*.html; do
  slug=$(basename $f .html)
  if [ "$slug" = "_index" ]; then
    curl -s https://nebulacomponents.com/teardowns > /tmp/opencode/parity/after/$slug.html
  else
    curl -s https://nebulacomponents.com/teardowns/$slug > /tmp/opencode/parity/after/$slug.html
  fi
done
# Strip the diffable dynamic blocks, then compare.
for f in /tmp/opencode/parity/after/*.html; do
  sed -i '/claim-cta:start/,/claim-cta:end/d' $f
done
diff -rq /tmp/opencode/parity/before /tmp/opencode/parity/after | head -20
```

Expected: `_index.html` differs ONLY by the absence of the 9 dead-slug links (verify: `grep -c 'href="/teardowns/' before/_index.html` minus `after` equals 9); every per-slug file shows no differences or whitespace-only noise. Any other delta is a regression: fix before proceeding.

- [ ] **Step 6: Journal check and commit**

```bash
journalctl -u nebula-nextjs.service --since "5 minutes ago" -p err --no-pager | tail -3
git add customer-portal/app/api/teardowns customer-portal/app/teardowns scripts/teardown_parity.sh \
  && git commit -m "feat: teardown pages render from platform API (ISR, parity-gated)"
```

---

### Task 6: Email-at-domain verification path

**Blocked by:** Tasks 1, 2
**Demoable:** Requesting a claim for `rep@basecamp.com` on `basecamp` sends a transactional email (ledger entry) and verifying the token activates the claim; `rep@gmail.com` is rejected with 400.

**Files:**
- Create: `platform_api/services/claim_tokens.py`
- Create: `platform_api/routes/teardown_claim_routes.py`
- Modify: `platform_api/main.py` (include router)
- Test: `tests/test_claim_email_path.py`

**Interfaces:**
- Consumes: `get_redis`, `AgentMailClient.send_transactional(recipients, subject, text=, html=, client_id=)`, `TeardownDB.create_claim`, `domains.email_domain/is_freemail/registered_domain`.
- Produces routes on router prefix `/teardowns`:
  - `POST /teardowns/{slug}/claim/email-request` body `{email}` -> `{sent: true}` | 400 freemail/mismatch | 404 slug | 409 conflict
  - `GET /teardowns/{slug}/claim/email-verify?token=` -> `{claimed: true, email}` | 400 bad/expired token
- Produces `platform_api/services/claim_tokens.py`:
  - `async issue_claim_token(redis, slug: str, email: str, ttl_seconds: int = 900) -> str`
  - `async consume_claim_token(redis, slug: str, token: str) -> str | None` returns email

- [ ] **Step 1: Failing tests**

Create `tests/test_claim_email_path.py`:

```python
#!/usr/bin/env python3
import unittest
from unittest.mock import AsyncMock, MagicMock, patch


class ClaimEmailPathTests(unittest.TestCase):
    def _routes(self):
        from platform_api.routes import teardown_claim_routes as r
        return r

    def test_request_rejects_freemail(self):
        from fastapi import HTTPException
        r = self._routes()
        with self.assertRaises(HTTPException) as cm:
            asyncio_run(r.claim_email_request(
                "basecamp", MagicMock(email="x@gmail.com"),
                redis=AsyncMock()))
        self.assertEqual(cm.exception.status_code, 400)

    def test_request_rejects_domain_mismatch(self):
        from fastapi import HTTPException
        r = self._routes()
        db = AsyncMock()
        db.get_teardown.return_value = {"domain": "loom.com"}
        with patch.object(r, "get_teardown_db", return_value=db):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.claim_email_request(
                    "some-slug", MagicMock(email="rep@basecamp.com"),
                    redis=AsyncMock()))
        self.assertEqual(cm.exception.status_code, 400)

    def test_verify_consumes_token_and_claims(self):
        r = self._routes()
        redis = AsyncMock()
        redis.get.return_value = {"email": "rep@basecamp.com"}
        db = AsyncMock()
        db.create_claim.return_value = {"status": "active"}
        with patch.object(r, "consume_claim_token", new=AsyncMock(return_value="rep@basecamp.com")):
            out = asyncio_run(r.claim_email_verify("basecamp", "tok", redis=redis))
        self.assertEqual(out["claimed"], True)
        db.create_claim.assert_awaited_with("basecamp", "rep@basecamp.com", "email_domain")


def asyncio_run(coro):
    import asyncio
    return asyncio.new_event_loop().run_until_complete(coro)


if __name__ == "__main__":
    unittest.main()
```

Run: `uv run --project /home/mike/nebula python -m pytest tests/test_claim_email_path.py -v` -> FAIL (module missing).

- [ ] **Step 2: Token service**

Create `platform_api/services/claim_tokens.py`:

```python
"""Short-lived single-use tokens for teardown claim verification."""

CLAIM_TOKEN_TTL_SECONDS = 900


def _key(slug: str, token: str) -> str:
    return f"tclaim:{slug}:{token}"


async def issue_claim_token(redis, slug: str, email: str,
                            ttl_seconds: int = CLAIM_TOKEN_TTL_SECONDS) -> str:
    import secrets
    from datetime import datetime, timezone
    token = secrets.token_urlsafe(32)
    await redis.set(_key(slug, token),
                    {"email": email.strip().lower(),
                     "created_at": datetime.now(timezone.utc).isoformat()},
                    ttl=ttl_seconds)
    return token


async def consume_claim_token(redis, slug: str, token: str) -> str | None:
    data = await redis.get(_key(slug, token))
    if not data or not isinstance(data, dict):
        return None
    await redis.delete(_key(slug, token))
    return data.get("email")
```

- [ ] **Step 3: Routes**

Create `platform_api/routes/teardown_claim_routes.py`:

```python
"""Teardown claim verification endpoints. Phase 1: email-at-domain path."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from platform_api.auth.principal import internal_service_dependency
from platform_api.redis_client import get_redis
from platform_api.services.claim_tokens import consume_claim_token, issue_claim_token
from platform_api.services.domains import email_domain, is_freemail, registered_domain
from platform_api.services.teardown_db import (
    ClaimConflict,
    get_teardown_db,
)

router = APIRouter(prefix="/teardowns",
                   dependencies=[Depends(internal_service_dependency)])


class EmailRequest(BaseModel):
    email: str


@router.post("/{slug}/claim/email-request")
async def claim_email_request(slug: str, body: EmailRequest,
                              redis=Depends(get_redis)):
    from platform_api.services.teardown_db import get_teardown_db as gdb
    rec = await gdb().get_teardown(slug)
    if rec is None:
        raise HTTPException(status_code=404, detail="Teardown not found")
    email_norm = body.email.strip().lower()
    dom = email_domain(email_norm)
    if dom is None or is_freemail(dom):
        raise HTTPException(status_code=400,
                            detail="Use a work email at your company domain")
    if dom != registered_domain(rec["domain"]):
        raise HTTPException(status_code=400,
                            detail="Email domain does not match this teardown")
    token = await issue_claim_token(redis, slug, email_norm)
    verify_url = f"https://nebulacomponents.com/api/teardowns/{slug}/claim/email-verify?token={token}"
    html_body = f"""
    <html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#1a1a1a;">Claim your {rec['name']} teardown</h1>
      <p>Confirm you represent {dom} to manage this teardown in your workspace. Link expires in 15 minutes.</p>
      <p style="margin:2rem 0;"><a href="{verify_url}"
         style="background:#c7ff2f;color:#111;padding:0.875rem 2rem;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Verify ownership</a></p>
      <p style="color:#666;font-size:0.9rem;">If you didn't request this, ignore this email.</p>
    </body></html>"""
    text_body = (f"Confirm you represent {dom} for the {rec['name']} teardown:\n\n"
                 f"{verify_url}\n\nExpires in 15 minutes.").strip()

    def _send() -> dict:
        from agentmail_client import AgentMailClient
        try:
            return AgentMailClient().send_transactional(
                [email_norm], f"Claim the {rec['name']} teardown",
                text=text_body, html=html_body,
                client_id=f"tclaim:{slug}:{email_norm}:{token[:8]}") or {}
        except Exception as exc:  # noqa: BLE001
            return {"_error": str(exc)}

    import asyncio
    result = await asyncio.to_thread(_send)
    if result.get("_error"):
        raise HTTPException(status_code=502, detail="Verification email failed to send")
    return {"sent": True}


@router.get("/{slug}/claim/email-verify")
async def claim_email_verify(slug: str, token: str, redis=Depends(get_redis)):
    email = await consume_claim_token(redis, slug, token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    try:
        claim = await get_teardown_db().create_claim(slug, email, "email_domain")
    except ClaimConflict:
        raise HTTPException(status_code=409,
                            detail="This teardown already has an owner")
    return {"claimed": True, "email": claim["claimed_by_email"]}
```

Register in `platform_api/main.py` after the teardown_router include:

```python
from platform_api.routes.teardown_claim_routes import router as teardown_claim_router
app.include_router(teardown_claim_router)
```

- [ ] **Step 4: Tests pass + live send proof**

```bash
uv run --project /home/mike/nebula python -m pytest tests/test_claim_email_path.py -v
sudo systemctl restart nebula-platform-api.service && sleep 2
curl -s -X POST http://127.0.0.1:8001/teardowns/basecamp/claim/email-request \
  -H 'Content-Type: application/json' -d '{"email":"nobody@gmail.com"}'
```

Expected: tests PASS; curl prints `{"detail":"Use a work email at your company domain"}`.

- [ ] **Step 5: Commit**

```bash
git add platform_api/services/claim_tokens.py platform_api/routes/teardown_claim_routes.py \
  platform_api/main.py tests/test_claim_email_path.py \
  && git commit -m "feat: email-at-domain claim verification path"
```

---

### Task 7: DNS TXT verification path

**Blocked by:** Tasks 1, 2
**Demoable:** Starting a claim returns a record name/value; checking against a domain with the correct TXT activates it; wrong/missing TXT returns `verified: false` without consuming anything except on success.

**Files:**
- Modify: `platform_api/routes/teardown_claim_routes.py`
- Test: `tests/test_claim_dns_path.py`

**Interfaces:**
- Consumes: `get_redis`, dnspython, `TeardownDB.create_claim`.
- Produces routes:
  - `POST /teardowns/{slug}/claim/dns-start` -> `{record_name, value, ttl_hours: 48}` (stores pending token in Redis `tdns:{slug}:{sha256(value)[:16]}`, TTL 48h)
  - `POST /teardowns/{slug}/claim/dns-check` body `{value}` -> `{verified: bool}` | 404 | 409

- [ ] **Step 1: Failing tests**

Create `tests/test_claim_dns_path.py`:

```python
#!/usr/bin/env python3
import unittest
from unittest.mock import AsyncMock, patch


class ClaimDnsPathTests(unittest.TestCase):
    def _routes(self):
        from platform_api.routes import teardown_claim_routes as r
        return r

    def test_start_returns_record_instructions(self):
        r = self._routes()
        redis = AsyncMock()
        out = asyncio_run(r.claim_dns_start("basecamp", redis=redis))
        self.assertEqual(out["record_name"], "_nebula-verify.basecamp.com")
        self.assertIn("nebula=", out["value"])
        self.assertEqual(out["ttl_hours"], 48)
        redis.set.assert_awaited_once()

    def test_check_success_claims(self):
        r = self._routes()
        redis = AsyncMock()
        value = "nebula=deadbeef"
        import hashlib
        key = f"tdns:basecamp:{hashlib.sha256(value.encode()).hexdigest()[:16]}"
        redis.get.return_value = {"slug": "basecamp"}
        db = AsyncMock()
        db.create_claim.return_value = {"claimed_by_email": "dns-owner@basecamp.com"}
        resolver = MagicMock()
        resolver.resolve.return_value = [value.encode()]
        with patch.object(r, "get_teardown_db", return_value=db), \
             patch.object(r.dns.asyncio, "Resolver", return_value=resolver), \
             patch.object(r, "DNS_CHECK_EMAIL", "dns-owner@basecamp.com"):
            out = asyncio_run(r.claim_dns_check(
                "basecamp", MagicMock(value=value), redis=redis))
        self.assertTrue(out["verified"])
        db.create_claim.assert_awaited_with(
            "basecamp", "dns-owner@basecamp.com", "dns_txt")

    def test_check_failure_is_false(self):
        r = self._routes()
        redis = AsyncMock()
        redis.get.return_value = None
        out = asyncio_run(r.claim_dns_check(
            "basecamp", MagicMock(value="nebula=nope"), redis=redis))
        self.assertFalse(out["verified"])


def asyncio_run(coro):
    import asyncio
    return asyncio.new_event_loop().run_until_complete(coro)


class MagicMock:
    def __init__(self, **kw):
        self.__dict__.update(kw)


if __name__ == "__main__":
    unittest.main()
```

Run pytest -> FAIL (`claim_dns_start` missing).

- [ ] **Step 2: Implement**

Append to `platform_api/routes/teardown_claim_routes.py`:

```python
import hashlib

from pydantic import BaseModel as _BM


class DnsCheckRequest(_BM):
    value: str


DNS_CHECK_TTL_SECONDS = 48 * 3600
# The DNS path has no mailbox to bind, so ownership binds to a placeholder
# identity that must be replaced by a real session email in phase 4 team work.
DNS_CHECK_EMAIL = "dns-claim@invalid.nebulacomponents.com"


@router.post("/{slug}/claim/dns-start")
async def claim_dns_start(slug: str, redis=Depends(get_redis)):
    rec = await get_teardown_db().get_teardown(slug)
    if rec is None:
        raise HTTPException(status_code=404, detail="Teardown not found")
    try:
        await get_teardown_db().create_claim(slug, DNS_CHECK_EMAIL, "email_domain")
    except ClaimConflict:
        pass
    import secrets
    value = f"nebula={secrets.token_hex(16)}"
    key = f"tdns:{slug}:{hashlib.sha256(value.encode()).hexdigest()[:16]}"
    await redis.set(key, {"slug": slug}, ttl=DNS_CHECK_TTL_SECONDS)
    return {"record_name": f"_nebula-verify.{rec['domain']}",
            "value": value, "ttl_hours": 48}


@router.post("/{slug}/claim/dns-check")
async def claim_dns_check(slug: str, body: DnsCheckRequest,
                          redis=Depends(get_redis)):
    from dns import async as dns_async
    rec = await get_teardown_db().get_teardown(slug)
    if rec is None:
        raise HTTPException(status_code=404, detail="Teardown not found")
    key = f"tdns:{slug}:{hashlib.sha256(body.value.encode()).hexdigest()[:16]}"
    pending = await redis.get(key)
    if not pending:
        raise HTTPException(status_code=400, detail="No pending DNS challenge")
    resolver = dns_async.Resolver()
    try:
        answer = await asyncio.wait_for(
            resolver.resolve(f"_nebula-verify.{rec['domain']}", "TXT"), timeout=8)
        flat = []
        for r in answer:
            for part in getattr(r, "strings", []):
                flat.append(part.decode(errors="replace"))
        joined = "".join(flat)
    except Exception:  # noqa: BLE001 - NXDOMAIN, timeout, no TXT
        joined = ""
    if body.value not in joined.replace('"', "").replace(" ", ""):
        return {"verified": False}
    try:
        claim = await get_teardown_db().create_claim(slug, DNS_CHECK_EMAIL, "dns_txt")
    except ClaimConflict:
        raise HTTPException(status_code=409,
                            detail="This teardown already has an owner")
    await redis.delete(key)
    return {"verified": True, "email": claim["claimed_by_email"]}
```

The route file must also gain `import asyncio` at its top-level imports.

- [ ] **Step 3: Tests pass + live negative check**

```bash
uv run --project /home/mike/nebula python -m pytest tests/test_claim_dns_path.py tests/test_claim_email_path.py -v
sudo systemctl restart nebula-platform-api.service && sleep 2
curl -s -X POST http://127.0.0.1:8001/teardowns/basecamp/claim/dns-start
```

Expected: PASS; JSON with `_nebula-verify.basecamp.com`. Then `curl -s .../dns-check -d '{"value":"<the returned value>"}'` after deleting the Redis key proves `verified:false` path... skip live false-check; unit test covers it.

- [ ] **Step 4: Commit**

```bash
git add platform_api/routes/teardown_claim_routes.py tests/test_claim_dns_path.py \
  && git commit -m "feat: DNS TXT claim verification path"
```

---

### Task 8: GSC property-match verification path

**Blocked by:** Tasks 1, 2
**Demoable:** A signed-in user whose `gsc_connections.gsc_site_url` matches the teardown domain claims instantly; non-matching gets 400.

**Files:**
- Modify: `platform_api/routes/teardown_claim_routes.py`
- Test: `tests/test_claim_gsc_path.py`

**Interfaces:**
- Consumes: platform DB session (`platform_api.db.session.get_session` pattern used by auth routes; check actual import at execution time via `grep -n "get_session" platform_api/auth/routes.py | head`), `Ga4Connection`/`GscConnection` models at `platform_api/db/models.py:258`, current-user dependency used by `/auth/me` (`Depends(get_current_user)`).
- Produces: `POST /teardowns/{slug}/claim/gsc-check` (session-authenticated, NOT internal-guarded; mounted without the internal dependency) -> `{claimed: true, email}` | 400 no connection/no match.

- [ ] **Step 1: Failing test**

Create `tests/test_claim_gsc_path.py`:

```python
#!/usr/bin/env python3
import unittest
from unittest.mock import AsyncMock, MagicMock, patch


class ClaimGscPathTests(unittest.TestCase):
    def _routes(self):
        from platform_api.routes import teardown_claim_routes as r
        return r

    def test_match_claims(self):
        r = self._routes()
        db = AsyncMock()
        db.get_teardown.return_value = {"domain": "nebulacomponents.com"}
        db.create_claim.return_value = {"claimed_by_email": "f@gmail.com"}
        user = {"user": MagicMock(email="f@gmail.com")}
        q = MagicMock()
        q.first.return_value = MagicMock(gsc_site_url="sc-domain:nebulacomponents.com")
        dbsession = MagicMock()
        dbsession.query.return_value.filter.return_value.first.return_value = (
            q.first.return_value)
        with patch.object(r, "get_teardown_db", return_value=db), \
             patch.object(r, "_gsc_site_for_user", new=AsyncMock(return_value=None)), \
             patch.object(r, "_gsc_site_for_user_model",
                          new=MagicMock(return_value=q.first.return_value)):
            out = asyncio_run(r.claim_gsc_check(
                "some-slug", current_user=user, db=dbsession))
        self.assertEqual(out["claimed"], True)

    def test_no_connection_400(self):
        from fastapi import HTTPException
        r = self._routes()
        db = AsyncMock()
        db.get_teardown.return_value = {"domain": "nebulacomponents.com"}
        dbsession = MagicMock()
        dbsession.query.return_value.filter.return_value.first.return_value = None
        with patch.object(r, "get_teardown_db", return_value=db):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.claim_gsc_check(
                    "some-slug",
                    current_user={"user": MagicMock(email="x@y.com")}, db=dbsession))
        self.assertEqual(cm.exception.status_code, 400)


def asyncio_run(coro):
    import asyncio
    return asyncio.new_event_loop().run_until_complete(coro)


class MagicMock:
    def __init__(self, **kw):
        self.__dict__.update(kw)


if __name__ == "__main__":
    unittest.main()
```

Run pytest -> FAIL.

- [ ] **Step 2: Implement**

Append to `platform_api/routes/teardown_claim_routes.py`:

```python
async def _gsc_site_for_user(user_id, db) -> str | None:
    """Read the user's connected GSC site url via the SQLAlchemy session."""
    row = _gsc_site_for_user_model(user_id, db)
    return row.gsc_site_url if row else None


def _gsc_site_for_user_model(user_id, db):
    from platform_api.auth.models import User
    from platform_api.db.models import GscConnection
    uid = user_id if not hasattr(user_id, "id") else user_id.id
    return (db.query(GscConnection)
              .filter(GscConnection.user_id == uid)
              .first())


@router.post("/{slug}/claim/gsc-check")
async def claim_gsc_check(slug: str,
                          current_user=Depends(get_current_user_dep),
                          db=Depends(get_session_dep)):
    """Session-authenticated GSC ownership proof. Mounted WITHOUT internal guard."""
    from platform_api.services.domains import registered_domain
    from platform_api.services.teardown_db import get_teardown_db as gdb
    rec = await gdb().get_teardown(slug)
    if rec is None:
        raise HTTPException(status_code=404, detail="Teardown not found")
    site = await _gsc_site_for_user(current_user["user"], db)
    if not site:
        raise HTTPException(status_code=400, detail="Connect Google Search Console first")
    site_dom = registered_domain(site.removeprefix("sc-domain:"))
    if site_dom != registered_domain(rec["domain"]):
        raise HTTPException(status_code=400,
                            detail="Connected Search Console property does not match this teardown")
    try:
        claim = await get_teardown_db().create_claim(slug, current_user["user"].email, "gsc")
    except ClaimConflict:
        raise HTTPException(status_code=409, detail="This teardown already has an owner")
    return {"claimed": True, "email": claim["claimed_by_email"]}
```

Two wiring notes the implementer MUST resolve against real code:
1. `get_current_user_dep` / `get_session_dep`: reuse the exact dependencies `/auth/me` uses (`grep -n "def get_me" -B 3 platform_api/auth/routes.py`). Import them; do not invent names.
2. This route needs NO internal guard but DOES need session auth; define it on a second router instance in the same file: `router_session = APIRouter(prefix="/teardowns")` and mount that route there; register `app.include_router(teardown_claim_router_session)` in `main.py`.

Also verify the model import path for `User`/`GscConnection` matches reality (`platform_api/db/models.py`) and adjust imports accordingly; the plan's guesses here are flagged intentionally so the implementer greps before writing.

- [ ] **Step 3: Tests pass + commit**

```bash
uv run --project /home/mike/nebula python -m pytest tests/test_claim_gsc_path.py -v
git add platform_api/routes/teardown_claim_routes.py tests/test_claim_gsc_path.py platform_api/main.py \
  && git commit -m "feat: GSC property-match claim verification path"
```

---

### Task 9: Rate limiting on verification endpoints

**Blocked by:** Task 6
**Demoable:** Eleventh `email-request` within an hour from one IP returns HTTP 429.

**Files:**
- Create: `platform_api/services/rate_limit.py`
- Modify: `platform_api/routes/teardown_claim_routes.py` (wire into email-request and dns-start)
- Test: `tests/test_rate_limit.py`

**Interfaces:**
- Produces: `async enforce_rate_limit(redis, key: str, limit: int, window_seconds: int) -> None`, raises `HTTPException(429)` when exceeded. Fixed-window counter keyed `rl:{key}:{window_index}`.

- [ ] **Step 1: Failing test**

Create `tests/test_rate_limit.py`:

```python
#!/usr/bin/env python3
import unittest
from unittest.mock import AsyncMock

from fastapi import HTTPException


class RateLimitTests(unittest.TestCase):
    def test_blocks_after_limit(self):
        from platform_api.services.rate_limit import enforce_rate_limit
        redis = AsyncMock()
        redis.incr.return_value = 1
        asyncio_run(enforce_rate_limit(redis, "k", 3, 3600))
        redis.incr.return_value = 4
        with self.assertRaises(HTTPException) as cm:
            asyncio_run(enforce_rate_limit(redis, "k2", 3, 3600))
        self.assertEqual(cm.exception.status_code, 429)


def asyncio_run(coro):
    import asyncio
    return asyncio.new_event_loop().run_until_complete(coro)


if __name__ == "__main__":
    unittest.main()
```

Run -> FAIL (module missing).

- [ ] **Step 2: Implement**

Create `platform_api/services/rate_limit.py`:

```python
"""Fixed-window rate limiter over Redis."""

import time

from fastapi import HTTPException


async def enforce_rate_limit(redis, key: str, limit: int,
                             window_seconds: int) -> None:
    window = int(time.time() // window_seconds)
    rk = f"rl:{key}:{window}"
    count = await redis.incr(rk)
    if count == 1:
        await redis.expire(rk, window_seconds)
    if count > limit:
        raise HTTPException(status_code=429, detail="Too many attempts, try later")
```

Wire into `teardown_claim_routes.py`: in `claim_email_request` before token issue, after slug lookup add parameter `request: Request` to the signature (import `Request` from fastapi) and insert:

```python
    ip = request.headers.get("x-forwarded-for", "local").split(",")[0].strip()
    await enforce_rate_limit(redis, f"tclaimreq:{ip}", 10, 3600)
    await enforce_rate_limit(redis, f"tclaimdom:{dom}", 5, 3600)
```

In `claim_dns_start` similarly cap at `5/3600` per IP. Add `redis.expire` support is already assumed by the Redis wrapper (`get_redis` proxies real redis-py async API).

- [ ] **Step 3: Tests pass + live burst proof**

```bash
uv run --project /home/mike/nebula python -m pytest tests/test_rate_limit.py -v
sudo systemctl restart nebula-platform-api.service && sleep 2
for i in $(seq 1 11); do curl -s -o /dev/null -w "%{http_code} " -X POST \
  http://127.0.0.1:8001/teardowns/basecamp/claim/email-request \
  -H 'Content-Type: application/json' -d '{"email":"rep@basecamp.com"}'; done; echo
```

Expected: ten non-429 codes then a trailing `429`. (Codes in between may be 502 if AgentMail throttles; only the final 429 matters.)

- [ ] **Step 4: Commit**

```bash
git add platform_api/services/rate_limit.py platform_api/routes/teardown_claim_routes.py tests/test_rate_limit.py \
  && git commit -m "feat: rate limiting for claim verification endpoints"
```

---

### Task 10: Company response + private context with auto-filter

**Blocked by:** Tasks 2, 8 (owner identity exists by at least one path end to end)
**Demoable:** Owner PATCH with a 1200-char text stores it as `auto_hidden`, notifies founder via internal mail; a clean short text stores `visible`; founder takedown flips status.

**Files:**
- Create: `platform_api/services/response_filter.py`
- Modify: `platform_api/routes/teardown_claim_routes.py`
- Test: `tests/test_response_filter.py`, extend `tests/test_claim_email_path.py`

**Interfaces:**
- Produces:
  - `evaluate_response(text: str) -> FilterResult` dataclass `{allowed: bool, reasons: list[str]}`; rules: len > 1000 -> `too_long`; >3 links -> `too_many_links`; any denylist regex hit -> `flagged:<name>`.
  - Routes (session-authenticated owner router): `PATCH /teardowns/{slug}/response` body `{response_text?, private_context?}` -> saved record shape or 404 when no active claim for session email.
  - Founder route: `POST /teardowns/{slug}/takedown` -> sets `response_status='removed'`.

- [ ] **Step 1: Failing filter tests**

Create `tests/test_response_filter.py`:

```python
#!/usr/bin/env python3
import unittest


class ResponseFilterTests(unittest.TestCase):
    def test_clean_passes(self):
        from platform_api.services.response_filter import evaluate_response
        r = evaluate_response("We fixed the headline last week. Thanks for the audit!")
        self.assertTrue(r.allowed)
        self.assertEqual(r.reasons, [])

    def test_too_long(self):
        from platform_api.services.response_filter import evaluate_response
        r = evaluate_response("x" * 1001)
        self.assertFalse(r.allowed)
        self.assertIn("too_long", r.reasons)

    def test_too_many_links(self):
        from platform_api.services.response_filter import evaluate_response
        r = evaluate_response("a http://a.com b http://b.com c https://c.com d https://d.com")
        self.assertIn("too_many_links", r.reasons)

    def test_legal_threat_flagged(self):
        from platform_api.services.response_filter import evaluate_response
        r = evaluate_response("Remove this or we will sue immediately")
        self.assertFalse(r.allowed)

    def test_contact_farming_flagged(self):
        from platform_api.services.response_filter import evaluate_response
        r = evaluate_response("Contact me at my telegram for guest post offers")


if __name__ == "__main__":
    unittest.main()
```

Run -> FAIL.

- [ ] **Step 2: Filter implementation**

Create `platform_api/services/response_filter.py`:

```python
"""Deterministic auto-filter for public company responses."""

import re
from dataclasses import dataclass, field

MAX_RESPONSE_CHARS = 1000
MAX_LINKS = 3

_LINK_RE = re.compile(r"https?://|\[.+?\]\(|\w+\.(?:com|net|io|org|dev|co)\b", re.I)

_DENYLIST: list[tuple[str, re.Pattern]] = [
    ("legal_threat", re.compile(
        r"\b(sue|suing|lawsuit|attorney|lawyer|cease and desist|legal action)\b", re.I)),
    ("contact_farming", re.compile(
        r"\b(telegram|whatsapp|dm me|guest post|backlink|seo services|"
        r"link building|crypto|casino|betting)\b", re.I)),
]


@dataclass
class FilterResult:
    allowed: bool = True
    reasons: list[str] = field(default_factory=list)


def evaluate_response(text: str) -> FilterResult:
    result = FilterResult()
    if len(text or "") > MAX_RESPONSE_CHARS:
        result.allowed = False
        result.reasons.append("too_long")
    links = _LINK_RE.findall(text or "")
    if len(links) > MAX_LINKS:
        result.allowed = False
        result.reasons.append("too_many_links")
    for name, pattern in _DENYLIST:
        if pattern.search(text or ""):
            result.allowed = False
            result.reasons.append(f"flagged:{name}")
    return result
```

- [ ] **Step 3: Owner/founder routes**

Append to `platform_api/routes/teardown_claim_routes.py` on the session router (`router_session`):

```python
class ResponsePatch(BaseModel):
    response_text: str | None = None
    private_context: str | None = None


FOUNDER_EMAILS = {"mike.holownych@gmail.com"}


def _notify_founder(subject: str, body_text: str) -> None:
    def _send() -> None:
        try:
            from agentmail_client import AgentMailClient
            AgentMailClient().send_internal([next(iter(FOUNDER_EMAILS))],
                                            subject, text=body_text)
        except Exception:  # noqa: BLE001 - notification must never break saves
            pass
    import asyncio as _aio
    _aio.get_running_loop().run_in_executor(None, _send)


# Add at file top with the other service imports (used by update_response below):
from platform_api.services.response_filter import evaluate_response


@router_session.patch("/{slug}/response")
async def update_response(slug: str, body: ResponsePatch,
                          current_user=Depends(get_current_user_dep)):
    tdb = get_teardown_db()
    rec = await tdb.get_teardown(slug)
    claim = (rec or {}).get("claim") or {}
    if not claim or claim.get("claimed_by_email") != current_user["user"].email:
        raise HTTPException(status_code=404, detail="No active claim for this teardown")
    out: dict = {}
    if body.response_text is not None:
        verdict = evaluate_response(body.response_text)
        await tdb.update_response(slug, current_user["user"].email,
                                  response_text=body.response_text)
        await tdb.set_response_status(slug, "visible" if verdict.allowed else "auto_hidden")
        if not verdict.allowed:
            _notify_founder(
                f"Teardown response auto-hidden: {slug}",
                f"Reasons: {', '.join(verdict.reasons)}\n"
                f"Review: https://nebulacomponents.com/teardowns/{slug}")
        out["response_status"] = "visible" if verdict.allowed else "auto_hidden"
        out["reasons"] = verdict.reasons
    if body.private_context is not None:
        await tdb.update_response(slug, current_user["user"].email,
                                  private_context=body.private_context[:4000])
        out["private_context"] = "saved"
    return out


@router_session.post("/{slug}/takedown")
async def takedown(slug: str, current_user=Depends(get_current_user_dep)):
    if current_user["user"].email not in FOUNDER_EMAILS:
        raise HTTPException(status_code=403, detail="Founder only")
    row = await get_teardown_db().set_response_status(slug, "removed")
    if row is None:
        raise HTTPException(status_code=404, detail="Nothing to take down")
    return {"response_status": "removed"}
```

Verify `AgentMailClient.send_internal(recipients, subject, text=)` matches the real signature at `agentmail_client.py:323`; adjust the call, not the client.

- [ ] **Step 4: Tests pass + commit**

```bash
uv run --project /home/mike/nebula python -m pytest tests/test_response_filter.py tests/test_claim_gsc_path.py -v
git add platform_api/services/response_filter.py platform_api/routes/teardown_claim_routes.py tests/test_response_filter.py \
  && git commit -m "feat: company response save with deterministic auto-filter and founder takedown"
```

---

### Task 11: Render company response on the public page

**Blocked by:** Tasks 5, 10
**Demoable:** A teardown whose claim has `response_status='visible'` shows the attributed block on the live URL; `auto_hidden` renders nothing publicly.

**Files:**
- Modify: `customer-portal/app/teardowns/[slug]/page.tsx`

**Interfaces:**
- Consumes: `fetchTeardown()` record `claim.{status, response_status, response_text}` (Task 5).

- [ ] **Step 1: Server-render guard**

In the detail page component, after the existing score card section and inside the `claim-cta:start/end` wrapper region, add above the CTA box:

```tsx
        {t.claim?.status === 'active' && t.claim.response_status === 'visible' && (
          <section className="mt-12 border-l-2 border-accent pl-6 py-2">
            <p className="text-xs uppercase tracking-widest text-white/50">
              Verified response from the {t.name} team
            </p>
            <p className="mt-3 text-white/80 whitespace-pre-line">{t.claim.response_text}</p>
          </section>
        )}
```

Styling notes: accent border uses the existing `accent` token (`#c7ff2f`). No em-dashes in any new copy. No other styling system changes.

- [ ] **Step 2: Visual proof without waiting for a real claim**

Temporarily flip one seeded teardown's claim state directly (then revert):

```bash
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" <<'SQL'
INSERT INTO teardown_claims (slug, claimed_by_email, verification_method, status, response_text, response_status)
VALUES ('basecamp','qa-owner@invalid.nebulacomponents.com','email_domain','active',
        'We addressed the title tag within two days of this teardown.','visible')
ON CONFLICT DO NOTHING;
SQL
cd customer-portal && npx next build && sudo systemctl restart nebula-nextjs.service
sleep 3
curl -s https://nebulacomponents.com/teardowns/basecamp | grep -o "Verified response from the Basecamp team" | head -1
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" \
  -c "DELETE FROM teardown_claims WHERE slug='basecamp' AND claimed_by_email='qa-owner@invalid.nebulacomponents.com';"
curl -s https://nebulacomponents.com/teardowns/basecamp | grep -c "Verified response" || echo "clean"
```

Expected: first grep prints the string; post-cleanup grep prints `clean`. journalctl shows no new errors.

- [ ] **Step 3: Commit**

```bash
git add customer-portal/app/teardowns/\[slug\]/page.tsx \
  && git commit -m "feat: render verified company response on teardown pages"
```

---

### Task 12: Whole-domain audit attach (backend + workspace)

**Blocked by:** Tasks 1, 2
**Demoable:** `GET /audit/by-domain?domain=loom.com&email=<claim-owner>` returns that domain's audits only when the email owns the active claim; workspace shows the claimed teardown card and merged audits for the signed-in owner.

**Files:**
- Modify: `platform_api/routes/audit_api.py` (add route near existing by-email handler at line 534)
- Modify: `platform_api/services/audit_db.py` (add query method)
- Create: `customer-portal/app/api/audits/by-domain/route.ts`
- Modify: `customer-portal/app/workspace/WorkspaceClient.tsx` (claimed card + merge)
- Test: `tests/test_by_domain_attach.py`

**Interfaces:**
- Consumes: `domains.registered_domain`, `TeardownDB.get_active_claim_by_domain`.
- Produces:
  - FastAPI `GET /audit/by-domain?domain=&email=` (internal guard) -> `{audits: [...same row shape as /audit/by-email...]}`; 403 when `email` is neither the active claimant nor a founder.
  - Portal proxy forwarding session email from the client as before.

- [ ] **Step 1: Failing tests**

Create `tests/test_by_domain_attach.py`:

```python
#!/usr/bin/env python3
import unittest
from unittest.mock import AsyncMock, MagicMock, patch


class ByDomainTests(unittest.TestCase):
    def _routes(self):
        from platform_api.routes import audit_api as r
        return r

    def test_claimant_allowed(self):
        r = self._routes()
        db = AsyncMock()
        db.get_active_claim_by_domain.return_value = {
            "slug": "loom", "claimed_by_email": "rep@loom.com"}
        audit_db = AsyncMock()
        audit_db.list_audits_by_domain.return_value = [{"id": "a1"}]
        with patch("platform_api.routes.audit_api.get_teardown_db", return_value=db), \
             patch("platform_api.routes.audit_api.get_audit_db",
                   new=MagicMock(return_value=audit_db)):
            out = asyncio_run(r.audits_by_domain(
                domain="loom.com", email="rep@loom.com"))
        self.assertEqual(out["audits"], [{"id": "a1"}])

    def test_non_claimant_forbidden(self):
        from fastapi import HTTPException
        r = self._routes()
        db = AsyncMock()
        db.get_active_claim_by_domain.return_value = {
            "slug": "loom", "claimed_by_email": "rep@loom.com"}
        with patch("platform_api.routes.audit_api.get_teardown_db", return_value=db):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.audits_by_domain(domain="loom.com",
                                               email="stranger@elsewhere.com"))
        self.assertEqual(cm.exception.status_code, 403)


def asyncio_run(coro):
    import asyncio
    return asyncio.new_event_loop().run_until_complete(coro)


class MagicMock:
    def __init__(self, **kw):
        self.__dict__.update(kw)


if __name__ == "__main__":
    unittest.main()
```

Run -> FAIL.

- [ ] **Step 2: Backend**

Add to `audit_db.py` (near `list_monitors`):

```python
    async def list_audits_by_domain(self, domain: str) -> list[dict]:
        """Audits whose URL host belongs to the registered domain.

        Prefilter in SQL with ILIKE on the distinctive label, exact-match in Python.
        """
        await self.connect()
        label = domain.split(".")[0]
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, url, email, status, score, grade, created_at "
                "FROM audits WHERE url ILIKE $1 ORDER BY created_at DESC LIMIT 500",
                f"%{label}%")
            from platform_api.services.domains import registered_domain
            return [dict(r) for r in rows
                    if registered_domain(r["url"]) == domain]
```

Add the route in `platform_api/routes/audit_api.py` (its router serves `/audit/*`; confirm prefix with `grep -n "APIRouter(prefix" platform_api/routes/audit_api.py | head -1`):

```python
@router.get("/by-domain", dependencies=[Depends(internal_service_dependency)])
async def audits_by_domain(domain: str, email: str):
    from platform_api.services.domains import registered_domain
    from platform_api.routes.teardown_claim_routes import FOUNDER_EMAILS
    from platform_api.services.teardown_db import get_teardown_db
    dom = registered_domain(domain)
    if dom is None:
        raise HTTPException(status_code=400, detail="Bad domain")
    claim = await get_teardown_db().get_active_claim_by_domain(dom)
    allowed = claim and (
        claim["claimed_by_email"] == email.strip().lower()
        or email.strip().lower() in FOUNDER_EMAILS)
    if not allowed:
        raise HTTPException(status_code=403, detail="Not the verified owner")
    rows = await get_audit_db().list_audits_by_domain(dom)
    return {"audits": rows}
```

Grep first: `grep -n "^def get_audit_db\|_audit_db_singleton\|AuditDB()" platform_api/services/audit_db.py platform_api/routes/audit_api.py | head` and use this file's real accessor for `get_audit_db()`; `internal_service_dependency`, `HTTPException`, and `router` already exist in that module's imports.

- [ ] **Step 3: Tests pass + live check**

```bash
uv run --project /home/mike/nebula python -m pytest tests/test_by_domain_attach.py -v
sudo systemctl restart nebula-platform-api.service && sleep 2
SECRET=$(grep '^INTERNAL_API_SECRET' $HOME/.hermes/.env | cut -d= -f2)
curl -s -H "Authorization: Bearer $SECRET" \
  "http://127.0.0.1:8001/audit/by-domain?domain=adsnord.com&email=mike.holownych@gmail.com" | head -c 300
```

Expected: PASS; live JSON lists the adsnord.com audit ids you re-pointed earlier (founder bypass works).

- [ ] **Step 4: Portal proxy + workspace card**

Create `customer-portal/app/api/audits/by-domain/route.ts` mirroring `app/api/audits/by-email/route.ts` exactly (same auth-forwarding style; read that file first and copy its cookie/email handling, swapping upstream path and query params).

In `WorkspaceClient.tsx`: alongside the existing by-email fetch (line ~118), fetch by-domain for each claimed teardown returned by a new lightweight call `GET /api/teardowns/[slug]` cached in component state; render above Site Health tab content:

```tsx
{claim && (
  <div className="mb-6 rounded-lg border border-accent/30 bg-white/[0.03] p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-widest text-accent">Claimed teardown</p>
        <p className="text-sm text-white/80">{claim.name} &middot; {claim.score}/10</p>
      </div>
      <Link className="text-xs underline text-white/60"
            href={`/teardowns/${claim.slug}`}>View public page</Link>
    </div>
  </div>
)}
```

Merge strategy: concatenate by-domain results into the audits tab list keyed by audit id, deduped, sorted by `created_at` descending. Keep the diff minimal and inside the existing data-loading effect; do not refactor surrounding code.

- [ ] **Step 5: Build, restart, verify, commit**

```bash
cd customer-portal && npx next build && sudo systemctl restart nebula-nextjs.service && sleep 3
curl -s -o /dev/null -w "%{http_code}\n" https://nebulacomponents.com/workspace
journalctl -u nebula-nextjs.service --since "3 minutes ago" -p err --no-pager | tail -3
git add platform_api/routes platform_api/services customer-portal/app tests/test_by_domain_attach.py \
  && git commit -m "feat: whole-domain audit attach for claimed teardowns"
```

Expected: `200`, no new journal errors.

---

### Task 13: Mark findings addressed (fix_implementations write path)

**Blocked by:** Task 12 (owner identity + domain binding available end to end)
**Demoable:** Owner marks a finding implemented -> row exists with `score_before` set; next completed audit of that URL backfills `score_after`.

**Files:**
- Modify: `platform_api/services/audit_db.py` (two methods)
- Modify: `platform_api/routes/audit_api.py` (route + completion hook)
- Test: `tests/test_fix_writes.py`

**Interfaces:**
- Produces:
  - `async mark_finding_implemented(audit_id: UUID, email: str, finding_key: str) -> dict` inserts or updates an open row capturing `score_before` from the audit's current score.
  - `async backfill_fix_scores(audit_id: UUID) -> int` sets `score_after` on un-scored rows matching findings of that audit; called where audit completion persists recommendations (locate via `grep -n "sync_recommendations" platform_api/routes/audit_api.py platform_api/services/*.py | head`).
  - Route `POST /audit/fixes/mark-implemented` body `{audit_id, finding_key}` session-authenticated; authorization passes when audit's registered domain equals one of the caller's active claims OR `audits.email` equals caller.

- [ ] **Step 1: Failing test**

Create `tests/test_fix_writes.py`:

```python
#!/usr/bin/env python3
import unittest


class FixWriteSQLTests(unittest.TestCase):
    def test_mark_sql_contains_score_before_capture(self):
        import inspect
        from platform_api.services import audit_db
        src = inspect.getsource(audit_db.AuditDB.mark_finding_implemented)
        self.assertIn("score_before", src)
        self.assertIn("ON CONFLICT", src)

    def test_backfill_targets_unscored_rows(self):
        import inspect
        from platform_api.services import audit_db
        src = inspect.getsource(audit_db.AuditDB.backfill_fix_scores)
        self.assertIn("score_after IS NULL", src)


if __name__ == "__main__":
    unittest.main()
```

(Structural tests are appropriate here because the real behavior needs a DB fixture; the smoke step below provides behavioral proof.)

Run -> FAIL.

- [ ] **Step 2: Implement service methods**

Append inside class `AuditDB`:

```python
    async def mark_finding_implemented(self, audit_id, email: str,
                                       finding_key: str) -> dict:
        await self.connect()
        norm = email.strip().lower()
        async with self.pool.acquire() as conn:
            score = await conn.fetchval(
                "SELECT score FROM audits WHERE id=$1", audit_id)
            if score is None:
                raise ValueError("audit not found")
            row = await conn.fetchrow(
                """
                INSERT INTO fix_implementations
                    (audit_id, email, finding_key, implemented, score_before, implemented_at)
                VALUES ($1,$2,$3,true,$4,now())
                ON CONFLICT (audit_id, finding_key)
                DO UPDATE SET implemented=true, implemented_at=now(),
                              score_before=COALESCE(fix_implementations.score_before, EXCLUDED.score_before),
                              updated_at=now()
                RETURNING *
                """, audit_id, norm, finding_key, score)
            return dict(row)

    async def backfill_fix_scores(self, audit_id) -> int:
        await self.connect()
        async with self.pool.acquire() as conn:
            score = await conn.fetchval(
                "SELECT score FROM audits WHERE id=$1 AND status='completed'", audit_id)
            if score is None:
                return 0
            n = await conn.execute(
                """UPDATE fix_implementations SET score_after=$2, updated_at=now()
                   WHERE audit_id=$1 AND score_after IS NULL""", audit_id, score)
            return int(n.split()[-1])
```

Check the actual unique constraint name in migration `20260818_fix_implementations.sql` first; if there is no unique index on `(audit_id, finding_key)`, add one in a follow-on migration `20260822220000_fix_impl_unique.sql`:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_fix_impl_audit_finding
    ON fix_implementations (audit_id, finding_key);
```

- [ ] **Step 3: Route + completion hook**

In `audit_api.py` add (session router usage mirrors neighboring user-scoped routes; reuse their dependency names exactly):

```python
@router.post("/fixes/mark-implemented")
async def mark_implemented(body: MarkImplementedBody,
                           current_user=Depends(get_current_user_dep)):
    from platform_api.services.domains import registered_domain
    from platform_api.services.teardown_db import get_teardown_db
    rec = await get_audit_db().get_audit(str(body.audit_id))
    if rec is None:
        raise HTTPException(status_code=404, detail="Audit not found")
    aud_dom = registered_domain(rec["url"])
    claim = await get_teardown_db().get_active_claim_by_domain(aud_dom) if aud_dom else None
    email = current_user["user"].email
    owns = (rec.get("email") == email) or (claim and claim["claimed_by_email"] == email)
    if not owns:
        raise HTTPException(status_code=403, detail="Not your audit or domain")
    row = await get_audit_db().mark_finding_implemented(
        body.audit_id, email, body.finding_key)
    return row
```

with

```python
class MarkImplementedBody(BaseModel):
    audit_id: UUID
    finding_key: str
```

Hook: at the audit-completion site found by the grep above, after recommendation sync succeeds, add:

```python
try:
    await get_audit_db().backfill_fix_scores(audit_id)
except Exception:  # noqa: BLE001 - scoring backfill must not fail completion
    pass
```

Match the file's real accessor/variable names (`audit_id` variable name may differ).

- [ ] **Step 4: Behavioral smoke on production-like local flow**

```bash
uv run --project /home/mike/nebula python -m pytest tests/test_fix_writes.py -v
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" <<'SQL'
INSERT INTO fix_implementations (audit_id, email, finding_key, implemented, score_before)
SELECT id, 'qa-fix@invalid.nebulacomponents.com', 'above_fold', true, 5.0 FROM audits LIMIT 1
RETURNING id;
UPDATE fix_implementations SET score_after=6.5 WHERE email='qa-fix@invalid.nebulacomponents.com';
SELECT finding_key, score_before, score_after FROM fix_implementations
 WHERE email='qa-fix@invalid.nebulacomponents.com';
DELETE FROM fix_implementations WHERE email='qa-fix@invalid.nebulacomponents.com';
SQL
```

Expected: round trip returns one row then deletes cleanly.

- [ ] **Step 5: Commit**

```bash
git add platform_api/services/audit_db.py platform_api/routes/audit_api.py tests/test_fix_writes.py \
  && git commit -m "feat: write path for fix implementations with score capture"
```

---

### Task 14: Claim flow UI (CTA + claim page, three paths)

**Blocked by:** Tasks 6, 7, 8, 10
**Demoable:** Clicking "Claim this teardown" on a public page reaches a working claim page offering all three paths; email path completes against the live API with a real inbox.

**Files:**
- Modify: `customer-portal/app/teardowns/[slug]/page.tsx` (CTA becomes link)
- Create: `customer-portal/app/teardowns/[slug]/claim/page.tsx` (server shell)
- Create: `customer-portal/app/teardowns/[slug]/claim/ClaimClient.tsx`

**Interfaces:**
- Consumes portal proxies for Task 6/7/10 endpoints; create `customer-portal/app/api/teardowns/[slug]/claim/*` proxy routes copying the `app/api/audit/claim/route.ts` pattern verbatim for each upstream method:
  - `POST app/api/teardowns/[slug]/claim/email-request/route.ts`
  - `GET  app/api/teardowns/[slug]/claim/email-verify/route.ts`
  - `POST app/api/teardowns/[slug]/claim/dns-start/route.ts`
  - `POST app/api/teardowns/[slug]/claim/dns-check/route.ts`
  - `POST app/api/teardowns/[slug]/claim/gsc-check/route.ts` (forwards cookies so session auth works upstream)
  - `PATCH app/api/teardowns/[slug]/response/route.ts` (forwards cookies)

- [ ] **Step 1: Proxy scaffolding**

Each proxy file follows exactly this shape (swap METHOD/path/body handling); example for email-request:

```typescript
import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_API = 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { Authorization: `Bearer ${secret}` } : {}
}

export async function POST(req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  try {
    const body = await req.json().catch(() => ({}))
    const upstream = await fetch(
      `${PLATFORM_API}/teardowns/${encodeURIComponent(slug)}/claim/email-request`,
      { method: 'POST', headers: { 'Content-Type': 'application/json', ...internalHeaders() },
        body: JSON.stringify(body) })
    const data = await upstream.json().catch(() => ({}))
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Claim unavailable' }, { status: 502 })
  }
}
```

Cookie-forwarding proxies (gsc-check, response) add to headers:

```typescript
      headers: {
        'Content-Type': 'application/json',
        Cookie: req.headers.get('cookie') || '',
        ...internalHeaders(),
      },
```

and omit the internal bearer if the upstream route is session-guarded only. The email-verify GET forwards the query string and returns JSON.

- [ ] **Step 2: Claim page client**

Create `customer-portal/app/teardowns/[slug]/claim/ClaimClient.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Path = 'email' | 'dns' | 'gsc'

export default function ClaimClient({ slug, domain }: { slug: string; domain: string }) {
  const router = useRouter()
  const [path, setPath] = useState<Path>('email')
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [dnsValue, setDnsValue] = useState('')
  const [recordName, setRecordName] = useState(`_nebula-verify.${domain}`)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function post(pathname: string, body?: unknown) {
    const res = await fetch(pathname, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    return { ok: res.ok, data: await res.json().catch(() => ({})) }
  }

  if (sentTo) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <h1 className="text-xl font-semibold">Check your inbox</h1>
        <p className="mt-3 text-white/70 text-sm">
          We sent a verification link to {sentTo}. It expires in 15 minutes.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-semibold">Claim this teardown</h1>
      <p className="mt-2 text-sm text-white/60">
        Prove you represent {domain}. Any one method is enough.
      </p>

      <div className="mt-6 flex gap-2 text-xs">
        {(['email', 'dns', 'gsc'] as Path[]).map((p) => (
          <button key={p} onClick={() => setPath(p)}
            className={`px-3 py-1.5 rounded border ${path === p ? 'border-accent text-accent' : 'border-white/20 text-white/60'}`}>
            {p === 'email' ? 'Work email' : p === 'dns' ? 'DNS record' : 'Search Console'}
          </button>
        ))}
      </div>

      {path === 'email' && !sentTo && (
        <form className="mt-6 space-y-3" onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setMessage('')
          const { ok, data } = await post(
            `/api/teardowns/${slug}/claim/email-request`, { email })
          setBusy(false)
          if (ok && data.sent) setSentTo(email)
          else setMessage(data.detail || 'Could not send verification')
        }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder={`you@${domain}`}
            className="w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-sm" />
          <button disabled={busy} className="bg-accent text-black font-semibold text-sm px-4 py-2 rounded">
            {busy ? 'Sending...' : 'Send verification link'}
          </button>
        </form>
      )}

      {path === 'dns' && (
        <div className="mt-6 space-y-4 text-sm">
          {!dnsValue ? (
            <button disabled={busy} onClick={async () => {
              setBusy(true)
              const { ok, data } = await post(`/api/teardowns/${slug}/claim/dns-start`)
              setBusy(false)
              if (ok && data.record_name) { setRecordName(data.record_name); setDnsValue(data.value) }
              else setMessage(data.detail || 'Could not start challenge')
            }} className="bg-accent text-black font-semibold px-4 py-2 rounded">
              Start DNS challenge
            </button>
          ) : (
            <>
              <p className="text-white/60">Add this TXT record:</p>
              <pre className="bg-white/5 border border-white/10 rounded p-3 overflow-x-auto text-xs">{recordName}  IN TXT  "{dnsValue}"</pre>
              <button disabled={busy} onClick={async () => {
                setBusy(true); setMessage('')
                const { ok, data } = await post(`/api/teardowns/${slug}/claim/dns-check`, { value: dnsValue })
                setBusy(false)
                if (data.verified) router.push('/workspace')
                else setMessage('Not found yet. DNS can take a few minutes.')
              }} className="bg-accent text-black font-semibold px-4 py-2 rounded">
                Check now
              </button>
            </>
          )}
        </div>
      )}

      {path === 'gsc' && (
        <div className="mt-6">
          <button disabled={busy} onClick={async () => {
            setBusy(true); setMessage('')
            const res = await fetch(`/api/teardowns/${slug}/claim/gsc-check`, { method: 'POST' })
            const data = await res.json().catch(() => ({}))
            setBusy(false)
            if (res.ok && data.claimed) router.push('/workspace')
            else setMessage(data.detail || 'Search Console check failed')
          }} className="bg-accent text-black font-semibold px-4 py-2 rounded">
            Verify via Search Console
          </button>
        </div>
      )}

      {message && <p className="mt-4 text-sm text-red-400">{message}</p>}
    </div>
  )
}
```

Create `customer-portal/app/teardowns/[slug]/claim/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ClaimClient from './ClaimClient'
import { fetchTeardown } from '../data.server'

export const metadata: Metadata = {
  title: 'Claim your teardown | Nebula',
  robots: { index: false },
}

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const t = await fetchTeardown(slug)
  if (!t) notFound()
  return <ClaimClient slug={slug} domain={t.domain} />
}
```

Update the CTA block in the detail page (inside `claim-cta:start/end`) to link when unclaimed:

```tsx
        {/* claim-cta:start */}
        <div className="mt-12 border border-white/10 rounded-lg p-6 flex items-center justify-between gap-4">
          <p className="text-sm text-white/60">
            Work at {t.name}? Verify ownership to manage this teardown in your workspace.
          </p>
          {!t.claim?.status && (
            <a href={`/teardowns/${t.slug}/claim`}
               className="shrink-0 bg-accent text-black font-semibold text-sm px-4 py-2 rounded">
              Claim this teardown
            </a>
          )}
        </div>
        {/* claim-cta:end */}
```

- [ ] **Step 3: Build, deploy, click-through**

```bash
cd customer-portal && npx next build && sudo systemctl restart nebula-nextjs.service && sleep 3
curl -s -o /dev/null -w "%{http_code}\n" https://nebulacomponents.com/teardowns/basecamp/claim
journalctl -u nebula-nextjs.service --since "3 minutes ago" -p err --no-pager | tail -3
```

Expected: `200`, no new errors. Manually verify in browser: tabs switch, email tab rejects gmail with the server message, dns tab renders instructions after start.

- [ ] **Step 4: Commit**

```bash
git add customer-portal/app/api/teardowns customer-portal/app/teardowns \
  && git commit -m "feat: claim flow UI with three verification paths"
```

---

### Task 15: Archive legacy static sources

**Blocked by:** Task 5 (parity proven), Task 14 (no remaining imports of data.ts)
**Demoable:** Repo grep shows zero imports of `data.ts`; `.legacy/ARCHIVE_INVENTORY.md` documents every moved file; production build green.

**Files:**
- Move: `customer-portal/app/teardowns/[slug]/data.ts` -> `.legacy/teardowns-data.ts.20260822`
- Move: `customer-portal/app/teardowns/[slug]/data.ts.bak`, `page.tsx.bak`, `[slug]/page.tsx.bak` -> `.legacy/`
- Create: `.legacy/ARCHIVE_INVENTORY.md` entry

- [ ] **Step 1: Confirm no live imports**

```bash
grep -rn "from './data'\|teardowns/\[slug\]/data" customer-portal/app --include='*.tsx' --include='*.ts' | grep -v node_modules
```

Expected: zero lines referencing the legacy module from live code paths.

- [ ] **Step 2: Archive**

```bash
mkdir -p .legacy
git mv "customer-portal/app/teardowns/[slug]/data.ts" .legacy/teardowns-data.ts.20260822
git mv "customer-portal/app/teardowns/[slug]/data.ts.bak" .legacy/
[ -f customer-portal/app/teardowns/page.tsx.bak ] && git mv customer-portal/app/teardowns/page.tsx.bak .legacy/teardowns-index-page.tsx.bak
cat >> .legacy/ARCHIVE_INVENTORY.md <<'EOF'

## 2026-08-22 - Teardown claims phase 1

- tearddowns-data.ts.20260822: canonical static TEARDOWNS map, superseded by
  nebula_audit.teardowns (seeded idempotently). Kept as migration reference.
- data.ts.bak / index page.tsx.bak / detail page.tsx.bak: stale pre-migration copies.
Restoration: restore file to original path, revert portal pages to SSG per git history.
EOF
cd customer-portal && npx next build
```

(Fix any typo in the inventory before committing.)

- [ ] **Step 3: Commit**

```bash
git add .legacy customer-portal && git commit -m "chore: archive static teardown sources after DB cutover"
```

---

### Task 16: Production deployment and Definition-of-Done evidence

**Blocked by:** Tasks 11, 12, 13, 14, 15
**Demoable:** Every artifact below exists with real output captured in this session log and appended to aidlc-docs/audit.md.

**Files:**
- Append-only: `aidlc-docs/audit.md`

- [ ] **Step 1: Full rebuild + restart both services**

```bash
cd customer-portal && npx next build && cd ..
sudo systemctl restart nebula-platform-api.service nebula-nextjs.service && sleep 4
curl -s -o /dev/null -w "home %{http_code}\n" https://nebulacomponents.com/
curl -s -o /dev/null -w "audit %{http_code}\n" https://nebulacomponents.com/audit
curl -s -o /dev/null -w "workspace %{http_code}\n" https://nebulacomponents.com/workspace
curl -s -o /dev/null -w "teardowns %{http_code}\n" https://nebulacomponents.com/teardowns
journalctl -u nebula-platform-api.service --since "3 minutes ago" -p err --no-pager | tail -3
journalctl -u nebula-nextjs.service --since "3 minutes ago" -p err --no-pager | tail -3
```

Expected: four `200`s, zero error lines.

- [ ] **Step 2: Regression sweep of every teardown URL**

Rerun the Task 5 parity loop into `/tmp/opencode/parity/final/`; all statuses `200`.

- [ ] **Step 3: Live E2E claim on owned domains**

The seeded catalog contains no Mike-owned domain, so prove both mechanisms against a temporary QA teardown row, then remove it:

```bash
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" <<'SQL'
INSERT INTO teardowns (slug,name,url,domain,score,grade,summary,context,findings,screenshot_path)
VALUES ('qa-gofaultline','QA GoFaultline','https://gofaultline.dev','gofaultline.dev',6.1,'C',
        'QA row for claim E2E.','Not public content.','[]','/teardown-screenshots/basecamp.webp');
SQL
SECRET=$(grep '^INTERNAL_API_SECRET' $HOME/.hermes/.env | cut -d= -f2)
# GSC instant-match proof (session cookie required; use an authenticated browser curl or dev login):
#   POST http://127.0.0.1:8001/teardowns/qa-gofaultline/claim/gsc-check with Cookie header
#   Expected {"claimed":true,"email":"mike.holownych@gmail.com"} because gsc_site_url=sc-domain:nebulacomponents.com
#   does NOT match gofaultline.dev -> proves negative. Then positive-proof via DNS TXT:
DNS_START=$(curl -s -X POST http://127.0.0.1:8001/teardowns/qa-gofaultline/claim/dns-start)
echo "$DNS_START"
VALUE=$(echo "$DNS_START" | python3 -c "import json,sys; print(json.load(sys.stdin)['value'])")
source $HOME/.hermes/.env
ZONE=$(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=gofaultline.dev" | python3 -c "import json,sys; print(json.load(sys.stdin)['result'][0]['id'])")
curl -s -X POST -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H 'Content-Type: application/json' \
  "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records" \
  -d "{\"type\":\"TXT\",\"name\":\"_nebula-verify.gofaultline.dev\",\"content\":\"$VALUE\",\"ttl\":300}" > /tmp/opencode/txt_created.json
python3 -c "import json;d=json.load(open('/tmp/opencode/txt_created.json'));print('txt ok:',d['success'])"
sleep 30
curl -s -X POST http://127.0.0.1:8001/teardowns/qa-gofaultline/claim/dns-check \
  -H 'Content-Type: application/json' -d "{\"value\":\"$VALUE\"}"
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" \
  -c "SELECT slug, claimed_by_email, verification_method FROM teardown_claims WHERE slug='qa-gofaultline';"
```

Expected: `verified:true` and one active `dns_txt` claim row. Capture all output.

Then clean up:

```bash
RECORD=$(python3 -c "import json;print(json.load(open('/tmp/opencode/txt_created.json'))['result']['id'])")
curl -s -X DELETE -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records/$RECORD"
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" \
  -c "DELETE FROM teardown_claims WHERE slug='qa-gofaultline'; DELETE FROM teardowns WHERE slug='qa-gofaultline';"
```

Also run one filtered-response case through `PATCH .../response` with a legal-threat phrase and confirm `auto_hidden` plus founder notification fires.

- [ ] **Step 4: Append audit trail**

Append complete raw outputs summary to `aidlc-docs/audit.md` via terminal echo (`>>`), including parity diff results, HTTP codes, claim rows, and cleanup confirmations.

- [ ] **Step 5: Final commit**

```bash
git status --porcelain   # must be empty or docs-only
git push nebula-origin main
```

---

## Self-review notes (resolved during writing)

- Spec coverage: tiers table -> tasks 4-14; three verification paths -> tasks 6,7,8; rate limiting -> task 9; moderation/filter -> task 10; public rendering -> task 11; whole-domain attach -> task 12; remediation writes + score backfill -> task 13; regression alerts require no new work (existing monitors remain free and already email verified owners); archive -> task 15; DoD -> task 16.
- Type consistency: `fetchTeardown` record shape defined once (Task 5) and consumed unchanged by Tasks 11, 14; `TeardownDB` signatures defined once (Task 2) and reused everywhere.
- Known intentional flags for implementers (grep-before-write points): real singleton accessor name for AuditDB, auth dependency import names, AgentMailClient.send_internal signature, uv dependency management mode. Each flagged inline where it occurs.








