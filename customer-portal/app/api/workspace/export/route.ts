import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/app/lib/db'

/**
 * GET /api/workspace/export?email=...
 * Streams all user data as NDJSON (one JSON object per line).
 */

export async function GET(request: NextRequest) {
  const email = (request.nextUrl.searchParams.get('email') || '').trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  try {
    const [audits, purchases, monitors, recommendations, preferences] = await Promise.all([
      pool.query(
        `SELECT id, url, status, score, grade, composite, created_at, completed_at
         FROM audits WHERE email = $1 ORDER BY created_at DESC`,
        [email]
      ),
      pool.query(
        `SELECT stripe_session_id, offer_key, amount_total, currency, payment_status, fulfillment_status, created_at
         FROM purchases WHERE lower(customer_email) = $1 ORDER BY created_at DESC`,
        [email]
      ),
      pool.query(
        `SELECT id, url, cadence, status, last_run_at, created_at
         FROM monitors WHERE email = $1 ORDER BY created_at DESC`,
        [email]
      ),
      pool.query(
        `SELECT id, audit_id, key, label, impact, effort, status, created_at
         FROM recommendations WHERE email = $1 ORDER BY created_at DESC`,
        [email]
      ),
      pool.query(
        `SELECT preferences, timezone, created_at, updated_at
         FROM workspace_preferences WHERE email = $1`,
        [email]
      ),
    ])

    const lines: string[] = []

    lines.push(JSON.stringify({ _type: 'account', email, exported_at: new Date().toISOString() }))

    for (const row of audits.rows) {
      lines.push(JSON.stringify({ _type: 'audit', ...row }))
    }
    for (const row of purchases.rows) {
      lines.push(JSON.stringify({ _type: 'purchase', ...row }))
    }
    for (const row of monitors.rows) {
      lines.push(JSON.stringify({ _type: 'monitor', ...row }))
    }
    for (const row of recommendations.rows) {
      lines.push(JSON.stringify({ _type: 'recommendation', ...row }))
    }
    for (const row of preferences.rows) {
      lines.push(JSON.stringify({ _type: 'preferences', ...row }))
    }

    const ndjson = lines.join('\n') + '\n'

    return new NextResponse(ndjson, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Content-Disposition': `attachment; filename="nebula-export-${email.replace('@', '-at-')}.ndjson"`,
      },
    })
  } catch (err) {
    console.error('[Export] failed:', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
