import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'
import { authHeaders } from '@/app/lib/workspace-auth'

/**
 * Move a recommendation between kanban columns
 * PATCH /api/recommendations/[id]  { status: 'to_fix' | 'doing' | 'done' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  try {
    const { id } = await params
    let body: { status?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const status = body.status
    if (!status || !['to_fix', 'doing', 'done'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const response = await fetch(
      `${process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'}/audit/recommendations/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
        body: JSON.stringify({ status }),
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      return NextResponse.json(
        { error: data?.detail || data?.message || data?.error || 'Failed to update recommendation' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Recommendation update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
