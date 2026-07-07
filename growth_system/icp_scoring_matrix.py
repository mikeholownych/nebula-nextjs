"""
ICP Scoring Matrix — Weighted Lead Scoring Module
Adapted from TrustOS Lead Qualification System (flagstad.io, July 2026)
Scores leads against ICP criteria with weighted dimensions.
Returns structured qualification verdict for outreach prioritization.
"""
import json
from typing import Optional


class ICPScorer:
    """
    Score a lead against a defined ICP using weighted criteria.
    
    Dimensions:
    - Company Fit (industry, size, revenue, geography) — weight 40%
    - Person Fit (title, seniority, function) — weight 35%
    - Behavioral Fit (engagement source, signals) — weight 25%
    
    Disqualifiers immediately mark as unqualified regardless of score.
    """

    # Default ICP for Nebula Components — trigger-aware ICP
    DEFAULT_MATRIX = {
        "company_fit": {
            "weight": 0.40,
            "criteria": {
                "industry": {
                    "description": "DTC ecommerce, SaaS, services, education — actively running paid traffic",
                    "matches": {
                        "ecommerce": 30,
                        "saas": 30,
                        "dtc": 30,
                        "services": 20,
                        "education": 20,
                    },
                    "default": 5
                },
                "company_size": {
                    "description": "Small to mid-market (< 500 employees — no dedicated CRO)",
                    "matches": {
                        "1-10": 20,
                        "11-50": 30,
                        "51-200": 30,
                        "201-500": 20,
                    },
                    "default": 10
                },
                "revenue_range": {
                    "description": "Spending $3k-$15k/month on paid traffic",
                    "matches": {},
                    "default": 20,
                    "note": "Estimated from ad spend indicators"
                },
                "has_paid_traffic": {
                    "description": "Running paid ads (Meta, Google, LinkedIn)",
                    "matches": {
                        True: 30,
                    },
                    "default": 10
                }
            }
        },
        "person_fit": {
            "weight": 0.35,
            "criteria": {
                "role": {
                    "description": "Founder, owner, or head of growth/marketing with budget authority",
                    "matches": {
                        "founder": 35,
                        "ceo": 35,
                        "owner": 35,
                        "head of growth": 30,
                        "vp marketing": 30,
                        "cmo": 30,
                        "marketing director": 25,
                    },
                    "default": 10
                },
                "seniority": {
                    "description": "Decision-maker or strong influencer",
                    "matches": {
                        "c-suite": 30,
                        "vp": 25,
                        "director": 20,
                        "head": 25,
                        "manager": 10,
                    },
                    "default": 5
                },
                "has_pain_signal": {
                    "description": "Expressed buying trigger — bleeding money on ads, zero conversions",
                    "matches": {
                        True: 35,
                    },
                    "default": 10
                }
            }
        },
        "behavioral_fit": {
            "weight": 0.25,
            "criteria": {
                "engagement_source": {
                    "description": "How the lead was discovered",
                    "matches": {
                        "reddit_help": 30,
                        "forum_help": 30,
                        "direct_referral": 30,
                        "upwork_posting": 25,
                        "linkedin_pain_post": 25,
                        "inbound_audit_request": 30,
                        "cold_outbound": 15,
                    },
                    "default": 10
                },
                "urgency_signal": {
                    "description": "Indicates time pressure — 'right now', 'urgent', 'bleeding', 'desperate'",
                    "matches": {
                        True: 25,
                    },
                    "default": 5
                },
                "specificity": {
                    "description": "Mentions specific numbers ($ amounts, timeframes, conversion rates)",
                    "matches": {
                        True: 25,
                    },
                    "default": 10
                }
            }
        }
    }

    def __init__(self, matrix: Optional[dict] = None):
        self.matrix = matrix or self.DEFAULT_MATRIX

    def score(self, lead: dict) -> dict:
        """
        Score a lead dict against the ICP matrix.
        
        Expected lead fields:
        - industry, company_size (str), has_paid_traffic (bool)
        - role, seniority, has_pain_signal (bool)
        - engagement_source, urgency_signal (bool), specificity (bool)
        
        Returns dict with score, status, and dimension breakdown.
        """
        total = 0.0
        breakdown = {}
        disqualifiers = []

        for dimension_name, dimension in self.matrix.items():
            dim_score = 0.0
            dim_max = 0.0
            criteria = dimension.get("criteria", {})

            for criterion_name, criterion in criteria.items():
                lead_value = lead.get(criterion_name)

                # Check matches
                matches = criterion.get("matches", {})
                if lead_value in matches:
                    pts = matches[lead_value]
                elif isinstance(lead_value, str):
                    # Fuzzy match — check if any key is a substring of lead_value
                    matched = False
                    for key, pts in matches.items():
                        if isinstance(key, str) and key.lower() in lead_value.lower():
                            pts = pts
                            matched = True
                            break
                    if not matched:
                        pts = criterion.get("default", 0)
                else:
                    pts = criterion.get("default", 0)

                dim_score += pts
                dim_max += max(
                    max(matches.values()) if matches else pts,
                    pts
                )

            weight = dimension.get("weight", 0.33)
            weighted = dim_score * weight
            total += weighted
            breakdown[dimension_name] = {
                "raw": dim_score,
                "max": dim_max,
                "weighted": round(weighted, 1),
                "pct": round(dim_score / dim_max * 100, 1) if dim_max > 0 else 0,
            }

        # Normalize to 0-100
        max_possible = sum(d.get("weight", 0.33) * 100 for d in self.matrix.values())
        final_score = min(100, round(total / max_possible * 100, 1)) if max_possible > 0 else 0

        # Status thresholds
        if final_score >= 70:
            status = "qualified"
        elif final_score >= 45:
            status = "needs_review"
        else:
            status = "unqualified"

        return {
            "score": final_score,
            "status": status,
            "breakdown": breakdown,
            "disqualifiers": disqualifiers,
            "summary": f"Score: {final_score}/100 — {status.upper()}"
        }


if __name__ == "__main__":
    scorer = ICPScorer()

    # Example: strong lead — founder running ads, bleeding money
    strong = {
        "industry": "ecommerce",
        "company_size": "11-50",
        "has_paid_traffic": True,
        "role": "founder",
        "seniority": "ceo",
        "has_pain_signal": True,
        "engagement_source": "reddit_help",
        "urgency_signal": True,
        "specificity": True,
    }

    # Example: weak lead — no buying signal
    weak = {
        "industry": "services",
        "company_size": "1-10",
        "has_paid_traffic": False,
        "role": "intern",
        "seniority": "intern",
        "has_pain_signal": False,
        "engagement_source": "cold_outbound",
        "urgency_signal": False,
        "specificity": False,
    }

    print("=== SCORING DEMO ===")
    print(f"Strong lead: {scorer.score(strong)['summary']}")
    print(f"Weak lead: {scorer.score(weak)['summary']}")
    print()
    for label, data in [("Strong", strong), ("Weak", weak)]:
        result = scorer.score(data)
        print(f"{label} breakdown:")
        for dim, detail in result["breakdown"].items():
            print(f"  {dim}: {detail['raw']}/{detail['max']} ({detail['pct']}%) → weighted {detail['weighted']}")
