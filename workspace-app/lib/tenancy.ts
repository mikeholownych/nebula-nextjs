/**
 * Tenant authorization + audit logging.
 *
 * Authorization model (spec #2, #12): the actor's orgs come from the
 * memberships table server-side. Any org-scoped request must prove the actor
 * holds a membership in that org with a role satisfying the action. Client
 * supplied organization identifiers are never trusted as access control.
 */

import { Pool } from 'pg'
import { NextRequest } from 'next/server'
import { WorkspaceUser } from './auth'

const platformPool = new Pool({
  host: process.env.PGHOST || '/var/run/postgresql',
  port: parseInt(process.env.PGPORT || '5433'),
  database: process.env.PGDATABASE || 'nebula_platform',
  user: process.env.PGUSER || 'postgres',
  max: 5,
})
platformPool.on('error', (err: Error) => {
  console.error('[workspace-app rbac pg]', err.message)
})

export type Role = 'owner' | 'admin' | 'member' | 'viewer'

const ROLE_RANK: Record<Role, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
}

export function roleSatisfies(role: Role, required: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required]
}

export interface TenantContext {
  organizationId: string
  role: Role
}

/**
 * Resolve the actor's membership in `organizationId`.
 * Returns null when no active membership exists (=> 403 upstream).
 */
export async function resolveMembership(
  user: WorkspaceUser,
  organizationId: string
): Promise<TenantContext | null> {
  try {
    const result = await platformPool.query(
      `SELECT organization_id, role FROM memberships
       WHERE user_id = $1 AND organization_id::text = $2 AND status = 'active'
       LIMIT 1`,
      [user.id, organizationId]
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      organizationId,
      role: row.role as Role,
    }
  } catch (err) {
    console.error('[workspace-app membership lookup]', err)
    return null
  }
}

/** All orgs the actor belongs to (active memberships only). */
export async function listMemberships(user: WorkspaceUser): Promise<TenantContext[]> {
  const result = await platformPool.query(
    `SELECT organization_id::text, role FROM memberships
     WHERE user_id = $1 AND status = 'active'`,
    [user.id]
  )
  return result.rows.map((r: { organization_id: string; role: string }) => ({
    organizationId: r.organization_id,
    role: r.role as Role,
  }))
}

/**
 * Member emails across a set of orgs (server-side resolution only).
 * Used to compute the set of domains an actor may see through their
 * organizations. Never accepts emails from the client.
 */
export async function orgMemberEmails(organizationIds: string[]): Promise<string[]> {
  if (organizationIds.length === 0) return []
  const result = await platformPool.query(
    `SELECT DISTINCT u.email
     FROM memberships m
     JOIN users u ON u.id = m.user_id
     WHERE m.status = 'active'
       AND m.organization_id::text = ANY($1::text[])
       AND u.email IS NOT NULL`,
    [organizationIds]
  )
  return result.rows.map((r: { email: string }) => String(r.email).trim().toLowerCase())
}

/**
 * Domains explicitly claimed by the actor's orgs (org_domains, Phase 3).
 * These take precedence over email-chain inference.
 */
export async function orgClaimedDomains(organizationIds: string[]): Promise<string[]> {
  if (organizationIds.length === 0) return []
  const result = await platformPool.query(
    `SELECT DISTINCT lower(domain) AS domain
     FROM org_domains
     WHERE status = 'active'
       AND organization_id::text = ANY($1::text[])`,
    [organizationIds]
  )
  return result.rows.map((r: { domain: string }) => String(r.domain))
}

/**
 * Domains the actor's orgs have marked "not mine" (status='excluded').
 * Suppresses email-chain inference for those domains (demo runs, teardowns).
 */
export async function orgExcludedDomains(organizationIds: string[]): Promise<string[]> {
  if (organizationIds.length === 0) return []
  const result = await platformPool.query(
    `SELECT DISTINCT lower(domain) AS domain
     FROM org_domains
     WHERE status = 'excluded'
       AND organization_id::text = ANY($1::text[])`,
    [organizationIds]
  )
  return result.rows.map((r: { domain: string }) => String(r.domain))
}

// ---------------------------------------------------------------
// Audit log writer (spec #27). Append-only by convention: this is
// the ONLY module that inserts into audit_log and nothing ever
// updates or deletes from it.
// ---------------------------------------------------------------

const auditPool = new Pool({
  host: process.env.PGHOST || '/var/run/postgresql',
  port: parseInt(process.env.PGPORT || '5433'),
  database: process.env.PGDATABASE_AUDIT || 'nebula_audit',
  user: process.env.PGUSER || 'postgres',
  max: 5,
})
auditPool.on('error', (err: Error) => {
  console.error('[workspace-app auditlog pg]', err.message)
})

export interface AuditLogEntry {
  actorType: 'user' | 'system' | 'api_key'
  actorId?: string | null
  actorEmail?: string | null
  organizationId?: string | null
  action: string
  resourceType: string
  resourceId?: string | null
  oldValue?: unknown
  newValue?: unknown
  requestId?: string | null
  ip?: string | null
  userAgent?: string | null
  result?: 'ok' | 'denied' | 'error'
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await auditPool.query(
      `INSERT INTO audit_log (
        actor_type, actor_id, actor_email, organization_id,
        action, resource_type, resource_id, old_value, new_value,
        request_id, ip, user_agent, result
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        entry.actorType,
        entry.actorId ?? null,
        entry.actorEmail ?? null,
        entry.organizationId ?? null,
        entry.action,
        entry.resourceType,
        entry.resourceId ?? null,
        entry.oldValue === undefined ? null : JSON.stringify(entry.oldValue),
        entry.newValue === undefined ? null : JSON.stringify(entry.newValue),
        entry.requestId ?? null,
        entry.ip ?? null,
        entry.userAgent ?? null,
        entry.result ?? 'ok',
      ]
    )
  } catch (err) {
    // Audit log failure must not break the customer operation, but must be loud.
    console.error('[workspace-app AUDIT WRITE FAILED]', err)
  }
}

/** Extract correlation context from an incoming request. */
export function requestContext(request: NextRequest): {
  requestId: string
  ip: string | null
  userAgent: string | null
} {
  return {
    requestId:
      request.headers.get('x-request-id') ??
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ip:
      request.headers.get('cf-connecting-ip') ??
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      null,
    userAgent: request.headers.get('user-agent'),
  }
}
