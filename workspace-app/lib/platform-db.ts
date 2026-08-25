/**
 * Platform DB (nebula_platform) pool, shared by tenancy and domain-claims.
 */

import { Pool } from 'pg'

export const platformPool = new Pool({
  host: process.env.PGHOST || '/var/run/postgresql',
  port: parseInt(process.env.PGPORT || '5433'),
  database: process.env.PGDATABASE_PLATFORM || 'nebula_platform',
  user: process.env.PGUSER || 'postgres',
  max: 5,
})

platformPool.on('error', (err: Error) => {
  console.error('[workspace-app platform pg]', err.message)
})
