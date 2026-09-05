import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = (process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '')

export async function GET(request: NextRequest) {
  const projectDomain = new URL(request.url).searchParams.get('project_domain')
  const query = projectDomain ? `?project_domain=${encodeURIComponent(projectDomain)}` : ''
  const upstream = await fetch(`${PLATFORM_API}/api/ga4/status${query}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  const data = await upstream.json().catch(() => ({}))
  return NextResponse.json(data, { status: upstream.status })
}
