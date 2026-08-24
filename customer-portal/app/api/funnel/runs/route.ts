import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser, authHeaders } from '@/app/lib/workspace-auth'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { authorization: `Bearer ${secret}` } : {}
}

/**
 * Start a funnel run for one of my domains. POST /api/funnel/runs { domain }
 *
 * Session identity is authoritative; the email is resolved server-side and
 * never accepted from the client body. Denials pass through verbatim with
 * their upstream status: 403 -> {detail:{message, upgrade_url}} (teaser
 * already used), 429 -> {detail:{message, limit}}, 409 -> run already
 * active. Discovery failure still answers 200 upstream as a failed run.
 */
export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response

  let body: { domain?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const domain = typeof body.domain === 'string' ? body.domain.trim() : ''
  if (!domain || domain.length < 4 || domain.length > 255) {
    return NextResponse.json({ error: 'Valid domain required (e.g. example.com)' }, { status: 400 })
  }

  try {
    const response = await fetch(`${API_BASE}/audit/funnel/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(request), ...internalHeaders() },
      body: JSON.stringify({ domain }),
      signal: AbortSignal.timeout(30000),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('Funnel run create proxy error:', error)
    return NextResponse.json({ error: 'Failed to start funnel run' }, { status: 502 })
  }
}
