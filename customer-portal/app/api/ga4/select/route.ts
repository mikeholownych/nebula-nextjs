import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = (process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '')

export async function POST(request: NextRequest) {
  const body = await request.text()
  const upstream = await fetch(`${PLATFORM_API}/api/ga4/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
    body,
    signal: AbortSignal.timeout(10_000),
  })
  const data = await upstream.json().catch(() => ({}))
  return NextResponse.json(data, { status: upstream.status })
}
