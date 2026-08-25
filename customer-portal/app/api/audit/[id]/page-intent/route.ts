import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser, authHeaders } from '@/app/lib/workspace-auth'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { authorization: `Bearer ${secret}` } : {}
}

/**
 * Override the page intent for an audit (and all audits for the same URL + owner).
 * PATCH /api/audit/[id]/page-intent { page_intent: string }
 *
 * Auth: workspace session required. Internal bearer spread last so it wins
 * the lowercase `authorization` key collision.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response

  const { id } = await params
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid audit ID' }, { status: 400 })
  }

  let body: { page_intent?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.page_intent !== 'string' || !body.page_intent.trim()) {
    return NextResponse.json({ error: 'page_intent string required' }, { status: 400 })
  }

  try {
    const response = await fetch(`${API_BASE}/audit/${encodeURIComponent(id)}/page-intent`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(request),
        ...internalHeaders(),
      },
      body: JSON.stringify({ page_intent: body.page_intent }),
      signal: AbortSignal.timeout(10000),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('Page intent override proxy error:', error)
    return NextResponse.json({ error: 'Override failed' }, { status: 502 })
  }
}
