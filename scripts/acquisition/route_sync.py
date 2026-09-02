"""Route & Cohort Synchronization for the Acquisition Learning System."""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
import psycopg
from psycopg.rows import dict_row

from .models import BASE_URL, COHORTS, DEFAULT_DB_URI, PageRecord

# Canonical Declarative Route Manifest
# Format: (path, cohort, route_type, sitemap_priority, is_indexable)
DECLARATIVE_ROUTE_DEFINITIONS: List[Tuple[str, str, str, float, bool]] = [
    # Core & Commercial
    ("/", "product_core", "static", 1.0, True),
    ("/pricing", "product_core", "static", 0.9, True),
    ("/audit", "product_core", "static", 0.9, True),
    ("/spec/landing-page-diagnostic-v1", "resources", "static", 0.9, True),
    ("/how-nebula-audits", "resources", "static", 0.9, True),
    
    # Signal Hubs & Individual Signals
    ("/signals", "category", "static", 0.8, True),
    ("/signals/message-match", "category", "static", 0.8, True),
    ("/signals/trust-signals", "category", "static", 0.8, True),
    ("/signals/mobile-cta", "category", "static", 0.8, True),
    ("/signals/load-speed", "category", "static", 0.8, True),
    ("/signals/cta-clarity", "category", "static", 0.8, True),
    ("/signals/above-fold-clarity", "category", "static", 0.8, True),
    ("/signals/ad-signal-continuity", "category", "static", 0.8, True),
    ("/signals/seo-foundations", "category", "static", 0.8, True),
    ("/signals/ai-readiness", "category", "static", 0.8, True),
    
    # Problem Intent Landing Pages
    ("/why-is-my-landing-page-not-converting", "problem_intent", "static", 0.8, True),
    ("/ads-getting-clicks-but-no-sales", "problem_intent", "static", 0.8, True),
    ("/cta-optimization", "problem_intent", "static", 0.7, True),
    ("/headline-optimization", "problem_intent", "static", 0.7, True),
    ("/mobile-landing-page-optimization", "problem_intent", "static", 0.7, True),
    ("/page-speed-conversion", "problem_intent", "static", 0.7, True),
    ("/social-proof-landing-page", "problem_intent", "static", 0.7, True),
    ("/roas-cliff", "problem_intent", "static", 0.7, True),
    
    # Category Pages
    ("/best-landing-page-audit-tools", "category", "static", 0.8, True),
    ("/landing-page-audit-tools-pricing", "category", "static", 0.8, True),
    ("/what-is-landing-page-audit", "category", "static", 0.7, True),
    ("/landing-page-message-match", "category", "static", 0.8, True),
    ("/landing-page-trust-signals", "category", "static", 0.8, True),
    ("/landing-page-cta-audit", "category", "static", 0.8, True),
    ("/conversion-rate-optimization-audit", "category", "static", 0.8, True),
    ("/why-cro-agencies-dont-work", "category", "static", 0.8, True),
    ("/ai-readiness-landing-page-check", "category", "static", 0.8, True),
    ("/page-intent-aware-audit", "category", "static", 0.8, True),
    
    # Vertical Use Cases
    ("/lead-generation-landing-page-audit", "vertical_use_case", "static", 0.8, True),
    ("/saas-landing-page-audit", "vertical_use_case", "static", 0.8, True),
    ("/ecommerce-landing-page-audit", "vertical_use_case", "static", 0.8, True),
    ("/mobile-landing-page-audit", "vertical_use_case", "static", 0.8, True),
    ("/7-systems", "vertical_use_case", "static", 0.7, True),
    ("/ai-sdr-vs-audit", "vertical_use_case", "static", 0.7, True),
    
    # Commercial Comparisons (/vs and /compare)
    ("/vs", "commercial_comparison", "static", 0.7, True),
    ("/compare", "commercial_comparison", "static", 0.7, True),
    ("/vs/screaming-frog", "commercial_comparison", "dynamic", 0.6, True),
    ("/vs/unbounce", "commercial_comparison", "dynamic", 0.6, True),
    ("/vs/page-speed-insights", "commercial_comparison", "dynamic", 0.6, True),
    ("/vs/instapage", "commercial_comparison", "dynamic", 0.6, True),
    ("/vs/leadpages", "commercial_comparison", "dynamic", 0.6, True),
    ("/compare/unbounce", "commercial_comparison", "static", 0.7, True),
    ("/compare/instapage", "commercial_comparison", "static", 0.7, True),
    ("/compare/pagespeed-insights", "commercial_comparison", "static", 0.7, True),
    ("/compare/leadpages", "commercial_comparison", "static", 0.7, True),
    
    # Teardowns & Case Studies
    ("/teardowns", "teardown_index", "static", 0.7, True),
    ("/teardowns/airtable", "individual_teardown", "dynamic", 0.7, True),
    ("/teardowns/cal-com", "individual_teardown", "dynamic", 0.7, True),
    ("/teardowns/linear", "individual_teardown", "dynamic", 0.7, True),
    ("/teardowns/miro", "individual_teardown", "dynamic", 0.7, True),
    ("/teardowns/notion", "individual_teardown", "dynamic", 0.7, True),
    ("/case-studies", "case_study", "static", 0.8, True),
    
    # Hubs, Resources & Learning Centre
    ("/learning-centre", "resources", "static", 0.8, True),
    ("/resources", "resources", "static", 0.8, True),
    ("/observatory", "resources", "static", 0.8, True),
    ("/playbooks", "resources", "static", 0.7, True),
    ("/playbooks/founder-second-brain", "resources", "static", 0.6, True),
    ("/playbooks/linkedin-skill-engine", "resources", "static", 0.6, True),
    ("/playbooks/specialist-ai-agent-library", "resources", "static", 0.6, True),
    ("/benchmarks", "resources", "static", 0.7, True),
    ("/brand", "resources", "static", 0.7, True),
    ("/concepts", "resources", "static", 0.7, True),
    ("/lab", "resources", "static", 0.7, True),
    ("/press", "resources", "static", 0.7, True),
    ("/faq", "resources", "static", 0.7, True),
    ("/editorial-standards", "resources", "static", 0.7, True),
    ("/what-is-nebula-components", "resources", "static", 0.7, True),
    
    # Utility & Legal
    ("/about", "utility_legal", "static", 0.5, True),
    ("/about/team", "utility_legal", "static", 0.5, True),
    ("/privacy-policy", "utility_legal", "static", 0.2, True),
    ("/data-rights", "utility_legal", "static", 0.2, True),
    ("/terms", "utility_legal", "static", 0.2, True),
    
    # Downstream / Non-indexed conversion surfaces
    ("/checkout", "checkout", "conversion", 0.0, False),
]


