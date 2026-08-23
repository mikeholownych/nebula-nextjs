import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser, authHeaders } from '@/app/lib/workspace-auth'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { authorization: `Bearer ${secret}` } : {}
}

/**
 * Create a platform-engine monitor for the signed-in workspace.
 * POST /api/monitors-engine/create  { url, cadence }
 *
 * Session email is resolved server-side and forwarded as the explicit
 * upstream body field. Success returns {created:true}. Plan denials pass
 * through verbatim with their upstream status: 403 -> {detail:{message,
 * upgrade_url}}, 429 -> {detail:{message, limit}}.
 */
export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response

  let body: { url?: unknown; cadence?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const url = typeof body.url === 'string' ? body.url.trim() : ''
  const cadence = body.cadence === 'monthly' ? 'monthly' : 'weekly'
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return NextResponse.json({ error: 'Valid URL required' }, { status: 400 })
  }

  try {
    const response = await fetch(`${API_BASE}/audit/monitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(request), ...internalHeaders() },
      body: JSON.stringify({ email: auth.user.email, url, cadence }),
      signal: AbortSignal.timeout(15000),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json({ created: true })
  } catch (error) {
    console.error('Monitors engine create error:', error)
    return NextResponse.json(
      { error: 'Failed to add monitor' },
      { status: 502 }
    )
  }
}
