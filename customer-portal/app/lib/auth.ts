import { cookies } from 'next/headers'

const API_BASE = process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  name?: string | null
  picture?: string | null
  status: 'active' | 'suspended' | 'disabled'
}

export interface WorkspaceMembership {
  id: string
  userId: string
  organizationId: string
  role: 'owner' | 'admin' | 'member'
  status: 'active' | 'suspended' | 'removed'
}

export interface AuthContext {
  user: AuthUser
  organizationId: string
  membership: WorkspaceMembership
}

export type MembershipRole = 'owner' | 'admin' | 'member'

// ─── Session / User Resolution ───────────────────────────────────────────────

/**
 * Get the current session token from cookies. Returns null if absent.
 * Server-only: uses next/headers cookies().
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('access_token')?.value ?? null
}

/**
 * Get the current authenticated user from the platform API.
 * Returns null if unauthenticated or session invalid.
 * Does NOT throw - use requireAuthenticatedUser() for enforcement.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionToken()
  if (!token) return null

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.id || !data.email) return null
    return {
      id: data.id,
      email: data.email.trim().toLowerCase(),
      name: data.name ?? null,
      picture: data.picture ?? null,
      status: data.status ?? 'active',
    }
  } catch {
    return null
  }
}

/**
 * Require an authenticated user. Throws AuthError if not authenticated.
 */
export async function requireAuthenticatedUser(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthError('Authentication required', 401)
  }
  return user
}

/**
 * Require an active (non-suspended, non-disabled) user.
 */
export async function requireActiveUser(): Promise<AuthUser> {
  const user = await requireAuthenticatedUser()
  if (user.status !== 'active') {
    throw new AuthError('Account suspended or disabled', 403)
  }
  return user
}

// ─── Workspace / Membership Authorization ────────────────────────────────────

/**
 * Get the user's membership in a specific organization.
 * Returns null if no membership exists.
 */
export async function getWorkspaceMembership(
  userId: string,
  organizationId: string
): Promise<WorkspaceMembership | null> {
  const token = await getSessionToken()
  if (!token) return null

  try {
    const res = await fetch(
      `${API_BASE}/api/organizations/${organizationId}/membership?user_id=${encodeURIComponent(userId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(5_000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return {
      id: data.id,
      userId: data.user_id,
      organizationId: data.organization_id,
      role: data.role,
      status: data.status ?? 'active',
    }
  } catch {
    return null
  }
}

/**
 * Require active membership in the user's workspace.
 * Resolves the user's primary organization from the JWT claims.
 */
export async function requireWorkspaceMembership(): Promise<AuthContext> {
  const user = await requireActiveUser()
  const token = await getSessionToken()
  if (!token) throw new AuthError('Authentication required', 401)

  // The platform API /auth/me returns org_id from the JWT claims
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) throw new AuthError('Session invalid', 401)
    const data = await res.json()
    const orgId = data.org_id

    if (!orgId) {
      throw new AuthError('No workspace access', 403)
    }

    const membership = await getWorkspaceMembership(user.id, orgId)
    if (!membership || membership.status !== 'active') {
      throw new AuthError('Workspace membership inactive or missing', 403)
    }

    return { user, organizationId: orgId, membership }
  } catch (e) {
    if (e instanceof AuthError) throw e
    throw new AuthError('Authorization check failed', 500)
  }
}

/**
 * Require a specific role (or higher) in the workspace.
 */
export async function requireWorkspaceRole(
  allowedRoles: MembershipRole[]
): Promise<AuthContext> {
  const ctx = await requireWorkspaceMembership()
  if (!allowedRoles.includes(ctx.membership.role)) {
    throw new AuthError('Insufficient permissions', 403)
  }
  return ctx
}

// ─── Resource Ownership ──────────────────────────────────────────────────────

/**
 * Assert that a resource belongs to the given organization.
 * Use this to prevent cross-workspace access via URL manipulation.
 * Returns 404 instead of 403 to prevent resource enumeration.
 */
export function assertResourceBelongsToWorkspace(
  resourceOrgId: string | null | undefined,
  expectedOrgId: string
): void {
  if (!resourceOrgId || resourceOrgId !== expectedOrgId) {
    throw new AuthError('Resource not found', 404)
  }
}

// ─── Redirect Safety ─────────────────────────────────────────────────────────

/**
 * Validate a post-login redirect URL.
 * Only allows same-origin relative paths. Rejects absolute URLs,
 * protocol-relative URLs, encoded bypasses, and alternate schemes.
 */
export function validateReturnUrl(url: string | null | undefined): string {
  const fallback = '/workspace'
  if (!url || typeof url !== 'string') return fallback

  const trimmed = url.trim()

  // Reject empty
  if (!trimmed) return fallback

  // Reject protocol-relative URLs (//evil.com)
  if (trimmed.startsWith('//')) return fallback

  // Reject absolute URLs with scheme
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return fallback

  // Reject encoded variants of the above
  try {
    const decoded = decodeURIComponent(trimmed)
    if (decoded.startsWith('//')) return fallback
    if (/^[a-z][a-z0-9+.-]*:/i.test(decoded)) return fallback
  } catch {
    return fallback
  }

  // Must start with /
  if (!trimmed.startsWith('/')) return fallback

  // Reject backslash (Windows path traversal)
  if (trimmed.includes('\\')) return fallback

  // Reject URLs containing newlines (header injection)
  if (/[\r\n]/.test(trimmed)) return fallback

  return trimmed
}

// ─── Error Class ─────────────────────────────────────────────────────────────

export class AuthError extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode: number = 401) {
    super(message)
    this.name = 'AuthError'
    this.statusCode = statusCode
  }
}
