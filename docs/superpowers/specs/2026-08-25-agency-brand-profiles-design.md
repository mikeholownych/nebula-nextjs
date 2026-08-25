# Agency Brand Profiles — Phase B Design
**Date:** 2026-08-25
**Status:** approved
**Depends on:** Phase A (agency_clients table, org membership gates)

---

## Problem

Agency subscribers need to brand the workspace their clients see with their own logo, name, and colors. Today the workspace app is hard-coded to Nebula branding. There is no per-org brand profile table, no logo storage, and no brand injection point in the workspace.

## Goals

1. Agency can upload a logo and set display name, primary color, support email.
2. Brand profile is stored per-org and served to the workspace-app at tenant resolution time.
3. Client users logging into the agency's workspace (Phase C — subdomain) see agency branding, not Nebula branding.
4. Agency admin can preview branding before publishing.

## Non-goals (Phase B)

- No subdomain routing yet (Phase C). Brand profile is stored and retrievable but only surfaced once Phase C ships the tenant middleware.
- No custom email sending domain — outbound audit emails remain from Nebula's AgentMail inbox.
- No per-client branding (all clients under one agency share the agency's brand).

---

## Architecture

### Data model

**`nebula_platform.brand_profiles`** (new table):

```sql
CREATE TABLE brand_profiles (
    id               uuid         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id  uuid         NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    display_name     text         NOT NULL,                     -- replaces "Nebula Components" in UI
    logo_url         text,                                       -- absolute URL; null = default Nebula logo
    logo_dark_url    text,                                       -- optional dark-mode variant
    primary_color    text         NOT NULL DEFAULT '#c7ff2f',   -- hex, e.g. '#3b82f6'
    support_email    text,                                       -- shown in workspace footer/help
    footer_text      text,                                       -- "Powered by MyAgency" etc.
    published        boolean      NOT NULL DEFAULT false,        -- false = draft, not served yet
    created_at       timestamptz  NOT NULL DEFAULT now(),
    updated_at       timestamptz  NOT NULL DEFAULT now()
);
```

`primary_color` defaults to Nebula's accent (`#c7ff2f`) so a profile without customization degrades correctly.

### Logo storage

Logo assets are stored in the existing object-store infrastructure. The upload flow:

1. Client calls `POST /api/organizations/{org_id}/brand/logo-upload-url` → API returns a signed PUT URL with a 5-minute TTL, scoped to `organizations/{org_id}/brand/logo-{uuid}.{ext}`.
2. Client uploads directly to the signed URL (never proxied through the API).
3. Client calls `PATCH /api/organizations/{org_id}/brand` with `logo_url` set to the public CDN URL of the uploaded object.

Maximum file size: 2 MB. Accepted MIME types: `image/png`, `image/svg+xml`, `image/webp`. Validated server-side at upload-URL issuance (Content-Type header) and at PATCH (URL must match the signed-URL pattern for this org).

If no object store is configured (`OBJECT_STORE_URL` env absent), the upload-url endpoint returns 503 with `{"message": "Logo upload not configured"}`. Logo field remains null — acceptable degradation.

### Routes (platform API)

Prefix: `/api/organizations/{org_id}/brand`

```
GET  /api/organizations/{org_id}/brand
       → current brand profile (or 404 if none)
       → {id, display_name, logo_url, logo_dark_url, primary_color, support_email, footer_text, published}

POST /api/organizations/{org_id}/brand
       → create brand profile (owner/admin only; org must have is_agency=true)
       → body: {display_name, primary_color?, support_email?, footer_text?}
       → 409 if profile already exists (use PATCH)

PATCH /api/organizations/{org_id}/brand
       → update any fields (owner/admin only)
       → body: partial {display_name?, logo_url?, logo_dark_url?, primary_color?, support_email?, footer_text?, published?}

POST /api/organizations/{org_id}/brand/logo-upload-url
       → returns {upload_url, public_url, expires_in: 300}
       → validates ext and content_type query params

DELETE /api/organizations/{org_id}/brand
       → removes profile (published → false first, then delete)
```

Public read endpoint (no auth, used by tenant middleware in Phase C):

```
GET /api/tenant-brand?domain={domain}
     → resolves domain → org via org_domains → returns brand profile if published=true
     → 404 if no matching org or profile not published
     → {display_name, logo_url, logo_dark_url, primary_color, support_email, footer_text, org_id, org_slug}
```

This public endpoint is called by the Phase C Next.js middleware on every request to a custom domain. It is heavily cached (CDN TTL 60s).

### Workspace-app integration

**Brand context provider** — `workspace-app/app/providers/BrandProvider.tsx`:
- Reads `brandProfile` from a server-side prop injected by Phase C middleware (via `x-tenant-brand` header, JSON-encoded).
- Falls back to Nebula defaults if header absent.
- Exposes `useBrand()` hook: `{displayName, logoUrl, primaryColor, supportEmail, footerText}`.

**CSS injection** — `workspace-app/app/layout.tsx` server component:
- Injects a `<style>` tag with `--brand-primary: {primaryColor}; --brand-logo: url('{logoUrl}');` as CSS custom properties.
- All existing accent usage (`#c7ff2f` / Tailwind `accent`) picks up `--brand-primary` automatically once the Tailwind config maps the `accent` color to `var(--brand-primary)`.

**Logo** — header component replaces the hardcoded Nebula logo `<img>` with `{logoUrl ?? '/nebula-logo.svg'}`.

**Settings UI** — `workspace-app/app/settings/brand/page.tsx` (new sub-route):
- Live preview panel (iframe or CSS variable preview div).
- Color picker for `primary_color`.
- Logo upload (drag-and-drop → signed URL → display).
- `published` toggle with confirmation modal ("Publishing will make these changes visible to all clients logging in to your branded workspace").
- Only visible to agency org owners/admins.

---

## Testing

- Unit: upload URL issuance (scoping, MIME validation, size check), brand profile CRUD, `published` flag gate.
- Integration: non-agency org → 403 on all brand routes; non-owner → 403 on write routes; GET `/tenant-brand` resolves domain → profile → returns correct shape.
- E2E: create profile, toggle published, hit `/tenant-brand?domain=...` → returns brand fields.

---

## Definition of Done

- `GET /api/organizations/{org_id}/brand` returns stored profile.
- `GET /api/tenant-brand?domain=test-agency.example.com` returns `{"display_name":"Test Agency",...}` after domain is linked and profile published.
- Settings brand page renders in workspace-app (logo upload functional if object store configured, gracefully disabled if not).
- 656 + new tests pass.
