"""ICP quality gate tests — validate the live waterfall ICP gate.

The original tests targeted `ramp_pipeline_fill.check_icp_fit`, which was
replaced by the trigger-aware pipeline (2026-07-31) and the Waterfall ICP
architecture (`waterfall_icp_config.py`). These tests now assert the same
quality intent against the live gate:
  - decision-makers who own conversion/growth qualify
  - providers/agencies and juniors are excluded (noise)
  - non-ICP titles get no match
"""

from waterfall_icp_config import cascade_match, has_exclusion, validate_contact


def test_agency_noise_is_excluded():
    """Ads agencies are competitors, not ICP — never qualify."""
    result = validate_contact("Google Ads Expert", "I manage Facebook ads for clients")
    assert result["valid"] is False
    assert "agency_noise" in result["reason"]


def test_junior_or_intern_is_excluded():
    """Juniors have no budget authority — never qualify."""
    result = validate_contact("Junior Marketing Assistant", "Marketing intern at Acme")
    assert result["valid"] is False
    assert "junior_intern" in result["reason"]


def test_cmo_is_a_qualified_icp_match():
    """A CMO owns the conversion problem — top-priority match."""
    result = validate_contact("CMO", "Chief Marketing Officer at Acme Inc", company_size=50)
    assert result["valid"] is True
    assert result["icp_priority"] == 1
    assert result["icp_label"] == "Specialized C-level / VP"
    assert result["score"] > 0
    assert "routing" in result and result["routing"]["offer"] == "free_audit_then_97"


def test_founder_of_small_company_is_qualified():
    """A founder IS the decision maker — qualifies at the best matching level.

    'Founder' + a product/SaaS domain signal matches P4 (Champions via
    headline, founder_ceo prefix + product_founder domain) ahead of the
    generic P6 fallback. A founder with no domain signal hits P6.
    """
    with_signal = validate_contact("Founder", "Founder of a 12-person SaaS", company_size=12)
    assert with_signal["valid"] is True
    assert with_signal["icp_priority"] in (4, 6)
    assert with_signal["icp_label"] in (
        "Champions via headline (atypical titles)",
        "Founder/CEO fallback (sub-20 emp)",
    )

    fallback = validate_contact("Founder", "Running a small company", company_size=8)
    assert fallback["valid"] is True
    assert fallback["icp_priority"] == 6
    assert fallback["icp_label"] == "Founder/CEO fallback (sub-20 emp)"


def test_non_conversion_role_gets_no_match():
    """A title outside growth/conversion domains has no ICP match."""
    result = validate_contact("Data Analyst", "Analytics at a large bank", company_size=500)
    assert result["valid"] is False
    assert result["reason"] == "no_icp_match"


def test_cascade_match_returns_first_priority_level():
    """Waterfall cascade returns the highest (best) matching level."""
    match = cascade_match("CMO", "Chief Marketing Officer", company_size=50)
    assert match is not None
    assert match["icp_priority"] == 1
    assert match["score"] > 0


def test_has_exclusion_flags_freelancer():
    """Freelancers/contractors are excluded from ICP outreach."""
    matched, category = has_exclusion("Freelance CRO consultant")
    assert matched is True
    assert category == "freelance_contractor"
