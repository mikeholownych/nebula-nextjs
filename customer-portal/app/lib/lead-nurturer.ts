/**
 * Lead nurturer & automation service
 * Email nurture flows, auto-triggered by score, behavior, engagement
 */


import { auditPool } from '@/app/lib/audit-db'

/**
 * Create email nurture sequence
 */
export async function createNurtureSequence(data: {
  name: string
  description?: string
  conditions: {
    minScore?: number
    maxScore?: number
    daysSinceAudit?: number
    eventTypes?: string[]
  }
  steps: Array<{
    order: number
    emailType: 'welcome' | 'score_checkin' | 'upgrade_offer' | 'referral_reminder' | 'one_leak'
    subject: string
    content: string
    delayHours: number
  }>
}): Promise<{
  sequenceId: string
  name: string
  isActive: boolean
  createdAt: string
}> {
  try {
    const result = await auditPool.query(`
      INSERT INTO nurture_sequences (name, description, conditions, steps, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, name, is_active, created_at
    `, [
      data.name,
      data.description || '',
      data.conditions,
      data.steps,
      true,
    ])

    return {
      sequenceId: result.rows[0].id,
      name: result.rows[0].name,
      isActive: result.rows[0].is_active,
      createdAt: result.rows[0].created_at,
    }
  } catch (error: unknown) {
    console.error('[Lead Nurturer] Error createNurtureSequence:', error)
    throw error
  }
}

/**
 * Trigger nurture sequence for a customer
 */
export async function triggerNurtureSequence(
  customerId: string,
  sequenceId: string
): Promise<{
  customerId: string
  sequenceId: string
  status: 'active' | 'completed' | 'paused'
  nextStep?: number
  message: string
}> {
  try {
    // Check if already in sequence
    const existing = await auditPool.query(`
      SELECT id, status FROM nurture_executions
      WHERE customer_id = $1 AND sequence_id = $2
      AND status IN ('active', 'completed')
    `, [customerId, sequenceId])

    if (existing.rows.length > 0) {
      return {
        customerId,
        sequenceId,
        status: existing.rows[0].status,
        message: 'Customer is already in this sequence',
      }
    }

    await auditPool.query(`
      INSERT INTO nurture_executions (customer_id, sequence_id, status, started_at)
      VALUES ($1, $2, 'active', NOW())
    `, [customerId, sequenceId])

    return {
      customerId,
      sequenceId,
      status: 'active',
      nextStep: 1,
      message: 'Nurture sequence started',
    }
  } catch (error: unknown) {
    console.error('[Lead Nurturer] Error triggerNurtureSequence:', error)
    throw error
  }
}

/**
 * Get nurture status for a customer
 */
export async function getLeadNurtureStatus(customerId: string): Promise<{
  customerId: string
  nurtureSequences: Array<{
    sequenceId: string
    name: string
    status: string
    currentStep?: number
    totalSteps: number
    startedAt: string
  }>
  emailStats: {
    emailsSent: number
    emailsOpened: number
    emailsClicked: number
    conversionRate: number
  }
}> {
  try {
    const sequencesResult = await auditPool.query(`
      SELECT ns.id, ns.name, ne.status, ne.current_step, array_length(ns.steps, 1) as total_steps, ne.started_at
      FROM nurture_executions ne
      JOIN nurture_sequences ns ON ne.sequence_id = ns.id
      WHERE ne.customer_id = $1
      ORDER BY ne.started_at DESC
    `, [customerId])

    // Simplified - audit_events doesn't have customer_id
    const emailsResult = await auditPool.query(`
      SELECT 
        COUNT(*) as sent,
        COUNT(*) FILTER (WHERE event_type = 'email_open') as opened,
        COUNT(*) FILTER (WHERE event_type = 'email_click') as clicked
      FROM audit_events
    `)

    const emailsSent = parseInt(emailsResult.rows[0].sent)
    const emailsOpened = parseInt(emailsResult.rows[0].opened)
    const emailsClicked = parseInt(emailsResult.rows[0].clicked)

    const conversionRate = emailsSent > 0 ? (emailsClicked / emailsSent) * 100 : 0

    return {
      customerId,
        nurtureSequences: sequencesResult.rows.map((row: { id: string; name: string; status: string; current_step: string; total_steps: string; started_at: string }) => ({
          sequenceId: row.id,
          name: row.name,
          status: row.status,
          currentStep: parseInt(row.current_step),
          totalSteps: parseInt(row.total_steps),
          startedAt: row.started_at,
        })),
      emailStats: {
        emailsSent: emailsSent,
        emailsOpened: emailsOpened,
        emailsClicked: emailsClicked,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
      },
    }
  } catch (error: unknown) {
    console.error('[Lead Nurturer] Error getLeadNurtureStatus:', error)
    throw error
  }
}

/**
 * Create nurture sequences on load
 */
if (process.env.NEBULA_SKIP_DB_INIT !== '1') await auditPool.query(`
  CREATE TABLE IF NOT EXISTS nurture_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    conditions JSONB,
    steps JSONB[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )
`)

if (process.env.NEBULA_SKIP_DB_INIT !== '1') await auditPool.query(`
  CREATE TABLE IF NOT EXISTS nurture_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    sequence_id UUID REFERENCES nurture_sequences(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active',
    current_step INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
  )
`)
