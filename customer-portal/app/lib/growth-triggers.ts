/**
 * Product-led growth triggers service
 * Auto-trigger workflows based on audit scores and user behavior
 */


import { auditPool } from '@/app/lib/audit-db'

/**
 * Score thresholds for growth triggers
 */
export const GROWTH_SCORE_THRESHOLDS = {
  excellent: 80,
  good: 60,
  fair: 40,
  poor: 20,
}

/**
 * Trigger definitions based on score ranges
 */
export const TRIGGER_DEFINITIONS = {
  excellent: {
    id: 'excellent_score_refer',
    type: 'modal',
    condition: 'score >= 80',
    title: 'Great News!',
    message: 'Your landing page is in great shape. Want to help others?',
    cta: {
      label: ' Refer a Friend',
      reward: '$50 credit',
      action: 'refer',
    },
    trigger_once_per_session: true,
  },
  good: {
    id: 'good_score_upgrade',
    type: 'modal',
    condition: 'score >= 60 && score < 80',
    title: 'Almost There',
    message: 'Your landing page is solid. Unlock full fixes to reach 80+.',
    cta: {
      label: 'Unlock Full Solution',
      action: 'upgrade',
    },
    trigger_once_per_session: true,
  },
  fair: {
    id: 'fair_score_one_leak',
    type: 'modal',
    condition: 'score >= 40 && score < 60',
    title: 'Quick Win Available',
    message: 'We found one major leak holding you back. Fix it now.',
    cta: {
      label: 'Fix One Leak $49',
      action: 'one_leak_sprint',
    },
    trigger_once_per_session: true,
  },
  poor: {
    id: 'poor_score_full_audit',
    type: 'modal',
    condition: 'score < 40',
    title: 'Time for a Checkup',
    message: 'Your landing page has several leaks. Get a complete audit.',
    cta: {
      label: 'Start Full Audit',
      action: 'full_audit',
    },
    trigger_once_per_session: true,
  },
  high_bounce: {
    id: 'high_bounce_retention',
    type: 'sticky',
    condition: 'bounce_rate > 75',
    title: 'Visitors are leaving',
    message: 'Try adding trust signals to improve retention.',
    cta: {
      label: 'Add Trust Signals',
      action: 'trust_signals',
    },
    trigger_once_per_session: true,
  },
  slow_load: {
    id: 'slow_load_speed',
    type: 'toast',
    condition: 'load_time > 3',
    title: 'Page load is slow',
    message: 'Every 1s delay loses 7% conversions. Optimize now.',
    cta: {
      label: 'Speed Up Page',
      action: 'speed_optimize',
    },
    timeout_ms: 5000,
  },
}

/**
 * Determine which trigger(s) to show for a given audit score
 */
export function getAuditTriggers(score: number, auditData?: { bounce_rate?: number; load_time?: number }): Array<{
  id: string
  type: string
  condition: string
  title: string
  message: string
  cta: {
    label: string
    action: string
    reward?: string
  }
}> {
  const triggers = []

  // Score-based triggers
  if (score >= GROWTH_SCORE_THRESHOLDS.excellent) {
    triggers.push(TRIGGER_DEFINITIONS.excellent)
  } else if (score >= GROWTH_SCORE_THRESHOLDS.good) {
    triggers.push(TRIGGER_DEFINITIONS.good)
  } else if (score >= GROWTH_SCORE_THRESHOLDS.fair) {
    triggers.push(TRIGGER_DEFINITIONS.fair)
  } else {
    triggers.push(TRIGGER_DEFINITIONS.poor)
  }

  // Data-based triggers (if auditData provided)
  if (auditData) {
    if (auditData.bounce_rate && auditData.bounce_rate > 75) {
      triggers.push(TRIGGER_DEFINITIONS.high_bounce)
    }
    if (auditData.load_time && auditData.load_time > 3) {
      triggers.push(TRIGGER_DEFINITIONS.slow_load)
    }
  }

  return triggers
}

/**
 * Get triggers for a specific audit
 */
export async function getAuditTriggersForAudit(auditId: string): Promise<{
  score: number
  triggers: Array<{
    id: string
    type: string
    condition: string
    title: string
    message: string
    cta: { label: string; action: string; reward?: string }
  }>
}> {
  try {
    const auditResult = await auditPool.query(`
      SELECT 
        id,
        score,
        jsonb_build_object(
          'bounce_rate', (findings -> 'bounce_rate')::float,
          'load_time', (findings -> 'load_time')::float
        ) as audit_data
      FROM audits
      WHERE id = $1
    `, [auditId])

    if (auditResult.rows.length === 0) {
      throw new Error(`Audit not found: ${auditId}`)
    }

    const audit = auditResult.rows[0]
    const triggers = getAuditTriggers(audit.score, audit.audit_data)

    return {
      score: audit.score,
      triggers,
    }
  } catch (error: unknown) {
    console.error('[Growth] Error getAuditTriggersForAudit:', error)
    throw error
  }
}

/**
 * Log trigger impression for analytics
 */
export async function logTriggerImpression(
  auditId: string,
  triggerId: string,
  customerId?: string
): Promise<void> {
  try {
    await auditPool.query(`
      INSERT INTO growth_triggers (audit_id, trigger_id, customer_id, viewed_at)
      VALUES ($1, $2, $3, NOW())
    `, [auditId, triggerId, customerId || null])
  } catch (error: unknown) {
    console.error('[Growth] Error logTriggerImpression:', error)
    throw error
  }
}

/**
 * Log trigger action (CTA click, etc.)
 */
export async function logTriggerAction(
  auditId: string,
  triggerId: string,
  action: string,
  customerId?: string
): Promise<void> {
  try {
    await auditPool.query(`
      INSERT INTO growth_trigger_actions (audit_id, trigger_id, action, customer_id, occurred_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [auditId, triggerId, action, customerId || null])
  } catch (error: unknown) {
    console.error('[Growth] Error logTriggerAction:', error)
    throw error
  }
}
