# Nebula Platform Architecture — Wave 1 (Identity + Billing)

**Date:** 2026-07-14  
**Status:** IMPLEMENTING  
**Monthly Cost:** $0 (free tiers + self-hosted)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
│  Next.js 16.2.10 (proxy.ts) + React 19 + Tailwind CSS           │
└───────────────────┬─────────────────────────────────┬───────────┘
                    │                                 │
                    ▼                                 ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│   AUTHENTICATION LAYER       │    │      BILLING LAYER           │
│   Google OAuth 2.0 (FREE)    │    │   Stripe Portal (INCLUDED)   │
│   Email Magic Links (FREE)   │    │   Checkout + Webhooks        │
└───────────┬──────────────────┘    └───────────┬──────────────────┘
            │                                   │
            │ ID Token                          │ Events
            ▼                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│  FastAPI (Python 3.12) on Platform API (port 8766)              │
│  - JWT verification + Redis session check                        │
│  - Rate-limiting (Redis token bucket)                           │
│  - Organization context injection                                │
│  - Audit logging (PostgreSQL)                                   │
└──────────┬──────────────────────────────┬───────────────────────┘
           │                              │
           ▼                              ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│   DATA LAYER            │    │   CACHE LAYER           │
│   PostgreSQL 16         │    │   Redis 7.0 (Docker)    │
│   - users               │    │   - Session blacklist   │
│   - user_identities     │    │   - Active sessions     │
│   - organizations       │    │   - Rate-limit counters │
│   - memberships         │    │   - Idempotency keys    │
│   - subscriptions       │    │                         │
│   - audit_events        │    │                         │
└─────────────────────────┘    └─────────────────────────┘
           │
           ▼
┌─────────────────────────┐
│   EMAIL LAYER           │
│   SendGrid (3K/mo FREE) │
│   - Magic links         │
│   - Receipts            │
└─────────────────────────┘
```

---

## Component Stack

### Frontend (Next.js 16)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Router | Next.js App Router | File-based routing |
| Middleware | `proxy.ts` (not middleware.ts) | Auth check + redirects |
| Auth | `@react-oauth/google` | Google Sign-In button |
| State | React Context + SWR | Session management |
| Styling | Tailwind CSS | Utility-first CSS |
| Deployment | Vercel or self-hosted | TBD |

### Backend (FastAPI)

| Service | Port | Purpose |
|---------|------|---------|
| `platform_api` | 8766 | Core API + auth |
| `nebula-site` | 8765 | Existing site |
| Redis | 6379 | Sessions + rate-limit |
| PostgreSQL | 5433 | Persistent data |

### Authentication

| Method | Provider | Cost |
|--------|----------|------|
| Google OAuth | Google Cloud (OAuth 2.0) | FREE |
| Email Magic Links | SendGrid | FREE (3K/month) |
| JWT Sessions | Custom (Redis-backed) | FREE |

### Database

| Store | Technology | Purpose |
|-------|-----------|---------|
| PostgreSQL | 16 (self-hosted) | Users, orgs, subscriptions, audit |
| Redis | 7.0 (Docker) | Sessions, rate-limiting, caching |

### Billing

| Provider | Purpose | Cost |
|----------|---------|------|
| Stripe Checkout | Payment processing | 2.9% + $0.30 per transaction |
| Stripe Portal | Customer self-service | INCLUDED |
| Stripe Webhooks | Event-driven updates | INCLUDED |

---

## Data Flow

### 1. User Registration (Google OAuth)

```
User clicks "Sign in with Google"
         ↓
Google OAuth popup
         ↓
User authorizes
         ↓
Frontend receives ID token
         ↓
POST /api/auth/google (id_token)
         ↓
Backend verifies Google OIDC token
         ↓
Check user_identities table (issuer="google", subject=google_user_id)
         ↓
If new user:
  - Create User (email)
  - Create UserIdentity (google, subject)
  - Create Organization (default)
  - Create Membership (owner)
         ↓
Create Redis session (session_id, IP, user_agent)
         ↓
Generate JWT (user_id, session_id, org_id)
         ↓
Return JWT to frontend
         ↓
Frontend stores JWT (HTTP-only cookie)
         ↓
Redirect to /dashboard
```

### 2. User Registration (Magic Link)

```
User enters email
         ↓
