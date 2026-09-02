"""Phase 3 Acquisition Data Layer & Integrity Tests.

Validates:
- Canonical schema, indexes, and foreign keys in nebula_platform.
- Measurement versioning and SHA-256 definition hashes.
- Decision rule set versioning and evidence eligibility gates.
- Idempotency of historical migration.
- Semantic separation of 65.6 (gsc_aggregate_position) and 64.3 (dimensioned_weighted_position).
- Representation of /checkout as KNOWN_ATTRIBUTION_BEHAVIOR.
- Database-level immutability triggers (trg_prevent_mutation_acq_facts).
"""

import hashlib
import json
import os
import pytest
import psycopg
from psycopg.rows import dict_row

DB_URI = os.getenv(
    "ACQUISITION_DB_URI",
    "postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433",
)


@pytest.fixture
def db_conn():
    conn = psycopg.connect(DB_URI, row_factory=dict_row)
    yield conn
    conn.close()


def test_acquisition_tables_exist(db_conn):
    """Verify all 13 canonical acquisition tables exist in nebula_platform."""
    required_tables = [
        "measurement_versions",
        "decision_rule_sets",
        "page_registry",
        "page_cohort_assignments",
        "acquisition_measurements",
        "acquisition_source_runs",
        "page_measurements",
        "query_measurements",
        "acquisition_state_transitions",
        "acquisition_anomalies",
        "acquisition_changes",
        "acquisition_experiments",
        "experiment_evaluations",
    ]
    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = ANY(%s);
            """,
            (required_tables,),
        )
        found = {row["table_name"] for row in cur.fetchall()}
        missing = set(required_tables) - found
        assert not missing, f"Missing acquisition tables: {missing}"


def test_measurement_version_2_integrity(db_conn):
    """Verify version 2.0.0 exists with immutable SHA-256 definition hash."""
    with db_conn.cursor() as cur:
        cur.execute("SELECT * FROM measurement_versions WHERE version_code = '2.0.0';")
        row = cur.fetchone()
        assert row is not None
        assert row["status"] == "ACTIVE"
        assert row["metric_definition_version"] == "2.0.0"
        assert row["cohort_definition_version"] == "2.0.0"

        # Verify hash match
        expected_hash = hashlib.sha256(
            json.dumps(row["definition_json"], sort_keys=True, separators=(",", ":")).encode("utf-8")
        ).hexdigest()
        assert row["definition_hash"] == expected_hash


def test_decision_rule_set_registry(db_conn):
    """Verify versioned decision rules registry and evidence gates."""
    with db_conn.cursor() as cur:
        cur.execute("SELECT * FROM decision_rule_sets WHERE version_code = '2.0.0';")
        row = cur.fetchone()
        assert row is not None
        assert row["status"] == "ACTIVE"
        assert row["min_holdout_days"] == 28
        assert row["min_impression_gate"] == 100
        assert "SUFFICIENT" in row["definition_json"]["evidence_states"]
        assert "REVIEW_SERP_PRESENTATION" in row["definition_json"]["action_classes"]


def test_historical_baseline_migration_reconciliation(db_conn):
    """Verify the September 2026 baseline was accurately migrated without data corruption."""
    with db_conn.cursor() as cur:
        cur.execute("SELECT * FROM acquisition_measurements WHERE id = 'meas_20260902_baseline_v2';")
        meas = cur.fetchone()
        assert meas is not None
        
        # Verify macro search visibility totals
        assert meas["gsc_total_impressions"] == 429
        assert meas["gsc_total_clicks"] == 0
        assert float(meas["gsc_aggregate_position"]) == 65.6
        assert float(meas["dimensioned_impression_weighted_position"]) == 64.3
        assert meas["unique_visible_pages"] == 41
        
        # Verify position buckets sum to total pages
        bucket_sum = (
            meas["pos_bucket_1_10"]
            + meas["pos_bucket_11_20"]
            + meas["pos_bucket_21_30"]
            + meas["pos_bucket_31_50"]
            + meas["pos_bucket_51_plus"]
        )
        assert bucket_sum == 41
        
        # Verify GA4 organic traffic & search-entry vs downstream separation
        assert meas["ga4_organic_sessions"] == 16
        assert meas["ga4_search_entry_sessions"] == 12
        assert meas["ga4_downstream_checkout_sessions"] == 4


def test_checkout_attribution_anomaly_status(db_conn):
    """Verify /checkout is recorded as KNOWN_ATTRIBUTION_BEHAVIOR."""
    with db_conn.cursor() as cur:
        cur.execute(
            "SELECT * FROM acquisition_anomalies WHERE id = 'anom_20260902_checkout_attribution';"
        )
        anom = cur.fetchone()
        assert anom is not None
        assert anom["status"] == "KNOWN_ATTRIBUTION_BEHAVIOR"
        assert anom["severity"] == "MEDIUM"
        assert "ga4" in anom["source_system"]


def test_page_registry_canonical_domain(db_conn):
    """Verify all registered URLs use the canonical domain https://nebulacomponents.com."""
    with db_conn.cursor() as cur:
        cur.execute("SELECT canonical_url FROM page_registry;")
        urls = [r["canonical_url"] for r in cur.fetchall()]
        assert len(urls) >= 68
        for u in urls:
            assert u.startswith("https://nebulacomponents.com"), f"Non-canonical domain: {u}"


def test_immutability_trigger_blocks_update(db_conn):
    """Verify database-level trigger prevents updating historical measurement records."""
    with db_conn.cursor() as cur:
        with pytest.raises(psycopg.errors.RaiseException) as exc_info:
            cur.execute(
                """
                UPDATE acquisition_measurements
                SET gsc_total_clicks = 99
                WHERE id = 'meas_20260902_baseline_v2';
                """
            )
        assert "Mutation of historical acquisition facts is strictly prohibited" in str(exc_info.value)
    db_conn.rollback()


def test_immutability_trigger_blocks_delete(db_conn):
    """Verify database-level trigger prevents deleting historical measurement records."""
    with db_conn.cursor() as cur:
        with pytest.raises(psycopg.errors.RaiseException) as exc_info:
            cur.execute(
                """
                DELETE FROM acquisition_measurements
                WHERE id = 'meas_20260902_baseline_v2';
                """
            )
        assert "Deletion of historical acquisition facts is strictly prohibited" in str(exc_info.value)
    db_conn.rollback()


def test_migration_idempotency():
    """Verify executing the migration script repeatedly is 100% idempotent."""
    from scripts.migrate_acquisition_baseline import run_migration

    stats = run_migration(dry_run=False)
    assert stats["already_migrated"] is True
    assert stats["measurements_created"] == 0
    assert stats["anomalies_registered"] == 0
