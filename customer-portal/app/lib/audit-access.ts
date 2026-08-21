import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'
import { verifyAuditUnlock } from '@/app/lib/audit-unlock-token'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export function unlockCookieName(auditId: string): string {
  return `audit_unlock_${auditId}`
}

export function hasValidUnlockCookie(request: NextRequest, auditId: string): boolean {
  return verifyAuditUnlock(auditId, request.cookies.get(unlockCookieName(auditId))?.value)
}

export async function requireUnlockCookieOrSession(
  request: NextRequest,
  auditId?: string,
): Promise<{ via: 'cookie' | 'session'; email?: string } | { response: NextResponse }> {
  if (auditId && hasValidUnlockCookie(request, auditId)) {
    return { via: 'cookie' }
  }

  const cookie = request.headers.get('cookie')
  const authorization = request.headers.get('authorization')
  if (!cookie && !authorization) {
    return { response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) }
  }

  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth
  return { via: 'session', email: auth.user.email }
}

export async function requireUnlockCookieOrOwner(
  request: NextRequest,
  auditId: string,
  mismatchStatus: 403 | 404 = 403,
): Promise<{ via: 'cookie' | 'session'; email?: string } | { response: NextResponse }> {
  const access = await requireUnlockCookieOrSession(request, auditId)
  if ('response' in access) return access
  if (access.via === 'cookie') return access

  try {
    const res = await fetch(`${API_BASE}/audit/${auditId}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      return { response: NextResponse.json({ error: 'Audit not found' }, { status: 404 }) }
    }
    const data = await res.json() as { email?: string }
    const owner = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
    if (!owner || owner !== access.email) {
      const message = mismatchStatus === 404 ? 'Audit not found' : 'Forbidden'
      return { response: NextResponse.json({ error: message }, { status: mismatchStatus }) }
    }
    return access
  } catch {
    return { response: NextResponse.json({ error: 'Audit service unavailable' }, { status: 503 }) }
  }
}
