import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'

const PLATFORM_API = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkspaceUser(request)
    if ('response' in auth) return auth.response

    let body: { recId?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { recId } = body
    if (!recId) {
      return NextResponse.json({ error: 'recId required' }, { status: 400 })
    }

    const response = await fetch(
      `${PLATFORM_API}/verify/recommendation/${encodeURIComponent(recId)}?email=${encodeURIComponent(auth.user.email)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      return NextResponse.json(
        { error: data?.detail || 'Verification failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Verify] POST failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
