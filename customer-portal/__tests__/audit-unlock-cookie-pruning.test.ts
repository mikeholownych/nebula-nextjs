/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import {
  MAX_AUDIT_UNLOCK_COOKIES,
  pruneExcessUnlockCookies,
  setAuditUnlockCookie,
  unlockCookieName,
} from '@/app/lib/audit-access'
import { signAuditUnlock } from '@/app/lib/audit-unlock-token'

describe('Audit Unlock Cookie Bounding & Pruning (HTTP 431 Prevention)', () => {
  beforeEach(() => {
    process.env.AUDIT_UNLOCK_SECRET = 'test-secret'
  })

  it('bounds total audit_unlock cookies to MAX_AUDIT_UNLOCK_COOKIES', () => {
    expect(MAX_AUDIT_UNLOCK_COOKIES).toBe(5)
  })

  it('prunes oldest excess unlock cookies when threshold is exceeded', () => {
    const cookieHeader = Array.from({ length: 10 }, (_, i) => `audit_unlock_audit-${i}=token-${i}`).join('; ')
    const request = new NextRequest('https://nebulacomponents.com/audit', {
      headers: { cookie: cookieHeader },
    })

    const response = NextResponse.next()
    pruneExcessUnlockCookies(request, response, 'audit-new')

    const setCookieHeaders = response.headers.getSetCookie()
    expect(setCookieHeaders.length).toBe(6)

    for (let i = 0; i <= 5; i++) {
      const expiredCookie = response.cookies.get(`audit_unlock_audit-${i}`)
      expect(expiredCookie).toBeDefined()
      expect(expiredCookie?.maxAge).toBe(0)
    }

    for (let i = 6; i <= 9; i++) {
      expect(response.cookies.get(`audit_unlock_audit-${i}`)).toBeUndefined()
    }
  })

  it('setAuditUnlockCookie evicts excess cookies and sets the new cookie', () => {
    const cookieHeader = Array.from({ length: 8 }, (_, i) => `audit_unlock_audit-${i}=token-${i}`).join('; ')
    const request = new NextRequest('https://nebulacomponents.com/api/audit/unlock', {
      headers: { cookie: cookieHeader },
    })

    const response = NextResponse.json({ status: 'ok' })
    const token = signAuditUnlock('audit-brand-new', 'test@example.com')
    setAuditUnlockCookie(request, response, 'audit-brand-new', token)

    const newCookie = response.cookies.get(unlockCookieName('audit-brand-new'))
    expect(newCookie?.value).toBe(token)
    expect(newCookie?.httpOnly).toBe(true)
    expect(newCookie?.path).toBe('/')
    expect(newCookie?.maxAge).toBe(60 * 60 * 24 * 30)

    expect(response.cookies.get('audit_unlock_audit-0')?.maxAge).toBe(0)
    expect(response.cookies.get('audit_unlock_audit-1')?.maxAge).toBe(0)
    expect(response.cookies.get('audit_unlock_audit-2')?.maxAge).toBe(0)
    expect(response.cookies.get('audit_unlock_audit-3')?.maxAge).toBe(0)

    expect(response.cookies.get('audit_unlock_audit-4')).toBeUndefined()
    expect(response.cookies.get('audit_unlock_audit-7')).toBeUndefined()
  })

  it('does not prune when cookie count is within the safe limit', () => {
    const cookieHeader = 'audit_unlock_audit-1=t1; audit_unlock_audit-2=t2'
    const request = new NextRequest('https://nebulacomponents.com/', {
      headers: { cookie: cookieHeader },
    })

    const response = NextResponse.next()
    pruneExcessUnlockCookies(request, response)

    expect(response.headers.getSetCookie().length).toBe(0)
  })
})
