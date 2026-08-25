import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser, authHeaders } from '@/app/lib/workspace-auth'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { authorization: `Bearer ${secret}` } : {}
}

/**
 * Two-stage remediation roadmap for one of my domains.
 * GET /api/analytics/program?domain=
 *
 * Session identity is authoritative; email is resolved server-side via
 * requireWorkspaceUser and the session cookie is forwarded upstream.
 * Headers spread authHeaders first and the internal bearer LAST so the
 * lowercase `authorization` collision resolves to the internal secret
 * (phase 1 lesson); the forwarded cookie still wins principal resolution.
 * Plan denials pass through verbatim: 403 -> {detail:{message, upgrade_url}}.
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
      `${API_BASE}/audit/analytics/program?domain=${encodeURIComponent(domain)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...authHeaders(request), ...internalHeaders() },
        signal: AbortSignal.timeout(15000),
      }
    )

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('Analytics program proxy error:', error)
    return NextResponse.json({ error: 'Program unavailable' }, { status: 502 })
  }
}
