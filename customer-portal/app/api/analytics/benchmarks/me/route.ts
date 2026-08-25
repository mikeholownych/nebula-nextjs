import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser, authHeaders } from '@/app/lib/workspace-auth'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { authorization: `Bearer ${secret}` } : {}
}

/**
 * Personal percentile position against the corpus for one of my domains.
 * GET /api/analytics/benchmarks/me?domain=
 *
 * Gated upstream by plan analytics_depth; free plans receive a 403 with an
 * upgrade detail which this proxy passes through verbatim so the UI can
 * render depth-aware upsell copy.
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
      `${API_BASE}/audit/analytics/benchmarks/me?domain=${encodeURIComponent(domain)}`,
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
    console.error('Benchmarks personal proxy error:', error)
    return NextResponse.json({ error: 'Positioning unavailable' }, { status: 502 })
  }
}
