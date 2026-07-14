"""Redis client configuration and connection management."""

import json
from typing import Any, Optional

from redis.asyncio import ConnectionPool, Redis
from redis.asyncio.client import Pipeline
from redis.exceptions import RedisError

from platform_api.config import settings


class RedisClient:
    """Redis client wrapper with connection pooling.
    
    Usage:
        redis_client = RedisClient()
        await redis_client.connect()
        
        # Set value
        await redis_client.set("key", {"data": "value"}, ttl=3600)
        
        # Get value
        data = await redis_client.get("key")
        
        # Check exists
        exists = await redis_client.exists("key")
        
        # Delete
        await redis_client.delete("key")
    """
    
    def __init__(self, redis_url: str = None):
        self.redis_url = redis_url or settings.REDIS_URL
        self._pool: Optional[ConnectionPool] = None
        self._client: Optional[Redis] = None
    
    async def connect(self) -> None:
        """Initialize Redis connection pool."""
        if self._pool is None:
            self._pool = ConnectionPool.from_url(
                self.redis_url,
                decode_responses=True,
                max_connections=50,
            )
            self._client = Redis(connection_pool=self._pool)
    
    async def disconnect(self) -> None:
        """Close Redis connection pool."""
        if self._client:
            await self._client.aclose()
            self._client = None
        if self._pool:
            await self._pool.aclose()
            self._pool = None
    
    @property
    def client(self) -> Redis:
        """Get Redis client instance."""
        if self._client is None:
            raise RuntimeError("Redis not connected. Call connect() first.")
        return self._client
    
    async def ping(self) -> bool:
        """Check Redis connection health."""
        try:
            result = await self.client.ping()
            return result == b"PONG" or result == "PONG"
        except RedisError:
            return False
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value by key (auto-deserialize JSON)."""
        value = await self.client.get(key)
        if value is None:
            return None
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return value
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: Optional[int] = None
    ) -> bool:
        """Set key-value pair (auto-serialize JSON).
        
        Args:
            key: Redis key
            value: Value to store (will be JSON-serialized if dict/list)
            ttl: Time-to-live in seconds (None = no expiry)
        
        Returns:
            True if successful
        """
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        
        if ttl:
            return await self.client.setex(key, ttl, value)
        else:
            return await self.client.set(key, value)
    
    async def delete(self, *keys: str) -> int:
        """Delete one or more keys.
        
        Returns:
            Number of keys deleted
        """
        return await self.client.delete(*keys)
    
    async def exists(self, *keys: str) -> int:
        """Check if keys exist.
        
        Returns:
            Number of keys that exist
        """
        return await self.client.exists(*keys)
    
    async def expire(self, key: str, ttl: int) -> bool:
        """Set TTL on a key.
        
        Returns:
            True if TTL was set (key exists)
        """
        return await self.client.expire(key, ttl)
    
    async def ttl(self, key: str) -> int:
        """Get TTL of a key.
        
        Returns:
            TTL in seconds, -1 if no expiry, -2 if key doesn't exist
        """
        return await self.client.ttl(key)
    
    # Hash operations
    async def hset(
        self, 
        name: str, 
        key: str, 
        value: Any
    ) -> int:
        """Set hash field (auto-serialize JSON)."""
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        return await self.client.hset(name, key, value)
    
    async def hget(self, name: str, key: str) -> Optional[Any]:
        """Get hash field (auto-deserialize JSON)."""
        value = await self.client.hget(name, key)
        if value is None:
            return None
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return value
    
    async def hgetall(self, name: str) -> dict:
        """Get all hash fields (auto-deserialize JSON)."""
        data = await self.client.hgetall(name)
        result = {}
        for k, v in data.items():
            try:
                result[k] = json.loads(v)
            except (json.JSONDecodeError, TypeError):
                result[k] = v
        return result
    
    async def hdel(self, name: str, *keys: str) -> int:
        """Delete hash fields.
        
        Returns:
            Number of fields deleted
        """
        return await self.client.hdel(name, *keys)
    
    async def hexists(self, name: str, key: str) -> bool:
        """Check if hash field exists."""
        return await self.client.hexists(name, key)
    
    # Set operations
    async def sadd(self, name: str, *values: str) -> int:
        """Add members to set.
        
        Returns:
            Number of members added
        """
        return await self.client.sadd(name, *values)
    
    async def srem(self, name: str, *values: str) -> int:
        """Remove members from set.
        
        Returns:
            Number of members removed
        """
        return await self.client.srem(name, *values)
    
    async def sismember(self, name: str, value: str) -> bool:
        """Check if value is member of set."""
        return await self.client.sismember(name, value)
    
    async def smembers(self, name: str) -> set:
        """Get all members of set."""
        return await self.client.smembers(name)
    
    # Increment operations
    async def incr(self, key: str, amount: int = 1) -> int:
        """Increment key by amount.
        
        Returns:
            New value after increment
        """
        return await self.client.incrby(key, amount)
    
    async def decr(self, key: str, amount: int = 1) -> int:
        """Decrement key by amount.
        
        Returns:
            New value after decrement
        """
        return await self.client.decrby(key, amount)
    
    # Pipeline for atomic operations
    def pipeline(self) -> Pipeline:
        """Create a pipeline for atomic operations.
        
        Usage:
            async with redis_client.pipeline() as pipe:
                await pipe.set("key1", "value1")
                await pipe.set("key2", "value2")
                await pipe.execute()
        """
        return self.client.pipeline(transaction=True)
    
    # Lua script execution
    async def eval(
        self, 
        script: str, 
        numkeys: int, 
        *keys_and_args: Any
    ) -> Any:
        """Execute Lua script.
        
        Args:
            script: Lua script string
            numkeys: Number of keys in script
            keys_and_args: Keys followed by arguments
        
        Returns:
            Script result
        """
        return await self.client.eval(script, numkeys, *keys_and_args)


# Global Redis client instance
redis_client = RedisClient()


async def get_redis() -> RedisClient:
    """Dependency injection for Redis client."""
    if redis_client._client is None:
        await redis_client.connect()
    return redis_client
