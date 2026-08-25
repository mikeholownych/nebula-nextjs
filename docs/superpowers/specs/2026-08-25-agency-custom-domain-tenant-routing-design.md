# Agency Custom Domain + Tenant Routing — Phase C Design
**Date:** 2026-08-25
**Status:** approved
**Depends on:** Phase A (agency_clients), Phase B (brand_profiles, /tenant-brand endpoint)

---

## Problem

Agency subscribers need their clients to access the workspace at a branded URL they control (e.g. `audits.acme.com`), not `app.nebulacomponents.com`. Today `workspace-app` has no tenant-aware routing — it serves a single domain with Nebula branding regardless of the Host header.

## Goals

1. Agency adds their custom domain via workspace settings.
2. DNS TXT verification confirms they own the domain.
3. Once verified, Cloudflare Custom Hostnames routes `audits.acme.com` → `app.nebulacomponents.com` origin.
4. `workspace-app` middleware reads the Host header, resolves the tenant org, injects brand context.
5. Client users who navigate to `audits.acme.com` see agency branding and are scoped to agency clients.
6. Agency can also use a Nebula-managed subdomain: `{org-slug}.app.nebulacomponents.com` — no DNS verification needed, provisioned automatically.

## Non-goals (Phase C)

- No per-client custom domains (one custom domain per agency org).
- No SSL certificate management by Nebula (Cloudflare handles it via Custom Hostnames).
- No email sending from the custom domain.

---

## Architecture

### Domain provisioning flow

```
Agency admin → Settings → Domains → "Add domain"
  → POST /api/organizations/{org_id}/domains  {hostname: "audits.acme.com"}
  → API creates org_domains row (status='pending_verification')
  → API calls Cloudflare Custom Hostnames API → creates custom hostname entry
  → API generates DNS TXT verification token → stores in org_domains.verification_token
  → UI shows: "Add this TXT record to your DNS: _nebula-verify.audits.acme.com → {token}"

Agency admin adds TXT record → clicks "Verify"
  → POST /api/organizations/{org_id}/domains/{domain_id}/verify
  → API calls Cloudflare: check custom hostname status
  → If Cloudflare says 'active': update org_domains status='active', verified_by='dns_txt', verified_at=now()
  → If pending: return {status:'pending', message:'TXT record not yet propagated'}

Nebula-managed subdomain:
  → POST /api/organizations/{org_id}/domains  {hostname: null}  (null = use org slug)
  → API computes {org-slug}.app.nebulacomponents.com
  → No Cloudflare Custom Hostnames needed (wildcard *.app.nebulacomponents.com already on Cloudflare)
  → Creates org_domains row (status='active', verified_by='managed')
  → No DNS action required from agency admin
```

### Cloudflare adapter

**`platform_api/services/cloudflare_hostnames.py`** (new):

```python
class CloudflareHostnamesAdapter:
    """Thin wrapper around Cloudflare Custom Hostnames API v4."""

    def __init__(self, zone_id: str, api_token: str):
        ...

    async def create_hostname(self, hostname: str) -> dict:
        """POST /zones/{zone_id}/custom_hostnames"""
        ...

    async def get_hostname_status(self, hostname: str) -> dict:
        """GET /zones/{zone_id}/custom_hostnames?hostname={hostname}"""
        # returns: {id, hostname, status: pending|active|..., verification_errors}

    async def delete_hostname(self, hostname: str) -> None:
        """DELETE /zones/{zone_id}/custom_hostnames/{id}"""
        ...
```

