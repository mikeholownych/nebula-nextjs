import { NextRequest, NextResponse } from 'next/server'

/**
 * Recommendation kanban for a workspace email
 * GET /api/recommendations?email=...  (syncs from latest audits, returns cards)
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email') || ''
    if (!email || email.length < 3 || email.length > 320) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const response = await fetch(
      `${process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'}/audit/recommendations?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to load recommendations' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Workspace recommendations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
