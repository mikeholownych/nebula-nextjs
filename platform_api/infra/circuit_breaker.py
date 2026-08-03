import time
import json
import functools
from enum import Enum
from typing import Any, Callable, Optional

from platform_api.redis_client import redis_client


class CircuitState(str, Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout_seconds: int = 30,
        cache_ttl: int = 900,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout_seconds = recovery_timeout_seconds
        self.cache_ttl = cache_ttl

    @property
    def _key_failures(self) -> str:
        return f"cb:{self.name}:failures"

    @property
    def _key_state(self) -> str:
        return f"cb:{self.name}:state"

    @property
    def _key_opened_at(self) -> str:
        return f"cb:{self.name}:opened_at"

    @property
    def _key_cache(self) -> str:
        return f"cb:{self.name}:cache"

    async def _ensure_connected(self) -> None:
        await redis_client.connect()

    async def get_state(self) -> CircuitState:
        await self._ensure_connected()
        state = await redis_client.get(self._key_state)
        if state is None:
            return CircuitState.CLOSED
        return CircuitState(state)

    async def _set_state(self, state: CircuitState) -> None:
        await redis_client.set(self._key_state, state.value)

    async def _should_attempt(self) -> bool:
        state = await self.get_state()
        if state == CircuitState.CLOSED:
            return True
        if state == CircuitState.OPEN:
            opened_at = await redis_client.get(self._key_opened_at)
            if opened_at and (time.time() - float(opened_at)) >= self.recovery_timeout_seconds:
                await self._set_state(CircuitState.HALF_OPEN)
                return True
            return False
        # HALF_OPEN: allow one probe request
        return True

    async def record_success(self, result: Any) -> None:
        await self._ensure_connected()
        await redis_client.set(self._key_failures, 0)
        await self._set_state(CircuitState.CLOSED)
        try:
            serialized = json.dumps(result)
            await redis_client.set(self._key_cache, serialized, ttl=self.cache_ttl)
        except (TypeError, ValueError):
            pass

    async def record_failure(self) -> None:
        await self._ensure_connected()
        failures = await redis_client.incr(self._key_failures)
        if failures >= self.failure_threshold:
            await self._set_state(CircuitState.OPEN)
            await redis_client.set(self._key_opened_at, str(time.time()))

    async def get_cached_response(self) -> Optional[Any]:
        await self._ensure_connected()
        cached = await redis_client.get(self._key_cache)
        if cached is None:
            return None
        if isinstance(cached, str):
            try:
                return json.loads(cached)
            except (json.JSONDecodeError, TypeError):
                return cached
        return cached

    def __call__(self, func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            if not await self._should_attempt():
                cached = await self.get_cached_response()
                if cached is not None:
                    return cached
                raise CircuitOpenError(f"Circuit '{self.name}' is open and no cached response available")
            try:
                result = await func(*args, **kwargs)
                await self.record_success(result)
                return result
            except Exception as exc:
                await self.record_failure()
                state = await self.get_state()
                if state == CircuitState.OPEN:
                    cached = await self.get_cached_response()
                    if cached is not None:
                        return cached
                raise exc

        return wrapper


class CircuitOpenError(Exception):
    pass
