import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET() {
  try {
    const competitorsResult = await auditPool.query(`
      SELECT COUNT(*) as total, 
             COUNT(*) FILTER (WHERE status = 'active') as active
      FROM competitor_pricing
    `)

    const changesResult = await auditPool.query(`
      SELECT 
        COUNT(*) as changes,
        AVG(percent_change) as avg_change
      FROM competitor_price_changes
      WHERE change_date > NOW() - INTERVAL '30 days'
    `)

    return NextResponse.json({
      totalCompetitors: parseInt(competitorsResult.rows[0].total),
      activeCompetitors: parseInt(competitorsResult.rows[0].active),
      priceChangesLast30Days: parseInt(changesResult.rows[0].changes),
      avgPriceChange: parseFloat(changesResult.rows[0].avg_change?.toFixed(2) || '0'),
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
