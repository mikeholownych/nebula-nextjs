import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = (process.env.PLATFORM_API_URL || 'http://127.0.0.1:8001').replace(/\/$/, '')

export async function POST(req: NextRequest) {
  const body = await req.text()
  const res = await fetch(`${PLATFORM_API}/api/gsc/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(req) },
    body,
    signal: AbortSignal.timeout(10_000),
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
