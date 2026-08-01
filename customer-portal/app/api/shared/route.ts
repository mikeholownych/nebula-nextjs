import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') ?? ''
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })
  try {
    const upstream = await fetch(
      `${API_BASE}/audit/by-share-token?token=${encodeURIComponent(token)}`,
      { signal: AbortSignal.timeout(15_000) }
    )
    const data = await upstream.text()
    return new NextResponse(data, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
    })
  } catch (err) {
    console.error('[shared portal proxy]', err)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