def resolve_cohort_for_path(path: str) -> str:
    """
    Resolve cohort name deterministically without substring shadowing defects.
    
    Precedence rules:
    1. Exact path matches from declarative inventory.
    2. Dynamic teardown /teardowns/[slug] -> individual_teardown
    3. Teardown index /teardowns -> teardown_index
    4. Dynamic comparison /vs/[slug] or /compare/[slug] -> commercial_comparison
    5. Signals /signals/... -> category
    6. Learning centre /learning-centre/... -> resources
    7. Playbooks /playbooks/... -> resources
    8. Case studies /case-studies/... -> case_study
    9. Unmapped -> other
    """
    clean_path = path.strip()
    if clean_path.endswith("/") and len(clean_path) > 1:
        clean_path = clean_path[:-1]

    # 1. Exact match
    for d_path, d_cohort, _, _, _ in DECLARATIVE_ROUTE_DEFINITIONS:
        if clean_path == d_path:
            return d_cohort

    # 2. Dynamic pattern match (Explicit order preventing shadowing)
    if clean_path.startswith("/teardowns/"):
        return "individual_teardown"
    if clean_path == "/teardowns":
        return "teardown_index"
    if clean_path.startswith("/vs/") or clean_path.startswith("/compare/"):
        return "commercial_comparison"
    if clean_path.startswith("/signals/"):
        return "category"
    if clean_path.startswith("/learning-centre/"):
        return "resources"
    if clean_path.startswith("/playbooks/"):
        return "resources"
    if clean_path.startswith("/case-studies/"):
        return "case_study"
    if clean_path.startswith("/pricing-guides/"):
        return "commercial_comparison"

    return "other"


