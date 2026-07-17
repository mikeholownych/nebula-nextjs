# Manual OAuth Testing Guide

**Date:** July 14, 2026
**Status:** Ready for manual testing

---

## Prerequisites

1. Platform API running on port 8769
2. Google Cloud Console configured
3. Redis running
4. PostgreSQL running

---

## Step 1: Google Cloud Console Configuration

**Go to:** https://console.cloud.google.com/apis/credentials

**Find OAuth 2.0 Client ID:**
```
625346353182-qnlo095vhh5h8f8m1mkemjrrogppl821.apps.googleusercontent.com
```

**Add Authorized JavaScript origins:**
```
http://localhost:3000
http://localhost:8769
https://nebulacomponents.shop
```

**Add Authorized redirect URIs:**
```
http://localhost:3000/auth/callback
http://localhost:8769/api/auth/callback
https://nebulacomponents.shop/auth/callback
```

**Click Save.**

---

## Step 2: Start Platform API

```bash
cd /home/mike/nebula/.worktrees/nextjs-customer-platform

# Ensure dependencies running
sudo systemctl status postgresql
redis-cli ping  # Should return PONG

# Start API
PYTHONPATH=. venv/bin/uvicorn platform_api.main:app --port 8769 --host 127.0.0.1
```

**Verify:**
```bash
curl http://127.0.0.1:8769/healthz
# Expected: {"status": "healthy", ...}
```

---

## Step 3: Test Auth Endpoints

### 3.1 Health Check
```bash
curl http://127.0.0.1:8769/healthz | jq
```

**Expected:**
```json
{
  "status": "healthy",
  "environment": "development",
  "postgres": "connected",
  "redis": "connected"
}
```

### 3.2 Get Google OAuth URL
```bash
# First, test the auth endpoint exists
curl -X POST http://127.0.0.1:8769/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"id_token": "test_token"}' | jq
```

**Expected:**
```json
{
  "detail": "Invalid Google OAuth token"
}
```
(This proves the endpoint works)

---

## Step 4: Test with Google OAuth Playground

**Alternative: Use Google OAuth Playground**

1. Go to: https://developers.google.com/oauthplayground/
2. Configure:
   - Client ID: `625346353182-qnlo095vhh5h8f8m1mkemjrrogppl821`
   - Client Secret: (from .env file)
   - Redirect URI: `http://localhost:8769/api/auth/callback`
3. Select scopes: `openid`, `email`, `profile`
4. Authorize API
5. Exchange authorization code for tokens
6. Copy the `id_token`
7. Send to Platform API:

```bash
curl -X POST http://127.0.0.1:8769/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"id_token": "YOUR_ID_TOKEN_HERE"}' | jq
```

**Expected Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "organization": {
    "id": "uuid",
    "name": "user@example.com"
  },
  "session_id": "abc123"
}
```

---

## Step 5: Verify Session

### 5.1 Check Current User
```bash
# Extract JWT from previous response cookie
JWT_TOKEN="your_jwt_here"

curl http://127.0.0.1:8769/api/auth/me \
  -H "Cookie: session=$JWT_TOKEN" | jq
```

**Expected:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "organizations": [...]
}
```

### 5.2 List Sessions
```bash
curl http://127.0.0.1:8769/api/auth/sessions \
  -H "Cookie: session=$JWT_TOKEN" | jq
```

**Expected:**
```json
{
  "sessions": [
    {
      "session_id": "abc123",
      "created_at": "2026-07-14T...",
      "ip": null,
      "user_agent": null
    }
  ]
}
```

### 5.3 Logout
```bash
curl -X POST http://127.0.0.1:8769/api/auth/logout \
  -H "Cookie: session=$JWT_TOKEN" | jq
```

**Expected:**
```json
{
  "message": "Logged out successfully"
}
```

### 5.4 Verify Logout
```bash
curl http://127.0.0.1:8769/api/auth/me \
  -H "Cookie: session=$JWT_TOKEN" | jq
```

**Expected:**
```json
{
  "detail": "Not authenticated"
}
```

---

## Step 6: Test PostgreSQL Data

```bash
# Check if user was created
sudo -u postgres psql -d nebula_platform -c "SELECT id, email, created_at FROM users;"

# Check if organization was created
sudo -u postgres psql -d nebula_platform -c "SELECT id, name, slug FROM organizations;"

# Check memberships
sudo -u postgres psql -d nebula_platform -c "SELECT u.email, o.name, m.role FROM memberships m JOIN users u ON m.user_id = u.id JOIN organizations o ON m.org_id = o.id;"
```

---

## Step 7: Test Redis Sessions

```bash
# Check session data
redis-cli
> KEYS user:*
> HGETALL user:{user_uuid}:sessions
> TTL user:{user_uuid}:sessions
```

---

## Troubleshooting

### Issue: "Port 8769 already in use"
```bash
lsof -i :8769
kill -9 <PID>
```

### Issue: "Redis connection refused"
```bash
redis-cli ping
# If fails: redis-server &
```

### Issue: "PostgreSQL connection failed"
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Issue: "Invalid Google OAuth token"
- Verify Google Client ID matches
- Check redirect URIs in Google Console
- Ensure id_token is valid (not expired)
- Check token audience matches Client ID

---

## Success Criteria

- ✅ Platform API starts on port 8769
- ✅ Health endpoint returns 200
- ✅ Google OAuth endpoint accepts requests
- ✅ Valid ID token creates user + session
- ✅ JWT cookie set correctly
- ✅ /auth/me returns user data
- ✅ Logout revokes session
- ✅ PostgreSQL has user records
- ✅ Redis has session data

---

## Next Steps

**After successful testing:**
1. Document actual results
2. Note any issues found
3. Update configuration if needed
4. Proceed to frontend integration

---

## Frontend Integration Preview

```html
<!-- Login Button -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
<div id="g_id_onload"
     data-client_id="625346353182-qnlo095vhh5f8m1mkemjrrogppl821"
     data-callback="handleGoogleSignIn">
</div>
<button id="g_id_signin">Sign in with Google</button>

<script>
function handleGoogleSignIn(response) {
  // Send ID token to Platform API
  fetch('http://localhost:8769/api/auth/google', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id_token: response.credential})
  })
  .then(r => r.json())
  .then(data => {
    // Redirect to dashboard
    window.location.href = '/dashboard';
  });
}
</script>
```

---

**Testing guide ready! Configure Google Cloud Console to begin.**
