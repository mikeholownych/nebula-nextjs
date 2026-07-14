# ADR-002: Redis for Session Management and Rate-Limiting

**Date:** 2026-07-14  
**Status:** APPROVED  
**Decision:** Redis for session storage + API rate-limiting  
**Context:** Stateless JWTs have limitations; rate-limiting needed for security

---

## Context

JWT sessions are stateless - we can't:
1. Revoke sessions instantly (user compromised)
2. Track active sessions per user
3. Enforce concurrent session limits
4. Rate-limit API endpoints effectively

Redis solves:
- **Session revocation:** Blacklist JWTs in Redis
- **Active sessions:** Track Redis set per user
- **Rate-limiting:** Token bucket algorithm
- **Idempotency:** Dedup request IDs

---

## Decision: Redis Session Architecture

### Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ Bearer JWT
       ▼
┌─────────────┐     ┌─────────────┐
│  FastAPI    │────▶│    Redis    │
│  Platform   │     │   (7.0)     │
│    API      │     └─────────────┘
└──────┬──────┘            │
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│ PostgreSQL  │     │   Session   │
│  (永久数据) │     │   Blacklist │
└─────────────┘     │   Rate-limit│
                    └─────────────┘
```

---

## Use Cases

### 1. Session Blacklisting (Revocation)

**Scenario:** User account compromised, need to invalidate all sessions immediately.

**Redis structure:**
```
# Blacklisted JWT
SET blacklist:jwt:{token_id} "revoked"
EXPIRE blacklist:jwt:{token_id} {remaining_ttl_seconds}

# User's active sessions (optional tracking)
SADD user:{user_id}:sessions {session_id}
SREM user:{user_id}:sessions {session_id}
```

**Implementation:**
```python
# Session middleware
async def verify_session(jwt_token: str) -> User:
    # 1. Verify JWT signature
    payload = decode_jwt(jwt_token)
    
    # 2. Check Redis blacklist
    if await redis.exists(f"blacklist:jwt:{payload['jti']}"):
        raise Unauthorized("Session revoked")
    
    # 3. Return user
    return User.get(payload["user_id"])
```

---

### 2. Active Session Tracking

**Scenario:** Show user their active sessions, enforce concurrent limits.

**Redis structure:**
```
# Active sessions per user (with metadata)
SET user:{user_id}:session:{session_id} {
    "ip": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "created_at": "2026-07-14T06:00:00Z"
}
EXPIRE user:{user_id}:session:{session_id} {session_ttl}

# Or use Hash for session metadata
HSET user:{user_id}:sessions {session_id} {
    "ip": "...",
    "user_agent": "...",
    "created_at": "..."
}
```

**Implementation:**
```python
# On login
async def create_session(user_id: str, request: Request) -> str:
    session_id = str(uuid4())
    jwt_token = create_jwt({
        "user_id": user_id,
        "jti": session_id,  # JWT ID for revocation
        "exp": datetime.utcnow() + timedelta(days=7)
    })
    
    # Store in Redis
    await redis.hset(
        f"user:{user_id}:sessions",
        session_id,
        json.dumps({
            "ip": request.client.host,
            "user_agent": request.headers.get("user-agent"),
            "created_at": datetime.utcnow().isoformat()
        })
    )
    await redis.expire(f"user:{user_id}:sessions", 7 * 24 * 3600)
    
    return jwt_token

# On logout
async def revoke_session(user_id: str, session_id: str):
    # Remove from active sessions
    await redis.hdel(f"user:{user_id}:sessions", session_id)
    
    # Add to blacklist (in case JWT still valid)
    await redis.set(f"blacklist:jwt:{session_id}", "revoked")
    await redis.expire(f"blacklist:jwt:{session_id}", 7 * 24 * 3600)
```

---

### 3. Rate-Limiting

**Scenario:** Protect API endpoints from abuse, prevent brute-force attacks.

**Algorithm:** Token Bucket (Redis + Lua script)

**Redis structure:**
```
# Rate limit key
SET ratelimit:{identifier}:{endpoint} {tokens}
EXPIRE ratelimit:{identifier}:{endpoint} {window_seconds}
```

**Implementation:**
```python
# Rate limit middleware
from fastapi import HTTPException
from redis.commands.core import Script

