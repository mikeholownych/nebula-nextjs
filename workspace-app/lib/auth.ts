/**
 * Auth: delegates identity to platform_api /api/auth/me (same session cookie,
 * Redis-backed revocation). Tenant authorization is resolved server-side from
 * memberships - never from client-supplied org ids.
 */

import { NextRequest, NextResponse } from 'next/server'
import { platformPool } from './platform-db'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export interface WorkspaceUser {
  id: string
  email: string
  workspace_email?: string | null
  name?: string | null
  picture?: string | null
  org_id?: string | null
}

export type AuthResult =
  | { user: WorkspaceUser; response?: undefined }
  | { user?: undefined; response: NextResponse }

export async function requireUser(request: NextRequest): Promise<AuthResult> {
  const cookie = request.headers.get('cookie')
  const authorization = request.headers.get('authorization')
  const token = request.cookies.get('access_token')?.value

  if (!cookie && !authorization && !token) {
    return {
      response: jsonError(401, 'Authentication required', 'AUTH_REQUIRED'),
    }
  }

  const forwardHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
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
      return { response: jsonError(401, 'Authentication required', 'AUTH_REQUIRED') }
    }
    const user = (await upstream.json()) as WorkspaceUser
    if (!user?.email) {
      return { response: jsonError(401, 'Authenticated email required', 'AUTH_REQUIRED') }
    }
    const normalizedEmail = user.email.trim().toLowerCase()
    let workspaceEmail: string | null = null
    try {
      const binding = await platformPool.query(
        `SELECT client_email
         FROM agency_clients
         WHERE invited_user_id = $1
           AND status = 'active'
         ORDER BY updated_at DESC
         LIMIT 1`,
        [user.id]
      )
      workspaceEmail = binding.rows[0]?.client_email?.trim().toLowerCase() ?? null
    } catch (error) {
      console.error('[workspace-app client binding]', error)
    }
    return {
      user: { ...user, email: normalizedEmail, workspace_email: workspaceEmail },
    }
  } catch (error) {
    console.error('[workspace-app auth]', error)
    return { response: jsonError(503, 'Authentication service unavailable', 'AUTH_SVC_DOWN') }
  }
}

export function jsonError(
  status: number,
  message: string,
  code?: string,
  requestId?: string
): NextResponse {
  const body: Record<string, unknown> = { error: message }
  if (code) body.code = code
  if (requestId) body.request_id = requestId
  const res = NextResponse.json(body, { status })
  res.headers.set('Cache-Control', 'no-store')
  return res
}
