import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if ('response' in auth) return auth.response

  let body: { token?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const token = body.token
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'token is required' }, { status: 400 })
  }

  const cookie = request.headers.get('cookie')
  const accessToken = request.cookies.get('access_token')?.value
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (cookie) headers.cookie = cookie
  if (accessToken) headers.authorization = `Bearer ${accessToken}`

  try {
    const res = await fetch(
      `${API_BASE}/api/clients/invite/accept?token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(10000),
      }
    )
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}