POST /api/auth/magic-link (email)
         ↓
Backend generates magic token (JWT, 15-min expiry)
         ↓
Store in Redis (magic:{email}:{token})
         ↓
Send email via SendGrid with magic link
         ↓
User clicks magic link
         ↓
GET /api/auth/verify?token={token}
         ↓
Validate token from Redis
         ↓
Create/find User
         ↓
Create session + JWT
         ↓
Redirect to /dashboard
```

### 3. Stripe Subscription Flow

```
User clicks "Subscribe to Fix Pack ($147)"
         ↓
POST /api/billing/checkout
         ↓
Create Stripe Checkout Session
         ↓
Redirect to Stripe Checkout page
         ↓
User completes payment
         ↓
Stripe POST /webhook/stripe (checkout.session.completed)
         ↓
Update subscriptions table (stripe_subscription_id, status=active)
         ↓
Update audit_events table (event_type="subscription_created")
         ↓
User redirected to /dashboard (success)
```

### 4. Rate-Limited API Request

```
Client request → proxy.ts (Next.js)
         ↓
Authorization header: Bearer {jwt}
         ↓
FastAPI middleware
         ↓
Check Redis rate limit (ratelimit:{user_id}:{endpoint})
         ↓
If exceeded → 429 Too Many Requests
         ↓
Verify JWT signature
         ↓
Check Redis blacklist (blacklist:jwt:{session_id})
         ↓
If blacklisted → 401 Unauthorized
         ↓
Extract user_id, org_id from JWT
         ↓
Inject into request.state.user
         ↓
Route handler executes
         ↓
All DB queries filtered by org_id (tenant isolation)
         ↓
Log to audit_events table
         ↓
Return response
```

---

## Security Architecture

### Authentication

1. **Google OIDC verification:**
   - Verify signature with Google's public keys (JWKS)
   - Check issuer (`accounts.google.com`)
   - Check audience (your `client_id`)
   - Check expiration

2. **JWT sessions:**
   - Signed with `SECRET_KEY` (256-bit random)
   - 7-day expiry
   - Includes: `user_id`, `session_id`, `org_id`, `exp`, `iat`, `jti`

3. **Session revocation:**
   - Redis blacklist: `blacklist:jwt:{session_id}`
   - TTL = remaining JWT lifetime
   - Checked on every request

### Authorization

1. **Role-based access control (RBAC):**
   - Roles: `owner`, `admin`, `member`
   - Stored in `memberships.role`

2. **Tenant isolation:**
   - Every query includes `organization_id`
   - Enforced in middleware
   - Cross-tenant access returns 404 (not 403)

3. **Permission matrix:**
   - `owner`: Full access, billing, delete org
   - `admin`: Invite members, manage settings
   - `member`: View dashboard, audit reports

### Rate-Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/google` | 10 | 1 min |
| `/auth/magic-link` | 5 | 15 min |
| `/api/*` (auth) | 100 | 1 min |
| `/api/*` (anon) | 20 | 1 min |
| `/webhook/*` | 1000 | 1 min |

### Audit Logging

**Every request logs to `audit_events` table:**
- `event_type`: "api.request", "auth.login", "subscription.created"
- `event_data`: JSON (endpoint, method, status_code)
- `request_id`: From X-Request-ID header
- `user_id`, `organization_id`: From JWT

---

## Database Schema

### PostgreSQL (7 tables)

```sql
-- Users (identity root)
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- OAuth identities
user_identities (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  issuer VARCHAR(255),  -- "google", "github", etc.
  subject VARCHAR(255), -- provider's user ID
  created_at TIMESTAMPTZ,
  UNIQUE(issuer, subject)
)

-- Organizations (tenant root)
organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  slug VARCHAR(100) UNIQUE,
  is_agency BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Memberships (user-org relationship)
memberships (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, organization_id)
)

-- Subscriptions (Stripe integration)
subscriptions (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  plan VARCHAR(100),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Audit events (append-only log)
audit_events (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(100),
  event_data TEXT,
  request_id VARCHAR(100),
  created_at TIMESTAMPTZ
)

-- Alembic migrations
alembic_version (
  version_num VARCHAR(32) PRIMARY KEY
)
```

### Redis (4 key patterns)

