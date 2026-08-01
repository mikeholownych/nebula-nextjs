import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

/**
 * Monitoring watches
 * GET /api/monitors?email=...   list monitors + recent events
 * POST /api/monitors           create { email, url, cadence }
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email') || ''
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
  try {
    const res = await fetch(
      `${API_BASE}/audit/monitors?email=${encodeURIComponent(email)}`,
      { signal: AbortSignal.timeout(10_000) },
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.ok ? 200 : 502 })
  } catch {
    return NextResponse.json({ error: 'Monitor list failed' }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  try {
    const res = await fetch(`${API_BASE}/audit/monitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.ok ? 200 : res.status })
  } catch {
    return NextResponse.json({ error: 'Monitor create failed' }, { status: 502 })
  }
}
