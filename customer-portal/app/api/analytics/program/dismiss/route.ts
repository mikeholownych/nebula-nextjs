import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser, authHeaders } from '@/app/lib/workspace-auth'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { authorization: `Bearer ${secret}` } : {}
}

/**
 * Dismiss a program step. POST /api/analytics/program/dismiss { stepId }
 *
 * Owner gating happens upstream: the step's program must belong to the
 * session email. Headers follow the monitors-engine pattern (authHeaders
 * spread first, internal bearer last for the lowercase `authorization`
 * collision rule).
 */
export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response

  let body: { stepId?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const stepId = typeof body.stepId === 'string' ? body.stepId.trim() : ''
  if (!stepId || !/^[0-9a-fA-F-]{36}$/.test(stepId)) {
    return NextResponse.json({ error: 'Valid stepId required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `${API_BASE}/audit/analytics/program/steps/${encodeURIComponent(stepId)}/dismiss`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(request), ...internalHeaders() },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(10000),
      }
    )

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('Program step dismiss proxy error:', error)
    return NextResponse.json({ error: 'Dismiss failed' }, { status: 502 })
  }
}
