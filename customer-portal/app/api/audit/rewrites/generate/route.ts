import { NextRequest, NextResponse } from 'next/server'
import { authHeaders } from '@/app/lib/workspace-auth'

const PLATFORM_API = process.env.PLATFORM_API_URL || 'http://localhost:8001'

/**
 * POST /api/audit/rewrites/generate { audit_id, finding_key, share? }
 * Generate (or return the cached) AI rewrite for one finding.
 * The free-teaser paywall is enforced client-side; the upstream endpoint
 * returns any finding's rewrite for an authorized caller.
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
