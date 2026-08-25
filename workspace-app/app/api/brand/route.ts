import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getAgencyOrg } from '@/lib/agency'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

function headers(request: NextRequest): Record<string, string> {
  const result: Record<string, string> = { 'Content-Type': 'application/json' }
  const cookie = request.headers.get('cookie')
  const token = request.cookies.get('access_token')?.value
  if (cookie) result.cookie = cookie
  if (token) result.authorization = `Bearer ${token}`
  return result
}

async function agencyRequest(request: NextRequest, method: string) {
  const auth = await requireUser(request)
  if ('response' in auth) return auth.response
  const agency = await getAgencyOrg(auth.user)
  if (!agency || !['owner', 'admin'].includes(agency.role)) {
    return NextResponse.json({ error: 'Agency admin access required' }, { status: 403 })
  }
  let body: string | undefined
  if (method !== 'GET' && method !== 'DELETE') {
    try {
      body = JSON.stringify(await request.json())
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
  }
  try {
    const response = await fetch(
      `${API_BASE}/api/organizations/${agency.organizationId}/brand`,
      { method, headers: headers(request), body, signal: AbortSignal.timeout(10000) }
    )
    if (response.status === 204) return new NextResponse(null, { status: 204 })
    return NextResponse.json(await response.json().catch(() => ({})), { status: response.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}

export async function GET(request: NextRequest) { return agencyRequest(request, 'GET') }
export async function POST(request: NextRequest) { return agencyRequest(request, 'POST') }
export async function PATCH(request: NextRequest) { return agencyRequest(request, 'PATCH') }
export async function DELETE(request: NextRequest) { return agencyRequest(request, 'DELETE') }
