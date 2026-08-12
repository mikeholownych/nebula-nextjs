import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_API = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') ?? ''
  if (!token) {
    return NextResponse.json({ error: 'Confirmation token required' }, { status: 400 })
  }

  try {
    const upstream = await fetch(
      `${PLATFORM_API}/api/newsletter/confirm?token=${encodeURIComponent(token)}`,
      { cache: 'no-store', redirect: 'manual' },
    )

    if (upstream.status >= 300 && upstream.status < 400) {
      return NextResponse.redirect(upstream.headers.get('location') ?? '/newsletter')
    }

    const payload = await upstream.json().catch(() => ({
      error: 'Invalid response from newsletter service',
    }))
    return NextResponse.json(payload, { status: upstream.status })
  } catch (error) {
    console.error('[Newsletter Confirm API] upstream request failed:', error)
    return NextResponse.json(
      { error: 'Newsletter service unavailable' },
      { status: 502 },
    )
  }
}
