#!/usr/bin/env python3
"""
Manual setup for PostgreSQL to PostHog warehouse connection.
Uses PostHog HTTP API directly instead of interactive wizard.
"""
import json
import os
import urllib.request
import urllib.error
import sys

POSTHOG_HOST = os.environ.get('POSTHOG_HOST', 'https://us.i.posthog.com')
POSTHOG_API_KEY = os.environ.get('POSTHOG_PERSONAL_API_KEY')
PROJECT_ID = os.environ.get('POSTHOG_PROJECT_ID', '1')

DATABASE_HOST = '/var/run/postgresql'
DATABASE_PORT = '5433'
DATABASE_NAME = 'nebula_audit'
DATABASE_USER = 'postgres'

def make_posthog_request(path: str, method: str = 'POST', data: dict | None = None):
    """Make request to PostHog API."""
    url = f'{POSTHOG_HOST}/api/projects/{PROJECT_ID}/warehouse_database_connections/'
    if path:
        url = f'{POSTHOG_HOST}/api/{path.lstrip("/")}'
    
    headers = {
        'Authorization': f'Bearer {POSTHOG_API_KEY}',
        'Content-Type': 'application/json',
    }
    
    body = json.dumps(data).encode() if data else None
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()[:500]}", file=sys.stderr)
        return None

def create_database_connection():
    """Create PostgreSQL database connection in PostHog."""
    # Get existing connections
    existing = make_posthog_request('warehouse_database_connections/', 'GET')
    if existing and existing.get('results'):
        print("Existing database connections found:")
        for conn in existing['results']:
            print(f"  - {conn['name']} (id: {conn['id']})")
        # Use first existing connection
        return existing['results'][0]['id']
    
    # Create new connection
    data = {
        'name': 'Nebula Audit Database',
        'database_name': DATABASE_NAME,
        'host': DATABASE_HOST,
        'port': DATABASE_PORT,
        'user': DATABASE_USER,
        'password': '',  # Uses PostgreSQL socket authentication
        'ssl_mode': 'disable',
        'warehouse': 'postgres',
    }
    
    result = make_posthog_request('warehouse_database_connections/', 'POST', data)
    if result:
        print(f"Created database connection: {result['name']} (ID: {result['id']})")
        return result['id']
    return None

def sync_tables(database_id: str):
    """Trigger table sync."""
    result = make_posthog_request(
        f'warehouse_database_connections/{database_id}/sync/',
        'POST',
        {'auto_schedule': True}
    )
    if result:
        print(f"Sync triggered: {result.get('success', False)}")
        return result.get('jobs', [])
    return []

def main():
    if not POSTHOG_API_KEY:
        print("ERROR: POSTHOG_PERSONAL_API_KEY not set", file=sys.stderr)
        sys.exit(1)
    
    print("=== PostHog Warehouse Setup ===")
    print(f"PostHog Host: {POSTHOG_HOST}")
    print(f"Project ID: {PROJECT_ID}")
    print()
    
    # Create/reuse database connection
    print("Step 1: Creating database connection...")
    database_id = create_database_connection()
    if not database_id:
        print("ERROR: Failed to create database connection", file=sys.stderr)
        sys.exit(1)
    print()
    
    # Trigger sync
    print("Step 2: Triggering table sync...")
    jobs = sync_tables(database_id)
    if jobs:
        print(f"Sync jobs created: {len(jobs)}")
    else:
        print("No new jobs created (tables may already be synced)")
    print()
    
    print("=== Setup Complete ===")
    print(f"Database connection ID: {database_id}")

if __name__ == '__main__':
    main()
