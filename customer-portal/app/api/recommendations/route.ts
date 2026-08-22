import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'
import { authHeaders } from '@/app/lib/workspace-auth'

/**
 * Recommendation kanban for a workspace email
 * GET /api/recommendations?email=...  (syncs from latest audits, returns cards)
 */
export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  try {
    const email = auth.user.email
    if (!email || email.length < 3 || email.length > 320) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const response = await fetch(
      `${process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'}/audit/recommendations?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!response.ok) {
      const errData = await response.json().catch(() => null)
      return NextResponse.json(
        { error: errData?.detail || errData?.message || errData?.error || 'Failed to load recommendations' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Workspace recommendations error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
