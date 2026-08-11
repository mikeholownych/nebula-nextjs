import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/app/lib/db'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'
import { generateAuditPDF, type AuditFinding } from '@/app/lib/audit-pdf'
import { verifyAuditUnlock } from '@/app/lib/audit-unlock-token'

/**
 * GET /api/audit/[id]/pdf
 *
 * Returns a PDF of the audit report.
 * Requires an active Pro/Growth/Agency subscription, OR the audit's unlock cookie.
 * Free users see a 403 with an upgrade prompt.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: auditId } = await params

  // Resolve requester identity - either workspace session or unlock cookie
  let email: string | null = null
  let planLabel: string | null = null

  // Try workspace session first
  const auth = await requireWorkspaceUser(request)
  if (!('response' in auth)) {
    email = auth.user.email
    // Ownership is required for every authenticated export, including paid users.
    // Subscription status controls entitlement; it must never replace resource authorization.
    try {
      const auditOwner = await pool.query(
        `SELECT email FROM audits WHERE id = $1 LIMIT 1`,
        [auditId],
      )
      if (!auditOwner.rows.length || auditOwner.rows[0].email?.trim().toLowerCase() !== email) {
        return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
      }

      const sub = await pool.query(
        `SELECT plan FROM subscriptions
         WHERE LOWER(email) = $1 AND status = 'active' AND livemode = TRUE
         ORDER BY created_at DESC LIMIT 1`,
        [email],
      )
      if (sub.rows.length > 0) {
        planLabel = sub.rows[0].plan.charAt(0).toUpperCase() + sub.rows[0].plan.slice(1)
      } else {
        // Authenticated but no subscription - check if they own the audit
        const auditRow = await pool.query(
          `SELECT email FROM audits WHERE id = $1 LIMIT 1`,
          [auditId],
        )
        if (!auditRow.rows.length || auditRow.rows[0].email?.toLowerCase() !== email) {
          return NextResponse.json(
            {
              error: 'PDF export requires an active Pro, Growth, or Agency subscription.',
              code: 'SUBSCRIPTION_REQUIRED',
              upgradeUrl: '/pricing',
            },
            { status: 403 },
          )
        }
        planLabel = 'Free'
      }
    } catch {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }
  } else {
    // No workspace session - check unlock cookie using the same token format as unlock/route.ts
    const unlockToken = request.cookies.get('nebula_audit_unlock')?.value
    if (unlockToken && verifyAuditUnlock(auditId, unlockToken)) {
      planLabel = 'Free (unlocked)'
    }
    if (!planLabel) {
      return NextResponse.json(
        { error: 'Authentication required to export PDF.', code: 'AUTH_REQUIRED' },
        { status: 401 },
      )
    }
  }

  // Fetch audit data via platform API (same as /api/audit/[id])
  let auditData: {
    url: string; score: number; grade: string
    findings: AuditFinding[]; created_at: string; email: string
  } | null = null

  const PLATFORM_API = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'
  try {
    const res = await fetch(`${PLATFORM_API}/audit/${auditId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15_000),
    })
    if (res.status === 404) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }
    if (!res.ok) {
      return NextResponse.json({ error: 'Audit service unavailable' }, { status: 503 })
    }
    auditData = await res.json()
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  if (!auditData) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
  }

  // Generate PDF
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generateAuditPDF({
      auditId,
      url: auditData.url,
      score: auditData.score ?? 0,
      grade: auditData.grade ?? 'N/A',
      findings: Array.isArray(auditData.findings) ? auditData.findings : [],
      createdAt: auditData.created_at,
      planLabel: planLabel ?? undefined,
    })
  } catch (err) {
    console.error('[PDF generation]', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }

  const filename = `nebula-audit-${auditId.slice(0, 8)}.pdf`
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
      'Cache-Control': 'private, no-cache',
    },
  })
}
