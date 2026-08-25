import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getAgencyOrg } from '@/lib/agency'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function forwardHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const cookie = request.headers.get('cookie')
  const token = request.cookies.get('access_token')?.value
  if (cookie) headers.cookie = cookie
  if (token) headers.authorization = `Bearer ${token}`
  return headers
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if ('response' in auth) return auth.response

  const agency = await getAgencyOrg(auth.user)
  if (!agency) {
    return NextResponse.json({ error: 'No agency organization found' }, { status: 403 })
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/organizations/${agency.organizationId}/clients`,
      { headers: forwardHeaders(request), signal: AbortSignal.timeout(10000) }
    )
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if ('response' in auth) return auth.response

  const agency = await getAgencyOrg(auth.user)
  if (!agency) {
    return NextResponse.json({ error: 'No agency organization found' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/organizations/${agency.organizationId}/clients`,
      {
        method: 'POST',
        headers: forwardHeaders(request),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      }
    )
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}
