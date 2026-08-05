import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://localhost:8001'

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${PLATFORM_API}/api/competitors/`, {
      headers: authHeaders(req),
      cache: 'no-store',
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Competitors unavailable' }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Competitor service unavailable' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${PLATFORM_API}/api/competitors/`, {
      method: 'POST',
      headers: { ...authHeaders(req), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to add competitor' }))
      return NextResponse.json(err, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Competitor service unavailable' }, { status: 503 })
  }
}
