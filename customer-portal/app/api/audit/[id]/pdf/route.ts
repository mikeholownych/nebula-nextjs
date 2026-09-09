import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/app/lib/db'
import { authHeaders, requireWorkspaceUser } from '@/app/lib/workspace-auth'
import { generateAuditPDF, type AuditFinding } from '@/app/lib/audit-pdf'
import { verifyAuditUnlock } from '@/app/lib/audit-unlock-token'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://127.0.0.1:8001'
const INTERNAL_SECRET = (process.env.INTERNAL_API_SECRET || '').trim()

/**
 * GET /api/audit/[id]/pdf
 *
 * Returns a PDF of the audit report.
 * Supports:
 *   1. Share token query parameter (?share=<token>)
 *   2. Unlock cookie (audit_unlock_${id}) or unlock query parameter (?unlock=<token>)
 *   3. Authenticated workspace user (active subscription or audit owner)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: auditId } = await params
  const shareToken = request.nextUrl.searchParams.get('share')
  const unlockParam = request.nextUrl.searchParams.get('unlock')
  const unlockToken = request.cookies.get(`audit_unlock_${auditId}`)?.value

  let authorized = false
  let planLabel: string | null = null

  // 1. Share token verification
  if (shareToken && /^[\w-]{10,64}$/.test(shareToken)) {
    authorized = true
    planLabel = 'Shared'
  }

  // 2. Unlock token verification (HMAC signed cookie or parameter)
  if (!authorized) {
    const candidateUnlock = unlockToken || unlockParam
    if (candidateUnlock && verifyAuditUnlock(auditId, candidateUnlock)) {
      authorized = true
      planLabel = 'Free (unlocked)'
    }
  }

  // 3. Workspace session verification
  if (!authorized) {
    const auth = await requireWorkspaceUser(request)
    if (!('response' in auth)) {
      const email = auth.user.email
      try {
        const auditOwner = await pool.query(
          `SELECT email FROM audits WHERE id = $1 LIMIT 1`,
          [auditId],
        )
        if (auditOwner.rows.length && auditOwner.rows[0].email?.trim().toLowerCase() === email) {
          authorized = true
          const sub = await pool.query(
            `SELECT plan FROM subscriptions
             WHERE LOWER(email) = $1 AND status = 'active' AND livemode = TRUE
             ORDER BY created_at DESC LIMIT 1`,
            [email],
          )
          if (sub.rows.length > 0) {
            planLabel = sub.rows[0].plan.charAt(0).toUpperCase() + sub.rows[0].plan.slice(1)
          } else {
            planLabel = 'Free (owner)'
          }
        } else if (!auditOwner.rows.length) {
          return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
        }
      } catch {
        return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
      }
    }
  }

  if (!authorized) {
    return NextResponse.json(
      { error: 'Authentication required to export PDF.', code: 'AUTH_REQUIRED' },
      { status: 401 },
    )
  }

  // Stream canonical ReportLab PDF from platform API when available
  try {
    const query = new URLSearchParams({ audit_id: auditId })
    if (shareToken) query.set('share', shareToken)
    const headers = authHeaders(request)
    if (INTERNAL_SECRET) {
      headers.authorization = `Bearer ${INTERNAL_SECRET}`
    }
    const res = await fetch(`${PLATFORM_API}/api/report/pdf?${query.toString()}`, {
      headers,
      cache: 'no-store',
    })

    if (res.ok) {
      return new NextResponse(res.body, {
        status: 200,
        headers: {
          'Content-Type': res.headers.get('content-type') || 'application/pdf',
          'Content-Disposition': res.headers.get('content-disposition') || `attachment; filename="nebula-audit-${auditId.slice(0, 8)}.pdf"`,
        },
      })
    }
  } catch (err) {
    console.warn('[PDF proxy fallback]', err)
  }

  // Fallback to local PDFKit generation if upstream is unavailable
  let auditData: {
    url: string; score: number; grade: string
    findings: AuditFinding[]; created_at: string; email: string
  } | null = null

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
