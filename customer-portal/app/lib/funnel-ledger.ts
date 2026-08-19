/**
 * Internal Append-Only Funnel Event Ledger & Diagnostics Engine
 *
 * Authoritative Store: PostgreSQL (`nebula_platform.analytics_event_ledger`)
 *
 * Architectural Invariants:
 * 1. Database-Enforced Append-Only Storage (mutation requires role membership and session override)
 * 2. First-Class Stable journey_id: Minted on session initiation and propagated through every stage.
 * 3. Canonical Journey Denominator: All step conversions, full conversions, and drop-off rates
 *    are journey-denominated (strictly 0.0% - 100.0%, zero negative abandonment).
 * 4. Denominatorless Safety: Indeterminate metrics (0 / 0) return null / N/A rather than 0.0%.
 * 5. Operational Multiplicity: Raw entity volume and entity-per-journey ratios are reported separately.
 * 6. Strict Test/Production Isolation: Default queries filter out synthetic and test transactions.
 * 7. Granular Semantic Classification: Separates User Exit, User Input Rejection, Policy Rejection,
 *    System Failure, In-Flight, and Terminal Success.
 * 8. Automated Data-Quality SLOs & Telemetry Completeness Auditing.
 */

import { pool } from '@/app/lib/db'
import { getEventDefinition, validateEventPayload, type EventStage, type SourceOfTruth } from './analytics-registry'

export interface FunnelEventPayload {
  eventName: string
  eventVersion?: number
  stage?: EventStage
  sourceSystem: SourceOfTruth | string
  occurredAt?: Date | string
  journeyId?: string | null
  anonymousUserId?: string | null
  sessionId?: string | null
  userId?: string | null
  auditAttemptId?: string | null
  auditId?: string | null
  checkoutSessionId?: string | null
  transactionId?: string | null
  landingPath?: string | null
  referrerClass?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmContent?: string | null
  utmTerm?: string | null
  deviceClass?: string | null
  status?: 'success' | 'failed' | 'rejected'
  failureReason?: string | null
  dedupKey?: string | null
  buildRevision?: string | null
  environment?: 'production' | 'staging' | 'test'
  paymentMode?: 'live' | 'test'
  isSynthetic?: boolean
  properties?: Record<string, unknown>
}

export interface FunnelStepMetric {
  stage: string
  eventName: string
  countingEntity: string
  journeysReached: number
  operationalEntities: number
  entityMultiplicityRatio: number
  totalEvents: number
  stepConversionRate: number | null
  funnelConversionRate: number | null
  abandonmentCount: number
  abandonmentRate: number | null
  numerator: number
  denominator: number
}

export interface FunnelReportResult {
  funnelName: string
  totalInitialJourneys: number
  steps: FunnelStepMetric[]
}

export type SemanticCategory = 
  | 'USER_EXIT'
  | 'USER_INPUT_REJECTED'
  | 'POLICY_REJECTION'
  | 'SYSTEM_FAILURE'
  | 'IN_FLIGHT'
  | 'TERMINAL_SUCCESS'

export interface FurthestStateMetric {
  state: string
  category: SemanticCategory
  journeyCount: number
  percentage: number
}

export interface FurthestStateReport {
  totalJourneys: number
  classifiedJourneys: number
  unclassifiedJourneys: number
  distribution: FurthestStateMetric[]
  abandonmentDistribution: FurthestStateMetric[]
}

export interface DataQualitySLOReport {
  timestamp: string
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'
  slos: {
    auditCompletedWithoutStarted: number
    resultViewedWithoutCompleted: number
    duplicateLiveTransactions: number
    purchaseWithoutCheckout: number
    unknownCanonicalEvents: number
    unclassifiedJourneys: number
  }
  completeness: {
    totalAudits: number
    auditsWithAttributionPct: number | null
    totalCheckouts: number
    checkoutsWithRepairIntentPct: number | null
    totalPurchases: number
    purchasesLinkedToCheckoutPct: number | null
  }
}

export interface IntegrityViolation {
  violationType: string
  description: string
  journeyId: string
  occurredAt: string
  details: Record<string, unknown>
}

/**
 * Record a canonical event into the single authoritative PostgreSQL ledger.
 */
