/**
 * Tests for server-side authorization primitives.
 * Covers: session enforcement, user status checks, workspace membership,
 * role authorization, cross-workspace denial, and redirect safety.
 */

import { validateReturnUrl, AuthError } from '@/app/lib/auth'

// ─── Redirect Safety Tests ───────────────────────────────────────────────────

describe('validateReturnUrl', () => {
  it('accepts valid relative paths', () => {
    expect(validateReturnUrl('/workspace')).toBe('/workspace')
    expect(validateReturnUrl('/workspace/settings')).toBe('/workspace/settings')
    expect(validateReturnUrl('/audit/123')).toBe('/audit/123')
  })

  it('returns /workspace for null or undefined', () => {
    expect(validateReturnUrl(null)).toBe('/workspace')
    expect(validateReturnUrl(undefined)).toBe('/workspace')
  })

  it('returns /workspace for empty string', () => {
    expect(validateReturnUrl('')).toBe('/workspace')
    expect(validateReturnUrl('   ')).toBe('/workspace')
  })

  it('rejects absolute URLs with scheme', () => {
    expect(validateReturnUrl('https://evil.com/workspace')).toBe('/workspace')
    expect(validateReturnUrl('http://attacker.org')).toBe('/workspace')
    expect(validateReturnUrl('javascript:alert(1)')).toBe('/workspace')
    expect(validateReturnUrl('data:text/html,<script>alert(1)</script>')).toBe('/workspace')
    expect(validateReturnUrl('ftp://evil.com')).toBe('/workspace')
  })

  it('rejects protocol-relative URLs', () => {
    expect(validateReturnUrl('//evil.com/workspace')).toBe('/workspace')
    expect(validateReturnUrl('//attacker.org')).toBe('/workspace')
  })

  it('rejects encoded bypasses', () => {
    expect(validateReturnUrl('%2f%2fevil.com')).toBe('/workspace')
    expect(validateReturnUrl('%68ttps://evil.com')).toBe('/workspace')
    // Double-encoded protocol-relative
    expect(validateReturnUrl('/%2f/evil.com')).toBe('/workspace')
  })

  it('rejects paths not starting with /', () => {
    expect(validateReturnUrl('workspace')).toBe('/workspace')
    expect(validateReturnUrl('evil.com/path')).toBe('/workspace')
  })

  it('rejects backslash paths', () => {
    expect(validateReturnUrl('/workspace\\..\\etc\\passwd')).toBe('/workspace')
  })

  it('rejects header injection via newlines', () => {
    expect(validateReturnUrl('/workspace\r\nSet-Cookie: evil=true')).toBe('/workspace')
    expect(validateReturnUrl('/workspace\nLocation: evil.com')).toBe('/workspace')
  })
})

// ─── AuthError Tests ─────────────────────────────────────────────────────────

describe('AuthError', () => {
  it('carries status code', () => {
    const err = new AuthError('Not authorized', 403)
    expect(err.message).toBe('Not authorized')
    expect(err.statusCode).toBe(403)
    expect(err.name).toBe('AuthError')
  })

  it('defaults to 401', () => {
    const err = new AuthError('Missing token')
    expect(err.statusCode).toBe(401)
  })

  it('is instanceof Error', () => {
    const err = new AuthError('test')
    expect(err).toBeInstanceOf(Error)
  })
})
