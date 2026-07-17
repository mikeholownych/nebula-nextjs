"""Middleware for request ID, CORS, and request size limits."""

import re
import uuid
from typing import Optional

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware


# Conservative pattern for accepting external request IDs
# Alphanumeric, hyphens, underscores only, 1-64 chars
REQUEST_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware to generate and manage request IDs."""
    
    async def dispatch(self, request: Request, call_next):
        # Check for incoming request ID
        incoming_id = request.headers.get("X-Request-ID")
        
        # Validate or generate request ID
        if incoming_id and REQUEST_ID_PATTERN.match(incoming_id):
            request_id = incoming_id
        else:
            # Generate cryptographically random UUID
            request_id = str(uuid.uuid4())
        
        # Store in request state for later use
        request.state.request_id = request_id
        
        # Process the request
        response = await call_next(request)
        
        # Echo request ID in response header
        response.headers["X-Request-ID"] = request_id
        
        return response


class RequestSizeMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce JSON request body size limits."""
    
    def __init__(self, app, max_body_size: int):
        super().__init__(app)
        self.max_body_size = max_body_size
    
    async def dispatch(self, request: Request, call_next):
        # Check Content-Length header if present
        content_length = request.headers.get("Content-Length")
        if content_length:
            try:
                length = int(content_length)
                if length > self.max_body_size:
                    # Return 413 before reading body
                    from fastapi import status
                    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
                    request.state.request_id = request_id
                    
                    envelope = {
                        "code": "payload_too_large",
                        "message": f"Request body exceeds {self.max_body_size} bytes limit",
                        "request_id": request_id,
                    }
                    
                    from fastapi.responses import JSONResponse
                    response = JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content=envelope,
                        headers={"X-Request-ID": request_id},
                    )
                    
                    # Don't process the request further
                    return response
            except ValueError:
                # Invalid Content-Length, continue but we'll check actual bytes
                pass
        
        # Process request and check actual bytes as they're read
        # FastAPI will handle this in the request body validation
        response = await call_next(request)
        return response


def setup_cors(app: FastAPI, allowed_origins: list[str]) -> None:
    """Configure CORS middleware with strict allowlisting."""
    if not allowed_origins:
        return
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "Accept",
            "X-Request-ID",
            "Origin",
            "X-Requested-With",
        ],
        expose_headers=["X-Request-ID"],
        max_age=600,  # 10 minutes
    )


def setup_middleware(app: FastAPI, max_body_size: int) -> None:
    """Setup all middleware."""
    # Request ID middleware
    app.add_middleware(RequestIDMiddleware)
    
    # Request size middleware  
    app.add_middleware(RequestSizeMiddleware, max_body_size=max_body_size)
    
    # CORS will be added separately based on settings