import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://localhost:8001'

/**
 * GET /api/audit/rewrites?audit_id=<id>[&share=<token>]
 * List stored AI rewrites for an audit. Access is enforced upstream:
 * either a valid share token or the owner's session cookie.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const auditId = searchParams.get('audit_id')
    const share = searchParams.get('share')

    if (!auditId) {
      return NextResponse.json({ error: 'audit_id param required' }, { status: 400 })
    }

    const upstream = new URL(`${PLATFORM_API}/api/audit/rewrites/`)
    upstream.searchParams.set('audit_id', auditId)
    if (share) upstream.searchParams.set('share', share)

    const res = await fetch(upstream.toString(), {
      headers: authHeaders(req),
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({ error: 'Rewrites unavailable' }))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Rewrite service unavailable' }, { status: 503 })
  }
}

/**
 * POST /api/audit/rewrites { audit_id, finding_key, share? }
 * Convenience alias - generates (or returns the cached) rewrite for one
 * finding. Canonical path is /api/audit/rewrites/generate.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body?.audit_id || !body?.finding_key) {
      return NextResponse.json(
        { error: 'audit_id and finding_key required' },
        { status: 400 },
      )
    }

    const res = await fetch(`${PLATFORM_API}/api/audit/rewrites/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(req) },
      body: JSON.stringify({
        audit_id: body.audit_id,
        finding_key: body.finding_key,
        share: body.share ?? null,
      }),
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({ error: 'Rewrite generation failed' }))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Rewrite service unavailable' }, { status: 503 })
  }
}
