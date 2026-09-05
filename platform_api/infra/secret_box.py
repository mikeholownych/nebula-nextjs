"""Application-level secret box for tokens at rest (SEC-P1-3).

AES-256-GCM with a key derived from SECRET_KEY via HKDF-SHA256 and a fixed,
version-tagged salt. Ciphertext format: "v1:<b64nonce>:<b64ciphertext>".
Values not carrying the prefix are treated as legacy plaintext by callers so
existing rows migrate lazily on next write.
"""

from __future__ import annotations

import base64
import functools
import hashlib
import os

_SALT_V1 = b"nebula-gsc-token-v1"
_PREFIX = "v1:"


@functools.lru_cache(maxsize=1)
def _key() -> bytes:
    from platform_api.config import settings
    secret = settings.SECRET_KEY or ""
    if not secret:
        raise RuntimeError("SECRET_KEY required for token encryption at rest")
    return hashlib.pbkdf2_hmac("sha256", secret.encode(), _SALT_V1, 200_000, dklen=32)


def encrypt(plaintext: str) -> str:
    if not plaintext:
        return plaintext
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    nonce = os.urandom(12)
    ct = AESGCM(_key()).encrypt(nonce, plaintext.encode(), None)
    return _PREFIX + base64.urlsafe_b64encode(nonce).decode() + ":" + base64.urlsafe_b64encode(ct).decode()


def decrypt(value: str) -> str:
    if not value or not value.startswith(_PREFIX):
        return value  # legacy plaintext; caller migrates lazily
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    try:
        _, nonce_b64, ct_b64 = value.split(":", 2)
        nonce = base64.urlsafe_b64decode(nonce_b64)
        ct = base64.urlsafe_b64decode(ct_b64)
        return AESGCM(_key()).decrypt(nonce, ct, None).decode()
    except Exception as exc:  # wrong key / tampered value
        raise RuntimeError(f"secret box decrypt failed: {exc}") from exc


def is_encrypted(value: str | None) -> bool:
    return bool(value) and value.startswith(_PREFIX)
