/**
 * GET /api/auth/me
 *
 * Identity for the workspace shell. Delegates to the platform API /api/auth/me
 * (same session cookie, Redis-backed).
 *
 * Response shape is the LEGACY flat form {id, email, name, ...}: the ported
 * WorkspaceClient reads user.email at the top level. Do not nest under "user".
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.response) return auth.response
  const user = auth.user

  const res = NextResponse.json({
    id: user.id,
    email: user.email,
    workspace_email: user.workspace_email ?? null,
    name: user.name ?? null,
  })
  res.headers.set('Cache-Control', 'no-store')
  return res
}
