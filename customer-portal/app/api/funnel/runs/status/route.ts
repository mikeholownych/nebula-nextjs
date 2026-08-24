import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser, authHeaders } from '@/app/lib/workspace-auth'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { authorization: `Bearer ${secret}` } : {}
}

/**
 * Latest funnel run for one of my domains with scorecard + pages summary.
 * GET /api/funnel/runs/status?domain=
 *
 * Session identity is authoritative; headers follow the monitors-engine
 * pattern (authHeaders spread first, internal bearer last). Upstream 404
 * means no run yet for the domain and passes through as {status:404}.
 */
export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response

  const domain = request.nextUrl.searchParams.get('domain')?.trim() ?? ''
  if (!domain) {
    return NextResponse.json({ error: 'domain query parameter required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `${API_BASE}/audit/funnel/runs?domain=${encodeURIComponent(domain)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...authHeaders(request), ...internalHeaders() },
        signal: AbortSignal.timeout(10000),
      }
    )

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('Funnel run status proxy error:', error)
    return NextResponse.json({ error: 'Funnel unavailable' }, { status: 502 })
  }
}
