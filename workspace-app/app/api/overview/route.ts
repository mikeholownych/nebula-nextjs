/**
 * GET /api/overview
 *
 * Single aggregated payload for the Overview page (spec questions #1-#4):
 * - finding counts by status (attention model: regressed > new > open > settled)
 * - top required actions (regressed first, then new, by impact)
 * - property count (distinct domains visible to this actor)
 *
 * Tenant scoping identical to /api/findings: ownership proven through the
 * audit email chain server-side, org visibility via active memberships.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUser, jsonError } from '@/lib/auth'
import { auditPool } from '@/lib/db'
import {
  requestContext,
  writeAuditLog,
  listMemberships,
  orgMemberEmails,
  orgClaimedDomains,
  orgExcludedDomains,
} from '@/lib/tenancy'

const STATUS_KEYS = [
  'regressed',
  'new',
  'acknowledged',
  'in_progress',
  'resolved',
  'accepted_risk',
  'ignored',
] as const

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.response) return auth.response
  const user = auth.user
  const workspaceEmail = user.workspace_email ?? user.email
  const ctx = requestContext(request)

  try {
    const memberships = await listMemberships(user)
    let orgEmails: string[] = []
    let claimed: string[] = []
    let excluded: string[] = []
    if (memberships.length > 0) {
      const ids = memberships.map((m) => m.organizationId)
      orgEmails = await orgMemberEmails(ids)
      claimed = await orgClaimedDomains(ids)
      excluded = await orgExcludedDomains(ids)
    }

    // Same visibility rule as /api/findings: claims first, email-chain
    // fallback, exclusions suppressed from the email path.
    const domains = new Set<string>(claimed)
    if ([workspaceEmail, ...orgEmails].length > 0) {
      const ownerRes = await auditPool.query(
        `SELECT DISTINCT lower(
           CASE WHEN raw.host LIKE 'www.%' THEN substring(raw.host FROM 5) ELSE raw.host END
         ) AS domain
         FROM (
           SELECT split_part(split_part(a.url, '//', 2), '/', 1) AS host, a.email
           FROM audits a
         ) raw
         WHERE raw.host <> '' AND raw.email = ANY($1::text[])`,
         [[workspaceEmail, ...orgEmails]]
      )
      for (const r of ownerRes.rows as { domain: string }[]) {
        if (r.domain && !excluded.includes(r.domain)) domains.add(r.domain)
      }
    }
    const domainList: string[] = [...domains]

    if (domainList.length === 0) {
      const empty = {
        properties: 0,
        countsByStatus: Object.fromEntries(STATUS_KEYS.map((k) => [k, 0])),
        requiresAttention: [],
        recentFindings: [],
      }
      const res = NextResponse.json(empty)
      res.headers.set('Cache-Control', 'no-store')
      res.headers.set('X-Request-ID', ctx.requestId)
      return res
    }

    // Counts by status across visible domains
    const countsRes = await auditPool.query(
      `SELECT f.status, COUNT(*)::int AS n
       FROM findings f
       WHERE f.domain = ANY($1::text[])
       GROUP BY f.status`,
      [domainList]
    )
    const countsByStatus: Record<string, number> = Object.fromEntries(
      STATUS_KEYS.map((k) => [k, 0])
    )
    for (const row of countsRes.rows as { status: string; n: number }[]) {
      if (row.status in countsByStatus) countsByStatus[row.status] = row.n
    }

    // Required actions: regressed first, then new, capped at 5
    const attentionRes = await auditPool.query(
      `SELECT f.public_id, f.domain, f.signal_key, f.label, f.status,
              f.impact, f.effort, f.last_seen_at
       FROM findings f
       WHERE f.domain = ANY($1::text[])
         AND f.status IN ('regressed', 'new')
       ORDER BY CASE f.status WHEN 'regressed' THEN 0 ELSE 1 END,
                f.impact DESC NULLS LAST
       LIMIT 5`,
      [domainList]
    )

    // Recent movement: last 8 events on visible findings
    const recentRes = await auditPool.query(
      `SELECT fe.event_type, fe.old_status, fe.new_status, fe.actor_email,
              fe.occurred_at, f.public_id, f.label, f.domain
       FROM finding_events fe
       JOIN findings f ON f.id = fe.finding_id
       WHERE f.domain = ANY($1::text[])
         AND fe.event_type <> 'detected'
       ORDER BY fe.occurred_at DESC
       LIMIT 8`,
      [domainList]
    )

    const payload = {
      properties: domainList.length,
      countsByStatus,
      requiresAttention: attentionRes.rows,
      recentActivity: recentRes.rows,
    }
    const res = NextResponse.json(payload)
    res.headers.set('Cache-Control', 'no-store')
    res.headers.set('X-Request-ID', ctx.requestId)
    return res
  } catch (err) {
    console.error('[overview GET]', err)
    await writeAuditLog({
      actorType: 'user',
      actorId: user?.id,
      actorEmail: workspaceEmail,
      action: 'overview.view',
      resourceType: 'overview',
      requestId: ctx.requestId,
      result: 'error',
    })
    return jsonError(500, 'Failed to load overview', 'OVERVIEW_FAILED', ctx.requestId)
  }
}