# Lua script for atomic token bucket
RATE_LIMIT_SCRIPT = """
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local current = redis.call('GET', key)

if current == false then
    redis.call('SET', key, 1, 'EX', window)
    return 1
end

local count = tonumber(current)
if count < limit then
    redis.call('INCR', key)
    return count + 1
else
    return nil
end
"""

async def rate_limit(
    identifier: str,
    endpoint: str,
    max_requests: int = 100,
    window_seconds: int = 60
):
    key = f"ratelimit:{identifier}:{endpoint}"
    
    result = await redis.eval(
        RATE_LIMIT_SCRIPT,
        1,
        key,
        max_requests,
        window_seconds
    )
    
    if result is None:
        # Rate limit exceeded
        ttl = await redis.ttl(key)
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Retry in {ttl} seconds.",
            headers={"Retry-After": str(ttl)}
        )
```

**Rate-limit tiers:**

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/google` | 10 | 1 min | Prevent abuse |
| `/auth/magic-link` | 5 | 15 min | Prevent spam |
| `/api/*` (authenticated) | 100 | 1 min | Normal usage |
| `/api/*` (anonymous) | 20 | 1 min | Tighter limit |
| `/webhook/*` | 1000 | 1 min | Stripe webhooks |

---

### 4. Idempotency Keys

**Scenario:** Prevent duplicate POST requests (double-submit, retry storms).

**Redis structure:**
```
# Idempotency key → response cache
SET idempotency:{key} {response_json}
EXPIRE idempotency:{key} 86400  # 24 hours
```

**Implementation:**
```python
async def idempotency_middleware(request: Request, call_next):
    if request.method != "POST":
        return await call_next(request)
    
    idempotency_key = request.headers.get("Idempotency-Key")
    if not idempotency_key:
        return await call_next(request)
    
    # Check if key exists
    cached = await redis.get(f"idempotency:{idempotency_key}")
    if cached:
        return JSONResponse(
            content=json.loads(cached),
            status_code=200
        )
    
    # Process request
    response = await call_next(request)
    
    # Cache response
    if response.status_code in [200, 201]:
        response_body = b"".join([chunk async for chunk in response.body_iterator])
        await redis.set(
            f"idempotency:{idempotency_key}",
            response_body.decode(),
            ex=86400
        )
    
    return response
```

---

## Redis Configuration

### Docker Container (Already Running)

```bash
# Current Redis (Docker)
docker ps | grep redis
# Port: 6379 (localhost)

# Connection
REDIS_URL=redis://localhost:6379/0
```

### Production Configuration

```conf
# /etc/redis/redis.conf

# Memory limit
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence (for session blacklist)
save 900 1
save 300 10
save 60 10000

# AOF for durability
appendonly yes
appendfsync everysec

# Security
requirepass {REDIS_PASSWORD}

# Network
bind 127.0.0.1
port 6379
```

---

## Implementation Plan

### Backend (4-5 hours)

1. ✅ Redis already running (Docker)
   ```bash
   redis-cli ping  # PONG
   ```

2. ⏭️ Install Redis client
   ```bash
   uv pip install redis[hiredis]
   ```

3. ⏭️ Create `platform_api/redis_client.py`
   - Connection pool
   - Redis client wrapper
   - Health check

4. ⏭️ Create `platform_api/auth/session.py`
   - Session creation
   - Session revocation
   - Blacklist checking

5. ⏭️ Create `platform_api/middleware/rate_limit.py`
   - Token bucket rate-limiter
   - IP-based + user-based limits
   - Configurable tiers

6. ⏭️ Create `platform_api/middleware/idempotency.py`
   - Idempotency key caching
   - Response deduplication

7. ⏭️ Update `platform_api/auth/routes.py`
   - Session creation on login
   - Session revocation on logout

---

## Database Schema Updates

No PostgreSQL changes needed. All session data in Redis.

**PostgreSQL (permanent):**
- Users, Organizations, Memberships
- Subscriptions (Stripe)
- Audit events

**Redis (ephemeral):**
- Active sessions
- Session blacklist
- Rate-limit counters
- Idempotency keys

---

## API Changes

### New Endpoints

