"""Durable rate-limiting middleware using Redis GCRA (Generic Cell Rate Algorithm).

GCRA allows short bursts while enforcing a sustainable average rate. Each route
class gets its own policy (burst capacity, sustained rate, fail behavior).

Fail behavior per class:
  fail-open     → PUBLIC_READ: let Cloudflare handle coarse protection
  fail-closed   → AUTH, EMAIL, EXPENSIVE_WORK, CHECKOUT: reject if limiter unavailable
  fail-degraded → INTERACTIVE_WRITE, WEBHOOK, AGENT_API: bounded local emergency fallback

Redis keys are bounded:
  key = rl:{route_class}:{identity_hash}
  All identities are SHA-256 hashed and truncated to 16 hex chars.
  Paths are normalized (dynamic segments stripped) to bound cardinality.

Observability:
  Structured log entries for allowed/rejected/backend_error events.
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
import time
from enum import Enum
from typing import Callable, Optional

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from ..redis_client import RedisClient

logger = logging.getLogger("platform_api.rate_limit")

# ─── Route classes ────────────────────────────────────────────────────────────

class RouteClass(str, Enum):
    PUBLIC_READ = "public_read"
    INTERACTIVE_WRITE = "interactive_write"
    EXPENSIVE_WORK = "expensive_work"
    AUTH = "auth"
    EMAIL = "email"
    CHECKOUT = "checkout"
    WEBHOOK = "webhook"
    AGENT_API = "agent_api"
    INTERNAL = "internal"


class FailBehavior(str, Enum):
    FAIL_OPEN = "fail_open"
    FAIL_CLOSED = "fail_closed"
    FAIL_DEGRADED = "fail_degraded"


class RateLimitPolicy:
    """Configuration for a single rate-limit policy."""

    def __init__(
        self,
        sustained_rps: float,
        burst_capacity: int,
        window_seconds: int = 60,
        fail_behavior: FailBehavior = FailBehavior.FAIL_CLOSED,
        scope: str = "ip",
    ):
        """
        Args:
            sustained_rps: Sustained requests per second allowed.
            burst_capacity: Maximum burst size (token bucket capacity).
            window_seconds: TTL for the Redis key (auto-expires).
            fail_behavior: What to do when Redis is unavailable.
            scope: Primary identity dimension for key composition.
        """
        self.sustained_rps = sustained_rps
        self.burst_capacity = burst_capacity
        self.window_seconds = window_seconds
        self.fail_behavior = fail_behavior
        self.scope = scope


# ─── Policy definitions ──────────────────────────────────────────────────────
# Burst = how many requests can arrive in a single instant before throttling.
# Sustained rate = long-term average.
# TTL = how long the Redis key lives (must exceed burst_capacity / sustained_rps).

ROUTE_POLICIES: dict[RouteClass, RateLimitPolicy] = {
    # Marketing pages, pricing, learning centre — Cloudflare handles most of this.
    # Application limit protects origin from direct hits.
    RouteClass.PUBLIC_READ: RateLimitPolicy(
        sustained_rps=2.0,       # 120 req/min
        burst_capacity=30,       # burst of 30
        window_seconds=120,      # key TTL
        fail_behavior=FailBehavior.FAIL_OPEN,
        scope="ip",
    ),
    # Form submissions, newsletter, share creation, claim actions.
    RouteClass.INTERACTIVE_WRITE: RateLimitPolicy(
        sustained_rps=0.5,       # 30 req/min
        burst_capacity=10,
        window_seconds=120,
        fail_behavior=FailBehavior.FAIL_DEGRADED,
        scope="ip",
    ),
    # Audit accept, audit run, screenshot, compute-heavy tasks.
    # Queue-level admission control is enforced by AuditRunner (max_in_flight=2).
    RouteClass.EXPENSIVE_WORK: RateLimitPolicy(
        sustained_rps=2.0,       # 120 req/min
        burst_capacity=60,       # allow full project page batch scans
        window_seconds=120,      # key TTL
        fail_behavior=FailBehavior.FAIL_CLOSED,
        scope="identity",
    ),
    # Magic link, OAuth initiation, login attempts.
    RouteClass.AUTH: RateLimitPolicy(
        sustained_rps=0.167,     # 10 req/min
        burst_capacity=3,
        window_seconds=120,
        fail_behavior=FailBehavior.FAIL_CLOSED,
        scope="ip",
    ),
    # Outbound email (audit email, magic link, report send).
    RouteClass.EMAIL: RateLimitPolicy(
        sustained_rps=0.083,     # 5 req/min
        burst_capacity=2,
        window_seconds=120,
        fail_behavior=FailBehavior.FAIL_CLOSED,
        scope="identity",
    ),
    # Checkout creation — allow legitimate retries, prevent session storms.
    RouteClass.CHECKOUT: RateLimitPolicy(
        sustained_rps=0.333,     # 20 req/min
        burst_capacity=5,
        window_seconds=120,
        fail_behavior=FailBehavior.FAIL_CLOSED,
        scope="ip",
    ),
    # Stripe webhooks — NOT rate-limited like user traffic.
    # Signature verification + event-id idempotency is the real guard.
    # This is a permissive cap on malformed/unverified traffic only.
    RouteClass.WEBHOOK: RateLimitPolicy(
        sustained_rps=16.67,     # 1000 req/min — generous
        burst_capacity=100,
        window_seconds=120,
        fail_behavior=FailBehavior.FAIL_OPEN,
        scope="ip",
    ),
    # API-key routes — workspace + key identity + IP secondary.
    RouteClass.AGENT_API: RateLimitPolicy(
        sustained_rps=1.67,      # 100 req/min
        burst_capacity=20,
        window_seconds=120,
        fail_behavior=FailBehavior.FAIL_CLOSED,
        scope="identity",
    ),
    # Internal service-to-service — very permissive.
    RouteClass.INTERNAL: RateLimitPolicy(
        sustained_rps=100.0,
        burst_capacity=200,
        window_seconds=120,
        fail_behavior=FailBehavior.FAIL_OPEN,
        scope="ip",
    ),
}


# ─── Route classification ────────────────────────────────────────────────────

# Dynamic path segments to normalize for key cardinality
_DYNAMIC_SEGMENT_RE = re.compile(
    r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",  # UUIDs
)
_NUMERIC_SEGMENT_RE = re.compile(r"^\d+$")
_SLUG_SEGMENT_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)+$")  # slugs with hyphens


def _normalize_path(path: str) -> str:
    """Normalize path to bound Redis key cardinality.

    Strips UUIDs, numeric IDs, and long slugs to prevent unbounded cardinality.
    """
    parts = path.strip("/").split("/")
    normalized = []
    for part in parts:
        if _DYNAMIC_SEGMENT_RE.match(part):
            normalized.append("{id}")
        elif _NUMERIC_SEGMENT_RE.match(part) and len(part) > 3:
            normalized.append("{id}")
        elif len(part) > 40:
            normalized.append("{slug}")
        else:
            normalized.append(part)
    return "/" + "/".join(normalized)


# Route prefix → RouteClass mapping (most-specific first)
_ROUTE_PREFIX_MAP: list[tuple[str, RouteClass]] = [
    # Auth - session verification reads have standard read limits
    ("/api/auth/me", RouteClass.PUBLIC_READ),
    ("/auth/me", RouteClass.PUBLIC_READ),
    ("/api/auth/", RouteClass.AUTH),
    ("/api/auth", RouteClass.AUTH),
    # Email / dispatch
    ("/api/dispatch/", RouteClass.EMAIL),
    ("/api/dispatch", RouteClass.EMAIL),
    # Checkout
    ("/api/checkout", RouteClass.CHECKOUT),
    # Webhook
    ("/api/webhook/", RouteClass.WEBHOOK),
    ("/api/stripe/webhook", RouteClass.WEBHOOK),
    # Audit expensive work
    ("/audit/accept", RouteClass.EXPENSIVE_WORK),
    ("/audit/run", RouteClass.EXPENSIVE_WORK),
    ("/audit/lab", RouteClass.EXPENSIVE_WORK),
    # Agent API routes
    ("/api/workspace/", RouteClass.AGENT_API),
    # Report generation (expensive)
    ("/api/reports/", RouteClass.EXPENSIVE_WORK),
    # Internal health / infra — internal
    ("/health/ping", RouteClass.INTERNAL),
    ("/health/deep", RouteClass.INTERNAL),
    # API key management
    ("/api/api-keys", RouteClass.AUTH),
    # Default interactive write for /api/* POST/PUT/PATCH/DELETE
    # Default public read for everything else
]


def classify_route(path: str, method: str) -> RouteClass:
    """Classify a request path into a route class."""
    for prefix, route_class in _ROUTE_PREFIX_MAP:
        if path.startswith(prefix):
            return route_class

    # API methods that write are interactive_write
    if path.startswith("/api/") and method in ("POST", "PUT", "PATCH", "DELETE"):
        return RouteClass.INTERACTIVE_WRITE

    # Default: public read
    return RouteClass.PUBLIC_READ


# ─── Identity resolution ─────────────────────────────────────────────────────

# Trusted proxy headers — only the rightmost non-private IP is considered.
_PRIVATE_IP_RE = re.compile(
    r"^(127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|"
    r"172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|::1|fc00:|fe80:|unknown)$"
)


def _extract_trusted_ip(request: Request) -> str:
    """Extract the real client IP from trusted proxy headers.

    Only trusts X-Forwarded-For when the immediate connection is a known
    private-range proxy (Cloudflare tunnel, localhost, LAN). This prevents
    trivial bypass via spoofed headers.
    """
    client_host = request.client.host if request.client else "unknown"

    # If the direct connection is NOT from a private IP, it's not behind
    # a trusted proxy — use the direct client IP.
    if not _PRIVATE_IP_RE.match(client_host):
        return client_host

    # Behind a trusted proxy: walk X-Forwarded-For right-to-left, skip
    # private/loopback IPs, take the first public IP.
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        for part in reversed(xff.split(",")):
            candidate = part.strip()
            if candidate and not _PRIVATE_IP_RE.match(candidate):
                return candidate

    return client_host


def _hash_identity(raw: str) -> str:
    """SHA-256 hash an identity to prevent raw values in Redis keys."""
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _resolve_identity(
    request: Request,
    route_class: RouteClass,
    scope: str,
) -> str:
    """Resolve the rate-limit identity for a request.

    Security invariant (SEC-P1-1): the identity dimension may ONLY come from
    server-verifiable credentials. Caller-controlled strings such as
    x-audit-email / x-email must never mint fresh budget - an attacker could
    rotate them to bypass limits entirely.

    scope="ip" → trusted IP only
    scope="identity" → API key id or session token hash when cryptographically
    verifiable, else trusted IP. Email is never used.
    """
    ip = _extract_trusted_ip(request)

    if scope == "ip":
        return _hash_identity(ip)

    # API keys are high-entropy credentials: safe as identity dimension.
    api_key = request.headers.get("x-api-key", "")
    if api_key.startswith("nbk_"):
        return _hash_identity(f"key:{_hash_identity(api_key)}")

    # Bearer JWTs carry signature + expiry; their hash is stable per session
    # and cannot be freely rotated by an anonymous attacker.
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer ") and not auth_header[7:].startswith("nbk_"):
        token_hash = _hash_identity(auth_header[7:])
        return _hash_identity(f"user:{token_hash}")

    # Anonymous callers fall back to trusted IP. Never trust email headers.
    return _hash_identity(ip)


# ─── GCRA Lua script ──────────────────────────────────────────────────────────
# Generic Cell Rate Algorithm: allows burst, enforces sustainable rate.
# Keys auto-expire via EXPIRE.

_GCRA_LUA = """
local key = KEYS[1]
local burst = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])       -- tokens per second
local now = tonumber(ARGV[3])        -- current time in ms
local ttl = tonumber(ARGV[4])        -- key TTL in seconds

