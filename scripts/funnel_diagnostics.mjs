#!/usr/bin/env node

/**
 * Nebula Funnel Diagnostics CLI
 *
 * Reconstructs end-to-end commercial funnels, runs the "Last Meaningful State" query,
 * and checks telemetry integrity constraints directly against the PostgreSQL event ledger.
 *
 * Usage: node scripts/funnel_diagnostics.mjs [--json] [--days=30]
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

  try {
    // 1. Funnel A: Audit Activation
    const funnelAEvents = [
      'landing_page_view',
      'audit_cta_exposed',
      'audit_cta_clicked',
      'audit_url_submitted',
      'audit_accepted',
      'audit_started',
      'audit_completed',
      'audit_result_viewed',
    ]

    // 2. Full Commercial Funnel D
    const funnelDEvents = [
      'landing_page_view',
      'audit_url_submitted',
      'audit_completed',
      'audit_result_viewed',
      'repair_sprint_clicked',
      'checkout_started',
      'purchase_completed',
    ]

    const countsRes = await pool.query(`
      SELECT 
        event_name,
        stage,
        COUNT(DISTINCT COALESCE(audit_attempt_id, session_id, anonymous_user_id, id::text)) as unique_entities,
        COUNT(*) as total_events
      FROM analytics_event_ledger
      GROUP BY event_name, stage
    `)

    const counts = new Map()
    for (const r of countsRes.rows) {
      counts.set(r.event_name, {
        unique: parseInt(r.unique_entities, 10),
        total: parseInt(r.total_events, 10),
        stage: r.stage,
      })
    }

    // 3. Last Meaningful State Query
    const lastStateRes = await pool.query(`
      WITH journey_events AS (
        SELECT 
          COALESCE(audit_attempt_id, session_id, anonymous_user_id, id::text) as journey_id,
          event_name,
          CASE event_name
            WHEN 'landing_page_view' THEN 1
            WHEN 'audit_cta_exposed' THEN 2
            WHEN 'audit_cta_clicked' THEN 3
            WHEN 'audit_url_submitted' THEN 4
            WHEN 'audit_accepted' THEN 5
            WHEN 'audit_started' THEN 6
            WHEN 'audit_completed' THEN 7
            WHEN 'audit_result_viewed' THEN 8
            WHEN 'finding_expanded' THEN 9
            WHEN 'repair_sprint_exposed' THEN 10
            WHEN 'repair_sprint_clicked' THEN 11
            WHEN 'checkout_started' THEN 12
            WHEN 'purchase_completed' THEN 13
            ELSE 0
          END as stage_rank
        FROM analytics_event_ledger
      ),
      furthest_state AS (
        SELECT 
          journey_id,
          MAX(stage_rank) as max_rank
        FROM journey_events
        GROUP BY journey_id
      ),
      classified_state AS (
        SELECT
          journey_id,
          CASE max_rank
            WHEN 1 THEN 'landing_only'
            WHEN 2 THEN 'audit_cta_exposed_only'
            WHEN 3 THEN 'audit_cta_clicked'
            WHEN 4 THEN 'audit_submitted'
            WHEN 5 THEN 'audit_accepted'
            WHEN 6 THEN 'audit_started'
            WHEN 7 THEN 'audit_completed_unviewed'
            WHEN 8 THEN 'result_viewed'
            WHEN 9 THEN 'finding_engaged'
            WHEN 10 THEN 'repair_sprint_exposed'
            WHEN 11 THEN 'repair_sprint_clicked'
            WHEN 12 THEN 'checkout_started'
            WHEN 13 THEN 'purchase_completed'
            ELSE 'unclassified'
          END as last_state
        FROM furthest_state
      )
      SELECT 
        last_state,
        COUNT(*) as journey_count,
        COUNT(*)::float / (SELECT COUNT(*) FROM classified_state) * 100 as percentage
      FROM classified_state
      GROUP BY last_state
      ORDER BY MIN(
        CASE last_state
          WHEN 'landing_only' THEN 1
          WHEN 'audit_cta_exposed_only' THEN 2
          WHEN 'audit_cta_clicked' THEN 3
          WHEN 'audit_submitted' THEN 4
          WHEN 'audit_accepted' THEN 5
          WHEN 'audit_started' THEN 6
          WHEN 'audit_completed_unviewed' THEN 7
          WHEN 'result_viewed' THEN 8
          WHEN 'finding_engaged' THEN 9
          WHEN 'repair_sprint_exposed' THEN 10
          WHEN 'repair_sprint_clicked' THEN 11
          WHEN 'checkout_started' THEN 12
          WHEN 'purchase_completed' THEN 13
          ELSE 99
        END
      );
    `)

    // 4. Integrity Checks
    const orphanPurchases = await pool.query(`
      SELECT p.id, p.transaction_id
      FROM analytics_event_ledger p
      WHERE p.event_name = 'purchase_completed'
        AND NOT EXISTS (
          SELECT 1 FROM analytics_event_ledger c
          WHERE c.event_name = 'checkout_started'
            AND (
              (c.checkout_session_id IS NOT NULL AND c.checkout_session_id = p.checkout_session_id)
              OR (c.audit_id IS NOT NULL AND c.audit_id = p.audit_id)
            )
        )
    `)

    const output = {
      timestamp: new Date().toISOString(),
      funnelA_AuditActivation: funnelAEvents.map((evt) => ({
        event: evt,
        uniqueEntities: counts.get(evt)?.unique || 0,
        totalEvents: counts.get(evt)?.total || 0,
      })),
      funnelD_FullCommercial: funnelDEvents.map((evt) => ({
        event: evt,
        uniqueEntities: counts.get(evt)?.unique || 0,
        totalEvents: counts.get(evt)?.total || 0,
      })),
      lastMeaningfulState: lastStateRes.rows.map((r) => ({
        state: r.last_state,
        journeys: parseInt(r.journey_count, 10),
        pct: parseFloat(r.percentage).toFixed(1) + '%',
      })),
      integrity: {
        orphanPurchases: orphanPurchases.rowCount,
      },
    }

    if (isJson) {
      console.log(JSON.stringify(output, null, 2))
    } else {
      console.log('=================================================================')
      console.log('           NEBULA FUNNEL OBSERVABILITY & DIAGNOSTICS            ')
      console.log('=================================================================\n')
      console.log('--- FUNNEL A: AUDIT ACTIVATION ---')
      console.table(output.funnelA_AuditActivation)
      console.log('\n--- FUNNEL D: FULL COMMERCIAL JOURNEY ---')
      console.table(output.funnelD_FullCommercial)
      console.log('\n--- LAST MEANINGFUL STATE REACHED BEFORE ABANDONMENT ---')
      console.table(output.lastMeaningfulState)
      console.log('\n--- INTEGRITY CHECKS ---')
      console.log(`Orphan Purchases without Checkout: ${output.integrity.orphanPurchases}`)
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
