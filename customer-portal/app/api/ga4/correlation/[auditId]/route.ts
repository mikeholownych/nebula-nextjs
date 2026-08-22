import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PLATFORM_API = (process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auditId: string }> },
) {
  const { auditId } = await params
  if (!UUID_RE.test(auditId)) {
    return NextResponse.json({ error: 'Invalid audit id' }, { status: 400 })
  }
  const upstream = await fetch(`${PLATFORM_API}/api/ga4/correlation/${auditId}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  })
  const data = await upstream.json().catch(() => ({}))
  return NextResponse.json(data, { status: upstream.status })
}
