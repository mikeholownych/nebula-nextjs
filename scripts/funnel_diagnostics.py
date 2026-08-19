#!/usr/bin/env python3
"""
Nebula Funnel Diagnostics CLI (Python Edition)

Reconstructs end-to-end commercial funnels using First-Class Canonical Journey IDs,
tracks Operational Multiplicity, evaluates Furthest State Semantic Classifications,
and audits Data-Quality SLOs directly against PostgreSQL.

Usage:
  python3 scripts/funnel_diagnostics.py [--json] [--include-test]
"""

import sys
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor


def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("PGHOST", "/var/run/postgresql"),
        port=int(os.getenv("PGPORT", "5433")),
        dbname=os.getenv("PGDATABASE", "nebula_platform"),
        user=os.getenv("PGUSER", "postgres"),
    )


def run_diagnostics():
    is_json = "--json" in sys.argv
    include_test = "--include-test" in sys.argv or "--all" in sys.argv

    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            where_live = (
                ""
                if include_test
                else "WHERE is_synthetic = FALSE AND environment = 'production' AND payment_mode = 'live'"
            )

            # 1. Stage Counts with First-Class Journey ID and Operational Multiplicity
            cur.execute(f"""
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
                {where_live}
                GROUP BY event_name, stage
            """)
            counts_rows = cur.fetchall()
            counts = {r["event_name"]: r for r in counts_rows}

            funnel_a_events = [
                {"name": "landing_page_view", "entity": "session"},
                {"name": "audit_cta_exposed", "entity": "session"},
                {"name": "audit_cta_clicked", "entity": "session"},
                {"name": "audit_url_submitted", "entity": "audit_attempt"},
                {"name": "audit_accepted", "entity": "audit_attempt"},
                {"name": "audit_started", "entity": "audit_attempt"},
                {"name": "audit_completed", "entity": "audit"},
                {"name": "audit_result_viewed", "entity": "audit"},
            ]

            funnel_d_events = [
                {"name": "landing_page_view", "entity": "session"},
                {"name": "audit_url_submitted", "entity": "audit_attempt"},
                {"name": "audit_completed", "entity": "audit"},
                {"name": "audit_result_viewed", "entity": "audit"},
                {"name": "repair_sprint_clicked", "entity": "audit"},
                {"name": "checkout_started", "entity": "checkout"},
                {"name": "purchase_completed", "entity": "transaction"},
            ]

            def format_funnel(events):
                steps = []
                first_journeys = 0
                prev_journeys = 0
                for idx, step in enumerate(events):
                    stat = counts.get(
                        step["name"],
                        {
                            "reaching_journeys": 0,
                            "operational_entities": 0,
                            "total_events": 0,
                        },
                    )
                    journeys = stat["reaching_journeys"]
                    if idx > 0 and journeys > prev_journeys:
                        journeys = prev_journeys

                    mult_ratio = (
                        f"{(stat['operational_entities'] / journeys):.1f}x"
                        if journeys > 0
                        else "1.0x"
                    )

                    if idx == 0:
                        first_journeys = journeys
                        prev_journeys = journeys
                        steps.append(
                            {
                                "event": step["name"],
                                "journeysReached": journeys,
                                "stepConversion": (
                                    "100.0%" if first_journeys > 0 else "N/A"
                                ),
                                "funnelConversion": (
                                    "100.0%" if first_journeys > 0 else "N/A"
                                ),
                                "dropOffRate": (
                                    "0.0%" if first_journeys > 0 else "N/A"
                                ),
                                "nativeEntities": f"{stat['operational_entities']} {step['entity']}s",
                                "multiplicity": mult_ratio,
                                "totalEvents": stat["total_events"],
                            }
                        )
                    else:
                        step_conv = (
                            f"{(journeys / prev_journeys) * 100:.1f}%"
                            if prev_journeys > 0
                            else "N/A"
                        )
                        full_conv = (
                            f"{(journeys / first_journeys) * 100:.1f}%"
                            if first_journeys > 0
                            else "N/A"
                        )
                        drop_off = (
                            f"{((prev_journeys - journeys) / prev_journeys) * 100:.1f}%"
                            if prev_journeys > 0
                            else "N/A"
                        )
                        prev_journeys = journeys
                        steps.append(
                            {
                                "event": step["name"],
                                "journeysReached": journeys,
                                "stepConversion": step_conv,
                                "funnelConversion": full_conv,
                                "dropOffRate": drop_off,
                                "nativeEntities": f"{stat['operational_entities']} {step['entity']}s",
                                "multiplicity": mult_ratio,
                                "totalEvents": stat["total_events"],
                            }
                        )
                return steps

            # 2. Furthest Meaningful State & Semantic Classification
            cur.execute(f"""
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
                    {where_live}
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
            """)
            last_state_rows = cur.fetchall()

            # 3. Data Quality SLOs
            cur.execute("""
                SELECT COUNT(DISTINCT c.audit_id) as count
                FROM analytics_event_ledger c
                WHERE c.event_name = 'audit_completed'
                  AND c.audit_id IS NOT NULL
                  AND NOT EXISTS (
                    SELECT 1 FROM analytics_event_ledger s
                    WHERE s.event_name = 'audit_started'
                      AND s.audit_id = c.audit_id
                  )
            """)
            orphan_audits = cur.fetchone()["count"]

            cur.execute("""
                SELECT COUNT(DISTINCT r.audit_id) as count
                FROM analytics_event_ledger r
                WHERE r.event_name = 'audit_result_viewed'
                  AND r.audit_id IS NOT NULL
                  AND NOT EXISTS (
                    SELECT 1 FROM analytics_event_ledger c
                    WHERE c.event_name = 'audit_completed'
                      AND (c.audit_id = r.audit_id OR c.journey_id = r.journey_id)
                  )
            """)
            orphan_results = cur.fetchone()["count"]

            cur.execute("""
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
            """)
            dup_txs = cur.fetchone()["count"]

            cur.execute("""
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
            """)
            orphan_purchases = cur.fetchone()["count"]

            cur.execute(f"""
                SELECT 
                  COUNT(DISTINCT COALESCE(journey_id, audit_id, audit_attempt_id)) as total_audits,
                  COUNT(DISTINCT CASE WHEN utm_source IS NOT NULL OR referrer_class IS NOT NULL THEN COALESCE(journey_id, audit_id, audit_attempt_id) END) as attributed_audits
                FROM analytics_event_ledger
                {where_live + " AND event_name IN ('audit_url_submitted', 'audit_accepted', 'audit_started')" if where_live else "WHERE event_name IN ('audit_url_submitted', 'audit_accepted', 'audit_started')"}
            """)
            attr_row = cur.fetchone()
            total_audits = attr_row["total_audits"]
            attr_audits = attr_row["attributed_audits"]
            attr_pct = (
                f"{(attr_audits / total_audits) * 100:.1f}%"
                if total_audits > 0
                else "N/A (0 eligible journeys)"
            )

            output = {
                "timestamp": psycopg2.Timestamp(2026, 8, 19, 0, 0, 0).__str__(),
                "mode": (
                    "ALL TRAFFIC (Including Synthetic/Test Data)"
                    if include_test
                    else "LIVE PRODUCTION ONLY (Zero Synthetic)"
                ),
                "funnelA_AuditActivation": format_funnel(funnel_a_events),
                "funnelD_FullCommercial": format_funnel(funnel_d_events),
                "furthestMeaningfulState": [
                    {
                        "state": r["state_name"],
                        "category": r["classification"],
                        "journeys": int(r["journey_count"]),
                        "pct": f"{float(r['percentage']):.1f}%",
                    }
                    for r in last_state_rows
                ],
                "dataQualitySLOs": {
                    "auditCompletedWithoutStarted": int(orphan_audits),
                    "resultViewedWithoutCompleted": int(orphan_results),
                    "duplicateLiveTransactions": int(dup_txs),
                    "purchaseWithoutCheckout": int(orphan_purchases),
                    "unclassifiedJourneys": sum(
                        1
                        for r in last_state_rows
                        if r["state_name"] == "unclassified"
                    ),
                    "attributionCompleteness": attr_pct,
                },
            }

            if is_json:
                print(json.dumps(output, indent=2, default=str))
            else:
                print(
                    "================================================================="
                )
                print(
                    "           NEBULA FUNNEL OBSERVABILITY & DIAGNOSTICS            "
                )
                print(f"           MODE: {output['mode']}")
                print(
                    "=================================================================\n"
                )
                print("--- FUNNEL A: AUDIT ACTIVATION (JOURNEY-DENOMINATED) ---")
                print(
                    f"{'Event':<22} | {'Journeys':<8} | {'Step Conv':<9} | {'Full Conv':<9} | {'Drop-off':<8} | {'Native Entities':<18} | {'Multiplicity':<12}"
                )
                print("-" * 98)
                for s in output["funnelA_AuditActivation"]:
                    print(
                        f"{s['event']:<22} | {s['journeysReached']:<8} | {s['stepConversion']:<9} | {s['funnelConversion']:<9} | {s['dropOffRate']:<8} | {s['nativeEntities']:<18} | {s['multiplicity']:<12}"
                    )

                print(
                    "\n--- FUNNEL D: FULL COMMERCIAL JOURNEY (JOURNEY-DENOMINATED) ---"
                )
                print(
                    f"{'Event':<22} | {'Journeys':<8} | {'Step Conv':<9} | {'Full Conv':<9} | {'Drop-off':<8} | {'Native Entities':<18} | {'Multiplicity':<12}"
                )
                print("-" * 98)
                for s in output["funnelD_FullCommercial"]:
                    print(
                        f"{s['event']:<22} | {s['journeysReached']:<8} | {s['stepConversion']:<9} | {s['funnelConversion']:<9} | {s['dropOffRate']:<8} | {s['nativeEntities']:<18} | {s['multiplicity']:<12}"
                    )

                print(
                    "\n--- FURTHEST MEANINGFUL STATE REACHED (GRANULAR SEMANTIC CATEGORIES) ---"
                )
                print(
                    f"{'State':<28} | {'Classification':<22} | {'Journeys':<8} | {'Percentage':<8}"
                )
                print("-" * 75)
                for s in output["furthestMeaningfulState"]:
                    print(
                        f"{s['state']:<28} | {s['category']:<22} | {s['journeys']:<8} | {s['pct']:<8}"
                    )

                print("\n--- DATA-QUALITY SLOs & TELEMETRY INTEGRITY ---")
                print(
                    f"• Audits Completed without Start Event:    {output['dataQualitySLOs']['auditCompletedWithoutStarted']} (Target: 0)"
                )
                print(
                    f"• Results Viewed without Completed Event:  {output['dataQualitySLOs']['resultViewedWithoutCompleted']} (Target: 0)"
                )
                print(
                    f"• Duplicate Live Transaction IDs:          {output['dataQualitySLOs']['duplicateLiveTransactions']} (Target: 0)"
                )
                print(
                    f"• Purchases without Checkout Started:      {output['dataQualitySLOs']['purchaseWithoutCheckout']} (Target: 0)"
                )
                print(
                    f"• Unclassified Journey States:             {output['dataQualitySLOs']['unclassifiedJourneys']} (Target: 0)"
                )
                print(
                    f"• Attribution Context Completeness:        {output['dataQualitySLOs']['attributionCompleteness']} (Target: >95% when N > 0)"
                )
                print(
                    "=================================================================\n"
                )

    finally:
        conn.close()


if __name__ == "__main__":
    run_diagnostics()
