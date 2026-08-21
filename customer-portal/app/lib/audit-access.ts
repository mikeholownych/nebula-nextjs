import { NextRequest, NextResponse } from 'next/server'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'
import { verifyAuditUnlock } from '@/app/lib/audit-unlock-token'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

export const MAX_AUDIT_UNLOCK_COOKIES = 5

export function unlockCookieName(auditId: string): string {
  return `audit_unlock_${auditId}`
}

export function hasValidUnlockCookie(request: NextRequest, auditId: string): boolean {
  return verifyAuditUnlock(auditId, request.cookies.get(unlockCookieName(auditId))?.value)
}

/**
 * Prunes excess audit unlock cookies from the client by expiring older ones.
 * Keeps at most MAX_AUDIT_UNLOCK_COOKIES (including keepAuditId if provided).
 * Prevents HTTP 431 Request Header Fields Too Large from cookie accumulation.
 */
export function pruneExcessUnlockCookies(
  request: NextRequest,
  response: NextResponse,
  keepAuditId?: string,
): void {
  const unlockCookies: string[] = []
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith('audit_unlock_')) {
      const id = cookie.name.slice('audit_unlock_'.length)
      if (id !== keepAuditId) {
        unlockCookies.push(cookie.name)
      }
    }
  }

  const maxAllowedOther = keepAuditId ? MAX_AUDIT_UNLOCK_COOKIES - 1 : MAX_AUDIT_UNLOCK_COOKIES
  if (unlockCookies.length > maxAllowedOther) {
    const excess = unlockCookies.slice(0, unlockCookies.length - maxAllowedOther)
    for (const name of excess) {
      response.cookies.set(name, '', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 0,
        expires: new Date(0),
      })
    }
  }
}

/**
 * Sets an HMAC-signed audit unlock cookie and automatically evicts older
 * unlock cookies to keep the request header size strictly bounded.
 */
export function setAuditUnlockCookie(
  request: NextRequest,
  response: NextResponse,
  auditId: string,
  token: string,
): void {
  pruneExcessUnlockCookies(request, response, auditId)
  response.cookies.set(unlockCookieName(auditId), token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
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
