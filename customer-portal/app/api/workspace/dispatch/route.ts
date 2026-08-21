import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  const email = auth.user.email

  const period = request.nextUrl.searchParams.get('period') || '7'

  try {
    const res = await fetch(
      `${API_BASE}/dispatch/preview?email=${encodeURIComponent(email)}&period=${period}`,
      { signal: AbortSignal.timeout(10000) }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[Dispatch] preview failed:', err)
    return NextResponse.json({ error: 'Dispatch preview failed' }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  const email = auth.user.email

  const period = request.nextUrl.searchParams.get('period') || '7'

  try {
    const res = await fetch(
      `${API_BASE}/dispatch/send?email=${encodeURIComponent(email)}&period=${period}`,
      {
        method: 'POST',
        signal: AbortSignal.timeout(15000),
      }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[Dispatch] send failed:', err)
    return NextResponse.json({ error: 'Dispatch send failed' }, { status: 502 })
  }
}
