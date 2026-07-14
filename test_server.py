"""Test the platform API server."""

import asyncio
import sys
import time
from contextlib import asynccontextmanager

import httpx
import uvicorn
from httpx import ASGITransport

# Add current directory to path
sys.path.insert(0, '.')

from platform_api.main import app


@asynccontextmanager
async def lifespan(app_instance):
    """Lifespan context manager for the server."""
    print("Starting server...")
    yield
    print("Server stopped.")


async def test_server():
    """Start server and test endpoints."""
    # Start server in background
    config = uvicorn.Config(
        app,
        host="127.0.0.1",
        port=8770,
        log_level="info",
        lifespan="on",
    )
    server = uvicorn.Server(config)
    
    # Start server in background task
    server_task = asyncio.create_task(server.serve())
    
    # Wait a moment for server to start
    print("Waiting for server to start...")
    await asyncio.sleep(2)
    
    try:
        # Test endpoints
        async with httpx.AsyncClient(
            transport=ASGITransport(app=app), 
            base_url="http://test"
        ) as client:
            # Test health endpoint
            response = await client.get("/healthz")
            print(f"Health status: {response.status_code}")
            print(f"Health response: {response.json()}")
            
            # Test readyz endpoint
            response = await client.get("/readyz")
            print(f"Readyz status: {response.status_code}")
            print(f"Readyz response: {response.json()}")
            
            # Test root endpoint
            response = await client.get("/")
            print(f"Root status: {response.status_code}")
            print(f"Root response: {response.json()}")
            
            # Test 404 endpoint
            response = await client.get("/nonexistent")
            print(f"404 status: {response.status_code}")
            print(f"404 response: {response.json()}")
            
    finally:
        # Shutdown server
        print("\nShutting down server...")
        server.should_exit = True
        await server_task
        print("Server shutdown complete.")


if __name__ == "__main__":
    asyncio.run(test_server())