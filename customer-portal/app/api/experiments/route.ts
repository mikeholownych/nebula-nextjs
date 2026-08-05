import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://localhost:8001'

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${PLATFORM_API}/api/experiments/`, {
      headers: authHeaders(req),
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json({ error: 'Failed to load experiments' }, { status: res.status })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${PLATFORM_API}/api/experiments/`, {
      method: 'POST',
      headers: { ...authHeaders(req), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err || 'Failed to create experiment' }, { status: res.status })
    }
    return NextResponse.json(await res.json(), { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
