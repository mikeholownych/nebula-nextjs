# ADR-001: Identity Provider Selection (Revised)

**Date:** 2026-07-14  
**Status:** PROPOSED  
**Decision:** Google OAuth 2.0 + Stripe Portal + PostgreSQL  
**Context:** $0/month constraint + Google Auth hard requirement

---

## Context

Nebula needs:
1. **Google OAuth** (HARD REQUIREMENT)
2. Email authentication (magic links)
3. Organization membership
4. Customer billing portal
5. Audit logging
6. **Budget: $0/month**

---

## Decision: Google OAuth + Stripe Portal

### Architecture

```
┌─────────────┐
│  Google     │  ← OAuth 2.0 (FREE)
│  OAuth API  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  FastAPI    │  ← OIDC Verification
│  Platform   │     JWT Issuance
│  API        │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PostgreSQL  │  ← User identity source
│  Database   │     Organization/Membership
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Stripe    │  ← Billing portal (FREE)
│   Portal    │     Customer management
└─────────────┘
```

---

## Why This Works

### Google OAuth 2.0 (FREE)

**What it provides:**
- Google account authentication
- OpenID Connect (OIDC) tokens
- User profile (email, name, avatar)
- **Zero cost** (Google provides free)

**Implementation:**
- Google Cloud Console project (free)
- OAuth 2.0 credentials (free)
- JWKS endpoint verification (free)
- Unlimited users (free)

---

## Implementation Plan

### Step 1: Google Cloud Setup (FREE)

1. Create Google Cloud project
2. Configure OAuth consent screen
3. Create OAuth 2.0 credentials:
   - Authorized JavaScript origins: `https://nebulacomponents.shop`
   - Authorized redirect URIs: `https://nebulacomponents.shop/auth/callback`
4. Note: `client_id` and `client_secret`

**Cost:** $0

---

### Step 2: OIDC Verification Layer

```python
# platform_api/auth/google.py
from authlib.jose import jwt
from httpx import AsyncClient

GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUER = "https://accounts.google.com"

async def verify_google_token(token: str) -> dict:
    """Verify Google OIDC token."""
    # Get Google's public keys
    async with AsyncClient() as client:
        response = await client.get(GOOGLE_JWKS_URL)
        jwks = response.json()
    
    # Decode and verify JWT
    claims = jwt.decode(
        token,
        key=jwks,
        claims_options={
            "iss": {"values": [GOOGLE_ISSUER]},
            "aud": {"values": [GOOGLE_CLIENT_ID]}
        }
    )
    
    return {
        "subject": claims["sub"],      # Google user ID
        "email": claims["email"],
        "name": claims.get("name"),
        "picture": claims.get("picture")
    }
```

---

### Step 3: User Creation Flow

```python
# platform_api/auth/routes.py
@router.post("/auth/google")
async def google_auth(
    request: GoogleAuthRequest,
    db: Session = Depends(get_session)
):
    # Verify Google token
    google_user = await verify_google_token(request.id_token)
    
    # Check if user exists
    identity = db.query(UserIdentity).filter_by(
        issuer="google",
        subject=google_user["subject"]
    ).first()
    
    if identity:
        # Existing user - create session
        user = identity.user
    else:
        # New user
        user = User(email=google_user["email"])
        identity = UserIdentity(
            user=user,
            issuer="google",
            subject=google_user["subject"]
        )
        db.add(user)
        db.add(identity)
        db.commit()
    
    # Create JWT session
    jwt_token = create_jwt({
        "user_id": str(user.id),
        "email": user.email
    })
    
    return {"token": jwt_token, "user": user}
```

---

### Step 4: Frontend Integration

```javascript
// Frontend (Next.js)
import { GoogleOAuthProvider } from '@react-oauth/google';

function LoginButton() {
  const handleGoogleSuccess = async (credentialResponse) => {
    // Send Google ID token to backend
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token: credentialResponse.credential })
    });
    
    const { token, user } = await response.json();
    // Store JWT and redirect to dashboard
    localStorage.setItem('token', token);
    router.push('/dashboard');
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => console.log('Login Failed')}
      useOneTap
    />
  );
}
```

