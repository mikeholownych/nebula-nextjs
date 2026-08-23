import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser, authHeaders } from '@/app/lib/workspace-auth'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function internalHeaders(): Record<string, string> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  return secret ? { authorization: `Bearer ${secret}` } : {}
}

/**
 * Per-monitor actions backed by the platform engine.
 * PATCH /api/monitors-engine/[id]  { cadence?, active? }
 * DELETE /api/monitors-engine/[id]
 *
 * Ownership and plan gates are enforced upstream by the platform's
 * tenant-bound principal; this proxy only forwards the session. Denial
 * payloads pass through verbatim with their upstream status.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  const { id } = await params

  let body: { cadence?: unknown; active?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const payload: { cadence?: string; active?: boolean } = {}
  if (body.cadence === 'weekly' || body.cadence === 'monthly') payload.cadence = body.cadence
  if (typeof body.active === 'boolean') payload.active = body.active
  if (!('cadence' in payload) && !('active' in payload)) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  try {
    const response = await fetch(`${API_BASE}/audit/monitors/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders(request), ...internalHeaders() },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('Monitors engine update error:', error)
    return NextResponse.json(
      { error: 'Failed to update monitor' },
      { status: 502 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  const { id } = await params

  try {
    const response = await fetch(`${API_BASE}/audit/monitors/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders(request), ...internalHeaders() },
      signal: AbortSignal.timeout(10000),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('Monitors engine delete error:', error)
    return NextResponse.json(
      { error: 'Failed to remove monitor' },
      { status: 502 }
    )
  }
}
