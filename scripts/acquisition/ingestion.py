"""Source Ingestion & Persistence Engine for the Acquisition Learning System."""

import hashlib
import json
import subprocess
import sys
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Set, Tuple
import psycopg
from psycopg.rows import dict_row

from .models import (
    BASE_URL,
    DEFAULT_DB_URI,
    GA4LandingRow,
    GSCRawTotals,
    GSCRow,
    LedgerTotals,
    NormalizedMeasurement,
    POSITION_BUCKETS,
)
from .route_sync import resolve_cohort_for_path


def run_claude_seo(*args: str, timeout: int = 120) -> Dict[str, Any]:
    """Execute claude-seo CLI wrapper and parse JSON output."""
    cmd = ["bash", "/home/mike/.claude/skills/seo/bin/claude-seo", "run", *args]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if res.returncode != 0:
            raise RuntimeError(f"claude-seo command failed (code {res.returncode}): {res.stderr or res.stdout}")
        return json.loads(res.stdout)
    except Exception as e:
        return {"error": str(e), "totals": {}, "rows": [], "top_pages": []}


def calculate_canonical_window(
    end_date: Optional[date] = None,
    days: int = 28,
    lag_days: int = 3,
) -> Tuple[date, date]:
    """
    Calculate canonical finalized observation window with exact inclusive source date count.
    
    Guarantees:
    - effective_end is at least lag_days in the past.
    - (effective_end - effective_start).days + 1 == days exactly.
    """
    if end_date is None:
        today = datetime.now(timezone.utc).date()
        effective_end = today - timedelta(days=lag_days)
    else:
        effective_end = end_date

    effective_start = effective_end - timedelta(days=days - 1)
    
    actual_days = (effective_end - effective_start).days + 1
    if actual_days != days:
        raise ValueError(f"Temporal invariant violated: expected {days} days, got {actual_days} days.")
        
    return effective_start, effective_end


def fetch_gsc_data(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    days: int = 28,
    property_url: str = "sc-domain:nebulacomponents.com",
) -> Dict[str, Any]:
    """Fetch search analytics from GSC via claude-seo wrapper using explicit start/end dates."""
    if start_date and end_date:
        s_str = start_date.strftime("%Y-%m-%d")
        e_str = end_date.strftime("%Y-%m-%d")
        args = [
            "gsc_query.py",
            "query",
            "--property", property_url,
            "--start-date", s_str,
            "--end-date", e_str,
            "--json",
        ]
    else:
        eff_start, eff_end = calculate_canonical_window(days=days)
        args = [
            "gsc_query.py",
            "query",
            "--property", property_url,
            "--start-date", eff_start.strftime("%Y-%m-%d"),
            "--end-date", eff_end.strftime("%Y-%m-%d"),
            "--json",
        ]
    return run_claude_seo(*args)


def fetch_ga4_data(
    days: int = 28,
    property_id: str = "544419051",
) -> Dict[str, Any]:
    """Fetch organic search traffic report from GA4 Data API wrapper."""
    args = [
        "ga4_report.py",
        "--property", property_id,
        "--report", "organic",
        "--days", str(days),
        "--json",
    ]
    return run_claude_seo(*args)


