import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  try {
    const result = await auditPool.query(`
      SELECT 
        COALESCE(a.source, 'unknown') as source,
        COUNT(DISTINCT co.customer_id) as customers,
        COUNT(*) FILTER (WHERE co.stage = 'payment_received') as payments
      FROM audits a
      LEFT JOIN customer_onboarding co ON a.id = co.audit_id
      WHERE a.completed_at > NOW() - INTERVAL '${days} days'
      GROUP BY a.source
      ORDER BY payments DESC
    `)

    const revenueBySource = result.rows.reduce((acc: Record<string, number>, row: { source: string; payments: string }) => {
      acc[row.source] = parseInt(row.payments) * 97
      return acc
    }, {} as Record<string, number>)

    const totalRevenue = (Object.values(revenueBySource) as number[]).reduce((sum: number, v: number) => sum + v, 0)

    return NextResponse.json({
      revenueBySource,
      totalRevenue,
      days,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
