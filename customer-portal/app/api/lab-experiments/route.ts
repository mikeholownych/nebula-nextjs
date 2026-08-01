import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

/**
 * Lab experiments (Component Lab History)
 * GET /api/lab-experiments?email=...   → list saved experiments
 * POST /api/lab-experiments            → save a lab run
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email') || ''
    if (!email || email.length < 3 || email.length > 320) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const response = await fetch(
      `${API_BASE}/audit/lab-experiments?email=${encodeURIComponent(email)}`,
      { signal: AbortSignal.timeout(10000) }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to load experiments' },
        { status: response.status }
      )
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Lab experiments list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const { email, url, label, score, grade, components, adCopy } = body
    if (!email || !url || !label || typeof score !== 'number') {
      return NextResponse.json({ error: 'email, url, label, and score required' }, { status: 400 })
    }

    const response = await fetch(`${API_BASE}/audit/lab-experiments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, url, label, score, grade, components, adCopy }),
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      return NextResponse.json(
        { error: data?.message || 'Failed to save experiment' },
        { status: response.status }
      )
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Lab experiment create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
