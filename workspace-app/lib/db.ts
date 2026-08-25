/**
 * Workspace app database access.
 * Reads tenant data from nebula_audit (findings/audit_log) and identity from
 * nebula_platform via the platform API auth service.
 */

import { Pool } from 'pg'

export const auditPool = new Pool({
  host: process.env.PGHOST || '/var/run/postgresql',
  port: parseInt(process.env.PGPORT || '5433'),
  database: process.env.PGDATABASE_AUDIT || 'nebula_audit',
  user: process.env.PGUSER || 'postgres',
  max: 10,
})

auditPool.on('error', (err: Error) => {
  console.error('[workspace-app pg]', err.message)
})

/** Normalized domain extraction shared by all queries. */
export function normalizeDomain(url: string): string {
  try {
    let host = new URL(url).hostname.toLowerCase()
    if (host.startsWith('www.')) host = host.slice(4)
    return host
  } catch {
    return ''
  }
}

export const VALID_FINDING_STATUSES = [
  'new', 'acknowledged', 'in_progress', 'resolved',
  'accepted_risk', 'ignored', 'regressed',
] as const

export type FindingStatus = (typeof VALID_FINDING_STATUSES)[number]