-- Theoretical arrival time (TAT) for the next cell.
-- burst = capacity; rate = emission rate.
-- A request is allowed if now >= tat - burst/rate.
local tat = tonumber(redis.call('GET', key) or '0')
local delta = 1000 / rate            -- ms per token

if tat == 0 then
    -- First request: set TAT to now + delta
    tat = now + delta
elseif now >= tat then
    -- Within budget: advance TAT
    tat = now + delta
else
    -- Over budget: check if we have burst capacity remaining
    local new_tat = tat + delta
    if new_tat - now <= burst * delta then
        -- Burst allows it
        tat = new_tat
    else
        -- Rejected
        local retry_after_ms = tat - now
        return {0, retry_after_ms}
    end
end

redis.call('SET', key, tostring(tat), 'EX', ttl)
local remaining = math.max(0, math.floor((tat - now) / delta))
return {1, remaining}
"""


# ─── Local emergency fallback ─────────────────────────────────────────────────

class _LocalEmergencyLimiter:
    """Bounded process-local fallback for FAIL_DEGRADED routes when Redis is down.

    Hard-capped at 100 entries. Strictly a temporary measure — never the
    normal source of truth.
    """

    def __init__(self, max_entries: int = 100):
        self._max = max_entries
        self._counters: dict[str, tuple[float, int]] = {}  # key → (window_start, count)

    def check(self, key: str, limit: int, window: float) -> bool:
        now = time.time()
        window_start = int(now // window) * window
        entry = self._counters.get(key)
        if entry is None or entry[0] != window_start:
            if len(self._counters) >= self._max:
                # Evict oldest 25%
                to_evict = self._max // 4
                sorted_keys = sorted(
                    self._counters, key=lambda k: self._counters[k][0]
                )
                for k in sorted_keys[:to_evict]:
                    del self._counters[k]
            self._counters[key] = (window_start, 1)
            return True
        _, count = entry
        if count >= limit:
            return False
        self._counters[key] = (window_start, count + 1)
        return True


# ─── Middleware ────────────────────────────────────────────────────────────────

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Durable rate-limiting middleware using Redis GCRA.

    Route-class aware, identity-aware, fail-behavior-per-class, and
    observable. Every Redis key has a TTL. Every identity is hashed.
    """

    def __init__(self, app, redis: RedisClient):
        super().__init__(app)
        self.redis = redis
        self._local = _LocalEmergencyLimiter()

    def _get_identifier(self, request: Request) -> str:
        """Helper to compute raw composite identity before hashing.

        Kept for diagnostics only - never used for limit identity (SEC-P1-1).
        """
        ip = _extract_trusted_ip(request)
        return f"ip:{ip}"

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        method = request.method

        # Skip health checks (both liveness and readiness)
        if path in ("/healthz", "/readyz", "/health/ping"):
            return await call_next(request)

        route_class = classify_route(path, method)
        policy = ROUTE_POLICIES[route_class]
        identity = _resolve_identity(request, route_class, policy.scope)
        normalized = _normalize_path(path)
        redis_key = f"rl:{route_class.value}:{identity}:{normalized}"

        # GCRA check
        allowed, retry_after_ms, remaining = await self._gcra_check(
            redis_key, policy
        )

        if not allowed:
            retry_after_s = max(1, int(retry_after_ms / 1000))
            self._log_rejected(route_class, identity, path, retry_after_s)

            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limited",
                    "scope": route_class.value,
                    "retry_after_seconds": retry_after_s,
                    "request_id": getattr(
                        request.state, "request_id", None
                    ),
                },
                headers={
                    "Retry-After": str(retry_after_s),
                    "X-RateLimit-Limit": str(policy.burst_capacity),
                    "X-RateLimit-Remaining": "0",
                },
            )

        # Allowed — proceed
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(policy.burst_capacity)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response

    async def _gcra_check(
        self, key: str, policy: RateLimitPolicy
    ) -> tuple[bool, int, int]:
        """Run the GCRA algorithm via Redis Lua script.

        Returns (allowed, retry_after_ms, remaining_tokens).
        """
        now_ms = int(time.time() * 1000)

        try:
            await self.redis.connect()
            result = await self.redis.client.eval(
                _GCRA_LUA,
                1,          # number of keys
                key,
                policy.burst_capacity,
                policy.sustained_rps,
                now_ms,
                policy.window_seconds,
            )

            if result is None:
                # Shouldn't happen with well-formed Lua
                return True, 0, policy.burst_capacity

            allowed = bool(result[0])
            retry_or_remaining = int(result[1])

            if allowed:
                self._log_allowed(policy, key)
                return True, 0, retry_or_remaining
            else:
                return False, retry_or_remaining, 0

        except Exception as exc:
            logger.warning("rate_limit_backend_error: %s", exc)

            # Fail behavior per route class
            if policy.fail_behavior == FailBehavior.FAIL_OPEN:
                self._log_backend_error(policy, key, "fail_open")
                return True, 0, policy.burst_capacity

            if policy.fail_behavior == FailBehavior.FAIL_DEGRADED:
                # Use bounded local fallback
                allowed = self._local.check(
                    key, policy.burst_capacity, policy.window_seconds
                )
                if not allowed:
                    logger.info(
                        "rate_limit_rejected_local_fallback",
                        extra={
                            "event": "rate_limit_rejected",
                            "scope": policy.scope,
                            "behavior": "local_fallback",
                            "retry_after": policy.window_seconds,
                        },
                    )
                    return False, policy.window_seconds * 1000, 0
                self._log_backend_error(policy, key, "fail_degraded_local")
                return True, 0, policy.burst_capacity

            # FAIL_CLOSED
            self._log_backend_error(policy, key, "fail_closed")
            return False, policy.window_seconds * 1000, 0

    def _log_allowed(self, policy: RateLimitPolicy, key: str) -> None:
        logger.debug(
            "rate_limit_allowed",
            extra={
                "event": "rate_limit_allowed",
                "scope": policy.scope,
                "key_prefix": key[:40],
            },
        )

    def _log_rejected(
        self, route_class: RouteClass, identity: str, path: str, retry_after: int
    ) -> None:
        logger.info(
            "rate_limit_rejected",
            extra={
                "event": "rate_limit_rejected",
                "route_class": route_class.value,
                "path": path[:80],
                "identity_prefix": identity[:16],
                "retry_after": retry_after,
            },
        )

    def _log_backend_error(
        self, policy: RateLimitPolicy, key: str, behavior: str
    ) -> None:
        logger.warning(
            "rate_limit_backend_error",
            extra={
                "event": "rate_limit_backend_error",
                "scope": policy.scope,
                "behavior": behavior,
                "key_prefix": key[:40],
            },
        )


def setup_rate_limiting(app, redis: RedisClient):
    """Add rate-limiting middleware to app."""
    app.add_middleware(RateLimitMiddleware, redis=redis)
