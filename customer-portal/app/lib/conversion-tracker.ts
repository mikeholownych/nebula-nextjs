/**
 * Conversion tracking service for closed-loop funnel analysis.
 * Connects audit → email → click → purchase events end-to-end.
 */

import { NextRequest } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

/**
 * Track audit start event
 */
export async function trackAuditStart(request: NextRequest) {
  const data = await request.json()
  const { auditId, source, referrer, utm } = data

  try {
    await auditPool.query(`
      INSERT INTO audit_events (audit_id, event_type, event_data, created_at)
      VALUES ($1, $2, $3, NOW())
    `, [auditId, 'audit_started', JSON.stringify({ source, referrer, utm })])

    return { success: true }
  } catch (error) {
    console.error('[Conversion] Error tracking audit start:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Track email engagement
 */
export async function trackEmailEngagement(auditId: string, eventType: string) {
  try {
    await auditPool.query(`
      INSERT INTO audit_events (audit_id, event_type, event_data, created_at)
      VALUES ($1, $2, '{}', NOW())
    `, [auditId, eventType])

    return { success: true }
  } catch (error) {
    console.error('[Conversion] Error tracking email engagement:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Track purchase conversion
 */
export async function trackPurchase(auditId: string, customerId: string, amount: number, product: string) {
  try {
    await auditPool.query(`
      INSERT INTO audit_events (audit_id, event_type, event_data, created_at)
      VALUES ($1, $2, $3, NOW())
    `, [auditId, 'purchase_completed', JSON.stringify({ customerId, amount, product })])

    return { success: true }
  } catch (error) {
    console.error('[Conversion] Error tracking purchase:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Get funnel metrics for an audit
 */
export async function getAuditFunnel(auditId: string) {
  try {
    const result = await auditPool.query(`
      SELECT 
        event_type,
        COUNT(*) as count,
        MIN(created_at) as first_at,
        MAX(created_at) as last_at
      FROM audit_events
      WHERE audit_id = $1
      GROUP BY event_type
      ORDER BY created_at
    `, [auditId])

    const events = result.rows.reduce((acc: Record<string, any>, row: any) => {
      acc[row.event_type] = {
        count: parseInt(row.count),
        first_at: row.first_at,
        last_at: row.last_at,
      }
      return acc
    }, {})

    return events
  } catch (error) {
    console.error('[Conversion] Error getting funnel:', error)
    return null
  }
}

/**
 * Get cohort funnel analysis
 */
export async function getCohortFunnel(days: number = 30) {
  try {
    const result = await auditPool.query(`
      WITH audit_starts AS (
        SELECT audit_id, created_at as started_at
        FROM audit_events
        WHERE event_type = 'audit_started'
        AND created_at > NOW() - INTERVAL '${days} days'
      ),
      email_views AS (
        SELECT DISTINCT audit_id
        FROM audit_events
        WHERE event_type IN ('email_opened', 'email_clicked')
      ),
      purchases AS (
        SELECT DISTINCT audit_id
        FROM audit_events
        WHERE event_type = 'purchase_completed'
      )
      SELECT
        (SELECT COUNT(*) FROM audit_starts) as started,
        (SELECT COUNT(*) FROM email_views) as viewed_email,
        (SELECT COUNT(*) FROM purchases) as purchased
    `)

    const row = result.rows[0] as any
    const started = parseInt(row.started)
    const viewed = parseInt(row.viewed_email)
    const purchased = parseInt(row.purchased)

    return {
      started,
      viewed_email: viewed,
      email_view_rate: started > 0 ? (viewed / started) * 100 : 0,
      purchased,
      purchase_rate: started > 0 ? (purchased / started) * 100 : 0,
      funnel: [
        { stage: 'audit_started', count: started },
        { stage: 'email_viewed', count: viewed },
        { stage: 'purchase_completed', count: purchased },
      ],
    }
  } catch (error) {
    console.error('[Conversion] Error getting cohort funnel:', error)
    return null
  }
}
