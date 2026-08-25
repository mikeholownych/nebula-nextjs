import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getAgencyOrg } from '@/lib/agency'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if ('response' in auth) return auth.response
  const agency = await getAgencyOrg(auth.user)
  if (!agency || !['owner', 'admin'].includes(agency.role)) {
    return NextResponse.json({ error: 'Agency admin access required' }, { status: 403 })
  }
  const contentType = request.nextUrl.searchParams.get('content_type') ?? ''
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const cookie = request.headers.get('cookie')
  const token = request.cookies.get('access_token')?.value
  if (cookie) headers.cookie = cookie
  if (token) headers.authorization = `Bearer ${token}`
  try {
    const response = await fetch(
      `${API_BASE}/api/organizations/${agency.organizationId}/brand/logo-upload-url?content_type=${encodeURIComponent(contentType)}`,
      { method: 'POST', headers, signal: AbortSignal.timeout(10000) }
    )
    return NextResponse.json(await response.json().catch(() => ({})), { status: response.status })
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 })
  }
}
