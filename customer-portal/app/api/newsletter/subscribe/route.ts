import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_API = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

/**
 * Public newsletter signup bridge.
 * The browser talks to Next.js; the platform API owns persistence.
 */
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const upstream = await fetch(`${PLATFORM_API}/api/newsletter/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const payload = await upstream.json().catch(() => ({
      error: 'Invalid response from newsletter service',
    }))

    return NextResponse.json(payload, { status: upstream.status })
  } catch (error) {
    console.error('[Newsletter Subscribe API] upstream request failed:', error)
    return NextResponse.json(
      { error: 'Newsletter service unavailable' },
      { status: 502 },
    )
  }
}
