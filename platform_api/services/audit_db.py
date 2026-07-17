"""
Database service for audit persistence
"""

import os
import asyncpg
from datetime import datetime
from typing import Optional, List
from uuid import UUID
import json


class AuditDB:
    """PostgreSQL database service for audit records"""
    
    def __init__(self):
        self.db_url = os.getenv(
            "DATABASE_URL",
            "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433"
        )
        self.pool = None
    
    async def connect(self):
        """Create connection pool"""
        if not self.pool:
            self.pool = await asyncpg.create_pool(self.db_url, min_size=2, max_size=10)
    
    async def close(self):
        """Close connection pool"""
        if self.pool:
            await self.pool.close()
    
    async def get_or_create_customer(self, email: str, name: Optional[str] = None) -> UUID:
        """Get or create customer by email"""
        async with self.pool.acquire() as conn:
            # Try to get existing
            row = await conn.fetchrow(
                "SELECT id FROM customers WHERE email = $1",
                email
            )
            if row:
                return row['id']
            
            # Create new
            row = await conn.fetchrow(
                "INSERT INTO customers (email, name) VALUES ($1, $2) RETURNING id",
                email, name
            )
            return row['id']
    
    async def create_audit(self, url: str, email: str, name: Optional[str] = None) -> UUID:
        """Create a new audit record"""
        await self.connect()
        
        customer_id = await self.get_or_create_customer(email, name)
        
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO audits (customer_id, url, email, name, status)
                VALUES ($1, $2, $3, $4, 'pending')
                RETURNING id
                """,
                customer_id, url, email, name
            )
            return row['id']
    
    async def update_audit(self, audit_id: UUID, score: float, grade: str, 
                          findings: List[dict], status: str = 'completed') -> bool:
        """Update audit with results"""
        await self.connect()
        
        async with self.pool.acquire() as conn:
            result = await conn.execute(
                """
                UPDATE audits
                SET score = $2, grade = $3, findings = $4, 
                    status = $5, completed_at = NOW()
                WHERE id = $1
                """,
                audit_id, int(score * 10), grade, json.dumps(findings), status
            )
            return result == 'UPDATE 1'
    
    async def mark_email_sent(self, audit_id: UUID) -> bool:
        """Mark audit email as sent"""
        await self.connect()
        
        async with self.pool.acquire() as conn:
            result = await conn.execute(
                "UPDATE audits SET email_sent_at = NOW() WHERE id = $1",
                audit_id
            )
            return result == 'UPDATE 1'
    
    async def get_audit(self, audit_id: UUID) -> Optional[dict]:
        """Get audit by ID"""
        await self.connect()
        
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, customer_id, url, email, name, status, 
                       score, grade, findings, created_at, completed_at,
                       email_sent_at, paid_at, paid_product
                FROM audits WHERE id = $1
                """,
                audit_id
            )
            if row:
                return dict(row)
            return None
    
    async def get_audits_by_email(self, email: str, limit: int = 10) -> List[dict]:
        """Get audits by email"""
        await self.connect()
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, url, status, score, grade, created_at, completed_at
                FROM audits
                WHERE email = $1
                ORDER BY created_at DESC
                LIMIT $2
                """,
                email, limit
            )
            return [dict(r) for r in rows]
    
    async def create_purchase(self, customer_id: UUID, audit_id: Optional[UUID],
                             product: str, amount_cents: int,
                             stripe_payment_intent_id: Optional[str] = None) -> UUID:
        """Create purchase record"""
        await self.connect()
        
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO purchases (customer_id, audit_id, product, 
                                       amount_cents, stripe_payment_intent_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
                """,
                customer_id, audit_id, product, amount_cents, stripe_payment_intent_id
            )
            
            # Also update audit if provided
            if audit_id:
                await conn.execute(
                    "UPDATE audits SET paid_at = NOW(), paid_product = $2 WHERE id = $1",
                    audit_id, product
                )
            
            return row['id']


# Singleton
audit_db = AuditDB()