---

## Auth Methods Supported

### 1. Google OAuth (Primary)

**Flow:**
1. User clicks "Sign in with Google"
2. Google OAuth prompt
3. User authorizes
4. Frontend receives ID token
5. Backend verifies token + creates session
6. User redirected to dashboard

**Pros:**
- ✅ Zero cost
- ✅ Familiar UX (Google login)
- ✅ Fast onboarding
- ✅ No password management

**Cons:**
- ❌ Requires Google account

---

### 2. Email Magic Link (Backup)

For users without Google account:

1. User enters email
2. Backend sends magic link
3. User clicks link
4. Backend creates session

**Implementation:**
- JWT token with 15-min expiry
- One-time use (track in PostgreSQL)
- Email via Postmark/SendGrid free tier

**Cost:** $0 (within free tier)

---

## Database Schema (Already Implemented)

✅ `users` table  
✅ `user_identities` table (issuer="google", subject=google_user_id)  
✅ `organizations` table  
✅ `memberships` table  
✅ `subscriptions` table (Stripe Customer ID)  

---

## Stripe Integration (Separate from Auth)

**Billing flow:**
1. User signs in (Google or magic link)
2. User clicks "Subscribe" → Stripe Checkout
3. Stripe creates Customer + Subscription
4. Webhook updates `subscriptions` table
5. User accesses Customer Portal for billing management