def get_canonical_route_inventory() -> List[Tuple[str, str, str, float, bool]]:
    """Return the complete normalized route inventory."""
    return list(DECLARATIVE_ROUTE_DEFINITIONS)


def sync_routes_to_db(
    db_uri: str = DEFAULT_DB_URI,
    routes: Optional[List[Tuple[str, str, str, float, bool]]] = None,
) -> Dict[str, Any]:
    """
    Synchronize canonical routes to page_registry and page_cohort_assignments in PostgreSQL.
    
    Guarantees:
    - Never deletes records (soft-retires absent routes with retired_at).
    - Preserves stable UUIDs for existing routes.
    - Sets cohort_definition_version = '2.0.0'.
    - Fully idempotent.
    """
    if routes is None:
        routes = get_canonical_route_inventory()

    stats = {
        "routes_discovered": len(routes),
        "pages_created": 0,
        "pages_updated": 0,
        "pages_retired": 0,
        "cohorts_assigned": 0,
        "cohort_counts": {},
    }

    active_paths: Set[str] = set()

    with psycopg.connect(db_uri, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            for path, cohort, route_type, priority, is_indexable in routes:
                active_paths.add(path)
                canonical_url = f"{BASE_URL}{path}" if path != "/" else BASE_URL
                
                route_pattern = path
                if "/vs/" in path and path != "/vs":
                    route_pattern = "/vs/[slug]"
                elif "/teardowns/" in path and path != "/teardowns":
                    route_pattern = "/teardowns/[slug]"
                elif "/playbooks/" in path and path != "/playbooks":
                    route_pattern = "/playbooks/[slug]"
                elif "/case-studies/" in path and path != "/case-studies":
                    route_pattern = "/case-studies/[slug]"

                # Check if page exists
                cur.execute(
                    "SELECT id, is_active FROM page_registry WHERE route_path = %s;",
                    (path,),
                )
                existing = cur.fetchone()

                if not existing:
                    cur.execute(
                        """
                        INSERT INTO page_registry (
                            canonical_url, route_path, route_pattern, route_type,
                            sitemap_priority, is_indexable, is_active
                        ) VALUES (%s, %s, %s, %s, %s, %s, TRUE)
                        RETURNING id;
                        """,
                        (canonical_url, path, route_pattern, route_type, priority, is_indexable),
                    )
                    page_id = str(cur.fetchone()["id"])
                    stats["pages_created"] += 1
                else:
                    page_id = str(existing["id"])
                    cur.execute(
                        """
                        UPDATE page_registry
                        SET canonical_url = %s,
                            sitemap_priority = %s,
                            is_indexable = %s,
                            is_active = TRUE,
                            retired_at = NULL,
                            updated_at = NOW()
                        WHERE id = %s;
                        """,
                        (canonical_url, priority, is_indexable, page_id),
                    )
                    stats["pages_updated"] += 1

                # Cohort assignment
                cur.execute(
                    """
                    INSERT INTO page_cohort_assignments (
                        page_id, cohort_name, cohort_definition_version, assigned_by, is_current
                    ) VALUES (%s, %s, %s, %s, TRUE)
                    ON CONFLICT (page_id, cohort_name, cohort_definition_version) DO NOTHING;
                    """,
                    (page_id, cohort, "2.0.0", "declarative_registry"),
                )
                stats["cohorts_assigned"] += 1
                stats["cohort_counts"][cohort] = stats["cohort_counts"].get(cohort, 0) + 1

            # Soft-retire absent routes that were previously marked active
            cur.execute(
                """
                UPDATE page_registry
                SET is_active = FALSE,
                    retired_at = NOW(),
                    updated_at = NOW()
                WHERE is_active = TRUE AND NOT (route_path = ANY(%s))
                RETURNING id;
                """,
                (list(active_paths),),
            )
            retired_rows = cur.fetchall()
            stats["pages_retired"] = len(retired_rows)

            conn.commit()

    return stats
