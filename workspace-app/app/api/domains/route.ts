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

async function agency(request: NextRequest) {
  const auth = await requireUser(request)
  if ('response' in auth) return { response: auth.response }
  const org = await getAgencyOrg(auth.user)
  if (!org || !['owner', 'admin'].includes(org.role)) {
    return { response: NextResponse.json({ error: 'Agency admin access required' }, { status: 403 }) }
  }
  return { org }
}

export async function GET(request: NextRequest) {
  const result = await agency(request)
  if (result.response) return result.response
  try {
    const upstream = await fetch(`${API_BASE}/api/organizations/${result.org!.organizationId}/domains`, { headers: forwardHeaders(request), signal: AbortSignal.timeout(10000) })
    return NextResponse.json(await upstream.json().catch(() => ({})), { status: upstream.status })
  } catch { return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 }) }
}

export async function POST(request: NextRequest) {
  const result = await agency(request)
  if (result.response) return result.response
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  try {
    const upstream = await fetch(`${API_BASE}/api/organizations/${result.org!.organizationId}/domains`, { method: 'POST', headers: forwardHeaders(request), body: JSON.stringify(body), signal: AbortSignal.timeout(15000) })
    return NextResponse.json(await upstream.json().catch(() => ({})), { status: upstream.status })
  } catch { return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 }) }
}
