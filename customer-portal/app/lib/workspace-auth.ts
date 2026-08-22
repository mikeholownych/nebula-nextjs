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
  const token = request.cookies.get('access_token')?.value
  const cookie = request.headers.get('cookie')
  const authorization = request.headers.get('authorization')
  if (!cookie && !authorization && !token) {
    return { response: NextResponse.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 }) }
  }

  const forwardHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (cookie) forwardHeaders.cookie = cookie
  else if (token) forwardHeaders.cookie = `access_token=${token}`

  if (authorization) forwardHeaders.authorization = authorization
  else if (token) forwardHeaders.authorization = `Bearer ${token}`

  try {
    const upstream = await fetch(`${API_BASE}/api/auth/me`, {
      headers: forwardHeaders,
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    })
    if (!upstream.ok) {
      return { response: NextResponse.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 }) }
    }
    const user = await upstream.json() as WorkspaceUser
    if (!user.email) {
      return { response: NextResponse.json({ error: 'Authenticated email required', code: 'AUTH_REQUIRED' }, { status: 401 }) }
    }
    return { user: { ...user, email: user.email.trim().toLowerCase() } }
  } catch (error) {
    console.error('[workspace auth]', error)
    return { response: NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 }) }
  }
}

export function authHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = request.cookies.get('access_token')?.value
  const cookie = request.headers.get('cookie')
  const authorization = request.headers.get('authorization')
  if (cookie) headers.cookie = cookie
  else if (token) headers.cookie = `access_token=${token}`
  if (authorization) headers.authorization = authorization
  else if (token) headers.authorization = `Bearer ${token}`
  return headers
}

export function ownershipError(message = 'Workspace ownership mismatch') {
  return NextResponse.json({ error: message }, { status: 403 })
}
