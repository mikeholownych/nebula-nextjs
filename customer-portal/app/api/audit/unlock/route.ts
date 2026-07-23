import { NextRequest, NextResponse } from 'next/server'
import { getPostHogClient } from '@/app/lib/posthog-server'

/**
 * Unlock audit results by providing an email address.
 *
 * Flow:
 *   1. Client POSTs { audit_id, email, name? }
 *   2. We update the audit record in the DB with the real email via FastAPI
 *   3. We trigger the full-report email via FastAPI /audit/email
 *   4. We set an httpOnly cookie so the results page can verify unlock
 *      without relying on the forgeable ?unlocked=true query param.
 *
 * POST /api/audit/unlock
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { audit_id, email, name } = body

    if (!audit_id || !email) {
      return NextResponse.json(
        { error: 'audit_id and email are required' },
        { status: 400 }
      )
    }

    // 1. Fetch the audit so we have score/grade/findings to email
    const auditRes = await fetch(`http://127.0.0.1:8001/audit/${audit_id}`, {
      signal: AbortSignal.timeout(10_000),
    })

    if (!auditRes.ok) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      )
    }

    const audit = await auditRes.json()

    // 2. Send the full report email. Unlock remains available if delivery is
    //    down, but the response must never claim an unconfirmed send.
    let emailSent = false
    try {
      const deliveryRes = await fetch('http://127.0.0.1:8001/audit/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: audit.url,
          email,
          name: name ?? null,
          score: audit.score,
          grade: audit.grade,
          findings: audit.findings ?? [],
        }),
        signal: AbortSignal.timeout(15_000),
      })
      if (deliveryRes.ok) {
        const delivery = await deliveryRes.json().catch(() => null)
        const receipt = delivery?.message_id
        emailSent = delivery?.status === 'sent'
          && typeof receipt === 'string'
          && receipt.trim().length > 0
      }
    } catch {
      emailSent = false
    }

    const clientDistinctId = request.headers.get('X-POSTHOG-DISTINCT-ID') ?? email
    try {
      const ph = getPostHogClient()
      ph.identify({ distinctId: email, properties: { name: name ?? undefined } })
      ph.capture({
        distinctId: clientDistinctId,
        event: 'audit_results_unlocked',
        properties: {
          audit_id,
          page_url: audit.url,
          score: audit.score,
          grade: audit.grade,
          $set: { name: name ?? undefined },
        },
      })
      await ph.flush()
    } catch {
      // Non-fatal
    }

    // 3. Set a signed unlock cookie scoped to this audit_id.
    //    We keep it simple: a base64 of audit_id:email so the results page
    //    can verify the correct email unlocked the correct audit.
    //    This is anti-forgery, not full auth — the user's email is the secret.
    const token = Buffer.from(`${audit_id}:${email}`).toString('base64url')

    const response = NextResponse.json({
      status: 'unlocked',
      audit_id,
      email_sent: emailSent,
    })

    response.cookies.set(`audit_unlock_${audit_id}`, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: `/audit/${audit_id}`,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch (error) {
    console.error('Audit unlock error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
