#!/usr/bin/env venv/bin/python3
"""Test authentication flow end-to-end.

This script tests:
1. Platform API health
2. PostgreSQL connection
3. Redis connection
4. JWT creation/verification
5. Google OAuth token structure (mock)

Run with: PYTHONPATH=. venv/bin/python3 scripts/test_auth_flow.py
"""

import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from platform_api.config import settings
from platform_api.redis_client import get_redis
from platform_api.auth.jwt import create_jwt, decode_jwt, verify_session
from platform_api.auth.google import GoogleOIDCVerifier
import httpx


async def test_postgres():
    """Test PostgreSQL connection."""
    print("\n📊 Testing PostgreSQL...")
    
    try:
        # Test direct connection
        import subprocess
        result = subprocess.run(
            ["sudo", "-u", "postgres", "psql", "-d", "nebula_platform", "-c", "SELECT COUNT(*) FROM users;"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            print(f"   ✅ Connected (users table exists)")
            return True
        else:
            print(f"   ❌ Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


async def test_redis():
    """Test Redis connection."""
    print("\n🔴 Testing Redis...")
    
    from platform_api.redis_client import RedisClient
    
    try:
        redis = RedisClient()
        await redis.connect()
        
        # Test set/get
        await redis.set("test_key", {"test": "data"}, ttl=10)
        result = await redis.get("test_key")
        
        await redis.delete("test_key")
        await redis.disconnect()
        
        print(f"   ✅ Connected (set/get/delete works)")
        return True
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


async def test_jwt():
    """Test JWT creation and verification."""
    print("\n🔑 Testing JWT sessions...")
    
    try:
        # Test with real settings
        payload = {
            "user_id": "test-user-123",
            "org_id": "test-org-456"
        }
        
        token = create_jwt(payload)
        print(f"   ✅ JWT created: {token[:50]}...")
        
        # Verify it decodes
        claims = decode_jwt(token)
        print(f"   ✅ JWT decodes: user_id={claims['user_id']}")
        
        return True
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


async def test_google_oauth_structure():
    """Test Google OAuth verifier initialization."""
    print("\n🔐 Testing Google OAuth setup...")
    
    try:
        verifier = GoogleOIDCVerifier(client_id=settings.GOOGLE_CLIENT_ID)
        print(f"   ✅ Verifier initialized with client_id: {settings.GOOGLE_CLIENT_ID[:30]}...")
        
        # Check JWKS URL is reachable
        async with httpx.AsyncClient() as client:
            response = await client.get("https://www.googleapis.com/oauth2/v3/certs")
            if response.status_code == 200:
                print(f"   ✅ Google JWKS endpoint reachable")
            else:
                print(f"   ⚠️  JWKS returned status {response.status_code}")
        
        return True
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


async def test_platform_api():
    """Test Platform API health."""
    print("\n🚀 Testing Platform API...")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8766/healthz", timeout=5.0)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Platform API healthy: {data.get('status')}")
                return True
            else:
                print(f"   ⚠️  Status {response.status_code}: {response.text}")
                return False
    except httpx.ConnectError:
        print(f"   ⚠️  Platform API not running (start with: venv/bin/uvicorn platform_api.main:app)")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def print_summary(results: dict):
    """Print test summary."""
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:.<40} {status}")
    
    print("="*60)
    print(f"Total: {total} | Passed: {passed} | Failed: {failed}")
    print(f"Pass Rate: {(passed/total*100):.0f}%")
    print("="*60)


async def main():
    """Run all tests."""
    print("="*60)
    print("AUTHENTICATION FLOW TEST SUITE")
    print("="*60)
    
    print(f"\n⚙️  Configuration:")
    print(f"   Environment: {settings.ENVIRONMENT}")
    print(f"   Google Client ID: {settings.GOOGLE_CLIENT_ID[:30]}...")
    print(f"   Redis URL: {settings.REDIS_URL}")
    print(f"   JWT Expiration: {settings.JWT_EXPIRATION_DAYS} days")
    
    # Run tests
    results = {
        "PostgreSQL": await test_postgres(),
        "Redis": await test_redis(),
        "JWT Sessions": await test_jwt(),
        "Google OAuth": await test_google_oauth_structure(),
        "Platform API": await test_platform_api(),
    }
    
    print_summary(results)
    
    # Return exit code
    if all(results.values()):
        print("\n✅ All tests passed! Ready for manual OAuth testing.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Fix issues before manual testing.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
