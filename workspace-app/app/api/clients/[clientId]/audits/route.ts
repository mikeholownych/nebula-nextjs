import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getAgencyOrg } from '@/lib/agency'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

type Params = { params: Promise<{ clientId: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { clientId } = await params
  const auth = await requireUser(request)
  if ('response' in auth) return auth.response
  const agency = await getAgencyOrg(auth.user)
  if (!agency) return NextResponse.json({ error: 'Not an agency' }, { status: 403 })
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const cookie = request.headers.get('cookie')
  const token = request.cookies.get('access_token')?.value
  if (cookie) headers.cookie = cookie
  if (token) headers.authorization = `Bearer ${token}`
  const limit = request.nextUrl.searchParams.get('limit') ?? '20'
  try {
    const res = await fetch(
      `${API_BASE}/api/organizations/${agency.organizationId}/clients/${encodeURIComponent(clientId)}/audits?limit=${encodeURIComponent(limit)}`,
      { headers, signal: AbortSignal.timeout(10000) }
    )
    return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}
