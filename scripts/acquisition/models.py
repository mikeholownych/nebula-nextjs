"""Data models, constants, and typing for the Acquisition Learning System."""

import os
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Set

BASE_URL = "https://nebulacomponents.com"
DEFAULT_DB_URI = os.getenv(
    "ACQUISITION_DB_URI",
    "postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433",
)

# Canonical Cohort Names
COHORTS: Set[str] = {
    "problem_intent",
    "commercial_comparison",
    "category",
    "vertical_use_case",
    "resources",
    "teardown_index",
    "individual_teardown",
    "case_study",
    "product_core",
    "checkout",
    "utility_legal",
    "other",
}

# Position Bucket Boundaries (Inclusive)
POSITION_BUCKETS = {
    "POS_1_10": (1.0, 10.4),
    "POS_11_20": (10.5, 20.4),
    "POS_21_30": (20.5, 30.4),
    "POS_31_50": (30.5, 50.4),
    "POS_51_PLUS": (50.5, float("inf")),
}

# Search Visibility States
SEARCH_STATES = [
    "UNSEEN",
    "SERP_IMPRESSION",
    "POS_51_PLUS",
    "TOP_50",
    "TOP_30",
    "TOP_20",
    "TOP_10",
    "SERP_CLICKED",
]

# Product Journey States
PRODUCT_STATES = [
    "LANDING_VIEWED",
    "ENGAGED_CTA",
    "AUDIT_SUBMITTED",
    "AUDIT_STARTED",
    "AUDIT_COMPLETED",
    "RESULT_VIEWED",
    "REPAIR_EXPOSED",
    "CHECKOUT_STARTED",
    "PURCHASE_COMPLETED",
]

# Deterministic Trend Classifications
TREND_CLASSES = [
    "IMPROVING",
    "STABLE",
    "DECLINING",
    "STALLED",
    "VOLATILE",
    "INSUFFICIENT_EVIDENCE",
    "BLOCKED",
]


@dataclass
class PageRecord:
    id: Optional[str]
    canonical_url: str
    route_path: str
    route_pattern: str
    route_type: str
    cohort_name: str
    sitemap_priority: float = 0.7
    is_indexable: bool = True
    is_active: bool = True


@dataclass
class GSCRawTotals:
    impressions: int
    clicks: int
    ctr: float
    position: float
    source: str = "dimensionless_aggregate"
    is_complete: bool = True


@dataclass
class GSCRow:
    page: str
    query: str
    impressions: int
    clicks: int
    ctr: float
    position: float


@dataclass
class GA4LandingRow:
    landing_page: str
    sessions: int
    users: int
    pageviews: int
    bounce_rate: float
    engagement_rate: float


@dataclass
class LedgerTotals:
    audit_started: int = 0
    audit_completed: int = 0
    checkout_started: int = 0
    purchases: int = 0


@dataclass
class NormalizedMeasurement:
    measurement_id: str
    measurement_version: int
    measurement_version_code: str
    generated_at: datetime
    requested_start: date
    requested_end: date
    effective_start: date
    effective_end: date
    source_native_start: date
    source_native_end: date
    source_native_timezone: str
    canonical_timezone: str
    window_days: int
    
    # Search Visibility
    gsc_total_impressions: int
    gsc_total_clicks: int
    gsc_aggregate_position: float
    dimensioned_impression_weighted_position: float
    unique_visible_pages: int
    unique_visible_queries: int
    
    # Buckets
    pos_bucket_1_10: int
    pos_bucket_11_20: int
    pos_bucket_21_30: int
    pos_bucket_31_50: int
    pos_bucket_51_plus: int
    
    # GA4 Traffic
    ga4_organic_sessions: int
    ga4_organic_users: int
    ga4_search_entry_sessions: int
    ga4_downstream_checkout_sessions: int
    
    # Internal Ledger
    internal_audit_started: int
    internal_audit_completed: int
    internal_checkout_started: int
    internal_purchases: int
    
    # Metadata
    source_filters: Dict[str, Any] = field(default_factory=dict)
    source_query_parameters: Dict[str, Any] = field(default_factory=dict)
    data_completeness_status: str = "COMPLETE"
    source_finalization_status: str = "FINAL"
    known_anomalies: List[str] = field(default_factory=list)
    known_blockers: List[str] = field(default_factory=list)
    measurement_code_commit: str = ""
    application_commit: Optional[str] = None
