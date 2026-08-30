/**
 * Churn prediction and retention engine service
 * Flags customers at risk of churn based on behavior patterns
 */


import { auditPool } from '@/app/lib/audit-db'

/**
 * Calculate churn risk score for a customer
 * Based on: audit inactivity, email engagement, onboarding progress
 */
export async function calculateChurnRisk(
  customerId: string,
  days: number = 90
): Promise<{
  customerId: string
  churnScore: number
  riskLevel: 'low' | 'medium' | 'high'
  riskFactors: string[]
  lastAuditDate: string | null
  auditCount: number
  emailOpenRate: number
}> {
  try {
    // Get audit history
    const auditsResult = await auditPool.query(`
      SELECT 
        id,
        completed_at,
        source
      FROM audits
      WHERE customer_id = $1
      AND completed_at > NOW() - INTERVAL '${days} days'
      ORDER BY completed_at DESC
      LIMIT 10
    `, [customerId])

    const audits = auditsResult.rows
    const auditCount = audits.length
    const lastAuditDate = audits.length > 0 ? audits[0].completed_at : null

    // Calculate days since last audit
    const daysSinceLastAudit = lastAuditDate
      ? Math.floor((Date.now() - new Date(lastAuditDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    // Get email engagement metrics
    const emailResult = await auditPool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE event_type = 'email_opened') as opens,
        COUNT(*) FILTER (WHERE event_type = 'email_bounced') as bounces,
        COUNT(*) FILTER (WHERE event_type = 'email_unsubscribed') as unsubscribes,
        COUNT(*) FILTER (WHERE event_type = 'audit_started') as audits
      FROM audit_events
      WHERE customer_id = $1
      AND created_at > NOW() - INTERVAL '${days} days'
    `, [customerId])

    const emails = emailResult.rows[0] || {}
    const totalEmails = parseInt(emails.audits) + parseInt(emails.opens) + parseInt(emails.bounces) + parseInt(emails.unsubscribes)
    const emailOpenRate = totalEmails > 0
      ? (parseInt(emails.opens) / totalEmails) * 100
      : 0

    // Calculate churn score (0-100, higher = more risk)
    let churnScore = 0
    const riskFactors: string[] = []

    // Audit inactivity factor (0-40 points)
    if (auditCount === 0) {
      churnScore += 40
      riskFactors.push('No audits in last 90 days')
    } else if (daysSinceLastAudit > 60) {
      churnScore += Math.min(40, (daysSinceLastAudit - 60) / 2)
      riskFactors.push(`No audit for ${daysSinceLastAudit} days`)
    } else if (daysSinceLastAudit > 30) {
      churnScore += 20
      riskFactors.push(`Audit gap of ${daysSinceLastAudit} days`)
    }

    // Low email engagement factor (0-30 points)
    if (emailOpenRate < 20 && totalEmails > 0) {
      churnScore += 30
      riskFactors.push(`Low email engagement: ${emailOpenRate.toFixed(1)}%`)
    } else if (totalEmails === 0) {
      churnScore += 20
      riskFactors.push('No email engagement recorded')
    }

    // Bounce/unsubscribe factor (0-30 points)
    if (parseInt(emails.unsubscribes) > 0) {
      churnScore += 30
      riskFactors.push('User unsubscribed from emails')
    }
    if (parseInt(emails.bounces) > 0) {
      churnScore += 15
      riskFactors.push('Email bounces detected')
    }

    // Cap at 100
    churnScore = Math.min(100, churnScore)

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    if (churnScore >= 70) {
      riskLevel = 'high'
    } else if (churnScore >= 40) {
      riskLevel = 'medium'
    }

    return {
      customerId,
      churnScore,
      riskLevel,
      riskFactors,
      lastAuditDate: lastAuditDate?.toISOString() || null,
      auditCount,
      emailOpenRate,
    }
  } catch (error: unknown) {
    console.error('[Churn] Error calculateChurnRisk:', error)
    throw error
  }
}

/**
 * Get churning customers with risk scores
 */
export async function getChurningCustomers(days: number = 90): Promise<{
  totalAtRisk: number
  lowRisk: number
  mediumRisk: number
  highRisk: number
  customers: Array<{
    customerId: string
    churnScore: number
    riskLevel: string
    lastAuditDate: string | null
    auditCount: number
    emailOpenRate: number
  }>
}> {
  try {
    // Get unique customers from audits
    const customersResult = await auditPool.query(`
      SELECT DISTINCT customer_id
      FROM audits
      WHERE completed_at > NOW() - INTERVAL '${days} days'
    `)

    const customerIds = customersResult.rows.map((row: { [key: string]: unknown }) => row.customer_id)

    const riskCounts = { low: 0, medium: 0, high: 0 }
    const processedCustomers: Array<{
      customerId: string
      churnScore: number
      riskLevel: string
      lastAuditDate: string | null
      auditCount: number
      emailOpenRate: number
    }> = []

    for (const customerId of customerIds) {
      try {
        const risk = await calculateChurnRisk(customerId, days)
        riskCounts[risk.riskLevel]++
        processedCustomers.push({
          customerId: risk.customerId,
          churnScore: risk.churnScore,
          riskLevel: risk.riskLevel,
          lastAuditDate: risk.lastAuditDate,
          auditCount: risk.auditCount,
          emailOpenRate: risk.emailOpenRate,
        })
      } catch (err: unknown) {
        console.error(`[Churn] Failed to process customer ${customerId}:`, err instanceof Error ? err.message : String(err))
      }
    }

    // Sort by churn score (highest first)
    processedCustomers.sort((a, b) => b.churnScore - a.churnScore)

    return {
      totalAtRisk: processedCustomers.length,
      lowRisk: riskCounts.low,
      mediumRisk: riskCounts.medium,
      highRisk: riskCounts.high,
      customers: processedCustomers,
    }
  } catch (error: unknown) {
    console.error('[Churn] Error getChurningCustomers:', error)
    throw error
  }
}

/**
 * Get retention metrics
 */
export async function getRetentionMetrics(days: number = 30): Promise<{
  customersAtStart: number
  retained: number
  churned: number
  retentionRate: number
  reAuditRate: number
}> {
  try {
    // Get customers at start of period
    const atStartResult = await auditPool.query(`
      SELECT COUNT(DISTINCT customer_id) as count
      FROM customer_onboarding
      WHERE stage_changed_at > NOW() - INTERVAL '${days} days'
      AND stage = 'payment_received'
    `)

    const customersAtStart = parseInt(atStartResult.rows[0].count)

    // Get re-audits (indicates retention)
    const reAuditResult = await auditPool.query(`
      SELECT COUNT(DISTINCT customer_id) as count
      FROM audits
      WHERE source = 're_audit'
      AND completed_at > NOW() - INTERVAL '${days} days'
    `)

    const reAuditCount = parseInt(reAuditResult.rows[0].count)

    // Get churned customers
    const churnedResult = await auditPool.query(`
      SELECT COUNT(DISTINCT customer_id) as count
      FROM customer_onboarding
      WHERE stage = 'churned'
      AND stage_changed_at > NOW() - INTERVAL '${days} days'
    `)

    const churnedCount = parseInt(churnedResult.rows[0].count)

    // Retention rate: customers who did a re-audit / total
    const retentionRate = customersAtStart > 0
      ? (reAuditCount / customersAtStart) * 100
      : 0

    return {
      customersAtStart,
      retained: reAuditCount,
      churned: churnedCount,
      retentionRate: parseFloat(retentionRate.toFixed(1)),
      reAuditRate: parseFloat(retentionRate.toFixed(1)),
    }
  } catch (error: unknown) {
    console.error('[Churn] Error getRetentionMetrics:', error)
    throw error
  }
}
