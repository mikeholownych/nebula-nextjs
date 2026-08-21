import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://localhost:8001'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${PLATFORM_API}/api/gsc/inspect`, {
      method: 'POST',
      headers: { ...authHeaders(req), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25_000),
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Inspection failed' }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
