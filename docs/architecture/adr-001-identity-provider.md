# ADR-001: Identity Provider Selection

**Date:** 2026-07-14  
**Status:** PROPOSED  
**Decision:** Self-hosted OIDC with Stripe Portal for billing  
**Context:** $0/month constraint on identity infrastructure

---

## Context

Nebula needs:
1. User authentication (email + social)
2. Organization membership
3. Customer billing portal
4. Audit logging
5. **Budget: $0/month infrastructure cost**

Paid options rejected:
- WorkOS: $100+ for SSO (per connection)
- Auth0: $35+/month (MAU-based)
- Clerk: MAU-based pricing

---

## Decision: Stripe Portal + PostgreSQL Auth

### Option 1: Stripe Customer Portal (CHOSEN)

**Why it works:**
- Stripe Portal is **free** (included in Stripe account)
- Handles billing management (invoices, payment methods, cancellations)
- Customer ID is your user identity
- Email verification built-in (Stripe sends receipt emails)
- Self-service account management

**Auth flow:**
```
1. User clicks "Sign Up" → Stripe Checkout
2. Stripe creates Customer + Subscription
3. Webhook POST /webhook/stripe → create user in PostgreSQL
4. Email: customer.email
5. User ID: customer.id (or internal UUID)
6. Login: Magic link via email (custom implementation)
```

**Implementation:**
- No separate auth provider needed
- Stripe Customer ID = user identity
- PostgreSQL stores: user profile, organization, membership
- Email magic links for login (Postmark/SendGrid free tier)
- Session: JWT signed with SECRET_KEY

**Pros:**
- ✅ Zero monthly cost
- ✅ Billing built-in
- ✅ Customer portal ready
- ✅ Email verification exists
- ✅ Stripe handles PCI compliance
- ✅ No vendor lock-in (PostgreSQL owns identity)

**Cons:**
- ❌ No social auth initially (add later if needed)
- ❌ Requires own JWT implementation
- ❌ Magic link implementation needed

---

### Option 2: Self-Hosted Keycloak

**Why rejected:**
- Docker-only deployment
- Heavyweight (Java + PostgreSQL)
- Overkill for MVP
- Complex maintenance
- Still requires Stripe integration separately

**Cost:** $0 (if self-hosted) but high operational overhead

---

### Option 3: Supabase Auth (Free Tier)

**Why rejected:**
- Free tier: 50,000 MAU
- But: Requires Supabase stack (PostgreSQL + API)
- Creates vendor lock-in (supabase-js client)
- We already have PostgreSQL + FastAPI

**Cost:** $0 up to 50K MAU, but lock-in concerns

---

## Chosen Architecture

### Stripe Portal as Identity (Implementation Plan)

**Step 1: Checkout as Registration**
```python
# POST /checkout
stripe.Customer.create(email=user_email)
stripe.checkout.Session.create(
    customer=customer.id,
    mode="subscription",
    success_url="https://nebulacomponents.shop/dashboard"
)
```

**Step 2: Webhook Creates User**
```python
# POST /webhook/stripe
if event.type == "checkout.session.completed":
    customer_id = event.data.object.customer
    email = event.data.object.customer_email
    # Create user in PostgreSQL
    user = User(id=customer_id, email=email)
    organization = Organization(name=..., slug=...)
    membership = Membership(user=user, org=organization, role="owner")
```

**Step 3: Magic Link Login**
```python
# POST /auth/magic-link
email = request.email
token = generate_magic_link_token(email)
send_email(email, link=f"/auth/verify?token={token}")

# GET /auth/verify
token = validate_magic_link_token(request.token)
user = User.get(email=token.email)
jwt = create_jwt(user.id)
redirect("/dashboard", set_cookie=jwt)
```

**Step 4: Customer Portal (Self-Service)**
```python
# GET /billing
session = stripe.billing_portal.Session.create(
    customer=user.stripe_customer_id,
    return_url="https://nebulacomponents.shop/account"
)
redirect(session.url)
```

---

## Database Schema (Already Done)

✅ `users` table (UUID primary key)  
✅ `user_identities` table (for future OIDC)  
✅ `organizations` table  
✅ `memberships` table  
✅ `subscriptions` table (Stripe Customer ID)  
✅ `audit_events` table  

---

## Email Provider (Free Tier)

**Postmark:** 100 emails/month free  
**SendGrid:** 100 emails/day free  
**AWS SES:** 62,000 emails/month free (in sandbox)

For magic links: ~1-2 emails per user/month  
Expected volume: <500 users → within free tier

---

## Security Model

1. **Email verification:** Stripe handles (checkout requires valid email)
2. **Passwordless:** Magic links (no passwords to breach)
3. **Session:** JWT with 7-day expiry, signed with SECRET_KEY
4. **Tenant isolation:** organization_id in every query
5. **Audit:** Every auth event logged to `audit_events` table

---

## What We Lose (vs WorkOS)

| Feature | Impact |
|---------|--------|
| Social auth (Google/GitHub) | Can add later via `user_identities` table |
| Enterprise SSO (SAML) | Not needed for $50k/month target (SMB focus) |
| Embeddable admin portal | Stripe Portal covers billing, custom dashboard for org |
| Audit logs (SIEM-ready) | ✅ We have `audit_events` table |

---

## Migration Path (Future)

If/when revenue justifies paid identity:

1. Add OIDC provider to `user_identities` table
2. Implement `verify_access_token()` for chosen provider
3. Migrate users incrementally (email match)
4. Keep PostgreSQL as source of truth

**触发点:** When:
- Social auth requested by users, OR
- Enterprise customers demand SSO, OR
- Revenue > $20k/month

---

## Implementation Order

1. ✅ PostgreSQL schema (done)
2. ⏭️ Magic link email auth (JWT implementation)
3. ⏭️ Stripe webhook handler (user creation)
4. ⏭️ Customer portal integration
5. ⏭️ Session middleware (require_permission dependency)
6. ⏭️ Audit logging middleware

**Estimated:** 2-3 days

---

## Alternatives Considered and Rejected

### Keycloak
- Too complex for MVP
- Requires Docker/Kubernetes
- Operational burden

### Supabase Auth
- Free tier is generous
- But creates vendor lock-in
- We already have PostgreSQL

### AWS Cognito
- Free tier: 50,000 MAU
- AWS lock-in
- Complex pricing after free tier

### Firebase Auth
- Free tier: Unlimited MAU
- Google lock-in
- Requires Firebase SDK

### self-hosted Dex (OIDC)
- Lightweight OIDC provider
- But requires connectors for social auth
- Stripe integration still manual

---

## Consequences

**Positive:**
- Zero monthly auth cost
- Full control over identity schema
- Stripe integration natural (billing = identity)
- PostgreSQL owns source of truth
- Easy to migrate later if needed

**Negative:**
- More custom code (magic links, JWT handling)
- No built-in social auth initially
- Email deliverability is our responsibility

**Risks:**
- Magic link emails might hit spam (mitigation: SPF/DKIM records)
- No built-in rate limiting (mitigation: implement IP-based throttling)
- Manual JWT rotation (mitigation: crypto rotation endpoint)

---

## Approvals Required

- [ ] Mike approval (self-hosted auth vs paid provider)
- [ ] Email provider selection (Postmark vs SendGrid vs SES)
- [ ] Magic link expiration policy (15 mins vs 1 hour)

---

**Recommendation:** IMPLEMENT Stripe Portal + Magic Link Auth

**Time to production:** 2-3 days  
**Monthly cost:** $0 (within free tiers)  
**Maintenance burden:** Low (JWT + magic links are simple)
