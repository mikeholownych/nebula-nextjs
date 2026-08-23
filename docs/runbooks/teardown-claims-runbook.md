# Teardown Claims Operations Runbook

Phase 1 claim system operational procedures. Spec: `docs/superpowers/specs/2026-08-22-teardown-claims-design.md`.

## Secrets and environment

- `INTERNAL_API_SECRET` is injected into the platform service process environment (systemd), not stored in `$HOME/.hermes/.env`. Read it without echoing:
  ```bash
  SECRET=$(sudo cat /proc/$(systemctl show -p MainPID --value nebula-platform-api.service)/environ | tr '\0' '\n' | grep '^INTERNAL_API_SECRET=' | cut -d= -f2-)
  ```
- Founder notification recipient allowlist lives in a systemd drop-in on `nebula-platform-api.service`: `NEBULA_INTERNAL_RECIPIENTS=mike.holownych@gmail.com`. The outbound gate rejects `send_internal` traffic to addresses not on this allowlist (`internal_recipient_not_allowed`). Change via `sudo systemctl edit nebula-platform-api.service` + restart.

## Founder takedown of a company response

Session-authenticated (founder account only):

```bash
curl -X POST https://nebulacomponents.com/api/teardowns/<slug>/takedown \
  -H "Cookie: access_token=<founder session jwt>"
```

Takedown is sticky: the owner cannot re-save either response text or private context afterwards (409). There is no un-remove control yet; reversal is SQL:

```sql
UPDATE teardown_claims SET response_status='visible'
WHERE slug='<slug>' AND status='active';
```

Note: public pages are ISR-cached 300s; a removal takes up to 5 minutes to disappear from all edges.

## Reseeding teardown content

Canonical marketing copy still lives in `customer-portal/app/teardowns/[slug]/data.ts` (dual-source state, see `.legacy/ARCHIVE_INVENTORY.md`). After editing it:

```bash
node customer-portal/scripts/export_teardowns.mjs
uv run --project /home/mike/nebula python scripts/seed_teardowns.py
```

Idempotent upsert by slug. Never delete teardown rows.

## Claim E2E smoke (QA rows, no third-party mail)

Never fire `email-request` at real third-party domains. Pattern:

```bash
psql "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433" -c \
  "INSERT INTO teardowns (slug,name,url,domain,score,grade,summary,context,findings,screenshot_path)
   VALUES ('qa-e2e','QA','https://<your-domain>','<your-domain>',6.0,'C','qa','qa','[]','/teardown-screenshots/basecamp.webp');"
```

Then exercise email-request (needs a mailbox you control at that domain), dns-start/dns-check (TXT `_nebula-verify.<domain>`), or gsc-check with your session. Delete qa rows after.

## Rate limits

Fixed-window Redis counters: `rl:tclaimreq:<ip>` 10/hour per IP and `rl:tclaimdom:<domain>` 5/hour per domain on email-request; `rl:tclaimdns:<ip>` 5/hour on dns-start. Client IP comes from `cf-connecting-ip` forwarded by the portal proxies; direct :8001 callers appear as `local`. To release a stuck counter: `redis-cli DEL rl:tclaimreq:<ip>:<window>`.

## Known limits

- No takedown UI button; the platform route above is the surface.
- `card-display.ts` holds index-card presentation data until the list payload is enriched (phase 3); keep it in sync with any index order/copy changes.
