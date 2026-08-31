/**
 * PATCH /api/findings/[publicId]  { status?, owner_email? }
 *
 * Finding lifecycle transitions (spec #18):
 *   new -> acknowledged -> in_progress -> resolved
 *   any -> ignored / accepted_risk
 *   resolved|ignored -> regressed (system, via re-detection) or back via status change
 *
 * Authorization: only the domain owner's org members with role >= member may
 * transition; ownership is proven through the audit email chain server-side.
 * Every transition writes a finding_events row AND an audit_log row.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUser, jsonError } from '@/lib/auth'
import { auditPool, VALID_FINDING_STATUSES } from '@/lib/db'
import {
  requestContext,
  writeAuditLog,
  listMemberships,
  orgMemberEmails,
  roleSatisfies,
} from '@/lib/tenancy'
import { claimExistsForDomain } from '@/lib/domain-claims'

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  new: ['acknowledged', 'in_progress', 'resolved', 'accepted_risk', 'ignored'],
  acknowledged: ['in_progress', 'resolved', 'accepted_risk', 'ignored', 'new'],
  in_progress: ['resolved', 'acknowledged', 'new'],
  resolved: ['regressed', 'new'],
  ignored: ['new', 'regressed'],
  accepted_risk: ['new', 'regressed'],
  regressed: ['acknowledged', 'in_progress', 'resolved', 'accepted_risk', 'ignored'],
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ publicId: string }> }
) {
  const auth = await requireUser(request)
  if (auth.response) return auth.response
  const user = auth.user
  const workspaceEmail = user.workspace_email ?? user.email
  const ctx = requestContext(request)

  const { publicId } = await context.params
  let body: { status?: string; owner_email?: string; note?: string }
  try {
    body = await request.json()
  } catch {
    return jsonError(400, 'Invalid JSON body', 'INVALID_JSON', ctx.requestId)
  }

  const nextStatus = body.status?.trim()
  if (!nextStatus || !VALID_FINDING_STATUSES.includes(nextStatus as never)) {
    return jsonError(400, `status must be one of: ${VALID_FINDING_STATUSES.join(', ')}`, 'INVALID_STATUS', ctx.requestId)
  }

  const client = await auditPool.connect()
  try {
    await client.query('BEGIN')
    const findingRes = await client.query(
      `SELECT id, public_id, domain, signal_key, label, status, owner_email
       FROM findings WHERE public_id = $1 FOR UPDATE`,
      [publicId]
    )
    if (findingRes.rows.length === 0) {
      await client.query('ROLLBACK')
      return jsonError(404, 'Finding not found', 'FINDING_NOT_FOUND', ctx.requestId)
    }
    const finding = findingRes.rows[0]

    // --- tenant authorization (server-side ownership proof) ---
    // Phase 3: an active org_domains claim on this domain grants access
    // directly; email-chain inference remains as fallback.
    const memberships = await listMemberships(user)
    const ids = memberships.map((m) => m.organizationId)
    const orgEmails = await orgMemberEmails(ids)

    // Phase 3: an active org_domains claim on this domain grants access
    // directly; email-chain inference remains as fallback.
    const visibleViaClaim = await claimExistsForDomain(ids, finding.domain)

    const ownerRes = await client.query(
      `SELECT DISTINCT a.email FROM audits a
       WHERE split_part(split_part(a.url, '//', 2), '/', 1) IN (
         $1, $2
       )`,
      [finding.domain, `www.${finding.domain}`]
    )
    const domainOwnerEmails: string[] = ownerRes.rows.map((r: { email: string }) => r.email)

    const visibleViaSelf = domainOwnerEmails.includes(workspaceEmail)
    const visibleViaOrg =
      orgEmails.length > 0 && domainOwnerEmails.some((e) => orgEmails.includes(e))

    if (!visibleViaSelf && !visibleViaOrg && !visibleViaClaim) {
      await client.query('ROLLBACK')
      await writeAuditLog({
        actorType: 'user',
        actorId: user.id,
        actorEmail: workspaceEmail,
        action: 'finding.status.update',
        resourceType: 'finding',
        resourceId: finding.public_id,
        oldValue: { status: finding.status },
        newValue: { status: nextStatus },
        requestId: ctx.requestId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        result: 'denied',
      })
      return jsonError(403, 'You do not have access to this finding', 'FORBIDDEN', ctx.requestId)
    }

    // Role gate: mutations need >= member. Org members who can only see via
    // self are the domain owner themselves.
    const actorMembership = memberships.find((m) =>
      roleSatisfies(m.role, 'viewer')
    )
    const isSelfOwner = visibleViaSelf
    if (!isSelfOwner && (!actorMembership || !roleSatisfies(actorMembership.role, 'member'))) {
      await client.query('ROLLBACK')
      await writeAuditLog({
        actorType: 'user',
        actorId: user.id,
        actorEmail: workspaceEmail,
        action: 'finding.status.update',
        resourceType: 'finding',
        resourceId: finding.public_id,
        requestId: ctx.requestId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        result: 'denied',
      })
      return jsonError(
        403,
        'Your workspace role does not allow updating findings.',
        'ROLE_FORBIDDEN',
        ctx.requestId
      )
    }

    // --- state machine ---
    const currentStatus: string = finding.status
    if (nextStatus !== currentStatus) {
      const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? []
      if (!allowed.includes(nextStatus)) {
        await client.query('ROLLBACK')
        return jsonError(
          409,
          `Cannot move finding from ${currentStatus} to ${nextStatus}`,
          'INVALID_TRANSITION',
          ctx.requestId
        )
      }
    }

    const now = new Date()
    const resolvedAt = ['resolved', 'accepted_risk'].includes(nextStatus) ? now : null
    await client.query(
      `UPDATE findings SET status=$1, resolved_at=COALESCE($2, resolved_at),
       owner_email=COALESCE($3, owner_email), updated_at=now()
       WHERE id=$4 RETURNING status, resolved_at`,
      [
        nextStatus,
        resolvedAt,
        body.owner_email?.trim()?.toLowerCase() || null,
        finding.id,
      ]
    )

    await client.query(
      `INSERT INTO finding_events (finding_id, event_type, old_status, new_status,
       actor_email, actor_id, note, request_id)
       VALUES ($1,'status_changed',$2,$3,$4,$5,$6,$7)`,
      [finding.id, currentStatus, nextStatus, workspaceEmail, user.id, body.note ?? null, ctx.requestId]
    )
    await client.query('COMMIT')

    await writeAuditLog({
      actorType: 'user',
      actorId: user.id,
      actorEmail: workspaceEmail,
      action: 'finding.status.update',
      resourceType: 'finding',
      resourceId: finding.public_id,
      organizationId: null,
      oldValue: { status: currentStatus },
      newValue: { status: nextStatus },
      requestId: ctx.requestId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      result: 'ok',
    })

    const res = NextResponse.json({
      ok: true,
      public_id: finding.public_id,
      status: nextStatus,
      previous_status: currentStatus,
    })
    res.headers.set('Cache-Control', 'no-store')
    res.headers.set('X-Request-ID', ctx.requestId)
    return res
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('[finding PATCH]', err)
    await writeAuditLog({
      actorType: 'user',
      actorId: user?.id,
      actorEmail: workspaceEmail,
      action: 'finding.status.update',
      resourceType: 'finding',
      resourceId: publicId,
      requestId: ctx.requestId,
      result: 'error',
    })
    return jsonError(500, 'Failed to update finding', 'FINDING_UPDATE_FAILED', ctx.requestId)
  } finally {
    client.release()
  }
}

/** GET single finding with full event history. */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ publicId: string }> }
) {
  const auth = await requireUser(request)
  if (auth.response) return auth.response
  const user = auth.user
  const workspaceEmail = user.workspace_email ?? user.email
  const ctx = requestContext(request)
  const { publicId } = await context.params

  try {
    const finding = await auditPool.query(
      `SELECT f.* FROM findings f WHERE f.public_id = $1`,
      [publicId]
    )
    if (finding.rows.length === 0) {
      return jsonError(404, 'Finding not found', 'FINDING_NOT_FOUND', ctx.requestId)
    }
    if (user.workspace_email) {
      const ownedAudit = await auditPool.query(
        'SELECT 1 FROM audits WHERE id = $1 AND email = $2 LIMIT 1',
        [finding.rows[0].audit_id, workspaceEmail]
      )
      if (ownedAudit.rows.length === 0) {
        return jsonError(403, 'You do not have access to this finding', 'FORBIDDEN', ctx.requestId)
      }
    }
    const events = await auditPool.query(
      `SELECT event_type, old_status, new_status, actor_email, note, occurred_at
       FROM finding_events WHERE finding_id = $1 ORDER BY occurred_at ASC`,
      [finding.rows[0].id]
    )
    const row = finding.rows[0]
    const prov = (row.scoring_provenance && typeof row.scoring_provenance === 'object')
      ? row.scoring_provenance as Record<string, unknown>
      : {}
    const determination = typeof prov.determination === 'string' ? prov.determination : null
    const notEstablished = determination === 'FAIL' || determination === 'REVIEW'
      ? (typeof prov.not_established === 'string' ? prov.not_established : 'Nebula has not established that this condition caused conversion loss or that changing it will increase conversion rate.')
      : (typeof prov.not_established === 'string' ? prov.not_established : null)
    const payload = {
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
    const res = NextResponse.json({ finding: payload, history: events.rows })
    res.headers.set('Cache-Control', 'no-store')
    res.headers.set('X-Request-ID', ctx.requestId)
    return res
  } catch (err) {
    console.error('[finding GET]', err)
    return jsonError(500, 'Failed to load finding', 'FINDING_QUERY_FAILED', ctx.requestId)
  }
}
