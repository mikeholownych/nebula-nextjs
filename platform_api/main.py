"""FastAPI application entry point."""

from contextlib import asynccontextmanager
import os

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from platform_api.config import settings
from platform_api.errors import (
    APIError,
    generic_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from platform_api.middleware import setup_cors, setup_middleware
from platform_api.middleware.rate_limit import setup_rate_limiting
from platform_api.infra import health_router, MaintenanceMiddleware


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Initialize and close shared runtime integrations."""
    from platform_api.redis_client import redis_client
    from platform_api.db import init_db
    from platform_api.posthog_client import (
        init_posthog,
        shutdown_posthog,
        warn_missing_token,
    )

    # Initialize database
    if settings.DATABASE_URL:
        init_db(settings.DATABASE_URL)
        print("✅ Database initialized")
    else:
        print("⚠️  DATABASE_URL not set - DB routes will fail")

    # RES-6: production configuration gate at STARTUP, not just /readyz.
    # A misconfigured prod boot must not serve traffic until probed.
    if settings.ENVIRONMENT == "production":
        missing = settings.missing_required_settings()
        if missing:
            raise RuntimeError(
                "Refusing to start in production with missing required settings: "
                + ", ".join(missing)
            )
        print("✅ Production settings validated")

    await redis_client.connect()
    print("✅ Redis connected")
    if settings.POSTHOG_PROJECT_TOKEN:
        init_posthog(
            settings.POSTHOG_PROJECT_TOKEN,
            settings.POSTHOG_HOST,
            debug=settings.is_development,
        )
        print("✅ PostHog initialized")
    elif settings.is_development:
        warn_missing_token("POSTHOG_PROJECT_TOKEN")

    try:
        from platform_api.services.audit_db import audit_db
        await audit_db.connect()
        swept = await audit_db.sweep_stale_audits()
        if swept:
            print(f"⚠️  Startup: swept {swept} stale audit(s) → failed")
    except Exception as exc:
        print(f"⚠️  Audit DB connect/sweep failed: {exc}")

    try:
        from platform_api.services.audit_runner import start_runner
        await start_runner()
        print("✅ Audit runner started (max_in_flight=2)")
    except Exception as exc:
        print(f"⚠️  Audit runner startup failed: {exc}")

    try:
        yield
    finally:
        try:
            from platform_api.services.audit_runner import stop_runner
            await stop_runner()
        except Exception:
            pass
        await redis_client.disconnect()
        print("✅ Redis disconnected")
        shutdown_posthog()


# Create FastAPI application
app = FastAPI(
    title="Platform API",
    description="Bounded FastAPI platform service",
    version="0.1.0",
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
    openapi_url="/openapi.json" if settings.is_development else None,
    lifespan=lifespan,
    # Request size limit
    max_request_size=settings.MAX_JSON_BODY_BYTES,
)


# Setup middleware
setup_middleware(app, max_body_size=settings.MAX_JSON_BODY_BYTES)
setup_cors(app, settings.ALLOWED_ORIGINS)
app.add_middleware(MaintenanceMiddleware)

# Rate limiting - uses the Redis client connected in lifespan
from platform_api.redis_client import redis_client as _redis_client
setup_rate_limiting(app, _redis_client)


# Import and include routers
from platform_api.auth.routes import router as auth_router
from platform_api.routes.audits import router as audits_router
from platform_api.routes.organizations import router as orgs_router
from platform_api.routes.audit_api import router as audit_api_router
from platform_api.routes.verify_api import router as verify_router
from platform_api.routes.dispatch_api import router as dispatch_router
from platform_api.gsc.routes import router as gsc_router
from platform_api.audit.schedule_routes import router as audit_schedule_router
from platform_api.routes.report_routes import router as report_router
from platform_api.competitor.routes import router as competitor_router
from platform_api.audit.rewrite_routes import router as rewrite_router
from platform_api.experiment.routes import router as experiment_router
from platform_api.routes.leads_api import router as leads_router
from platform_api.routes.api_key_routes import router as api_key_router
from platform_api.routes.ga4_routes import router as ga4_router
from platform_api.routes.deploy_hook_routes import router as dh_router
from platform_api.routes.deploy_hook_routes import public_router as dh_public_router

# Lead Gen Pipeline (RB2B + n8n webhooks)
try:
  from lead_gen.webhook_endpoints import router as lead_gen_router
  LEAD_GEN_AVAILABLE = True
except ImportError:
  LEAD_GEN_AVAILABLE = False
  print("⚠️  lead_gen module not available (lead gen routes disabled)")

app.include_router(auth_router, prefix="/api")
app.include_router(orgs_router)
app.include_router(audits_router)
app.include_router(audit_api_router)
app.include_router(verify_router)
app.include_router(dispatch_router)
app.include_router(health_router)
app.include_router(gsc_router)
from platform_api.routes.teardown_routes import router as teardown_router
app.include_router(teardown_router)
from platform_api.routes.teardown_claim_routes import router as teardown_claim_router
app.include_router(teardown_claim_router)
app.include_router(audit_schedule_router)
app.include_router(report_router)
app.include_router(competitor_router)
app.include_router(rewrite_router)
app.include_router(experiment_router)
app.include_router(leads_router)
app.include_router(api_key_router)
app.include_router(ga4_router)
app.include_router(dh_router)
app.include_router(dh_public_router)

# CRM + Newsletter (Phase 2 - Marketing Machine)
from platform_api.routes.newsletter import router as newsletter_router
from platform_api.routes.newsletter_events import router as newsletter_events_router
from platform_api.routes.crm import router as crm_router
from platform_api.routes.ab_and_scoring import router as ab_router
from platform_api.routes.stripe_webhook import router as stripe_webhook_router
from platform_api.routes.checkout import router as checkout_router
from platform_api.routes.outbox_api import router as outbox_router
app.include_router(newsletter_router, prefix="/api")
app.include_router(newsletter_events_router, prefix="/api")
app.include_router(crm_router, prefix="/api")
app.include_router(ab_router, prefix="/api")
app.include_router(stripe_webhook_router, prefix="/api")
app.include_router(checkout_router, prefix="/api")
app.include_router(outbox_router, prefix="/api")
if LEAD_GEN_AVAILABLE:
  app.include_router(lead_gen_router)


# Exception handlers - order matters
app.add_exception_handler(APIError, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


# Custom 404 handler for error envelope
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle 404 errors with error envelope."""
    from platform_api.errors import error_envelope

    request_id = request.headers.get("X-Request-ID") or (
        request.state.request_id if hasattr(request.state, "request_id") else None
    )

    envelope = error_envelope(
        code="not_found",
        message="Resource not found",
        request_id=request_id,
        status_code=404,
    )

    return JSONResponse(
        status_code=404,
        content=envelope,
        headers={"X-Request-ID": request_id} if request_id else None,
    )


@app.get("/healthz", response_model=dict, status_code=status.HTTP_200_OK)
async def health_check(request: Request) -> dict:
    """Health check endpoint without dependency checks."""
    request_id = request.headers.get("X-Request-ID") or (
        request.state.request_id if hasattr(request.state, "request_id") else None
    )
    return {"status": "ok", "revision": os.getenv("NEBULA_BUILD_REVISION", "unknown"), "request_id": request_id}


@app.get("/build-info", response_model=dict, status_code=status.HTTP_200_OK)
async def build_info() -> dict:
    """Expose immutable deployed build identifier for validation."""
    return {"revision": os.getenv("NEBULA_BUILD_REVISION", "unknown")}


@app.post("/healthz", response_model=dict, status_code=status.HTTP_200_OK)
async def health_check_post(request: Request) -> dict:
    """Health check endpoint that accepts POST for testing."""
    request_id = request.headers.get("X-Request-ID") or (
        request.state.request_id if hasattr(request.state, "request_id") else None
    )
    return {"status": "ok", "request_id": request_id}


@app.get("/readyz", response_model=dict)
async def readiness_check(request: Request) -> dict:
    """Readiness check endpoint with settings validation."""
    from platform_api.services.audit_runner import runner_started

    request_id = request.headers.get("X-Request-ID") or (
        request.state.request_id if hasattr(request.state, "request_id") else None
    )
    if not settings.ready():
        missing = settings.missing_required_settings()
        raise APIError(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            code="not_ready",
            message=f"Missing required settings: {missing}",
            request_id=request_id,
        )
    if not runner_started():
        raise APIError(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            code="not_ready",
            message="Audit runner unavailable",
            request_id=request_id,
        )
    return {"status": "ready"}


# Add a test endpoint to verify the service works
@app.get("/", response_model=dict)
async def root(request: Request) -> dict:
    """Root endpoint."""
    return {
        "service": "platform_api",
        "version": "0.1.0",
        "environment": settings.ENVIRONMENT,
        "request_id": request.headers.get("X-Request-ID") or request.state.request_id
        if hasattr(request.state, "request_id")
        else None,
    }