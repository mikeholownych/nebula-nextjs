import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  try {
    const result = await auditPool.query(`
      SELECT 
        stage,
        COUNT(DISTINCT customer_id) as count,
        AVG(EXTRACT(EPOCH FROM (NOW() - stage_changed_at)) / 86400) as avg_days_in_stage
      FROM customer_onboarding
      WHERE stage_changed_at > NOW() - INTERVAL '${days} days'
      GROUP BY stage
      ORDER BY count DESC
    `)

    const stages = result.rows.reduce((acc: Record<string, { count: number; avgDaysInStage: number }>, row: { stage: string; count: string; avg_days_in_stage: string | number }) => {
      acc[row.stage] = {
        count: parseInt(row.count),
        avgDaysInStage: parseFloat(parseFloat(String(row.avg_days_in_stage || '0')).toFixed(1)),
      }
      return acc
    }, {} as Record<string, { count: number; avgDaysInStage: number }>)

    const totalCustomers = (Object.values(stages) as { count: number }[]).reduce((sum: number, s: { count: number }) => sum + s.count, 0)

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      days,
      totalCustomers,
      stages,
      conversionRates: {
        payment_to_onboarding: stages.payment_received && stages.onboarding_complete 
          ? (stages.onboarding_complete.count / stages.payment_received.count) * 100 
          : 0,
        onboarding_to_sprint: stages.onboarding_complete && stages.sprint_delivered
          ? (stages.sprint_delivered.count / stages.onboarding_complete.count) * 100
          : 0,
        sprint_to_re_audit: stages.sprint_delivered && stages.re_audit_scheduled
          ? (stages.re_audit_scheduled.count / stages.sprint_delivered.count) * 100
          : 0,
      },
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