**Note:** Stripe Customer ID ≠ User identity (they're separate)

---

## Cost Breakdown

| Component | Cost |
|-----------|------|
| Google OAuth | $0 (free tier unlimited) |
| PostgreSQL | $0 (self-hosted) |
| FastAPI auth | $0 (custom code) |
| JWT signing | $0 (internal) |
| Email (Postmark) | $0 (100/month free) |
| **Total** | **$0/month** |

---

## Security Model

### Token Verification (OIDC)

1. **Signature verification:** Google's public keys (JWKS)
2. **Issuer verification:** `iss == "https://accounts.google.com"`
3. **Audience verification:** `aud == GOOGLE_CLIENT_ID`
4. **Expiry verification:** `exp` claim checked
5. **Email verification:** Google ensures email is valid

### Session Management

1. **JWT created:** After successful auth
2. **Expiry:** 7 days
3. **Storage:** HTTP-only cookie (secure, SameSite=strict)
4. **Rotation:** Automatic on dashboard access
5. **Revocation:** Delete from Cookie on logout

### Tenant Isolation

1. Every query includes `organization_id` from JWT
2. Authorization middleware enforces access
3. Cross-tenant object IDs return 404 (not 403)

---

## What We Get

✅ **Google Auth:** Familiar, fast, free  
✅ **Email magic links:** Backup method  
✅ **Zero monthly cost:** Important for bootstrap  
✅ **Source of truth:** PostgreSQL owns identity  
✅ **Audit logging:** Every auth event tracked  
✅ **Multi-tenancy:** Organization-based  
✅ **Billing:** Stripe Portal self-service  
✅ **No vendor lock-in:** Standard OIDC  

---

## What We Lose (vs WorkOS/Auth0)

| Feature | Impact |
|---------|--------|
| Facebook/GitHub auth | Add via `user_identities` later (free OAuth apps) |
| Enterprise SSO (SAML) | Not needed for SMB target |
| Admin portal (white-label) | Build custom dashboard (already planned) |
| SIEM-ready audit logs | PostgreSQL audit_events table (sufficient) |

---

## Migration Path (Future)

### Add More Social Providers (FREE)

```python
# Add GitHub OAuth
user_identities.append(UserIdentity(
    user=user,
    issuer="github",
    subject=github_user_id
))

# Add Facebook OAuth
user_identities.append(UserIdentity(
    user=user,
    issuer="facebook",
    subject=facebook_user_id
))
```

All OAuth providers have free tiers.

---

### Enterprise SSO (When Revenue Justifies)

When:
- Revenue > $20k/month, OR
- Enterprise customers demand SAML SSO

Add WorkOS ($100/SSO connection) or self-hosted Dex (free).

---

## Implementation Tasks

### Backend (FastAPI)

1. ⏭️ Install authlib + httpx
   ```bash
   uv pip install authlib httpx
   ```

2. ⏭️ Create `platform_api/auth/google.py`
   - OIDC token verification
   - JWKS fetching + caching

3. ⏭️ Create `platform_api/auth/jwt.py`
   - JWT creation/verification
   - Session management

4. ⏭️ Create `platform_api/auth/routes.py`
   - `/auth/google` endpoint
   - `/auth/magic-link` endpoint
   - `/auth/verify` endpoint
   - `/auth/logout` endpoint

5. ⏭️ Create `platform_api/auth/middleware.py`
   - `require_auth` dependency
   - Organization context injection

### Frontend (Next.js)

6. ⏭️ Install @react-oauth/google
   ```bash
   npm install @react-oauth/google
   ```

7. ⏭️ Create Google Login button component

8. ⏭️ Create magic link form component

9. ⏭️ Create auth callback page (`/auth/callback`)

10. ⏭️ Create dashboard (protected route)

### Google Cloud Console

11. ⏭️ Create OAuth 2.0 credentials

12. ⏭️ Configure consent screen

13. ⏭️ Add authorized domains/redirect URIs

---

## Testing Strategy

### Unit Tests

```python
def test_google_token_verification():
    """Verify Google OIDC token is validated."""
    token = create_mock_google_token()
    result = verify_google_token(token)
    assert result["email"] == "test@example.com"

def test_user_creation_from_google():
    """User created on first Google auth."""
    response = client.post("/auth/google", json={"id_token": token})
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "test@example.com"

def test_existing_user_login():
    """Existing user gets session, not new account."""
    # First login
    response1 = client.post("/auth/google", json={"id_token": token})
    user_id_1 = response1.json()["user"]["id"]
    
    # Second login
    response2 = client.post("/auth/google", json={"id_token": token})
    user_id_2 = response2.json()["user"]["id"]
    
    assert user_id_1 == user_id_2  # Same user
```

---

## Email Provider Decision

### Free Tier Comparison

| Provider | Free Tier | Deliverability | Integration |
|----------|-----------|----------------|-------------|
| Postmark | 100/month | Excellent | SMTP API |
| SendGrid | 100/day (3K/month) | Good | SMTP API |
| AWS SES | 62K/month (sandbox) | Good | AWS SDK |

**Recommendation:** **SendGrid** (3000/month free)

Magic links: ~1-2 emails/user/month  
Expected: <500 users → well within 3K/month

---

## Timeline

| Task | Duration |
|------|----------|
| Google Cloud setup | 30 min |
| Backend auth endpoints | 4 hours |
| Frontend integration | 3 hours |
| Testing | 2 hours |
| Deployment | 1 hour |
| **Total** | **1-2 days** |

---

## Approvals Required

- [x] Google Auth requirement confirmed
- [ ] Google Cloud Console access (Mike)
- [ ] Email provider choice: SendGrid vs Postmark
- [ ] Magic link expiration: 15 mins (recommended)

---

## Decision Summary

**Implement:**
- Google OAuth 2.0 (FREE, unlimited users)
- Email magic links (backup auth)
- PostgreSQL identity (source of truth)
- Stripe Portal (billing only)
- JWT sessions (custom)

**Monthly cost:** $0  
**Implementation time:** 1-2 days  
**Maintenance burden:** Low  

**When to reconsider:** Enterprise SSO demanded (revenue-dependent)

---

**NEXT STEPS:**
1. Create Google Cloud Console project
2. Implement backend auth endpoints
3. Add frontend login components
4. Test auth flow end-to-end

Proceed with Google OAuth implementation?
