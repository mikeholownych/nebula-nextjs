"""Error handling and envelope formatting."""

from typing import Any, Dict, Optional

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse


class APIError(HTTPException):
    """Base API error with envelope formatting."""
    
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        request_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=message)
        self.code = code
        self.request_id = request_id
        self.details = details or {}


def error_envelope(
    code: str,
    message: str,
    request_id: Optional[str] = None,
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
    details: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Create standardized error envelope."""
    envelope = {
        "code": code,
        "message": message,
        "request_id": request_id,
    }
    if details:
        envelope["details"] = details
    return envelope


async def http_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    """Handle HTTP exceptions with envelope formatting."""
    request_id = request.headers.get("X-Request-ID") or request.state.request_id
    
    envelope = error_envelope(
        code="http_error",
        message=exc.detail,
        request_id=request_id,
        status_code=exc.status_code,
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=envelope,
        headers={"X-Request-ID": request_id} if request_id else None,
    )


async def validation_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """Handle validation exceptions with envelope formatting."""
    request_id = request.headers.get("X-Request-ID") or request.state.request_id
    
    # FastAPI validation errors have a specific structure
    # For now, return a generic validation error
    envelope = error_envelope(
        code="validation_error",
        message="Request validation failed",
        request_id=request_id,
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=envelope,
        headers={"X-Request-ID": request_id} if request_id else None,
    )


async def generic_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """Handle all other exceptions with envelope formatting."""
    request_id = request.headers.get("X-Request-ID") or request.state.request_id
    
    # In production, don't expose internal error details
    message = "Internal server error"
    
    envelope = error_envelope(
        code="internal_error",
        message=message,
        request_id=request_id,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=envelope,
        headers={"X-Request-ID": request_id} if request_id else None,
    )