"""Revenue Impact Estimator — pure function module.

Estimates the monthly revenue leak caused by each audit finding,
based on bounce-rate assumptions per severity tier and the user's CPC.
"""


def estimate_revenue_impact(finding_impact: int, monthly_visitors: int, cpc: float) -> float:
    """Estimate monthly revenue lost from a single finding.

    impact 8-10 (critical): assume 15-30% bounce rate increase → midpoint 22%
    impact 5-7 (high): assume 5-15% → midpoint 10%
    impact 1-4 (medium/low): assume 2-5% → midpoint 3.5%

    lost_revenue = bounce_pct * monthly_visitors * cpc
    """
    if finding_impact >= 8:
        bounce_pct = 0.22  # midpoint of 15-30%
    elif finding_impact >= 5:
        bounce_pct = 0.10  # midpoint of 5-15%
    else:
        bounce_pct = 0.035  # midpoint of 2-5%
    return round(bounce_pct * monthly_visitors * cpc, 2)


def enrich_findings_with_revenue(
    findings: list,
    monthly_visitors: int,
    avg_cpc: float,
) -> list:
    """Add revenue_impact field to each finding dict (in-place and returned).

    If avg_cpc is 0 or None, returns findings unchanged.
    """
    if not avg_cpc or avg_cpc <= 0:
        return findings
    for f in findings:
        impact = f.get("impact", 0)
        if isinstance(impact, (int, float)) and impact > 0:
            f["revenue_impact"] = estimate_revenue_impact(
                int(impact), monthly_visitors, avg_cpc
            )
    return findings
