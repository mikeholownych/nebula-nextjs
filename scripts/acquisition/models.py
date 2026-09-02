"""Data models, constants, and typing for the Acquisition Learning System."""

import os
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
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

# Position Bucket Boundaries: Half-Open Intervals [min, max)
POSITION_BUCKETS = {
    "POS_1_10": (1.0, 11.0),
    "POS_11_20": (11.0, 21.0),
    "POS_21_30": (21.0, 31.0),
    "POS_31_50": (31.0, 51.0),
    "POS_51_PLUS": (51.0, float("inf")),
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
    "NO_QUALIFIED_SESSION",
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

# Comparison Classes
COMPARISON_CLASSES = [
    "ADJACENT_PERIOD",
    "OVERLAPPING_PERIOD",
    "BASELINE_ANCHORED",
    "SAME_PERIOD_REMEASUREMENT",
    "SOURCE_REVISION",
    "METHODOLOGY_RECONCILIATION",
    "NON_COMPARABLE",
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
    "TREND_NOT_ESTABLISHED",
]

# Change Types
CHANGE_TYPES = [
    "CONTENT",
    "TITLE_META",
    "INTERNAL_LINKING",
    "STRUCTURED_DATA",
    "ROUTE",
    "CANONICAL",
    "INDEXABILITY",
    "NAVIGATION",
    "CTA",
    "LAYOUT",
    "TEARDOWN_CONTENT",
    "CASE_STUDY_CONTENT",
    "TECHNICAL_SEO",
    "EXPERIMENTAL",
    "OTHER",
]

# Actor Types
ACTOR_TYPES = [
    "HUMAN",
    "TERMINAL_AGENT",
    "AUTOMATION",
    "SYSTEM",
]

# Experiment Approval States
EXPERIMENT_STATUSES = [
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "RUNNING",
    "HOLDOUT",
    "ELIGIBLE_FOR_EVALUATION",
    "EVALUATED",
    "CANCELLED",
    "REJECTED",
]

# Evaluation Outcomes (Phase 2 & 5 canonical 6 outcomes)
EVALUATION_OUTCOMES = [
    "SUPPORTED",
    "PARTIALLY_SUPPORTED",
    "NOT_SUPPORTED",
    "INCONCLUSIVE",
    "CONFOUNDED",
    "REGRESSED",
]

# Confounding Severity Levels
CONFOUNDING_LEVELS = [
    "NONE",
    "LOW",
    "MATERIAL",
    "CRITICAL",
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
    position: Optional[float]
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
    requested_window_days: int
    effective_window_days: int
    window_days: int  # Canonical alias for effective_window_days
    
    # Search Visibility
    gsc_total_impressions: int
    gsc_total_clicks: int
    gsc_aggregate_position: Optional[float]
    dimensioned_impression_weighted_position: Optional[float]
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


@dataclass
class ChangeRecord:
    id: str
    change_type: str
    summary: str
    affected_page_ids: List[str]
    affected_cohorts: List[str]
    deployed_commit: str
    deployed_at: datetime
    expected_impact: str
    actor_type: str = "SYSTEM"
    execution_status: str = "DEPLOYED"
    pre_change_measurement_id: Optional[str] = None
    min_observation_days: int = 28
    evaluation_due_date: Optional[date] = None
    logged_by: str = "system"
    rollback_change_id: Optional[str] = None
    rollback_reason: Optional[str] = None
    rollback_at: Optional[datetime] = None


@dataclass
class ExperimentRecord:
    id: str
    change_id: str
    hypothesis_statement: str
    target_metric: str
    expected_direction: str  # INCREASE, DECREASE, MAINTAIN
    pre_metric_value: float
    pre_change_measurement_id: str
    expected_magnitude: Optional[float] = None
    decision_rule_set_id: str = "ruleset_2_0_0"
    measurement_version_id: str = "mver_2_0_0"
    approval_status: str = "DRAFT"
    approved_by: Optional[str] = None
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    effective_change_at: Optional[datetime] = None
    scheduled_evaluation_at: Optional[datetime] = None
    do_not_change_until: Optional[datetime] = None
    minimum_holdout_days: int = 28
    override_reason: Optional[str] = None
    override_actor: Optional[str] = None
    override_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancelled_by: Optional[str] = None
    cancellation_reason: Optional[str] = None


@dataclass
class EvaluationRecord:
    id: Optional[str]
    experiment_id: str
    post_measurement_id: str
    decision_rule_set_id: str
    outcome: str  # SUPPORTED, PARTIALLY_SUPPORTED, NOT_SUPPORTED, INCONCLUSIVE, CONFOUNDED, REGRESSED
    pre_value: float
    post_value: float
    delta_value: float
    delta_percentage: Optional[float]
    confidence_level: str  # HIGH, MEDIUM, LOW, NONE
    confounding_level: str = "NONE"
    confounding_details: Dict[str, Any] = field(default_factory=dict)
    wall_clock_elapsed_days: int = 0
    finalized_source_days: int = 0
    is_clean_window: bool = True
    synthesis_notes: str = ""
    learning_accumulated: Dict[str, Any] = field(default_factory=dict)
    evaluated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# Phase 6 Constants & Dataclasses
# ---------------------------------------------------------------------------

RECOMMENDATION_CLASSES: List[str] = [
    "NO_CHANGE",
    "OBSERVE",
    "INVESTIGATE",
    "REVIEW_QUERY_ALIGNMENT",
    "REVIEW_CONTENT_ALIGNMENT",
    "REVIEW_INTERNAL_LINKING",
    "REVIEW_SERP_PRESENTATION",
    "REVIEW_TECHNICAL_INDEXABILITY",
    "REVIEW_CANNIBALIZATION",
    "CONSOLIDATE",
    "RETIRE",
    "EXPAND_ADJACENCY",
    "RUN_CONTROLLED_EXPERIMENT",
]

EVIDENCE_STATUSES: List[str] = [
    "SUFFICIENT",
    "INSUFFICIENT",
    "INCOMPLETE",
    "BLOCKED",
]

RECOMMENDATION_LIFECYCLE_STATUSES: List[str] = [
    "GENERATED",
    "PENDING_REVIEW",
    "ACCEPTED",
    "REJECTED",
    "DEFERRED",
    "SUPERSEDED",
    "EXPIRED",
]

REVIEW_ACTIONS: List[str] = [
    "ACCEPT",
    "REJECT",
    "DEFER",
    "REQUEST_MORE_EVIDENCE",
]

METRIC_DIRECTIONS: List[str] = [
    "HIGHER_IS_BETTER",
    "LOWER_IS_BETTER",
    "TARGET_RANGE",
    "NON_DIRECTIONAL",
]


@dataclass
class MetricSemantics:
    metric_name: str
    metric_family: str
    preferred_direction: str
    comparison_method: str
    materiality_rule: Dict[str, Any]
    low_volume_rule: str = "NONE"
    low_volume_threshold: int = 5
    null_semantics: str = "ZERO_PRESENCE_NULL"
    eligibility_requirements: Dict[str, Any] = field(default_factory=dict)
    description: str = ""


@dataclass
class QueryIntent:
    id: str
    page_id: str
    primary_topic: str
    secondary_topics: List[str]
    target_query_patterns: List[str]
    intended_intent: str = "COMMERCIAL"
    version: int = 1


@dataclass
class RecommendationRecord:
    id: str
    measurement_id: str
    decision_rule_set_id: str
    target_type: str  # SITEWIDE, COHORT, PAGE, QUERY
    detected_condition: str
    trend_classification: str
    evidence_status: str  # SUFFICIENT, INSUFFICIENT, INCOMPLETE, BLOCKED
    recommendation_class: str
    reason_code: str
    reason_text: str
    primary_metric: str
    supporting_metrics: Dict[str, Any]
    confidence: str  # NONE, LOW, MEDIUM, HIGH
    comparison_measurement_id: Optional[str] = None
    target_page_id: Optional[str] = None
    target_cohort: Optional[str] = None
    search_state: Optional[str] = None
    product_state: Optional[str] = None
    uncertainties: List[str] = field(default_factory=list)
    minimum_observation_period: int = 28
    do_not_change_conditions: List[str] = field(default_factory=list)
    lifecycle_status: str = "GENERATED"
    experiment_candidate_id: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class RecommendationReviewRecord:
    id: str
    recommendation_id: str
    reviewed_by: str
    review_action: str
    review_notes: str
    reviewed_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class RecommendationSuppressionRecord:
    id: str
    target_type: str
    target_id: str
    recommendation_class: str
    suppressed_by: str
    suppression_reason: str
    suppressed_until: datetime
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

