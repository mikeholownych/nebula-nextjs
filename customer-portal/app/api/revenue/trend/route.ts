import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const months = parseInt(searchParams.get('months') || '6')

  try {
    const result = await auditPool.query(`
      SELECT 
        DATE_TRUNC('month', stage_changed_at) as month,
        COUNT(DISTINCT customer_id) as customers
      FROM customer_onboarding
      WHERE stage = 'payment_received'
      AND stage_changed_at > NOW() - INTERVAL '${months} months'
      GROUP BY DATE_TRUNC('month', stage_changed_at)
      ORDER BY month
    `)

    const trend = result.rows.map((row: any) => ({
      month: row.month.toISOString().split('T')[0],
      revenue: parseInt(row.customers) * 97,
    }))

    // Calculate growth rate
    if (trend.length >= 2) {
      const firstMonth = trend[0].revenue
      const lastMonth = trend[trend.length - 1].revenue
      const growthRate = firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0

      return NextResponse.json({
        trend,
        months,
        growthRate: parseFloat(growthRate.toFixed(1)),
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      trend,
      months,
      growthRate: 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
