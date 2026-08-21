import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://127.0.0.1:8001'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${PLATFORM_API}/api/gsc/submit-index`, {
      method: 'POST',
      headers: { ...authHeaders(req), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Submission failed' }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
