# Runtime Topology Discovery

**Date:** 2026-07-14
**Wave:** 0 (Stabilize before building)
**Purpose:** Document current service bindings for safe Next.js migration

---

## Service Ports

Currently active services:

```
Port 8765  → agentic_server.py (Nebula main site)
Port 9000  → webhook_server.py (Stripe webhook receiver)
Port 8000  → Caddy reverse proxy
Port 8080  → Caddy reverse proxy (public endpoints)
Port 8766  → blog.nebulacomponents.shop
Port 8767  → launchcrate.io
Port 8768  → sdr.launchcrate.io
Port 5432  → PostgreSQL
Port 6379  → Redis (localhost only)
```

---

## Cloudflare Tunnel Configuration

**Tunnel ID:** `8cfcc2e1-cf49-4d57-b412-c1ec0474ffd2`

**Hostname bindings:**

| Hostname | Service | Port |
|----------|---------|------|
| `nebulacomponents.shop` | `localhost:8765` | Main Nebula site |
| `www.nebulacomponents.shop` | `localhost:8765` | Main Nebula site |
| `blog.nebulacomponents.shop` | `localhost:8766` | Blog subdomain |
| `launchcrate.io` | `localhost:8767` | LaunchCrate product |
| `www.launchcrate.io` | `localhost:8767` | LaunchCrate product |
| `sdr.launchcrate.io` | `localhost:8768` | SDR service |

**Config location:** `/home/mike/.cloudflared/config.yml`

**Run command:**
```bash
cloudflared --config /home/mike/.cloudflared/config.yml tunnel run 8cfcc2e1-cf49-4d57-b412-c1ec0474ffd2
```

---

## Caddy Configuration

**Service:** Caddy reverse proxy (active since 2026-07-07)

**File:** `/etc/caddy/Caddyfile`

**Bindings:**

```
:8080 {
    reverse_proxy /api/stats localhost:9000
    reverse_proxy /api/health localhost:9000
    reverse_proxy /webhook/* localhost:9000
    reverse_proxy /blog* localhost:8766
    reverse_proxy / localhost:8765
}

launchcrate.io:80 → localhost:8767
sdr.launchcrate.io:80 → localhost:8768
```

**Purpose:** Local reverse proxy for port mapping and routing

**Systemd service:** `caddy.service` (enabled)

---

## Python Services

### agentic_server.py

**Process:** `/usr/bin/python3 /home/mike/nebula/agentic_server.py 8765 /home/mike/nebula nebulacomponents.shop`

**Port:** 8765
**Purpose:** Main Nebula landing page + audit endpoints
**Startup:** Systemd service `nebula-site.service`

### webhook_server.py  

**Process:** `/usr/bin/python3 /home/mike/nebula/webhook_server.py`

**Port:** 9000 (via Caddy proxy on :8080)
**Purpose:** Stripe webhook receiver, revenue tracking
**Routes:**
- `/webhook/*` → Stripe webhook endpoint
- `/api/stats` → Revenue stats
- `/api/health` → Health check

---

## Route Inventory

**Active endpoints (from sitemap):**

- `/` → Landing page (index.html)
- `/demo.html`
- `/ad-burn-leaderboard.html`
- `/audit` → Audit form endpoint
- `/audit.html` → Audit page
- `/generator.html` → Case study generator
- `/pricing-generator.html` → Pricing page generator
- `/checkout.html` → Stripe checkout flow
- `/audit/{id}` → Password-protected audit dashboard (NEW)
- `/7-systems.html` → Lead magnet
- `/learning-center/` → 11 educational pages

**Generated content:**
- 391 case study pages (82% of total content)
- 408 JSON-LD structured data pages
- 461 total HTML files (estimated)

---

## Database

**PostgreSQL:** Running on `localhost:5432` (internal only)

**Redis:** Running on `localhost:6379` (internal only)

---

## Migration Implications

### Critical Bindings

1. **Stripe webhook path:** `/webhook/*` → `localhost:9000`
   - Must remain signed and idempotent during migration
   - SEC-01 already verified Stripe signature validation

2. **Blog subdomain:** `blog.nebulacomponents.shop` → `localhost:8766`
   - Separate service, continues unchanged

3. **LaunchCrate domains:** `launchcrate.io` + `sdr.launchcrate.io`
   - Separate products, continue unchanged

### Migration Strategy

**Phase 1 (Wave 1):** Deploy Next.js alongside Python on port 8765
- Python continues serving `/audit`, `/webhook/*`, Python APIs
- Next.js serves `/`, `/pricing`, `/contact`, customer dashboard

**Phase 2 (Wave 3):** Migrate Stripe webhooks to Next.js API routes
- Keep `localhost:9000` as fallback during transition
- Implement idempotent webhook handling

**Phase 3 (Wave 4):** Full cutover
- Python services continue only for revenue/audit-SEO features
- Next.js becomes primary frontend

### Rollback Plan

If Next.js deployment fails:
1. Stop Next.js service
2. All routes fallback to Python on port 8765
3. Cloudflare tunnel points to `localhost:8765` (unchanged)
4. Caddy continues reverse proxy without modification

---

## Next Steps

1. **Generator freeze:** Pause case-study generators before route-baseline capture
2. **Route baseline:** Snapshot all 461 HTML files with contracts
3. **Cloudflare for SaaS:** Verify custom hostname capability for customer subdomains
4. **Topology diagram:** Create visual diagram for migration planning

---

**Status:** Topology captured. Ready for generator freeze.
