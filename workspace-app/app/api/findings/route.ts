/**
 * GET /api/findings?domain=&status=&public_id=&limit=&offset=
 *
 * Tenant-scoped durable findings feed. Scoping rule: the actor may only see
 * domains owned by an organization they hold membership in. Domain ownership
 * currently maps through the audit email -> user -> memberships chain; a
 * domain is visible if ANY of the actor's orgs has audited it.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUser, jsonError } from '@/lib/auth'
import { auditPool } from '@/lib/db'
import { requestContext, writeAuditLog, listMemberships, orgMemberEmails, orgClaimedDomains, orgExcludedDomains } from '@/lib/tenancy'
import { VALID_FINDING_STATUSES } from '@/lib/db'

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.response) return auth.response
  const user = auth.user
  const workspaceEmail = user.workspace_email ?? user.email
  const ctx = requestContext(request)

  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')?.trim().toLowerCase() || null
  const statusParam = searchParams.get('status')?.trim() || null
  const publicId = searchParams.get('public_id')?.trim() || null
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 200)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

  let statusFilter: string[] | null = null
  if (statusParam) {
    const requested = statusParam.split(',').map((s) => s.trim()).filter(Boolean)
    const invalid = requested.filter((s) => !VALID_FINDING_STATUSES.includes(s as never))
    if (invalid.length > 0) {
      return jsonError(400, `Invalid status value: ${invalid.join(', ')}`, 'INVALID_STATUS', ctx.requestId)
    }
    statusFilter = requested
  }

  try {
    // Domains visible to this actor: domains their orgs (or their own audits) touched.
    const memberships = await listMemberships(user)

    const params: unknown[] = []
    let domainClause = ''
    if (domain) {
      params.push(domain)
      domainClause = `AND f.domain = $${params.length}`
    }
    if (publicId) {
      params.push(publicId)
      domainClause += ` AND f.public_id = $${params.length}`
    }
    if (statusFilter) {
      params.push(statusFilter)
      domainClause += ` AND f.status = ANY($${params.length}::varchar[])`
    }

    // Visibility (Phase 3): org_domains claims take precedence; email-chain
    // inference remains as the fallback for unclaimed domains. Domains the
    // org has marked 'excluded' are suppressed from the email path entirely
    // (owner judgment: demo runs / teardowns are not their properties).
    let orgEmails: string[] = []
    let claimed: string[] = []
    let excluded: string[] = []
    if (memberships.length > 0) {
      const ids = memberships.map((m) => m.organizationId)
      orgEmails = await orgMemberEmails(ids)
      claimed = await orgClaimedDomains(ids)
      excluded = await orgExcludedDomains(ids)
    }

    const visibilityClauses: string[] = []
    if (claimed.length > 0) {
      params.push(claimed)
      visibilityClauses.push(`f.domain = ANY($${params.length}::text[])`)
    }
    params.push([workspaceEmail, ...orgEmails])
    const ownerParam = `$${params.length}::text[]`
    const emailInferenceClause = `f.domain IN (
        SELECT DISTINCT lower(
          CASE WHEN raw.host LIKE 'www.%' THEN substring(raw.host FROM 5) ELSE raw.host END
        )
        FROM (
          SELECT split_part(split_part(a2.url, '//', 2), '/', 1) AS host
          FROM audits a2
          WHERE a2.email = ANY(${ownerParam})
        ) raw
        WHERE raw.host <> ''
      )`
    if (excluded.length > 0) {
      params.push(excluded)
      const excludedParam = `$${params.length}::text[]`
      visibilityClauses.push(`(${emailInferenceClause} AND f.domain <> ALL(${excludedParam}))`)
    } else {
      visibilityClauses.push(emailInferenceClause)
    }
    const visibilitySql = `(${visibilityClauses.join(' OR ')})`

    params.push(limit)
    const limitParam = `$${params.length}`
    params.push(offset)
    const offsetParam = `$${params.length}`

    const result = await auditPool.query(
      `SELECT f.id, f.public_id, f.domain, f.signal_key, f.label, f.issue, f.fix,
              f.quadrant, f.impact, f.effort, f.signal_type, f.evidence_class,
              f.evidence, f.scoring_provenance, f.status, f.owner_email,
              f.first_seen_at, f.last_seen_at, f.resolved_at
       FROM findings f
       WHERE ${visibilitySql}
       ${domainClause}
       ORDER BY
         CASE f.status WHEN 'regressed' THEN 0 WHEN 'new' THEN 1 ELSE 2 END,
         f.impact DESC NULLS LAST,
         f.last_seen_at DESC
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params
    )

    const NOT_ESTABLISHED =
      'Nebula has not established that this condition caused conversion loss or that changing it will increase conversion rate.'

    const findings = result.rows.map((row) => {
      const prov = (row.scoring_provenance && typeof row.scoring_provenance === 'object')
        ? row.scoring_provenance as Record<string, unknown>
        : {}
      const determination = typeof prov.determination === 'string' ? prov.determination : null
      const notEstablished = determination === 'FAIL' || determination === 'REVIEW'
        ? (typeof prov.not_established === 'string' ? prov.not_established : NOT_ESTABLISHED)
        : (typeof prov.not_established === 'string' ? prov.not_established : null)
      return {
        ...row,
        condition_id: prov.condition_id ?? null,
        condition_version: prov.condition_version ?? null,
        registry_version: prov.registry_version ?? null,
        determination,
        determination_reason_code: prov.determination_reason_code ?? null,
        observation_integrity: prov.observation_integrity ?? null,
        observation_integrity_reason: prov.observation_integrity_reason ?? null,
        determination_confidence: prov.determination_confidence ?? null,
        not_established: notEstablished,
      }
    })

    const res = NextResponse.json({
      findings,
      count: findings.length,
      limit,
      offset,
    })
    res.headers.set('Cache-Control', 'no-store')
    res.headers.set('X-Request-ID', ctx.requestId)
    return res
  } catch (err) {
    console.error('[findings GET]', err)
    await writeAuditLog({
      actorType: 'user',
      actorId: user.id,
      actorEmail: workspaceEmail,
      action: 'finding.list',
      resourceType: 'finding',
      requestId: ctx.requestId,
      result: 'error',
    })
    return jsonError(500, 'Failed to load findings', 'FINDINGS_QUERY_FAILED', ctx.requestId)
  }
}
