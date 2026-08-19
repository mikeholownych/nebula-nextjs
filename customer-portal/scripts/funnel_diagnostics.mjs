#!/usr/bin/env node

/**
 * Nebula Funnel Diagnostics CLI (Node.js Edition)
 *
 * Reconstructs end-to-end commercial funnels using First-Class Canonical Journey IDs,
 * tracks Operational Multiplicity, evaluates Furthest State Semantic Classifications,
 * and audits Data-Quality SLOs directly against PostgreSQL.
 *
 * Usage:
 *   node scripts/funnel_diagnostics.mjs [--json] [--include-test]
 */

import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  host: process.env.PGHOST || '/var/run/postgresql',
  port: parseInt(process.env.PGPORT || '5433', 10),
  database: process.env.PGDATABASE || 'nebula_platform',
  user: process.env.PGUSER || 'postgres',
})

async function runDiagnostics() {
  const isJson = process.argv.includes('--json')
  const includeTest = process.argv.includes('--include-test') || process.argv.includes('--all')

  try {
    const whereLive = includeTest
      ? ''
      : `WHERE is_synthetic = FALSE AND environment = 'production' AND payment_mode = 'live'`

    // 1. Stage Counts with First-Class Journey ID and Operational Multiplicity
    const countsRes = await pool.query(`
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
      ${whereLive}
      GROUP BY event_name, stage
    `)

    const counts = new Map()
    for (const r of countsRes.rows) {
      counts.set(r.event_name, {
        reachingJourneys: parseInt(r.reaching_journeys, 10),
        operationalEntities: parseInt(r.operational_entities, 10),
        totalEvents: parseInt(r.total_events, 10),
        stage: r.stage,
      })
    }

    const funnelAEvents = [
      { name: 'landing_page_view', entity: 'session' },
      { name: 'audit_cta_exposed', entity: 'session' },
      { name: 'audit_cta_clicked', entity: 'session' },
      { name: 'audit_url_submitted', entity: 'audit_attempt' },
      { name: 'audit_accepted', entity: 'audit_attempt' },
      { name: 'audit_started', entity: 'audit_attempt' },
      { name: 'audit_completed', entity: 'audit' },
      { name: 'audit_result_viewed', entity: 'audit' },
    ]

    const funnelDEvents = [
      { name: 'landing_page_view', entity: 'session' },
      { name: 'audit_url_submitted', entity: 'audit_attempt' },
      { name: 'audit_completed', entity: 'audit' },
      { name: 'audit_result_viewed', entity: 'audit' },
      { name: 'repair_sprint_clicked', entity: 'audit' },
      { name: 'checkout_started', entity: 'checkout' },
      { name: 'purchase_completed', entity: 'transaction' },
    ]

    const formatFunnel = (events) => {
      let firstJourneys = 0
      let prevJourneys = 0
      return events.map((step, idx) => {
        const stat = counts.get(step.name) || { reachingJourneys: 0, operationalEntities: 0, totalEvents: 0 }
        let journeys = stat.reachingJourneys
        if (idx > 0 && journeys > prevJourneys) {
          journeys = prevJourneys
        }

        const multRatio = journeys > 0 ? (stat.operationalEntities / journeys).toFixed(1) + 'x' : '1.0x'

        if (idx === 0) {
          firstJourneys = journeys
          prevJourneys = journeys
          return {
            event: step.name,
            journeysReached: journeys,
            stepConversion: firstJourneys > 0 ? '100.0%' : 'N/A',
            funnelConversion: firstJourneys > 0 ? '100.0%' : 'N/A',
            dropOffRate: firstJourneys > 0 ? '0.0%' : 'N/A',
            nativeEntities: `${stat.operationalEntities} ${step.entity}s`,
            multiplicity: multRatio,
            totalEvents: stat.totalEvents,
          }
        }

        const stepConv = prevJourneys > 0 ? ((journeys / prevJourneys) * 100).toFixed(1) + '%' : 'N/A'
        const fullConv = firstJourneys > 0 ? ((journeys / firstJourneys) * 100).toFixed(1) + '%' : 'N/A'
        const dropOff = prevJourneys > 0 ? (((prevJourneys - journeys) / prevJourneys) * 100).toFixed(1) + '%' : 'N/A'
        prevJourneys = journeys

        return {
          event: step.name,
          journeysReached: journeys,
          stepConversion: stepConv,
          funnelConversion: fullConv,
          dropOffRate: dropOff,
          nativeEntities: `${stat.operationalEntities} ${step.entity}s`,
          multiplicity: multRatio,
          totalEvents: stat.totalEvents,
        }
      })
    }

    // 2. Furthest Meaningful State & Semantic Classification
    const stateWhere = includeTest
      ? ''
      : `WHERE is_synthetic = FALSE AND environment = 'production' AND payment_mode = 'live'`

    const furthestStateRes = await pool.query(`
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
        ${stateWhere}
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
          END as classification
        FROM detailed_furthest
      )
      SELECT 
        state_name,
        classification,
        COUNT(DISTINCT journey_id) as journey_count,
        ROUND((COUNT(DISTINCT journey_id)::numeric / (SELECT GREATEST(COUNT(DISTINCT journey_id), 1) FROM classified_state) * 100), 2) as percentage
      FROM classified_state
      GROUP BY state_name, classification
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
    `)

    // 3. Data Quality SLOs
    const orphanAuditRes = await pool.query(`
      SELECT COUNT(DISTINCT c.audit_id) as count
      FROM analytics_event_ledger c
      WHERE c.event_name = 'audit_completed'
        AND c.audit_id IS NOT NULL
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
          AND is_synthetic = FALSE
          AND environment = 'production'
        GROUP BY transaction_id
        HAVING COUNT(*) > 1
      ) dup
    `)

    const orphanPurchaseRes = await pool.query(`
      SELECT COUNT(DISTINCT p.id) as count
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

    const auditAttrRes = await pool.query(`
      SELECT 
        COUNT(DISTINCT COALESCE(journey_id, audit_id, audit_attempt_id)) as total_audits,
        COUNT(DISTINCT CASE WHEN utm_source IS NOT NULL OR referrer_class IS NOT NULL THEN COALESCE(journey_id, audit_id, audit_attempt_id) END) as attributed_audits
      FROM analytics_event_ledger
      ${whereLive ? whereLive + " AND event_name IN ('audit_url_submitted', 'audit_accepted', 'audit_started')" : "WHERE event_name IN ('audit_url_submitted', 'audit_accepted', 'audit_started')"}
    `)

    const totalAudits = parseInt(auditAttrRes.rows[0]?.total_audits || '0', 10)
    const attributedAudits = parseInt(auditAttrRes.rows[0]?.attributed_audits || '0', 10)

    const output = {
      timestamp: new Date().toISOString(),
      mode: includeTest ? 'ALL TRAFFIC (Including Synthetic/Test Data)' : 'LIVE PRODUCTION ONLY (Zero Synthetic)',
      funnelA_AuditActivation: formatFunnel(funnelAEvents),
      funnelD_FullCommercial: formatFunnel(funnelDEvents),
      furthestMeaningfulState: furthestStateRes.rows.map((r) => ({
        state: r.state_name,
        category: r.classification,
        journeys: parseInt(r.journey_count, 10),
        pct: parseFloat(r.percentage).toFixed(1) + '%',
      })),
      dataQualitySLOs: {
        auditCompletedWithoutStarted: parseInt(orphanAuditRes.rows[0]?.count || '0', 10),
        resultViewedWithoutCompleted: parseInt(orphanResultRes.rows[0]?.count || '0', 10),
        duplicateLiveTransactions: parseInt(dupTxRes.rows[0]?.count || '0', 10),
        purchaseWithoutCheckout: parseInt(orphanPurchaseRes.rows[0]?.count || '0', 10),
        unclassifiedJourneys: furthestStateRes.rows.filter((r) => r.state_name === 'unclassified').length,
        attributionCompleteness: totalAudits > 0 ? ((attributedAudits / totalAudits) * 100).toFixed(1) + '%' : 'N/A (0 eligible journeys)',
      },
    }

    if (isJson) {
      console.log(JSON.stringify(output, null, 2))
    } else {
      console.log('=================================================================')
      console.log('           NEBULA FUNNEL OBSERVABILITY & DIAGNOSTICS            ')
      console.log(`           MODE: ${output.mode}`)
      console.log('=================================================================\n')
      console.log('--- FUNNEL A: AUDIT ACTIVATION (JOURNEY-DENOMINATED) ---')
      console.table(output.funnelA_AuditActivation)
      console.log('\n--- FUNNEL D: FULL COMMERCIAL JOURNEY (JOURNEY-DENOMINATED) ---')
      console.table(output.funnelD_FullCommercial)
      console.log('\n--- FURTHEST MEANINGFUL STATE REACHED (GRANULAR SEMANTIC CATEGORIES) ---')
      console.table(output.furthestMeaningfulState)
      console.log('\n--- DATA-QUALITY SLOs & TELEMETRY INTEGRITY ---')
      console.log(`• Audits Completed without Start Event:    ${output.dataQualitySLOs.auditCompletedWithoutStarted} (Target: 0)`)
      console.log(`• Results Viewed without Completed Event:  ${output.dataQualitySLOs.resultViewedWithoutCompleted} (Target: 0)`)
      console.log(`• Duplicate Live Transaction IDs:          ${output.dataQualitySLOs.duplicateLiveTransactions} (Target: 0)`)
      console.log(`• Purchases without Checkout Started:      ${output.dataQualitySLOs.purchaseWithoutCheckout} (Target: 0)`)
      console.log(`• Unclassified Journey States:             ${output.dataQualitySLOs.unclassifiedJourneys} (Target: 0)`)
      console.log(`• Attribution Context Completeness:        ${output.dataQualitySLOs.attributionCompleteness} (Target: >95% when N > 0)`)
      console.log('=================================================================\n')
    }
  } catch (err) {
    console.error('Error running diagnostics:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runDiagnostics()
