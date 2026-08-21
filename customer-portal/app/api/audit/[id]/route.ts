import { NextRequest, NextResponse } from 'next/server'
import { hasValidUnlockCookie, requireUnlockCookieOrSession } from '@/app/lib/audit-access'

/**
 * Fetch audit by ID from database
 * GET /api/audit/[id]
 *
 * HMAC unlock cookie holders and the owning workspace session may read
 * the report JSON. Unauthenticated callers without a cookie get 401.
 * A logged-in user who does not own the audit gets 404.
 */

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieUnlocked = hasValidUnlockCookie(request, id)
    let sessionEmail: string | undefined
    if (!cookieUnlocked) {
      const access = await requireUnlockCookieOrSession(request, id)
      if ('response' in access) return access.response
      sessionEmail = access.email
    }

    const response = await fetch(`${API_BASE}/audit/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000)
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Audit not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch audit' },
        { status: 500 }
      )
    }
    
    const data = await response.json()
    if (sessionEmail) {
      const owner = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
      if (!owner || owner !== sessionEmail) {
        return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
      }
    }
    
    return NextResponse.json({
      audit_id: data.audit_id,
      url: data.url,
      status: data.status,
      score: data.score, // Already converted to float by FastAPI
      grade: data.grade,
      composite: data.composite ?? undefined,
      composite_anchor: data.composite_anchor ?? undefined,
      findings: data.findings || [],
      email: data.email,
      name: data.name,
      created_at: data.created_at,
      completed_at: data.completed_at
    })
  } catch (error) {
    console.error('Audit fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
