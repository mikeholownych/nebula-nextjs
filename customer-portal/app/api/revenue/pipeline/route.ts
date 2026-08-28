import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')

  try {
    const stagesResult = await auditPool.query(`
      SELECT 
        stage,
        COUNT(DISTINCT customer_id) as count,
        AVG(COALESCE(metadata->>'amount', '97'))::numeric as avg_value
      FROM customer_onboarding
      WHERE stage_changed_at > NOW() - INTERVAL '${days} days'
      GROUP BY stage
    `)

    const stageProbabilities: Record<string, number> = {
      payment_received: 0.95,
      onboarding_complete: 0.85,
      sprint_delivered: 0.75,
      re_audit_scheduled: 0.60,
      churned: 0.0,
    }

    const pipeline = stagesResult.rows.map((row: any) => ({
      stage: row.stage,
      count: parseInt(row.count),
      value: parseFloat(row.avg_value) || 97,
      probability: stageProbabilities[row.stage] || 0.5,
      projected_value: (parseFloat(row.avg_value) || 97) * parseInt(row.count) * (stageProbabilities[row.stage] || 0.5),
    }))

    const pipelineValue = pipeline.reduce((sum: number, s: any) => sum + s.projected_value, 0)

    const historicalResult = await auditPool.query(`
      SELECT 
        DATE_TRUNC('month', stage_changed_at) as month,
        COUNT(DISTINCT customer_id) FILTER (WHERE stage = 'payment_received') as payments,
        COUNT(DISTINCT customer_id) FILTER (WHERE stage = 'onboarding_complete') as onboards
      FROM customer_onboarding
      WHERE stage_changed_at > NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', stage_changed_at)
      ORDER BY month DESC
    `)

    let conversionRates: Record<string, number> = {}
    let totalPayments = 0
    let totalOnboards = 0

    historicalResult.rows.forEach((row: any) => {
      totalPayments += parseInt(row.payments)
      totalOnboards += parseInt(row.onboards)
    })

    if (totalPayments > 0) {
      conversionRates = {
        payment_to_onboarding: totalOnboards / totalPayments,
        onboarding_to_sprint: 0.7,
      }
    }

    const currentMonthPayments = pipeline.find((s: any) => s.stage === 'payment_received')
    const currentMonthValue = currentMonthPayments ? currentMonthPayments.count * (currentMonthPayments.value || 97) : 0
    const nextMonthForecast = currentMonthValue * (conversionRates.payment_to_onboarding || 0.6)
    const nextQuarterForecast = nextMonthForecast * 3

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      pipeline,
      totalPipelineValue: pipelineValue,
      currentMonthValue,
      nextMonthForecast,
      nextQuarterForecast,
      conversionRates,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
