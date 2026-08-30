/**
 * Revenue forecasting and pipeline visibility service
 * Tracks revenue from lead → paid customer with forecasting
 */


import { auditPool } from '@/app/lib/audit-db'

export interface PipelineStage {
  stage: string
  count: number
  value: number
  probability: number
  projected_value: number
}

export interface RevenueForecast {
  current_month: number
  next_month: number
  next_quarter: number
  pipeline: PipelineStage[]
  conversion_rates: Record<string, number>
}

/**
 * Get current pipeline value
 */
export async function getPipelineValue(days: number = 30): Promise<RevenueForecast> {
  try {
    // Get onboarding stages with counts and values
    const stagesResult = await auditPool.query(`
      SELECT 
        stage,
        COUNT(DISTINCT customer_id) as count,
        97 as avg_value
      FROM customer_onboarding
      WHERE stage_changed_at > NOW() - INTERVAL '${days} days'
      GROUP BY stage
    `)

    // Default probabilities by stage (B2B SaaS typical)
    const stageProbabilities: Record<string, number> = {
      payment_received: 0.95,
      onboarding_complete: 0.85,
      sprint_delivered: 0.75,
      re_audit_scheduled: 0.60,
      churned: 0.0,
    }

    const pipeline: PipelineStage[] = stagesResult.rows.map((row: { [key: string]: unknown }) => ({
      stage: row.stage as string,
      count: parseInt(row.count as string),
      value: parseFloat(row.avg_value as string) || 97,
      probability: stageProbabilities[row.stage as string] || 0.5,
      projected_value: (parseFloat(row.avg_value as string) || 97) * parseInt(row.count as string) * (stageProbabilities[row.stage as string] || 0.5),
    }))

    // Calculate total pipeline value
    void pipeline.reduce((sum, s) => sum + s.projected_value, 0)

    // Get historical conversion rates for forecasting
    const historicalResult = await auditPool.query(`
      SELECT 
        DATE_TRUNC('month', stage_changed_at) as month,
        COUNT(DISTINCT customer_id) FILTER (WHERE stage = 'payment_received') as payments,
        COUNT(DISTINCT customer_id) FILTER (WHERE stage = 'onboarding_complete') as onboards,
        COUNT(DISTINCT customer_id) FILTER (WHERE stage = 'sprint_delivered') as sprints
      FROM customer_onboarding
      WHERE stage_changed_at > NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', stage_changed_at)
      ORDER BY month DESC
    `)

    // Calculate conversion rates
    const conversionRates: Record<string, number> = {}
    let totalPayments = 0
    let totalOnboards = 0

    historicalResult.rows.forEach((row: { [key: string]: unknown }) => {
      totalPayments += parseInt(row.payments as string)
      totalOnboards += parseInt(row.onboards as string)
    })

    if (totalPayments > 0) {
      conversionRates.payment_to_onboarding = totalOnboards / totalPayments
      conversionRates.onboarding_to_sprint = totalOnboards > 0 ? 0.7 : 0 // Default assumption
    }

    // Forecast calculations
    const currentMonthPayments = pipeline.find(s => s.stage === 'payment_received')?.value || 0
    const nextMonthForecast = currentMonthPayments * (conversionRates.payment_to_onboarding || 0.6)
    const nextQuarterForecast = nextMonthForecast * 3

    return {
      current_month: currentMonthPayments,
      next_month: nextMonthForecast,
      next_quarter: nextQuarterForecast,
      pipeline,
      conversion_rates: conversionRates,
    }
  } catch (error: unknown) {
    console.error('[Revenue] Error getPipelineValue:', error)
    throw error
  }
}

/**
 * Get revenue breakdown by source
 */
export async function getRevenueBySource(days: number = 30): Promise<Record<string, number>> {
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

    return result.rows.reduce((acc: Record<string, number>, row: { [key: string]: unknown }) => {
      acc[row.source as string] = parseInt(row.payments as string) * 97
      return acc
    }, {})
  } catch (error: unknown) {
    console.error('[Revenue] Error getRevenueBySource:', error)
    throw error
  }
}

/**
 * Get lead-to-customer conversion funnel
 */
export async function getLeadToCustomerFunnel(days: number = 30): Promise<Array<{
  stage: string
  count: number
  rate: number
}>> {
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

    return [
      { stage: 'audits_started', count: total, rate: 100 },
      { stage: 'leads_created', count: parseInt(leads.rows[0].count), rate: total > 0 ? (parseInt(leads.rows[0].count) / total) * 100 : 0 },
      { stage: 'customers_onboarded', count: parseInt(onboarded.rows[0].count), rate: parseInt(leads.rows[0].count) > 0 ? (parseInt(onboarded.rows[0].count) / parseInt(leads.rows[0].count)) * 100 : 0 },
    ]
  } catch (error: unknown) {
    console.error('[Revenue] Error getLeadToCustomerFunnel:', error)
    throw error
  }
}

/**
 * Get monthly revenue trend
 */
export async function getMonthlyRevenueTrend(months: number = 6): Promise<Array<{ month: string; revenue: number }>> {
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

    return result.rows.map((row: { [key: string]: unknown }) => ({
      month: row.month as string,
      revenue: parseInt(row.customers as string) * 97,
    }))
  } catch (error: unknown) {
    console.error('[Revenue] Error getMonthlyRevenueTrend:', error)
    throw error
  }
}