```
# Active sessions
user:{user_id}:sessions (Hash)
  {session_id}: {"ip": "...", "user_agent": "...", "created_at": "..."}

# Session blacklist
blacklist:jwt:{session_id} = "revoked" (String, TTL = JWT剩余时间)

# Rate limits
ratelimit:{identifier}:{endpoint} = {count} (String, TTL = window)

# Magic link tokens
magic:{email}:{token} = "pending" (String, TTL = 15 minutes)
```

---

## API Endpoints (Planned)

### Authentication

```
POST   /api/auth/google           # Google OAuth login
POST   /api/auth/magic-link       # Request magic link
GET    /api/auth/verify           # Verify magic link token
POST   /api/auth/logout           # Revoke current session
POST   /api/auth/logout-all       # Revoke all sessions
GET    /api/auth/sessions         # List active sessions
DELETE /api/auth/sessions/{id}    # Revoke specific session
GET    /api/auth/me               # Current user profile
```

### Billing

```
POST   /api/billing/checkout      # Create Stripe Checkout session
GET    /api/billing/portal        # Stripe Customer Portal URL
GET    /api/billing/subscription  # Current subscription status
```

### Organization

```
GET    /api/orgs/{id}             # Get organization
PATCH  /api/orgs/{id}             # Update organization
GET    /api/orgs/{id}/members     # List members
POST   /api/orgs/{id}/invites     # Invite member
DELETE /api/orgs/{id}/members/{user_id}  # Remove member
```

### Audit

```
GET    /api/audit/events          # List audit events (paginated)
GET    /api/audit/events/{id}     # Get audit event details
```

---

## Implementation Status

### Completed ✅

- [x] PostgreSQL installed and configured
- [x] Database `nebula_platform` created
- [x] SQLAlchemy models defined (7 tables)
- [x] Alembic migrations configured
- [x] First migration executed (0001_platform_core)
- [x] Redis installed (Docker, port 6379)

### In Progress ⏭️

- [ ] Install Python dependencies (authlib, httpx, redis)
- [ ] Implement Google OIDC verification
- [ ] Implement JWT session management
- [ ] Implement Redis session tracking
- [ ] Implement rate-limiting middleware
- [ ] Create auth endpoints (Google, magic link)

### Pending ⏳

- [ ] Google Cloud Console setup (OAuth credentials)
- [ ] Frontend Google Login component
- [ ] Stripe webhook handler
- [ ] Customer portal integration
- [ ] Testing (unit + integration)
- [ ] Deployment to production

---

## Configuration

### Environment Variables

```bash
# PostgreSQL
DATABASE_URL=postgresql+psycopg:///nebula_platform?host=/var/run/postgresql&port=5433&user=postgres

# Redis
REDIS_URL=redis://localhost:6379/0

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# JWT
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=7

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_FIX_PACK_PRICE_ID=price_xxx

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@nebulacomponents.shop

# Platform
PLATFORM_API_BASE_URL=https://api.nebulacomponents.shop
FRONTEND_BASE_URL=https://nebulacomponents.shop
```

---

## Monitoring

### Health Checks

```bash
# PostgreSQL
PGPASSWORD=nebula_dev_2026 psql -U nebula -h localhost -d nebula_platform -c "SELECT 1"

# Redis
redis-cli ping

# Platform API
curl http://localhost:8766/healthz
```

### Metrics to Track

- Active sessions (Redis)
- Database connections
- Redis memory usage
- API response times
- Rate-limit rejections
- Auth success/failure rates

---

## Cost Summary

| Component | Monthly Cost |
|-----------|--------------|
| PostgreSQL (self-hosted) | $0 |
| Redis (Docker) | $0 |
| Google OAuth | $0 (unlimited) |
| SendGrid (3K emails) | $0 |
| Stripe fees | 2.9% + $0.30/transaction |
| **Total Fixed** | **$0/month** |

---

## Next Steps

1. Install Python dependencies (authlib, httpx, redis)
2. Create Google Cloud Console project
3. Implement Google OIDC verification
4. Implement session management
5. Implement rate-limiting
6. Create auth endpoints
7. Add frontend Login component
8. Test end-to-end auth flow

---

**Architecture Status:** APPROVED  
**Implementation Phase:** Wave 1 (Identity + Billing)  
**Estimated Completion:** 2-3 days  
**Risk Level:** Low (proven patterns)
