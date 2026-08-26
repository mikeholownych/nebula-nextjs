/**
 * Audit database connection for Nebula Components
 * Connects to nebula_audit PostgreSQL database
 */

import { Pool } from 'pg';

// Audit database connection pool
export const auditPool = new Pool({
  host: process.env.PGHOST || '/var/run/postgresql',
  port: parseInt(process.env.PGPORT || '5433'),
  database: process.env.PGDATABASE_AUDIT || 'nebula_audit',
  user: process.env.PGUSER || 'postgres',
  max: 10,
});

// Test connection on startup
auditPool.on('connect', () => {
  console.log('[PostgreSQL] Connected to nebula_audit');
});

auditPool.on('error', (err: any) => {
  console.error('[PostgreSQL] Audit DB connection error:', err);
});
