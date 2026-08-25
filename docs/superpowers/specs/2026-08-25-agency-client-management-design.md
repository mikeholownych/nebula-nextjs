# Agency Client Management — Phase A Design
**Date:** 2026-08-25
**Status:** approved
**Phases:** A (this doc) — client management. B — brand profiles. C — custom domain + tenant routing.

---

## Problem

The live $497/mo agency subscriber needs to run audits for multiple clients and view results scoped per client. Today all audits are email-keyed and land in a single inbox. There is no client concept, no client-scoped view, and no way to hand a client their results separately from the agency's own results.

## Goals

1. Agency can create named client accounts with a domain.
2. Running an audit or monitor for a client uses a system-managed email slot so results are partitioned away from the agency's personal inbox.
3. Agency workspace shows a Clients tab — list of clients with per-client drill-down (audit history, findings, score trend).
4. Client invite: agency can generate a login link so the client can view their own results in the same workspace app (read-only by default).
5. Unlink: agency can remove a client; their data remains, client access is revoked.

## Non-goals (Phase A)

- No branded subdomain for the client (Phase C).
- No brand profile (Phase B).
- No client self-registration.
- No client billing — agency pays, clients are seats.
- No client → agency visibility (clients cannot see the agency's own audits).

---

## Architecture

### Client email slot convention

Every client gets a deterministic system-managed email address:

```
{client-slug}+{org-id-prefix8}@clients.nebulacomponents.com
```

Example: agency org `07ed2178`, client slug `acme-corp` → `acme-corp+07ed2178@clients.nebulacomponents.com`

This email is never a real mailbox. It exists solely as an audit ownership key in `nebula_audit`. The `+` passes cleanly through all existing email-split logic (confirmed: all splits are on `@`, not `+`).

The `clients.nebulacomponents.com` subdomain does not need to receive mail — it is purely a namespace. No MX record needed.

### Data model

**`nebula_platform.agency_clients`** (new table):

```sql
id               uuid         PK  gen_random_uuid()
organization_id  uuid         NOT NULL  FK → organizations.id ON DELETE CASCADE
name             text         NOT NULL
slug             text         NOT NULL
domain           text         NOT NULL             -- primary audited domain
client_email     text         NOT NULL  UNIQUE     -- system-managed audit ownership key
status           text         NOT NULL  DEFAULT 'active'
                              CHECK: active | suspended | unlinked
notes            text
invited_user_id  uuid                  FK → users.id  -- set when client accepts invite
invite_token     text                  -- single-use; cleared on acceptance
invite_expires_at timestamptz
created_at       timestamptz  NOT NULL  DEFAULT now()
updated_at       timestamptz  NOT NULL  DEFAULT now()
UNIQUE (organization_id, slug)
```

`client_email` is auto-computed at insert: `{slug}+{org_id[:8]}@clients.nebulacomponents.com`. Never user-supplied.

`invited_user_id`: if non-null, that user can log into the workspace app and see only this client's data (via `client_email` namespace). A client user cannot see the agency's personal audits.

### Audit scoping

When agency runs an audit for client `acme-corp`:
- `create_audit(url=..., email='acme-corp+07ed2178@clients.nebulacomponents.com', source='agency_client')`
- Entitlement check: uses agency user's email for entitlement resolution (unlimited audits). The client_email is only the ownership key, not used for billing lookup.

New `source` value: `'agency_client'` — excluded from agency's personal audit feed, included in client's feed.

### Entitlement resolution for agency_client audits

`resolve_for_email('acme-corp+07ed2178@clients.nebulacomponents.com')` would fail (no subscription). The audit creation route must resolve entitlements from the **invoking session's email** (agency user), not the client_email. The route accepts `client_id` in the body; the API looks up the `agency_clients` row to verify org membership, then runs the audit under `client_email` but gates on the agency's entitlements.

### Routes (platform API)

Prefix: `/api/organizations/{org_id}/clients`

```
GET    /api/organizations/{org_id}/clients
         → list clients (agency member required)
         → [{id, name, slug, domain, client_email, status, created_at}]

POST   /api/organizations/{org_id}/clients
         body: {name, domain, notes?}
         → creates client, auto-computes client_email and slug
         → 409 if slug collision

GET    /api/organizations/{org_id}/clients/{client_id}
         → client detail + last 10 audits summary

PATCH  /api/organizations/{org_id}/clients/{client_id}
         body: {name?, domain?, notes?, status?}
         → update (owner/admin only)

DELETE /api/organizations/{org_id}/clients/{client_id}
         → status = 'unlinked'; data preserved; invited_user_id access revoked

POST   /api/organizations/{org_id}/clients/{client_id}/invite
         → generates invite_token (32-byte urlsafe), sets invite_expires_at = now+7d
         → returns {invite_url: "https://app.nebulacomponents.com/invite/{token}"}

GET    /api/organizations/{org_id}/clients/{client_id}/audits
         → audit history for client_email (reads nebula_audit, same pattern as /audit/by-email)
```

Membership check for all routes: caller must have an active membership in `org_id`. `is_agency` must be true on the org.

### Workspace-app frontend

New route: `workspace-app/app/clients/`

- `page.tsx`: client list (name, domain, status, last audit score, last audit date). "Add client" button.
- `[clientId]/page.tsx`: client detail — score history chart (recharts, already dep), findings summary, audit list, "Run audit" button, "Invite client" button.
- Nav item: "Clients" (between "Team" and "Settings"), only visible when `org.is_agency === true`.
- `isAgency` fetched from `GET /api/organizations/{org_id}` — already returns `is_agency`.

New BFF proxies:
- `app/api/clients/route.ts` (GET list, POST create)
- `app/api/clients/[clientId]/route.ts` (GET detail, PATCH, DELETE)
- `app/api/clients/[clientId]/invite/route.ts` (POST invite)
- `app/api/clients/[clientId]/audits/route.ts` (GET audit history)

Invite acceptance route: `workspace-app/app/invite/[token]/page.tsx` — validates token, creates/links user account, redirects to client workspace.

### Client user workspace access

When a client user logs in (via invite), their session resolves to a `Principal` with `workspace_email = client_email`. The workspace app shows only audits for that `client_email`. The client sees: their audits, findings, score timeline — no agency data, no Clients tab, no billing.

This works with zero changes to the existing workspace views because they already filter on the session's workspace_email. The only addition: the Clients tab must be hidden when `org.is_agency !== true` or when the logged-in user is a client (identified by `workspace_email` matching the `clients.nebulacomponents.com` pattern).

---

## Database Migration

**`nebula_platform`** — one migration:

```sql
CREATE TABLE agency_clients (
    id               uuid         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id  uuid         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name             text         NOT NULL,
    slug             text         NOT NULL,
    domain           text         NOT NULL,
    client_email     text         NOT NULL UNIQUE,
    status           text         NOT NULL DEFAULT 'active'
                                  CHECK (status IN ('active','suspended','unlinked')),
    notes            text,
    invited_user_id  uuid         REFERENCES users(id) ON DELETE SET NULL,
    invite_token     text,
    invite_expires_at timestamptz,
    created_at       timestamptz  NOT NULL DEFAULT now(),
    updated_at       timestamptz  NOT NULL DEFAULT now(),
    UNIQUE (organization_id, slug)
);
CREATE INDEX idx_agency_clients_org ON agency_clients (organization_id) WHERE status='active';
CREATE INDEX idx_agency_clients_token ON agency_clients (invite_token) WHERE invite_token IS NOT NULL;
```

No changes to `nebula_audit`. `source='agency_client'` added as a documented value in audit creation, no schema change needed (source is `text`).

---

## Testing

- Unit: slug generation, `client_email` derivation, slug collision handling, membership-gate 403.
- Integration: full CRUD lifecycle (create→invite→accept→unlink), duplicate slug rejection, agency-only guard (non-agency org → 403).
- E2E: create client, run audit under `client_email`, list audit in client detail, invite + accept flow, revoke + re-login → 403.

---

## Definition of Done

- Agency org can create ≥1 client; audits run under client_email appear in `/clients/{id}/audits`.
- Non-agency org gets 403 on all client routes.
- Invite token flow: generate → accept → client user logs in → sees only client audits.
- Unlink: client user session → 403 on workspace.
- `workspace-app` Clients tab visible for agency users, hidden for non-agency and client users.
- 653 + new tests pass. Build clean. Blast radius: `/`, `/audit`, workspace → all 200.