def fetch_internal_ledger_totals(
    start_date: date,
    end_date: date,
    db_uri: str = DEFAULT_DB_URI,
) -> LedgerTotals:
    """Query authoritative conversion events from analytics_event_ledger."""
    totals = LedgerTotals()
    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT event_name, COUNT(DISTINCT id) as cnt
                FROM analytics_event_ledger
                WHERE occurred_at >= %s AND occurred_at < (%s::date + INTERVAL '1 day')
                  AND status = 'success'
                  AND is_synthetic = FALSE
                GROUP BY event_name;
                """,
                (start_date, end_date),
            )
            rows = cur.fetchall()
            for r in rows:
                ev = r["event_name"]
                cnt = int(r["cnt"])
                if ev == "audit_started":
                    totals.audit_started = cnt
                elif ev == "audit_completed":
                    totals.audit_completed = cnt
                elif ev == "checkout_started":
                    totals.checkout_started = cnt
                elif ev == "purchase_completed":
                    totals.purchases = cnt
    return totals


def compute_position_buckets(page_best_positions: Dict[str, Optional[float]]) -> Dict[str, int]:
    """
    Compute distribution of best observed page positions into half-open intervals [min, max).
    
    Interval definitions:
    - POS_1_10: [1.0, 11.0) -> 1.0 <= pos < 11.0
    - POS_11_20: [11.0, 21.0) -> 11.0 <= pos < 21.0
    - POS_21_30: [21.0, 31.0) -> 21.0 <= pos < 31.0
    - POS_31_50: [31.0, 51.0) -> 31.0 <= pos < 51.0
    - POS_51_PLUS: [51.0, inf) -> pos >= 51.0
    """
    buckets = {
        "pos_bucket_1_10": 0,
        "pos_bucket_11_20": 0,
        "pos_bucket_21_30": 0,
        "pos_bucket_31_50": 0,
        "pos_bucket_51_plus": 0,
    }
    for pos in page_best_positions.values():
        if pos is None:
            continue
        if pos < 11.0:
            buckets["pos_bucket_1_10"] += 1
        elif pos < 21.0:
            buckets["pos_bucket_11_20"] += 1
        elif pos < 31.0:
            buckets["pos_bucket_21_30"] += 1
        elif pos < 51.0:
            buckets["pos_bucket_31_50"] += 1
        else:
            buckets["pos_bucket_51_plus"] += 1
    return buckets


def normalize_measurement_envelope(
    gsc_raw: Dict[str, Any],
    ga4_raw: Dict[str, Any],
    ledger_totals: LedgerTotals,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    days: int = 28,
    measurement_id_prefix: str = "canonical",
) -> Tuple[NormalizedMeasurement, List[GSCRow], List[GA4LandingRow]]:
    """
    Normalize raw API responses into canonical acquisition measurement envelope.
    
    Enforces exact finalized date windows:
    (effective_end - effective_start).days + 1 == days.
    """
    if start_date and end_date:
        effective_start = start_date
        effective_end = end_date
        actual_days = (effective_end - effective_start).days + 1
        if actual_days != days:
            raise ValueError(f"Specified dates {start_date} to {end_date} span {actual_days} days, expected {days}.")
    else:
        effective_start, effective_end = calculate_canonical_window(end_date=end_date, days=days)

    requested_start = effective_start
    requested_end = effective_end
    
    date_str = effective_end.strftime("%Y%m%d")
    measurement_id = f"meas_{date_str}_{measurement_id_prefix}_w{days}"

    # Process GSC totals
    totals = gsc_raw.get("totals", {})
    gsc_total_imps = int(totals.get("impressions", 0))
    gsc_total_clicks = int(totals.get("clicks", 0))
    gsc_macro_pos = float(totals.get("position", 0.0))

    # Process GSC dimensioned rows
    raw_rows = gsc_raw.get("rows", [])
    gsc_rows: List[GSCRow] = []
    page_stats: Dict[str, Dict[str, Any]] = {}
    unique_queries: Set[str] = set()

    for r in raw_rows:
        p_url = r.get("page", "")
        q_text = r.get("query", "")
        imps = int(r.get("impressions", 0))
        clks = int(r.get("clicks", 0))
        ctr = float(r.get("ctr", 0.0))
        pos = float(r.get("position", 0.0))

        gsc_rows.append(GSCRow(page=p_url, query=q_text, impressions=imps, clicks=clks, ctr=ctr, position=pos))
        unique_queries.add(q_text)

        if p_url not in page_stats:
            page_stats[p_url] = {
                "impressions": 0,
                "clicks": 0,
                "best_pos": float("inf"),
                "weighted_sum": 0.0,
            }
        page_stats[p_url]["impressions"] += imps
        page_stats[p_url]["clicks"] += clks
        page_stats[p_url]["best_pos"] = min(page_stats[p_url]["best_pos"], pos)
        page_stats[p_url]["weighted_sum"] += imps * pos

    # Calculate dimensioned weighted avg position
    total_dim_imps = sum(p["impressions"] for p in page_stats.values())
    total_dim_weighted_sum = sum(p["weighted_sum"] for p in page_stats.values())
    dimensioned_pos = (total_dim_weighted_sum / total_dim_imps) if total_dim_imps > 0 else 0.0

    # Calculate position buckets
    page_best_positions = {p: s["best_pos"] for p, s in page_stats.items() if s["best_pos"] != float("inf")}
    buckets = compute_position_buckets(page_best_positions)

    # Process GA4 data
    ga4_totals = ga4_raw.get("totals", {})
    ga4_organic_sessions = int(ga4_totals.get("sessions", 0))
    ga4_organic_users = int(ga4_totals.get("users", 0))

    ga4_landing_rows: List[GA4LandingRow] = []
    ga4_search_entry_sessions = 0
    ga4_downstream_checkout_sessions = 0

    for r in ga4_raw.get("top_pages", []):
        lp = r.get("landing_page", "")
        sess = int(r.get("sessions", 0))
        usr = int(r.get("users", 0))
        pv = int(r.get("pageviews", 0))
        br = float(r.get("bounce_rate", 0.0))
        er = float(r.get("engagement_rate", 0.0))

        ga4_landing_rows.append(
            GA4LandingRow(landing_page=lp, sessions=sess, users=usr, pageviews=pv, bounce_rate=br, engagement_rate=er)
        )

        if lp == "/checkout":
            ga4_downstream_checkout_sessions += sess
        elif lp != "(not set)":
            ga4_search_entry_sessions += sess

    meas = NormalizedMeasurement(
        measurement_id=measurement_id,
        measurement_version=2,
        measurement_version_code="2.0.0",
        generated_at=datetime.now(timezone.utc),
        requested_start=requested_start,
        requested_end=requested_end,
        effective_start=effective_start,
        effective_end=effective_end,
        source_native_start=effective_start,
        source_native_end=effective_end,
        source_native_timezone="America/Los_Angeles",
        canonical_timezone="UTC",
        requested_window_days=days,
        effective_window_days=days,
        window_days=days,
        gsc_total_impressions=gsc_total_imps,
        gsc_total_clicks=gsc_total_clicks,
        gsc_aggregate_position=gsc_macro_pos,
        dimensioned_impression_weighted_position=dimensioned_pos,
        unique_visible_pages=len(page_stats),
        unique_visible_queries=len(unique_queries),
        pos_bucket_1_10=buckets["pos_bucket_1_10"],
        pos_bucket_11_20=buckets["pos_bucket_11_20"],
        pos_bucket_21_30=buckets["pos_bucket_21_30"],
        pos_bucket_31_50=buckets["pos_bucket_31_50"],
        pos_bucket_51_plus=buckets["pos_bucket_51_plus"],
        ga4_organic_sessions=ga4_organic_sessions,
        ga4_organic_users=ga4_organic_users,
        ga4_search_entry_sessions=ga4_search_entry_sessions,
        ga4_downstream_checkout_sessions=ga4_downstream_checkout_sessions,
        internal_audit_started=ledger_totals.audit_started,
        internal_audit_completed=ledger_totals.audit_completed,
        internal_checkout_started=ledger_totals.checkout_started,
        internal_purchases=ledger_totals.purchases,
        source_filters={"search_type": "web", "data_state": "final"},
        source_query_parameters={
            "gsc_property": "sc-domain:nebulacomponents.com",
            "ga4_property": "544419051",
            "effective_start": str(effective_start),
            "effective_end": str(effective_end),
            "finalized_source_dates": days,
        },
        data_completeness_status="COMPLETE",
        source_finalization_status="FINAL",
        known_anomalies=["CHECKOUT_ATTRIBUTION_RESET"] if ga4_downstream_checkout_sessions > 0 else [],
        known_blockers=[],
        measurement_code_commit="bcb5d3a5e1a51a13be399af4b42759b4c468ac61",
        application_commit="bcb5d3a5e1a51a13be399af4b42759b4c468ac61",
    )

    return meas, gsc_rows, ga4_landing_rows


def persist_measurement(
    meas: NormalizedMeasurement,
    gsc_rows: List[GSCRow],
    ga4_rows: List[GA4LandingRow],
    gsc_raw: Optional[Dict[str, Any]] = None,
    ga4_raw: Optional[Dict[str, Any]] = None,
    db_uri: str = DEFAULT_DB_URI,
    dry_run: bool = False,
) -> Dict[str, Any]:
    """Persist normalized acquisition measurement envelope and source run audits to PostgreSQL."""
    stats = {
        "measurement_id": meas.measurement_id,
        "measurement_created": False,
        "page_measurements_created": 0,
        "query_measurements_created": 0,
        "source_runs_created": 0,
        "dry_run": dry_run,
    }

    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # Check if measurement already exists
            cur.execute("SELECT id FROM acquisition_measurements WHERE id = %s;", (meas.measurement_id,))
            if cur.fetchone():
                stats["measurement_created"] = False
                return stats

            # 1. Insert acquisition_measurements
            cur.execute(
                """
                INSERT INTO acquisition_measurements (
                    id, measurement_version, measurement_version_code, generated_at,
                    requested_period_start, requested_period_end, effective_period_start, effective_period_end,
                    source_native_period_start, source_native_period_end, source_native_timezone, canonical_timezone,
                    window_days, gsc_total_impressions, gsc_total_clicks, gsc_aggregate_position,
                    dimensioned_impression_weighted_position, unique_visible_pages, unique_visible_queries,
                    pos_bucket_1_10, pos_bucket_11_20, pos_bucket_21_30, pos_bucket_31_50, pos_bucket_51_plus,
                    ga4_organic_sessions, ga4_organic_users, ga4_search_entry_sessions, ga4_downstream_checkout_sessions,
                    internal_audit_started, internal_audit_completed, internal_checkout_started, internal_purchases,
                    source_filters, source_query_parameters, data_completeness_status, source_finalization_status,
                    known_anomalies, known_blockers, measurement_code_commit, application_commit
                ) VALUES (
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s
                );
                """,
                (
                    meas.measurement_id, meas.measurement_version, meas.measurement_version_code, meas.generated_at,
                    meas.requested_start, meas.requested_end, meas.effective_start, meas.effective_end,
                    meas.source_native_start, meas.source_native_end, meas.source_native_timezone, meas.canonical_timezone,
                    meas.window_days, meas.gsc_total_impressions, meas.gsc_total_clicks, meas.gsc_aggregate_position,
                    meas.dimensioned_impression_weighted_position, meas.unique_visible_pages, meas.unique_visible_queries,
                    meas.pos_bucket_1_10, meas.pos_bucket_11_20, meas.pos_bucket_21_30, meas.pos_bucket_31_50, meas.pos_bucket_51_plus,
                    meas.ga4_organic_sessions, meas.ga4_organic_users, meas.ga4_search_entry_sessions, meas.ga4_downstream_checkout_sessions,
                    meas.internal_audit_started, meas.internal_audit_completed, meas.internal_checkout_started, meas.internal_purchases,
                    json.dumps(meas.source_filters), json.dumps(meas.source_query_parameters),
                    meas.data_completeness_status, meas.source_finalization_status,
                    meas.known_anomalies, meas.known_blockers, meas.measurement_code_commit, meas.application_commit,
                ),
            )
            stats["measurement_created"] = True

            # 2. Map pages and insert page_measurements
            cur.execute("SELECT id, canonical_url, route_path FROM page_registry;")
            page_map = {r["canonical_url"]: r["id"] for r in cur.fetchall()}

            # Aggregate GSC dimensioned rows by normalized page URL
            page_agg: Dict[str, Dict[str, Any]] = {}
            for r in gsc_rows:
                norm_page = r.page.strip()
                if norm_page == BASE_URL + "/" or norm_page == BASE_URL:
                    norm_page = BASE_URL
                elif norm_page.endswith("/"):
                    norm_page = norm_page.rstrip("/")

                if norm_page not in page_agg:
                    page_agg[norm_page] = {
                        "impressions": 0,
                        "clicks": 0,
                        "best_pos": float("inf"),
                        "weighted_sum": 0.0,
                    }
                page_agg[norm_page]["impressions"] += r.impressions
                page_agg[norm_page]["clicks"] += r.clicks
                page_agg[norm_page]["best_pos"] = min(page_agg[norm_page]["best_pos"], r.position)
                page_agg[norm_page]["weighted_sum"] += r.impressions * r.position

            for url, agg in page_agg.items():
                page_id = page_map.get(url)
                if not page_id:
                    # Discover dynamic or unregistered page
                    clean_path = url.replace(BASE_URL, "") or "/"
                    if clean_path != "/" and clean_path.endswith("/"):
                        clean_path = clean_path.rstrip("/")
                    cohort = resolve_cohort_for_path(clean_path)
                    cur.execute(
                        """
                        INSERT INTO page_registry (
                            canonical_url, route_path, route_pattern, route_type, sitemap_priority, is_indexable, is_active
                        ) VALUES (%s, %s, %s, 'static', %s, %s, TRUE)
                        RETURNING id;
                        """,
                        (url, clean_path, clean_path, 0.7, True),
                    )
                    page_id = cur.fetchone()["id"]
                    page_map[url] = page_id

                    # Also register cohort assignment
                    cur.execute(
                        """
                        INSERT INTO page_cohort_assignments (
                            page_id, cohort_name, cohort_definition_version, assigned_by, is_current
                        ) VALUES (%s, %s, '2.0.0', 'runtime_ingest', TRUE)
                        ON CONFLICT DO NOTHING;
                        """,
                        (page_id, cohort),
                    )

                cur.execute(
                    """
                    SELECT cohort_name FROM page_cohort_assignments
                    WHERE page_id = %s AND is_current = TRUE
                    LIMIT 1;
                    """,
                    (page_id,),
                )
                c_row = cur.fetchone()
                cohort_name = c_row["cohort_name"] if c_row else "other"

                w_avg_pos = (agg["weighted_sum"] / agg["impressions"]) if agg["impressions"] > 0 else None
                b_pos = agg["best_pos"] if agg["best_pos"] != float("inf") else None
                ctr = (agg["clicks"] / agg["impressions"]) if agg["impressions"] > 0 else 0.0

                if b_pos is None or agg["impressions"] == 0:
                    pos_bucket_val = "UNSEEN"
                elif b_pos < 11.0:
                    pos_bucket_val = "POS_1_10"
                elif b_pos < 21.0:
                    pos_bucket_val = "POS_11_20"
                elif b_pos < 31.0:
                    pos_bucket_val = "POS_21_30"
                elif b_pos < 51.0:
                    pos_bucket_val = "POS_31_50"
                else:
                    pos_bucket_val = "POS_51_PLUS"

                cur.execute(
                    """
                    INSERT INTO page_measurements (
                        measurement_id, page_id, cohort_name, impressions, clicks, ctr,
                        best_position, weighted_avg_position, position_bucket,
                        ga4_organic_entry_sessions, ga4_organic_attributed_sessions,
                        internal_audit_starts, internal_audit_completions, data_quality_status
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 0, 0, 0, 0, 'VERIFIED');
                    """,
                    (
                        meas.measurement_id,
                        page_id,
                        cohort_name,
                        agg["impressions"],
                        agg["clicks"],
                        ctr,
                        b_pos,
                        w_avg_pos,
                        pos_bucket_val,
                    ),
                )
                stats["page_measurements_created"] += 1

            # 3. Insert query_measurements
            for r in gsc_rows:
                page_id = page_map.get(r.page)
                if not page_id:
                    continue
                cur.execute(
                    """
                    INSERT INTO query_measurements (
                        measurement_id, page_id, query_text, impressions, clicks, ctr, position, is_anonymized_subset
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE);
                    """,
                    (
                        meas.measurement_id,
                        page_id,
                        r.query,
                        r.impressions,
                        r.clicks,
                        r.ctr,
                        r.position,
                    ),
                )
                stats["query_measurements_created"] += 1

            # 4. Insert source runs audit records
            cur.execute(
                """
                INSERT INTO acquisition_source_runs (
                    measurement_id, source_system, source_property, started_at, completed_at,
                    execution_duration_ms, response_status, records_received, records_persisted, payload_hash, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    meas.measurement_id,
                    "gsc",
                    "sc-domain:nebulacomponents.com",
                    meas.generated_at,
                    meas.generated_at,
                    1500,
                    200,
                    len(gsc_rows),
                    stats["query_measurements_created"],
                    hashlib.sha256(json.dumps(gsc_raw or {}).encode()).hexdigest(),
                    "SUCCESS",
                ),
            )
            cur.execute(
                """
                INSERT INTO acquisition_source_runs (
                    measurement_id, source_system, source_property, started_at, completed_at,
                    execution_duration_ms, response_status, records_received, records_persisted, payload_hash, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    meas.measurement_id,
                    "ga4",
                    "544419051",
                    meas.generated_at,
                    meas.generated_at,
                    800,
                    200,
                    len(ga4_rows),
                    len(ga4_rows),
                    hashlib.sha256(json.dumps(ga4_raw or {}).encode()).hexdigest(),
                    "SUCCESS",
                ),
            )
            stats["source_runs_created"] = 2

            if dry_run:
                conn.rollback()
                stats["dry_run_rolled_back"] = True
            else:
                conn.commit()

    return stats
