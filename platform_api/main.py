"""FastAPI application entry point."""

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


# Create FastAPI application
app = FastAPI(
    title="Platform API",
    description="Bounded FastAPI platform service",
    version="0.1.0",
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
    openapi_url="/openapi.json" if settings.is_development else None,
    # Request size limit
    max_request_size=settings.MAX_JSON_BODY_BYTES,
)


# Setup middleware
setup_middleware(app, max_body_size=settings.MAX_JSON_BODY_BYTES)
setup_cors(app, settings.ALLOWED_ORIGINS)


# Import and include routers
from platform_api.auth.routes import router as auth_router
from platform_api.routes.audits import router as audits_router
from platform_api.routes.organizations import router as orgs_router

app.include_router(auth_router, prefix="/api")
app.include_router(orgs_router)
app.include_router(audits_router)


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
    return {"status": "ok", "request_id": request_id}


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
    if settings.ready():
        return {"status": "ready"}
    else:
        missing = settings.missing_required_settings()
        raise APIError(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            code="not_ready",
            message=f"Missing required settings: {missing}",
            request_id=request.headers.get("X-Request-ID") or request.state.request_id
            if hasattr(request.state, "request_id")
            else None,
        )


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize Redis connection on startup."""
    from platform_api.redis_client import redis_client
    await redis_client.connect()
    print("✅ Redis connected")


@app.on_event("shutdown")
async def shutdown_event():
    """Close Redis connection on shutdown."""
    from platform_api.redis_client import redis_client
    await redis_client.disconnect()
    print("✅ Redis disconnected")


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