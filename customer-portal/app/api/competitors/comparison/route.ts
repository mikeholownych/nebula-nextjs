import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://127.0.0.1:8001'

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${PLATFORM_API}/api/competitors/comparison`, {
      headers: authHeaders(req),
      cache: 'no-store',
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Comparison unavailable' }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Competitor service unavailable' }, { status: 503 })
  }
}
