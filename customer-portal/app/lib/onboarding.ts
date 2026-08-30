/**
 * Customer onboarding workflow management
 * Tracks customers through the $97 One-Leak Repair Sprint funnel
 */


import { auditPool } from '@/app/lib/audit-db'

type OnboardingStage = 
  | 'payment_received'
  | 'onboarding_complete'
  | 'sprint_delivered'
  | 're_audit_scheduled'
  | 'onboarding_complete_30_day'
  | 'churned'

export interface OnboardingRecord {
  customer_id: string
  audit_id: string
  purchase_id: string
  stage: OnboardingStage
  stage_changed_at: string
  metadata: Record<string, any>
}

/**
 * Get or create onboarding record for a customer
 */
export async function getOrCreateOnboarding(
  customerId: string,
  auditId: string,
  purchaseId: string
): Promise<OnboardingRecord> {
  try {
    const existing = await auditPool.query(`
      SELECT * FROM customer_onboarding
      WHERE customer_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [customerId])

    if (existing.rows.length > 0) {
      return existing.rows[0] as any
    }

    const result = await auditPool.query(`
      INSERT INTO customer_onboarding (customer_id, audit_id, purchase_id, stage, metadata)
      VALUES ($1, $2, $3, 'payment_received', '{}')
      RETURNING *
    `, [customerId, auditId, purchaseId])

    return result.rows[0] as any
  } catch (error) {
    console.error('[Onboarding] Error getOrCreate:', error)
    throw error
  }
}

/**
 * Move customer to next onboarding stage
 */
export async function advanceOnboardingStage(
  customerId: string,
  newStage: OnboardingStage,
  _metadata: Record<string, any> = {}
): Promise<OnboardingRecord> {
  try {
    const result = await auditPool.query(`
      UPDATE customer_onboarding
      SET stage = $1,
          metadata = COALESCE(metadata, '{}') || jsonb_build_object('last_updated', NOW()) || jsonb_build_object($2, $3),
          updated_at = NOW()
      WHERE customer_id = $4
      RETURNING *
    `, [newStage, 'stage_change', JSON.stringify({ from: null, to: newStage, at: new Date().toISOString() }), customerId])

    if (result.rows.length === 0) {
      throw new Error(`No onboarding record found for customer ${customerId}`)
    }

    return result.rows[0] as any
  } catch (error) {
    console.error('[Onboarding] Error advanceStage:', error)
    throw error
  }
}

/**
 * Get onboarding progression for a customer
 */
export async function getOnboardingProgress(customerId: string) {
  try {
    const result = await auditPool.query(`
      SELECT 
        stage,
        stage_changed_at,
        metadata,
        created_at,
        updated_at,
        age(NOW(), stage_changed_at) as time_in_stage
      FROM customer_onboarding
      WHERE customer_id = $1
      ORDER BY stage_changed_at DESC
    `, [customerId])

    return result.rows.map((row: any) => ({
      stage: row.stage,
      timeInStage: row.time_in_stage,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  } catch (error) {
    console.error('[Onboarding] Error getProgress:', error)
    return null
  }
}

/**
 * Get cohort onboarding metrics
 */
export async function getCohortOnboardingMetrics(days: number = 30) {
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

    const stages = result.rows.reduce((acc: Record<string, any>, row: any) => {
      acc[row.stage] = {
        count: parseInt(row.count),
        avgDaysInStage: parseFloat(row.avg_days_in_stage?.toFixed(1) || '0'),
      }
      return acc
    }, {})

    const totalCustomers = Object.values(stages).reduce((sum: number, s: any) => sum + s.count, 0)

    return {
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
    }
  } catch (error) {
    console.error('[Onboarding] Error getCohortMetrics:', error)
    return null
  }
}

/**
 * Check if customer is due for re-audit (30 days after sprint delivered)
 */
export async function checkReAuditEligibility(customerId: string) {
  try {
    const result = await auditPool.query(`
      SELECT 
        customer_id,
        audit_id,
        stage_changed_at,
        CASE 
          WHEN stage = 'sprint_delivered' 
          AND stage_changed_at < NOW() - INTERVAL '30 days'
          THEN true
          ELSE false
        END as eligible
      FROM customer_onboarding
      WHERE customer_id = $1
    `, [customerId])

    return result.rows[0] as any
  } catch (error) {
    console.error('[Onboarding] Error checkReAudit:', error)
    return null
  }
}