```
POST /auth/logout               # Revoke current session
POST /auth/logout-all           # Revoke all sessions for user
GET  /auth/sessions             # List active sessions
DELETE /auth/sessions/{id}      # Revoke specific session
```

### Response Headers (Rate-Limit)

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312800
Retry-After: 45
```

---

## Testing Strategy

### Unit Tests

```python
def test_session_creation():
    """Session created in Redis on login."""
    token = create_session(user_id, request)
    assert redis.exists(f"user:{user_id}:sessions")

def test_session_revocation():
    """Session blacklisted on logout."""
    revoke_session(user_id, session_id)
    assert redis.exists(f"blacklist:jwt:{session_id}")

def test_rate_limit_enforcement():
    """Requests blocked after limit."""
    for i in range(101):
        response = client.get("/api/endpoint")
        if i < 100:
            assert response.status_code != 429
        else:
            assert response.status_code == 429
```

### Load Testing

```bash
# Redis benchmarks
redis-benchmark -t set,get -n 100000 -q

# API rate-limit testing
ab -n 1000 -c 10 http://localhost:8766/api/endpoint
```

---

## Cost Analysis

| Component | Cost |
|-----------|------|
| Redis (Docker) | $0 (self-hosted) |
| Memory (256MB) | Minimal overhead |
| Persistence (AOF) | Minimal disk I/O |
| **Total** | **$0/month** |

---

## Monitoring

### Health Check

```python
@router.get("/healthz")
async def health():
    # PostgreSQL
    db_health = await check_postgres()
    
    # Redis
    redis_health = await redis.ping() == b"PONG"
    
    return {
        "status": "ok",
        "postgres": db_health,
        "redis": redis_health
    }
```

### Metrics

```python
# Redis metrics to track
- Connected clients
- Used memory
- Keyspace hits/misses
- Expired keys
- Evicted keys
```

---

## Migration Path

### Current State (Wave 1)
- Redis: Session blacklist + rate-limiting
- PostgreSQL: User data + audit logs

### Future Considerations

**When to scale Redis:**
- >10K concurrent sessions
- Memory usage >256MB
- Redis becoming bottleneck

**Options:**
- Redis Cluster (sharding)
- Redis Sentinel (HA)
- Managed Redis (AWS ElastiCache - $15/month)

---

## Security Considerations

1. **Redis password:** Set `requirepass` in production
2. **Network binding:** `bind 127.0.0.1` (localhost only)
3. **TLS:** Not needed for localhost, add for production
4. **Session TTL:** 7 days (configurable)
5. **Rate-limit keys:** Include IP + user_id for granularity

---

## Implementation Tasks

### Backend

1. ⏭️ Install `redis[hiredis]`
2. ⏭️ Create Redis client wrapper
3. ⏭️ Implement session management
4. ⏭️ Implement rate-limiting middleware
5. ⏭️ Implement idempotency middleware
6. ⏭️ Add Redis health check to `/healthz`
7. ⏭️ Add session endpoints (`/auth/sessions`, `/auth/logout`)

### Testing

8. ⏭️ Unit tests for session management
9. ⏭️ Unit tests for rate-limiting
10. ⏭️ Integration tests for auth flow
11. ⏭️ Load tests for rate-limiting

### Documentation

12. ⏭️ API documentation (rate-limit headers)
13. ⏭️ Runbook for Redis management
14. ⏭️ Monitoring dashboard (Redis metrics)

---

## Timeline

| Task | Duration |
|------|----------|
| Redis client setup | 1 hour |
| Session management | 2 hours |
| Rate-limiting middleware | 2 hours |
| Testing | 2 hours |
| **Total** | **7 hours (1 day)** |

---

## Summary

**Add Redis for:**
- ✅ Session revocation (JWT blacklist)
- ✅ Active session tracking
- ✅ API rate-limiting (token bucket)
- ✅ Idempotency key caching

**Benefits:**
- Stateless JWTs + instant revocation
- Protection against abuse
- Better UX (session management)
- Production-ready patterns

**Cost:** $0/month (self-hosted Docker)

**Implementation time:** 1 day

---

**NEXT STEPS:**
1. Install Redis Python client
2. Implement session management
3. Add rate-limiting middleware
4. Update health check endpoint
5. Test auth flow with Redis

Proceed with Redis implementation?
