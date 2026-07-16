/**
 * Database connection for Nebula Components
 * Uses environment variables for PostgreSQL connection
 */

import { Pool } from 'pg';

// PostgreSQL connection pool
// Peer auth: run as postgres user or set PGHOST=/var/run/postgresql
export const pool = new Pool({
  host: process.env.PGHOST || '/var/run/postgresql',
  port: parseInt(process.env.PGPORT || '5433'),
  database: process.env.PGDATABASE || 'nebula_platform',
  user: process.env.PGUSER || 'postgres',
  max: 10,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('[PostgreSQL] Connected to nebula_platform');
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Connection error:', err);
});