Env vars: `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN`. If absent, `create_hostname` is a no-op (Nebula-managed subdomains don't need it; custom domain verification returns 503 if Cloudflare not configured).

### org_domains schema updates

The `org_domains` table already exists with `status` (`active`/`revoked`/`excluded`) and `verified_by` (`manual`/`dns_txt`). Add:

```sql
ALTER TABLE org_domains ADD COLUMN IF NOT EXISTS verification_token text;
ALTER TABLE org_domains ADD COLUMN IF NOT EXISTS cf_hostname_id      text;
-- status constraint update: add 'pending_verification' to the CHECK
ALTER TABLE org_domains DROP CONSTRAINT IF EXISTS org_domains_status_check;
ALTER TABLE org_domains ADD CONSTRAINT org_domains_status_check
    CHECK (status IN ('active', 'revoked', 'excluded', 'pending_verification'));
```

`cf_hostname_id`: the Cloudflare Custom Hostname resource ID, needed for deletion.
`verification_token`: DNS TXT token displayed to the admin.

### Routes (platform API)

Existing org_domains are managed via the organizations router. Extend `platform_api/routes/organizations.py`:

```
GET  /api/organizations/{org_id}/domains
       → list all org_domains (all statuses)

POST /api/organizations/{org_id}/domains
       body: {hostname?: string}   (null/absent = provision managed subdomain)
       → creates domain, triggers Cloudflare, returns {id, hostname, status, verification_token}
       → 409 if hostname already claimed by another org

POST /api/organizations/{org_id}/domains/{domain_id}/verify
       → checks Cloudflare status → updates org_domains.status
       → returns {status: 'active'|'pending', message}

DELETE /api/organizations/{org_id}/domains/{domain_id}
       → revokes (status='revoked'), deletes Cloudflare custom hostname
```

### Tenant middleware (workspace-app)

**`workspace-app/middleware.ts`** — extend the existing cookie-auth gate:

```typescript
import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_API = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'
const OWN_HOSTS = new Set([
  'app.nebulacomponents.com',
  'localhost:3001',
  '127.0.0.1:3001',
])

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const isOwnHost = OWN_HOSTS.has(host) || host.endsWith('.app.nebulacomponents.com')

  let tenantHeader: Record<string, string> = {}

  if (!isOwnHost) {
    // External custom domain — resolve tenant
    const res = await fetch(
      `${PLATFORM_API}/api/tenant-brand?domain=${encodeURIComponent(host)}`,
      { next: { revalidate: 60 } }   // Next.js fetch cache, 60s
    )
    if (res.ok) {
      const brand = await res.json()
      tenantHeader = {
        'x-tenant-org-id': brand.org_id,
        'x-tenant-org-slug': brand.org_slug,
        'x-tenant-brand': JSON.stringify(brand),
      }
    } else {
      // Unknown custom domain → 404
      return NextResponse.json({ error: 'Unknown host' }, { status: 404 })
    }
  } else if (host.endsWith('.app.nebulacomponents.com')) {
    // Nebula-managed subdomain — resolve by slug
    const slug = host.split('.')[0]
    const res = await fetch(
      `${PLATFORM_API}/api/tenant-brand?domain=${encodeURIComponent(host)}`,
      { next: { revalidate: 60 } }
    )
    if (res.ok) {
      const brand = await res.json()
      tenantHeader = {
        'x-tenant-org-id': brand.org_id,
        'x-tenant-org-slug': slug,
        'x-tenant-brand': JSON.stringify(brand),
      }
    }
    // Unrecognised slug → no tenant headers; workspace shows Nebula defaults
  }

  // Existing auth gate (unchanged)
  const token = request.cookies.get('access_token')
  const isPublicPath = request.nextUrl.pathname.startsWith('/login') ||
                       request.nextUrl.pathname.startsWith('/invite')
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('returnTo', request.nextUrl.pathname)
    const response = NextResponse.redirect(loginUrl)
    // Propagate tenant headers to the redirect so login page can brand itself
    for (const [k, v] of Object.entries(tenantHeader)) {
      response.headers.set(k, v)
    }
    return response
  }

  const response = NextResponse.next()
  for (const [k, v] of Object.entries(tenantHeader)) {
    response.headers.set(k, v)
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
```

### Brand injection (workspace-app layout)

`workspace-app/app/layout.tsx` reads `x-tenant-brand` from request headers (server component, `headers()` from `next/headers`) and injects CSS variables + passes brand to `<BrandProvider>` (Phase B component):

```tsx
import { headers } from 'next/headers'

export default async function RootLayout({ children }) {
  const h = headers()
  const brandRaw = h.get('x-tenant-brand')
  const brand = brandRaw ? JSON.parse(brandRaw) : null

  const primaryColor = brand?.primary_color ?? '#c7ff2f'
  const logoUrl = brand?.logo_url ?? '/nebula-logo.svg'

  return (
    <html>
      <head>
        <style>{`:root { --brand-primary: ${primaryColor}; }`}</style>
      </head>
      <body>
        <BrandProvider brand={brand}>
          {children}
        </BrandProvider>
      </body>
    </html>
  )
}
```

### Wildcard DNS

For Nebula-managed subdomains (`*.app.nebulacomponents.com`):
- Add a `CNAME *.app.nebulacomponents.com → app.nebulacomponents.com` in Cloudflare DNS.
- No per-org DNS changes needed.

For custom domains:
- Cloudflare Custom Hostnames handles SSL + routing to the origin.
- Agency admin adds the CNAME Cloudflare provides in their DNS registrar.

---

## Testing

- Unit: `CloudflareHostnamesAdapter` with mocked httpx; slug-to-managed-hostname derivation; verification token check.
- Integration: POST domain → Cloudflare create called → `pending_verification`; POST verify → Cloudflare active → `active`.
- Middleware: mock `x-tenant-brand` header → layout injects correct CSS variable; unknown host → 404; own host → no-op.
- E2E (manual): add `acme.test` to `/etc/hosts` pointing at `127.0.0.1`; create org_domain row manually with `status='active'`; hit `http://acme.test:{port}` → brand CSS variable injected in HTML.

---

## Definition of Done

- `POST /api/organizations/{org_id}/domains {hostname:null}` provisions `{slug}.app.nebulacomponents.com`, status active immediately.
- `POST /api/organizations/{org_id}/domains {hostname:"audits.acme.com"}` creates pending_verification row; POST verify checks Cloudflare.
- workspace-app middleware reads `host` header, calls `/api/tenant-brand`, injects `x-tenant-brand`.
- `workspace-app/app/layout.tsx` picks up `--brand-primary` CSS variable from brand profile.
- Unknown custom domain → 404. Own host → normal Nebula branding.
- 656 + new tests pass. Blast radius: `app.nebulacomponents.com` workspace → 200/307, all existing routes unaffected.
