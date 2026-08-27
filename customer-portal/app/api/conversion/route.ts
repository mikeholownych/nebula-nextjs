import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  try {
    const result = await auditPool.query(`
      WITH audit_starts AS (
        SELECT audit_id, created_at as started_at
        FROM audit_events
        WHERE event_type = 'audit_started'
        AND created_at > NOW() - INTERVAL '${days} days'
      ),
      email_views AS (
        SELECT DISTINCT audit_id
        FROM audit_events
        WHERE event_type IN ('email_opened', 'email_clicked')
      ),
      purchases AS (
        SELECT DISTINCT audit_id
        FROM audit_events
        WHERE event_type = 'purchase_completed'
      )
      SELECT
        (SELECT COUNT(*) FROM audit_starts) as started,
        (SELECT COUNT(*) FROM email_views) as viewed_email,
        (SELECT COUNT(*) FROM purchases) as purchased
    `)

    const row = result.rows[0]
    const started = parseInt(row.started)
    const viewed = parseInt(row.viewed_email)
    const purchased = parseInt(row.purchased)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      days,
      funnel: {
        started,
        viewed_email: viewed,
        email_view_rate: started > 0 ? (viewed / started) * 100 : 0,
        purchased,
        purchase_rate: started > 0 ? (purchased / started) * 100 : 0,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
