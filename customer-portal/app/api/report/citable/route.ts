import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'
import { hasValidUnlockCookie } from '@/app/lib/audit-access'
import { verifyAuditUnlock } from '@/app/lib/audit-unlock-token'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://127.0.0.1:8001'
const INTERNAL_SECRET = (process.env.INTERNAL_API_SECRET || '').trim()

/**
 * GET /api/report/citable?audit_id=<id>[&share=<token>][&format=<html|markdown>][&unlock=<token>]
 *
 * Proxy to the platform API's Citable executive brief report endpoint.
 * Forwards auth cookies / share token and pipes the HTML or Markdown body back.
 */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.search
  const auditId = req.nextUrl.searchParams.get('audit_id') || ''
  const unlockParam = req.nextUrl.searchParams.get('unlock')
  const isUnlocked = Boolean(
    (auditId && hasValidUnlockCookie(req, auditId)) ||
    (auditId && unlockParam && verifyAuditUnlock(auditId, unlockParam))
  )
  const headers = authHeaders(req)
  if (isUnlocked && INTERNAL_SECRET) {
    headers.authorization = `Bearer ${INTERNAL_SECRET}`
  }
  try {
    const res = await fetch(`${PLATFORM_API}/api/report/citable${query}`, {
      headers,
      cache: 'no-store',
    })

    if (!res.ok) {
      const body = await res.text()
      return new NextResponse(body, {
        status: res.status,
        headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
      })
    }

    return new NextResponse(res.body, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') || 'text/html; charset=utf-8',
        'content-disposition': res.headers.get('content-disposition') || 'inline',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Citable report service unavailable' }, { status: 503 })
  }
}
