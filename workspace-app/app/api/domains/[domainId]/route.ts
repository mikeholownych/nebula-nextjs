import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getAgencyOrg } from '@/lib/agency'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'
type Params = { params: Promise<{ domainId: string }> }

function headers(request: NextRequest): Record<string, string> {
  const result: Record<string, string> = { 'Content-Type': 'application/json' }
  const cookie = request.headers.get('cookie'); const token = request.cookies.get('access_token')?.value
  if (cookie) result.cookie = cookie
  if (token) result.authorization = `Bearer ${token}`
  return result
}

async function run(request: NextRequest, domainId: string, action: 'verify' | 'delete') {
  const auth = await requireUser(request)
  if ('response' in auth) return auth.response
  const org = await getAgencyOrg(auth.user)
  if (!org || !['owner', 'admin'].includes(org.role)) return NextResponse.json({ error: 'Agency admin access required' }, { status: 403 })
  const upstream = await fetch(`${API_BASE}/api/organizations/${org.organizationId}/domains/${encodeURIComponent(domainId)}${action === 'verify' ? '/verify' : ''}`, { method: action === 'verify' ? 'POST' : 'DELETE', headers: headers(request), signal: AbortSignal.timeout(15000) })
  if (upstream.status === 204) return new NextResponse(null, { status: 204 })
  return NextResponse.json(await upstream.json().catch(() => ({})), { status: upstream.status })
}

export async function POST(request: NextRequest, { params }: Params) { return run(request, (await params).domainId, 'verify') }
export async function DELETE(request: NextRequest, { params }: Params) { return run(request, (await params).domainId, 'delete') }
