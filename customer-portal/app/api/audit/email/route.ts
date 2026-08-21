import { NextRequest, NextResponse } from 'next/server'
import { requireUnlockCookieOrOwner } from '@/app/lib/audit-access'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Resend stored audit results. Unlock/claim is POST /api/audit/unlock.
 * POST /api/audit/email
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const auditId = typeof body.auditId === 'string'
      ? body.auditId
      : typeof body.audit_id === 'string'
        ? body.audit_id
        : ''
    if (!UUID_RE.test(auditId)) {
      return NextResponse.json({ error: 'audit_id required' }, { status: 400 })
    }
    const access = await requireUnlockCookieOrOwner(request, auditId, 403)
    if ('response' in access) return access.response

    const auditRes = await fetch(`${API_BASE}/audit/${auditId}`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!auditRes.ok) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }
    const audit = await auditRes.json() as {
      url?: string
      email?: string
      name?: string | null
      score?: number
      grade?: string
      findings?: unknown
    }
    const owner = typeof audit.email === 'string' ? audit.email.trim().toLowerCase() : ''
    if (!owner || !audit.url) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    const response = await fetch(`${API_BASE}/audit/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: audit.url,
        email: owner,
        name: typeof audit.name === 'string' ? audit.name : null,
        score: audit.score,
        grade: audit.grade,
        findings: Array.isArray(audit.findings) ? audit.findings : [],
      }),
      signal: AbortSignal.timeout(15_000),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { status: 'error', error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