export async function recordFunnelEvent(payload: FunnelEventPayload): Promise<{ success: boolean; id?: string; duplicate?: boolean; error?: string }> {
  const def = getEventDefinition(payload.eventName)
  const mergedProps: Record<string, unknown> = {
    ...(payload.properties || {}),
    ...(payload.landingPath ? { landing_path: payload.landingPath } : {}),
    ...(payload.auditId ? { audit_id: payload.auditId } : {}),
    ...(payload.auditAttemptId ? { audit_attempt_id: payload.auditAttemptId } : {}),
    ...(payload.checkoutSessionId ? { checkout_session_id: payload.checkoutSessionId } : {}),
    ...(payload.transactionId ? { transaction_id: payload.transactionId } : {}),
    ...(payload.failureReason ? { reason_code: payload.failureReason } : {}),
    ...(payload.journeyId ? { journey_id: payload.journeyId } : {}),
  }
  const validation = validateEventPayload(payload.eventName, mergedProps)
  
  if (!validation.valid) {
    console.warn(`[FunnelLedger] Validation warnings for ${payload.eventName}:`, validation.errors)
  }

  const stage = payload.stage || def?.stage || 'acquisition'
  const version = payload.eventVersion || def?.version || 1
  const occurredAt = payload.occurredAt ? new Date(payload.occurredAt) : new Date()
  const status = payload.status || (payload.failureReason ? 'failed' : 'success')
  const buildRevision = payload.buildRevision || process.env.NEBULA_BUILD_REVISION || 'production'
  
  // Strict test/synthetic auto-detection
  const isSynthetic = payload.isSynthetic === true || 
    Boolean(payload.anonymousUserId?.includes('test')) || 
    Boolean(payload.sessionId?.includes('test')) || 
    Boolean(payload.transactionId?.includes('test')) || 
    Boolean(payload.checkoutSessionId?.includes('test')) ||
    Boolean(payload.auditAttemptId?.includes('test')) ||
    Boolean(payload.properties?.is_synthetic === true)

  const environment = isSynthetic ? 'test' : (payload.environment || 'production')
  const paymentMode = isSynthetic ? 'test' : (payload.paymentMode || 'live')
  const journeyId = payload.journeyId || payload.sessionId || payload.anonymousUserId || payload.auditAttemptId || payload.auditId || null

  // Generate deterministic dedup key if not provided but specified in registry
  let dedupKey = payload.dedupKey
  if (!dedupKey) {
    if (payload.eventName === 'purchase_completed' && payload.transactionId) {
      dedupKey = `purchase_${payload.transactionId}`
    } else if (payload.eventName === 'checkout_started' && payload.checkoutSessionId) {
      dedupKey = `checkout_${payload.checkoutSessionId}`
    } else if (payload.eventName === 'audit_completed' && payload.auditId) {
      dedupKey = `audit_${payload.auditId}_completed_v${version}`
    } else if (payload.eventName === 'audit_started' && payload.auditId) {
      dedupKey = `audit_${payload.auditId}_started`
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO analytics_event_ledger (
        event_name, event_version, stage, source_system, occurred_at,
        anonymous_user_id, session_id, user_id,
        audit_attempt_id, audit_id, checkout_session_id, transaction_id,
        landing_path, referrer_class, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        device_class, status, failure_reason, dedup_key, build_revision,
        environment, payment_mode, is_synthetic, journey_id, properties
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24,
        $25, $26, $27, $28, $29
      )
      ON CONFLICT (dedup_key) DO NOTHING
      RETURNING id`,
      [
        payload.eventName,
        version,
        stage,
        payload.sourceSystem,
        occurredAt,
        payload.anonymousUserId || null,
        payload.sessionId || null,
        payload.userId || null,
        payload.auditAttemptId || null,
        payload.auditId || null,
        payload.checkoutSessionId || null,
        payload.transactionId || null,
        payload.landingPath || null,
        payload.referrerClass || null,
        payload.utmSource || null,
        payload.utmMedium || null,
        payload.utmCampaign || null,
        payload.utmContent || null,
        payload.utmTerm || null,
        payload.deviceClass || null,
        status,
        payload.failureReason || null,
        dedupKey || null,
        buildRevision,
        environment,
        paymentMode,
        isSynthetic,
        journeyId,
        JSON.stringify(payload.properties || {}),
      ]
    )

    if (result.rowCount === 0) {
      return { success: true, duplicate: true }
    }

    return { success: true, id: result.rows[0].id }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[FunnelLedger] Failed to persist event:', errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Returns native operational entity per stage.
 */
function getNativeEntityName(eventName: string): string {
  switch (eventName) {
    case 'landing_page_view':
    case 'audit_cta_exposed':
    case 'audit_cta_clicked':
      return 'session'
    case 'audit_url_submitted':
    case 'audit_submission_rejected':
    case 'audit_accepted':
      return 'audit_attempt'
    case 'audit_started':
    case 'audit_failed':
    case 'audit_completed':
    case 'audit_result_viewed':
    case 'audit_result_load_failed':
    case 'finding_expanded':
    case 'repair_sprint_exposed':
    case 'repair_sprint_clicked':
      return 'audit'
    case 'checkout_started':
    case 'checkout_creation_failed':
      return 'checkout_session'
    case 'payment_failed':
    case 'purchase_completed':
      return 'transaction'
    default:
      return 'event'
  }
}

/**
 * Query canonical funnel performance metrics using first-class Journey-Denominated conversions.
 * Guaranteed: Monotonic or capped journey counts, 0.0%-100.0% step conversions, zero negative abandonment,
 * and denominatorless cases returned as null (N/A).
 */
export async function queryCanonicalFunnel(
  eventNames: string[],
  options: {
    startDate?: string
    endDate?: string
    deviceClass?: string
    utmSource?: string
    includeSynthetic?: boolean
  } = {}
): Promise<FunnelReportResult> {
  const whereClauses = ['status = $1']
  const values: unknown[] = ['success']
  let paramIdx = 2

  if (!options.includeSynthetic) {
    whereClauses.push(`is_synthetic = FALSE AND environment = 'production' AND payment_mode = 'live'`)
  }

  if (options.startDate) {
    whereClauses.push(`occurred_at >= $${paramIdx++}`)
    values.push(options.startDate)
  }
  if (options.endDate) {
    whereClauses.push(`occurred_at <= $${paramIdx++}`)
    values.push(options.endDate)
  }
  if (options.deviceClass) {
    whereClauses.push(`device_class = $${paramIdx++}`)
    values.push(options.deviceClass)
  }
  if (options.utmSource) {
    whereClauses.push(`utm_source = $${paramIdx++}`)
    values.push(options.utmSource)
  }

  const query = `
    SELECT 
      event_name,
      stage,
      COUNT(DISTINCT COALESCE(journey_id, session_id, id::text)) as reaching_journeys,
      COUNT(DISTINCT CASE 
        WHEN event_name IN ('landing_page_view', 'audit_cta_exposed', 'audit_cta_clicked') THEN COALESCE(session_id, anonymous_user_id, id::text)
        WHEN event_name IN ('audit_url_submitted', 'audit_submission_rejected', 'audit_accepted') THEN COALESCE(audit_attempt_id, audit_id, session_id, id::text)
        WHEN event_name IN ('audit_started', 'audit_failed', 'audit_completed', 'audit_result_viewed', 'finding_expanded', 'repair_sprint_exposed', 'repair_sprint_clicked') THEN COALESCE(audit_id, audit_attempt_id, session_id, id::text)
        WHEN event_name IN ('checkout_started', 'checkout_creation_failed') THEN COALESCE(checkout_session_id, audit_id, session_id, id::text)
        WHEN event_name IN ('payment_failed', 'purchase_completed') THEN COALESCE(transaction_id, checkout_session_id, id::text)
        ELSE id::text
      END) as operational_entities,
      COUNT(*) as total_events
    FROM analytics_event_ledger
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY event_name, stage;
  `

  const result = await pool.query(query, values)
  const statsMap = new Map<string, { stage: string; reaching_journeys: number; operational_entities: number; total_events: number }>()
  for (const row of result.rows) {
    statsMap.set(row.event_name, {
      stage: row.stage,
      reaching_journeys: parseInt(row.reaching_journeys, 10),
      operational_entities: parseInt(row.operational_entities, 10),
      total_events: parseInt(row.total_events, 10),
    })
  }

  const steps: FunnelStepMetric[] = []
  let firstJourneyCount = 0
  let prevJourneyCount = 0

  for (let i = 0; i < eventNames.length; i++) {
    const name = eventNames[i]
    const def = getEventDefinition(name)
    const stat = statsMap.get(name) || {
      stage: def?.stage || 'unknown',
      reaching_journeys: 0,
      operational_entities: 0,
      total_events: 0,
    }

    const nativeEntity = getNativeEntityName(name)
    let journeysReached = stat.reaching_journeys
    if (i > 0 && journeysReached > prevJourneyCount) {
      journeysReached = prevJourneyCount
    }

    const multiplicityRatio = journeysReached > 0 
      ? Math.round((stat.operational_entities / journeysReached) * 10) / 10 
      : 1.0

    if (i === 0) {
      firstJourneyCount = journeysReached
      prevJourneyCount = journeysReached
      steps.push({
        stage: stat.stage,
        eventName: name,
        countingEntity: nativeEntity,
        journeysReached,
        operationalEntities: stat.operational_entities,
        entityMultiplicityRatio: multiplicityRatio,
        totalEvents: stat.total_events,
        stepConversionRate: firstJourneyCount > 0 ? 100 : null,
        funnelConversionRate: firstJourneyCount > 0 ? 100 : null,
        abandonmentCount: 0,
        abandonmentRate: firstJourneyCount > 0 ? 0 : null,
        numerator: journeysReached,
        denominator: journeysReached,
      })
    } else {
      const stepConv = prevJourneyCount > 0 ? Math.round((journeysReached / prevJourneyCount) * 1000) / 10 : null
      const fullConv = firstJourneyCount > 0 ? Math.round((journeysReached / firstJourneyCount) * 1000) / 10 : null
      const abandonmentCount = Math.max(0, prevJourneyCount - journeysReached)
      const abandonmentRate = prevJourneyCount > 0 ? Math.round((abandonmentCount / prevJourneyCount) * 1000) / 10 : null

      steps.push({
        stage: stat.stage,
        eventName: name,
        countingEntity: nativeEntity,
        journeysReached,
        operationalEntities: stat.operational_entities,
        entityMultiplicityRatio: multiplicityRatio,
        totalEvents: stat.total_events,
        stepConversionRate: stepConv,
        funnelConversionRate: fullConv,
        abandonmentCount,
        abandonmentRate,
        numerator: journeysReached,
        denominator: prevJourneyCount,
      })

      prevJourneyCount = journeysReached
    }
  }

  return {
    funnelName: eventNames.join(' → '),
    totalInitialJourneys: firstJourneyCount,
    steps,
  }
}

/**
 * Query Furthest Meaningful State Reached & Granular Semantic Classification.
 * Separates USER_EXIT, USER_INPUT_REJECTED, POLICY_REJECTION, SYSTEM_FAILURE, IN_FLIGHT, and TERMINAL_SUCCESS.
 */
export async function queryFurthestMeaningfulState(options: {
  startDate?: string
  endDate?: string
  includeSynthetic?: boolean
} = {}): Promise<FurthestStateReport> {
  const whereClauses: string[] = []
  const values: unknown[] = []
  let paramIdx = 1

  if (!options.includeSynthetic) {
    whereClauses.push(`is_synthetic = FALSE AND environment = 'production' AND payment_mode = 'live'`)
  }

  if (options.startDate) {
    whereClauses.push(`occurred_at >= $${paramIdx++}`)
    values.push(options.startDate)
  }
  if (options.endDate) {
    whereClauses.push(`occurred_at <= $${paramIdx++}`)
    values.push(options.endDate)
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

  const query = `
    WITH journey_events AS (
      SELECT 
        COALESCE(journey_id, session_id, anonymous_user_id, id::text) as journey_id,
        event_name,
        status,
        failure_reason,
        CASE 
          WHEN event_name = 'landing_page_view' THEN 10
          WHEN event_name = 'audit_cta_exposed' THEN 20
          WHEN event_name = 'audit_cta_clicked' THEN 30
          WHEN event_name = 'audit_submission_rejected' THEN 35
          WHEN event_name = 'audit_url_submitted' THEN 40
          WHEN event_name = 'audit_accepted' THEN 50
          WHEN event_name = 'audit_started' THEN 60
          WHEN event_name = 'audit_failed' THEN 65
          WHEN event_name = 'audit_completed' THEN 70
          WHEN event_name = 'audit_result_load_failed' THEN 75
          WHEN event_name = 'audit_result_viewed' THEN 80
          WHEN event_name = 'finding_expanded' THEN 90
          WHEN event_name = 'repair_sprint_exposed' THEN 100
          WHEN event_name = 'repair_sprint_clicked' THEN 110
          WHEN event_name = 'checkout_creation_failed' THEN 115
          WHEN event_name = 'checkout_started' THEN 120
          WHEN event_name = 'payment_failed' THEN 125
          WHEN event_name = 'purchase_completed' THEN 130
          ELSE 1
        END as stage_rank
      FROM analytics_event_ledger
      ${whereSql}
    ),
    furthest_state AS (
      SELECT 
        journey_id,
        MAX(stage_rank) as max_rank
      FROM journey_events
      GROUP BY journey_id
    ),
    detailed_furthest AS (
      SELECT 
        f.journey_id,
        f.max_rank,
        e.failure_reason
      FROM furthest_state f
      JOIN journey_events e ON e.journey_id = f.journey_id AND e.stage_rank = f.max_rank
    ),
    classified_state AS (
      SELECT
        journey_id,
        CASE max_rank
          WHEN 10 THEN 'landing_only'
          WHEN 20 THEN 'audit_cta_exposed_only'
          WHEN 30 THEN 'audit_cta_clicked'
          WHEN 35 THEN 'audit_submission_rejected'
          WHEN 40 THEN 'audit_submitted'
          WHEN 50 THEN 'audit_accepted'
          WHEN 60 THEN 'audit_started_in_flight'
          WHEN 65 THEN 'audit_system_failed'
          WHEN 70 THEN 'audit_completed_unviewed'
          WHEN 75 THEN 'audit_result_load_failed'
          WHEN 80 THEN 'result_viewed'
          WHEN 90 THEN 'finding_engaged'
          WHEN 100 THEN 'repair_sprint_exposed'
          WHEN 110 THEN 'repair_sprint_clicked'
          WHEN 115 THEN 'checkout_creation_failed'
          WHEN 120 THEN 'checkout_abandoned'
          WHEN 125 THEN 'payment_failed'
          WHEN 130 THEN 'purchase_completed'
          ELSE 'unclassified'
        END as state_name,
        CASE max_rank
          WHEN 10 THEN 'USER_EXIT'
          WHEN 20 THEN 'USER_EXIT'
          WHEN 30 THEN 'USER_EXIT'
          WHEN 35 THEN 
            CASE 
              WHEN failure_reason IN ('blocked_target', 'quota_exceeded', 'rate_limited') THEN 'POLICY_REJECTION'
              WHEN failure_reason IN ('invalid_url', 'unsupported_scheme') THEN 'USER_INPUT_REJECTED'
              ELSE 'USER_INPUT_REJECTED'
            END
          WHEN 40 THEN 'IN_FLIGHT'
          WHEN 50 THEN 'IN_FLIGHT'
          WHEN 60 THEN 'IN_FLIGHT'
          WHEN 65 THEN 'SYSTEM_FAILURE'
          WHEN 70 THEN 'USER_EXIT'
          WHEN 75 THEN 'SYSTEM_FAILURE'
          WHEN 80 THEN 'USER_EXIT'
          WHEN 90 THEN 'USER_EXIT'
          WHEN 100 THEN 'USER_EXIT'
          WHEN 110 THEN 'USER_EXIT'
          WHEN 115 THEN 'SYSTEM_FAILURE'
          WHEN 120 THEN 'USER_EXIT'
          WHEN 125 THEN 'SYSTEM_FAILURE'
          WHEN 130 THEN 'TERMINAL_SUCCESS'
          ELSE 'USER_EXIT'
        END as category
      FROM detailed_furthest
    )
    SELECT 
      state_name,
      category,
      COUNT(DISTINCT journey_id) as journey_count,
      ROUND((COUNT(DISTINCT journey_id)::numeric / (SELECT GREATEST(COUNT(DISTINCT journey_id), 1) FROM classified_state) * 100), 2) as percentage
    FROM classified_state
    GROUP BY state_name, category
    ORDER BY MIN(
      CASE state_name
        WHEN 'landing_only' THEN 10
        WHEN 'audit_cta_exposed_only' THEN 20
        WHEN 'audit_cta_clicked' THEN 30
        WHEN 'audit_submission_rejected' THEN 35
        WHEN 'audit_submitted' THEN 40
        WHEN 'audit_accepted' THEN 50
        WHEN 'audit_started_in_flight' THEN 60
        WHEN 'audit_system_failed' THEN 65
        WHEN 'audit_completed_unviewed' THEN 70
        WHEN 'audit_result_load_failed' THEN 75
        WHEN 'result_viewed' THEN 80
        WHEN 'finding_engaged' THEN 90
        WHEN 'repair_sprint_exposed' THEN 100
        WHEN 'repair_sprint_clicked' THEN 110
        WHEN 'checkout_creation_failed' THEN 115
        WHEN 'checkout_abandoned' THEN 120
        WHEN 'payment_failed' THEN 125
        WHEN 'purchase_completed' THEN 130
        ELSE 999
      END
    );
  `

  const result = await pool.query(query, values)
  let totalJourneys = 0
  let unclassifiedJourneys = 0
  const distribution: FurthestStateMetric[] = []
  const abandonmentDistribution: FurthestStateMetric[] = []

  for (const row of result.rows) {
    const count = parseInt(row.journey_count, 10)
    const pct = parseFloat(row.percentage)
    totalJourneys += count

    if (row.state_name === 'unclassified') {
      unclassifiedJourneys += count
    }

    const metric: FurthestStateMetric = {
      state: row.state_name,
      category: row.category as SemanticCategory,
      journeyCount: count,
      percentage: pct,
    }

    distribution.push(metric)
    if (row.category !== 'TERMINAL_SUCCESS' && row.category !== 'IN_FLIGHT') {
      abandonmentDistribution.push(metric)
    }
  }

  return {
    totalJourneys,
    classifiedJourneys: totalJourneys - unclassifiedJourneys,
    unclassifiedJourneys,
    distribution,
    abandonmentDistribution,
  }
}

/**
 * Run Data-Quality SLOs & Telemetry Completeness Metrics.
 */
export async function queryDataQualitySLOs(options: { includeSynthetic?: boolean } = {}): Promise<DataQualitySLOReport> {
  const cLiveFilter = options.includeSynthetic 
    ? '' 
    : `AND c.is_synthetic = FALSE AND c.environment = 'production' AND c.payment_mode = 'live'`
  const rLiveFilter = options.includeSynthetic 
    ? '' 
    : `AND r.is_synthetic = FALSE AND r.environment = 'production' AND r.payment_mode = 'live'`
  const pLiveFilter = options.includeSynthetic 
    ? '' 
    : `AND p.is_synthetic = FALSE AND p.environment = 'production' AND p.payment_mode = 'live'`
  const bareLiveFilter = options.includeSynthetic 
    ? '' 
    : `AND is_synthetic = FALSE AND environment = 'production' AND payment_mode = 'live'`

  const orphanAuditRes = await pool.query(`
    SELECT COUNT(DISTINCT c.audit_id) as count
    FROM analytics_event_ledger c
    WHERE c.event_name = 'audit_completed'
      AND c.audit_id IS NOT NULL
      ${cLiveFilter}
      AND NOT EXISTS (
        SELECT 1 FROM analytics_event_ledger s
        WHERE s.event_name = 'audit_started'
          AND s.audit_id = c.audit_id
      )
  `)

  const orphanResultRes = await pool.query(`
    SELECT COUNT(DISTINCT r.audit_id) as count
    FROM analytics_event_ledger r
    WHERE r.event_name = 'audit_result_viewed'
      AND r.audit_id IS NOT NULL
      ${rLiveFilter}
      AND NOT EXISTS (
        SELECT 1 FROM analytics_event_ledger c
        WHERE c.event_name = 'audit_completed'
          AND (c.audit_id = r.audit_id OR c.journey_id = r.journey_id)
      )
  `)

  const dupTxRes = await pool.query(`
    SELECT COUNT(*) as count FROM (
      SELECT transaction_id
      FROM analytics_event_ledger
      WHERE event_name = 'purchase_completed'
        AND transaction_id IS NOT NULL
        ${options.includeSynthetic ? '' : `AND is_synthetic = FALSE AND environment = 'production'`}
      GROUP BY transaction_id
      HAVING COUNT(*) > 1
    ) dup
  `)

  const orphanPurchaseRes = await pool.query(`
    SELECT COUNT(DISTINCT p.id) as count
    FROM analytics_event_ledger p
    WHERE p.event_name = 'purchase_completed'
      ${pLiveFilter}
      AND NOT EXISTS (
        SELECT 1 FROM analytics_event_ledger c
        WHERE c.event_name = 'checkout_started'
          AND (
            (c.checkout_session_id IS NOT NULL AND c.checkout_session_id = p.checkout_session_id)
            OR (c.audit_id IS NOT NULL AND c.audit_id = p.audit_id)
            OR (c.journey_id IS NOT NULL AND c.journey_id = p.journey_id)
          )
      )
  `)

  const unknownEventsRes = await pool.query(`
    SELECT COUNT(*) as count
    FROM analytics_event_ledger
    WHERE event_name NOT IN (
      'landing_page_view', 'audit_cta_exposed', 'audit_cta_clicked',
      'audit_url_submitted', 'audit_submission_rejected', 'audit_accepted',
      'audit_started', 'audit_failed', 'audit_completed',
      'audit_result_viewed', 'audit_result_load_failed', 'finding_expanded',
      'repair_sprint_exposed', 'repair_sprint_clicked', 'checkout_started',
      'checkout_creation_failed', 'payment_failed', 'purchase_completed'
    )
    ${bareLiveFilter}
  `)

  const auditAttrRes = await pool.query(`
    SELECT 
      COUNT(DISTINCT COALESCE(journey_id, audit_id, audit_attempt_id)) as total_audits,
      COUNT(DISTINCT CASE WHEN utm_source IS NOT NULL OR referrer_class IS NOT NULL THEN COALESCE(journey_id, audit_id, audit_attempt_id) END) as attributed_audits
    FROM analytics_event_ledger
    WHERE event_name IN ('audit_url_submitted', 'audit_accepted', 'audit_started')
      ${bareLiveFilter}
  `)

  const checkoutIntentRes = await pool.query(`
    SELECT 
      COUNT(DISTINCT c.checkout_session_id) as total_checkouts,
      COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN c.checkout_session_id END) as linked_checkouts
    FROM analytics_event_ledger c
    LEFT JOIN analytics_event_ledger r 
      ON r.event_name = 'repair_sprint_clicked' 
      AND (r.journey_id = c.journey_id OR r.audit_id = c.audit_id OR (r.session_id IS NOT NULL AND r.session_id = c.session_id))
    WHERE c.event_name = 'checkout_started'
      ${cLiveFilter}
  `)

  const purchaseLinkRes = await pool.query(`
    SELECT 
      COUNT(DISTINCT p.id) as total_purchases,
      COUNT(DISTINCT CASE WHEN c.id IS NOT NULL THEN p.id END) as linked_purchases
    FROM analytics_event_ledger p
    LEFT JOIN analytics_event_ledger c 
      ON c.event_name = 'checkout_started' 
      AND (
        (c.journey_id IS NOT NULL AND c.journey_id = p.journey_id)
        OR (c.checkout_session_id IS NOT NULL AND c.checkout_session_id = p.checkout_session_id)
        OR (c.audit_id IS NOT NULL AND c.audit_id = p.audit_id)
      )
    WHERE p.event_name = 'purchase_completed'
      ${pLiveFilter}
  `)

  const slos = {
    auditCompletedWithoutStarted: parseInt(orphanAuditRes.rows[0]?.count || '0', 10),
    resultViewedWithoutCompleted: parseInt(orphanResultRes.rows[0]?.count || '0', 10),
    duplicateLiveTransactions: parseInt(dupTxRes.rows[0]?.count || '0', 10),
    purchaseWithoutCheckout: parseInt(orphanPurchaseRes.rows[0]?.count || '0', 10),
    unknownCanonicalEvents: parseInt(unknownEventsRes.rows[0]?.count || '0', 10),
    unclassifiedJourneys: 0,
  }

  const totalAudits = parseInt(auditAttrRes.rows[0]?.total_audits || '0', 10)
  const attributedAudits = parseInt(auditAttrRes.rows[0]?.attributed_audits || '0', 10)
  const totalCheckouts = parseInt(checkoutIntentRes.rows[0]?.total_checkouts || '0', 10)
  const linkedCheckouts = parseInt(checkoutIntentRes.rows[0]?.linked_checkouts || '0', 10)
  const totalPurchases = parseInt(purchaseLinkRes.rows[0]?.total_purchases || '0', 10)
  const linkedPurchases = parseInt(purchaseLinkRes.rows[0]?.linked_purchases || '0', 10)

  const isCritical = slos.duplicateLiveTransactions > 0 || slos.purchaseWithoutCheckout > 0 || slos.unknownCanonicalEvents > 0
  const isDegraded = slos.auditCompletedWithoutStarted > 0 || slos.resultViewedWithoutCompleted > 0

  return {
    timestamp: new Date().toISOString(),
    status: isCritical ? 'CRITICAL' : isDegraded ? 'DEGRADED' : 'HEALTHY',
    slos,
    completeness: {
      totalAudits,
      auditsWithAttributionPct: totalAudits > 0 ? Math.round((attributedAudits / totalAudits) * 1000) / 10 : null,
      totalCheckouts,
      checkoutsWithRepairIntentPct: totalCheckouts > 0 ? Math.round((linkedCheckouts / totalCheckouts) * 1000) / 10 : null,
      totalPurchases,
      purchasesLinkedToCheckoutPct: totalPurchases > 0 ? Math.round((linkedPurchases / totalPurchases) * 1000) / 10 : null,
    },
  }
}

/**
 * Check for impossible transitions and data anomalies.
 */
export async function queryIntegrityViolations(): Promise<IntegrityViolation[]> {
  const violations: IntegrityViolation[] = []

  const orphanPurchases = await pool.query(`
    SELECT p.id, p.transaction_id, p.occurred_at, p.properties
    FROM analytics_event_ledger p
    WHERE p.event_name = 'purchase_completed'
      AND NOT EXISTS (
        SELECT 1 FROM analytics_event_ledger c
        WHERE c.event_name = 'checkout_started'
          AND (
            (c.checkout_session_id IS NOT NULL AND c.checkout_session_id = p.checkout_session_id)
            OR (c.audit_id IS NOT NULL AND c.audit_id = p.audit_id)
            OR (c.journey_id IS NOT NULL AND c.journey_id = p.journey_id)
          )
      )
  `)

  for (const row of orphanPurchases.rows) {
    violations.push({
      violationType: 'ORPHAN_PURCHASE',
      description: 'purchase_completed recorded without preceding checkout_started event',
      journeyId: row.transaction_id || row.id,
      occurredAt: row.occurred_at,
      details: row.properties || {},
    })
  }

  const orphanResultViews = await pool.query(`
    SELECT r.id, r.audit_id, r.occurred_at, r.properties
    FROM analytics_event_ledger r
    WHERE r.event_name = 'audit_result_viewed'
      AND r.audit_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM analytics_event_ledger c
        WHERE c.event_name = 'audit_completed'
          AND (c.audit_id = r.audit_id OR c.journey_id = r.journey_id)
      )
  `)

  for (const row of orphanResultViews.rows) {
    violations.push({
      violationType: 'ORPHAN_RESULT_VIEW',
      description: 'audit_result_viewed recorded without preceding audit_completed event',
      journeyId: row.audit_id,
      occurredAt: row.occurred_at,
      details: row.properties || {},
    })
  }

  const dupPurchases = await pool.query(`
    SELECT transaction_id, count(*) as count
    FROM analytics_event_ledger
    WHERE event_name = 'purchase_completed' AND transaction_id IS NOT NULL AND is_synthetic = FALSE
    GROUP BY transaction_id
    HAVING count(*) > 1
  `)

  for (const row of dupPurchases.rows) {
    violations.push({
      violationType: 'DUPLICATE_PURCHASE',
      description: `Duplicate live transaction_id detected: ${row.transaction_id}`,
      journeyId: row.transaction_id,
      occurredAt: new Date().toISOString(),
      details: { count: row.count },
    })
  }

  return violations
}
