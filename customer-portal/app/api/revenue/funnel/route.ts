import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  try {
    const totalAudits = await auditPool.query(`
      SELECT COUNT(*) as count FROM audits
      WHERE completed_at > NOW() - INTERVAL '${days} days'
    `)

    const leads = await auditPool.query(`
      SELECT COUNT(*) as count FROM leads
      WHERE created_at > NOW() - INTERVAL '${days} days'
    `)

    const onboarded = await auditPool.query(`
      SELECT COUNT(DISTINCT customer_id) as count FROM customer_onboarding
      WHERE stage = 'payment_received'
      AND stage_changed_at > NOW() - INTERVAL '${days} days'
    `)

    const total = parseInt(totalAudits.rows[0].count)

    const funnel = [
      { stage: 'audits_started', count: total, rate: 100 },
      { stage: 'leads_created', count: parseInt(leads.rows[0].count), rate: total > 0 ? (parseInt(leads.rows[0].count) / total) * 100 : 0 },
      { stage: 'customers_onboarded', count: parseInt(onboarded.rows[0].count), rate: parseInt(leads.rows[0].count) > 0 ? (parseInt(onboarded.rows[0].count) / parseInt(leads.rows[0].count)) * 100 : 0 },
    ]

    return NextResponse.json({
      funnel,
      days,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
