import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export interface WorkspaceUser {
  id: string
  email: string
  name?: string | null
  picture?: string | null
}

export async function requireWorkspaceUser(
  request: NextRequest,
): Promise<{ user: WorkspaceUser } | { response: NextResponse }> {
  const cookie = request.headers.get('cookie')
  const authorization = request.headers.get('authorization')
  if (!cookie && !authorization) {
    return { response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) }
  }

  try {
    const upstream = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(authorization ? { authorization } : {}),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    })
    if (!upstream.ok) {
      return { response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) }
    }
    const user = await upstream.json() as WorkspaceUser
    if (!user.email) {
      return { response: NextResponse.json({ error: 'Authenticated email required' }, { status: 401 }) }
    }
    return { user: { ...user, email: user.email.trim().toLowerCase() } }
  } catch (error) {
    console.error('[workspace auth]', error)
    return { response: NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 }) }
  }
}

export function authHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {}
  const cookie = request.headers.get('cookie')
  const authorization = request.headers.get('authorization')
  if (cookie) headers.cookie = cookie
  if (authorization) headers.authorization = authorization
  return headers
}

export function ownershipError(message = 'Workspace ownership mismatch') {
  return NextResponse.json({ error: message }, { status: 403 })
}
