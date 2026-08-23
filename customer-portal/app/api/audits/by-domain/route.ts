import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'
import { authHeaders } from '@/app/lib/workspace-auth'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

/**
 * Whole-domain audits for a claimed teardown (session email enforced server-side)
 * GET /api/audits/by-domain?domain=...
 */
export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  try {
    const email = auth.user.email
    if (!email || email.length < 3 || email.length > 320) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const domain = request.nextUrl.searchParams.get('domain')
    if (!domain) {
      return NextResponse.json({ error: 'Valid domain required' }, { status: 400 })
    }

    const response = await fetch(
      `${API_BASE}/audit/by-domain?domain=${encodeURIComponent(domain)}&email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...authHeaders(request) },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to load audits' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Workspace by-domain error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
