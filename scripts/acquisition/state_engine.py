"""Two-Dimensional State Machine & Transition Engine."""

from typing import Any, Dict, List, Optional, Tuple
import psycopg
from psycopg.rows import dict_row

from .models import DEFAULT_DB_URI, PRODUCT_STATES, SEARCH_STATES

SEARCH_STATE_RANK = {
    "UNSEEN": 0,
    "SERP_IMPRESSION": 1,
    "POS_51_PLUS": 2,
    "TOP_50": 3,
    "TOP_30": 4,
    "TOP_20": 5,
    "TOP_10": 6,
    "SERP_CLICKED": 7,
}


def evaluate_page_search_state(impressions: int, clicks: int, best_pos: Optional[float]) -> str:
    """
    Evaluate search visibility state for a single page in an observation window.
    
    Uses exact half-open intervals [min, max):
    - TOP_10: [1.0, 11.0)
    - TOP_20: [11.0, 21.0)
    - TOP_30: [21.0, 31.0)
    - TOP_50: [31.0, 51.0)
    - POS_51_PLUS: [51.0, inf)
    """
    if impressions == 0:
        return "UNSEEN"
    if clicks > 0:
        return "SERP_CLICKED"
    if best_pos is None:
        return "SERP_IMPRESSION"
    
    if best_pos < 11.0:
        return "TOP_10"
    if best_pos < 21.0:
        return "TOP_20"
    if best_pos < 31.0:
        return "TOP_30"
    if best_pos < 51.0:
        return "TOP_50"
    return "POS_51_PLUS"


def evaluate_page_product_state(
    landing_views: int,
    audit_starts: int,
    audit_completions: int,
    checkout_starts: int,
    purchases: int,
) -> str:
    """Evaluate product journey state for a page or journey aggregate."""
    if purchases > 0:
        return "PURCHASE_COMPLETED"
    if checkout_starts > 0:
        return "CHECKOUT_STARTED"
    if audit_completions > 0:
        return "AUDIT_COMPLETED"
    if audit_starts > 0:
        return "AUDIT_STARTED"
    if landing_views > 0:
        return "LANDING_VIEWED"
    return "NO_QUALIFIED_SESSION"


def evaluate_and_persist_state_transitions(
    current_meas_id: str,
    prev_meas_id: Optional[str] = None,
    db_uri: str = DEFAULT_DB_URI,
    dry_run: bool = False,
) -> List[Dict[str, Any]]:
    """
    Evaluate search visibility and product journey states for all pages and log transitions.
    
    Guarantees:
    - First observation of a page is recorded as INITIAL, never false PROGRESSION.
    - Genuine PROGRESSION or REGRESSION requires verified presence in prev_meas_id.
    - Transitions are persisted immutably to acquisition_state_transitions.
    """
    transitions: List[Dict[str, Any]] = []

    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # 1. Fetch current page measurements
            cur.execute(
                """
                SELECT pm.page_id, pr.canonical_url, pr.route_path, pm.impressions, pm.clicks,
                       pm.best_position, pm.internal_audit_starts, pm.internal_audit_completions
                FROM page_measurements pm
                JOIN page_registry pr ON pm.page_id = pr.id
                WHERE pm.measurement_id = %s;
                """,
                (current_meas_id,),
            )
            curr_pages = {str(r["page_id"]): r for r in cur.fetchall()}

            # 2. Fetch previous page measurements if prev_meas_id provided
            prev_pages: Dict[str, Dict[str, Any]] = {}
            if prev_meas_id and prev_meas_id != current_meas_id:
                cur.execute(
                    """
                    SELECT page_id, impressions, clicks, best_position,
                           internal_audit_starts, internal_audit_completions
                    FROM page_measurements
                    WHERE measurement_id = %s;
                    """,
                    (prev_meas_id,),
                )
                prev_pages = {str(r["page_id"]): r for r in cur.fetchall()}

            # 3. Evaluate transitions per page
            for page_id, curr_r in curr_pages.items():
                curr_search_state = evaluate_page_search_state(
                    curr_r["impressions"], curr_r["clicks"], curr_r["best_position"]
                )
                
                if page_id in prev_pages:
                    prev_r = prev_pages[page_id]
                    prev_search_state = evaluate_page_search_state(
                        prev_r["impressions"], prev_r["clicks"], prev_r["best_position"]
                    )
                    if SEARCH_STATE_RANK.get(curr_search_state, 0) > SEARCH_STATE_RANK.get(prev_search_state, 0):
                        t_type = "PROGRESSION"
                        reason = f"Search rank/visibility improved from {prev_search_state} to {curr_search_state}"
                    elif SEARCH_STATE_RANK.get(curr_search_state, 0) < SEARCH_STATE_RANK.get(prev_search_state, 0):
                        t_type = "REGRESSION"
                        reason = f"Search rank/visibility regressed from {prev_search_state} to {curr_search_state}"
                    else:
                        t_type = "MAINTAINED"
                        reason = f"Search visibility maintained at {curr_search_state}"
                else:
                    prev_search_state = "INITIAL"
                    t_type = "INITIAL"
                    reason = f"Initial observed state: {curr_search_state}"

                transition_record = {
                    "page_id": page_id,
                    "canonical_url": curr_r["canonical_url"],
                    "measurement_id": current_meas_id,
                    "dimension": "search_visibility",
                    "from_state": prev_search_state,
                    "to_state": curr_search_state,
                    "transition_type": t_type,
                    "transition_reason": reason,
                }
                transitions.append(transition_record)

                if not dry_run and t_type in ("PROGRESSION", "REGRESSION", "INITIAL"):
                    cur.execute(
                        """
                        INSERT INTO acquisition_state_transitions (
                            page_id, measurement_id, dimension, from_state, to_state,
                            transition_type, transition_reason
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s);
                        """,
                        (
                            page_id,
                            current_meas_id,
                            "search_visibility",
                            prev_search_state,
                            curr_search_state,
                            t_type,
                            reason,
                        ),
                    )

            if not dry_run:
                conn.commit()

    return transitions
