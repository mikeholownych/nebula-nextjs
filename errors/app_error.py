"""AppError package – defines structured error type for Nebula.
Provides a simple JSON‑serializable error with code, message, and optional details.
"""
import json

class AppError(Exception):
    """Structured application error.
    Attributes:
        code (str): Short machine‑readable error identifier.
        message (str): Human‑readable description.
        details (dict, optional): Additional context (no secrets).
    """
    def __init__(self, code: str, message: str, details: dict | None = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(f"{code}: {message}")

    def to_dict(self) -> dict:
        return {
            "code": self.code,
            "message": self.message,
            "details": self.details,
        }

    def __repr__(self):
        return f"AppError(code={self.code!r}, message={self.message!r}, details={self.details!r})"

    def __str__(self):
        return json.dumps(self.to_dict())
