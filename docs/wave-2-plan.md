# Wave 2 Plan — Customer Portal Expansion

**Started:** 2026-07-14
**Scope:** Build customer-facing portal with organization management + subscription handling
**Timeline:** 1-2 days

---

## Core Features

### 1. Organization Management
- Organization creation/retrieval
- Team member invites
- Role management (owner, admin, member)
- Organization settings

### 2. Subscription Handling
- View current subscription
- Stripe checkout integration
- Subscription management
- Invoice history

### 3. Audit History
- View past audits
- Audit details page
- Download audit reports

### 4. Dashboard
- Overview metrics
- Recent activity
- Quick actions

---

## Technical Components

### Backend (Platform API)

**New Models:**
- `Audit` (extend existing schema)
- Invoice tracking

**New Endpoints:**
```
GET    /api/organizations/:id           — Get organization
PUT    /api/organizations/:id            — Update organization
POST   /api/organizations/:id/invites   — Invite member
GET    /api/organizations/:id/members   — List members
DELETE /api/organizations/:id/members/:userId — Remove member

GET    /api/subscriptions               — Get subscription
POST   /api/subscriptions/checkout      — Create checkout session
POST   /api/subscriptions/cancel        — Cancel subscription
GET    /api/subscriptions/invoices      — List invoices

GET    /api/audits                      — List audits
GET    /api/audits/:id                  — Get audit details
```

### Frontend (Next.js)

**New Pages:**
- `/dashboard` — Overview with metrics
- `/organization` — Organization settings
- `/team` — Team management
- `/subscription` — Subscription management
- `/audits` — Audit history
- `/audits/[id]` — Audit details

**New Components:**
- Navigation bar
- Organization switcher
- Subscription card
- Team member list
- Audit table
- Invoice table

---

## Database Schema Extensions

### Table: audits
```sql
CREATE TABLE audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    site_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
```

### Table: invoices
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    stripe_invoice_id TEXT UNIQUE,
    amount_cents INTEGER,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Implementation Order

### Phase 1: Dashboard (2-3 hours)
1. Create dashboard page
2. Add navigation
3. Display user info
4. Recent activity feed

### Phase 2: Organization Management (3-4 hours)
1. Organization endpoints
2. Organization settings page
3. Team member list
4. Invite functionality

### Phase 3: Subscription Handling (3-4 hours)
1. Stripe integration endpoints
2. Subscription page
3. Checkout flow
4. Invoice history

### Phase 4: Audit History (2-3 hours)
1. Audit endpoints
2. Audit list page
3. Audit details page
4. Download functionality

---

## Success Criteria

- ✅ User can view dashboard
- ✅ User can manage organization
- ✅ User can invite team members
- ✅ User can view subscription
- ✅ User can view audit history
- ✅ All endpoints tested
- ✅ Frontend responsive

---

## Dependencies

- Stripe SDK (already configured)
- PostgreSQL (running)
- Redis (running)
- Platform API (running)

---

## Timeline Estimate

**Backend:** 6-8 hours
**Frontend:** 6-8 hours
**Testing:** 2-3 hours
**Total:** 14-19 hours (2-3 sessions)

---

## Notes

- Use existing Stripe products: $147, $497, $1,497
- Keep minimal UI (no over-engineering)
- Focus on core functionality
- Defer advanced features
