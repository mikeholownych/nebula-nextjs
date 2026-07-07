#!/usr/bin/env python3
"""
Fix Map — transforms audit scores into a visual execution roadmap.

Nico Lundquist's FORGE insight: "You can't hold a document in your head.
You can hold a map."

Instead of a text dump of scores, the Fix Map shows:
  Current State → Fix Path (ordered by impact) → Destination State

This IS the R → G → E transition adapted for Nebula's audit flow.
"""

from datetime import datetime


def build_fix_map(audit, url=None):
    """Build a structured Fix Map from audit output.
    
    Returns dict with:
      - current: {score, grade, diagnosis}
      - path: [{step, dimension, impact, effort, issue, fix}, ...] ordered by impact
      - destination: {projected_score, projected_grade, summary}
      - html: full HTML rendering of the map
    """
    dimensions = audit.get("dimensions", {})
    overall = audit.get("overall", 0)
    grade = audit.get("overall_grade", "C")
    
    # Classify each dimension
    scored = []
    for key, dim in dimensions.items():
        score = dim.get("score", 0)
        impact = _classify_impact(score)
        effort = _classify_effort(key)
        scored.append({
            "dimension": key,
            "label": _dim_label(key),
            "score": score,
            "impact": impact,
            "impact_icon": "🔴" if impact == "critical" else "🟡" if impact == "high" else "🔵" if impact == "medium" else "⚪",
            "effort": effort,
            "issue": dim.get("issue", ""),
            "fix": dim.get("fix", ""),
        })
    
    # Sort by impact (lowest score = highest impact to fix)
    scored.sort(key=lambda x: x["score"])
    
    # Build the fix path — ordered steps
    fix_path = []
    for i, item in enumerate(scored):
        fix_path.append({
            "step": i + 1,
            "dimension": item["dimension"],
            "label": item["label"],
            "current_score": item["score"],
            "target_score": min(10, item["score"] + 4),
            "impact": item["impact"],
            "impact_icon": item["impact_icon"],
            "effort": item["effort"],
            "issue": item["issue"],
            "fix": item["fix"],
        })
    
    # Projected destination state
    projected = overall
    for item in fix_path:
        gain = min(10, item["current_score"] + 4) - item["current_score"]
        projected += gain / len(dimensions)
    projected = round(min(10, projected), 1)
    projected_grade = "A" if projected >= 8 else "B" if projected >= 6.5 else "C"
    
    # Diagnosis summary
    critical_count = sum(1 for f in fix_path if f["impact"] == "critical")
    high_count = sum(1 for f in fix_path if f["impact"] == "high")
    
    if critical_count > 0:
        diagnosis = f"{critical_count} critical conversion blocker(s) found"
    elif high_count > 0:
        diagnosis = f"{high_count} significant conversion leak(s) found"
    else:
        diagnosis = "Minor optimization opportunities"
    
    result = {
        "current": {
            "score": overall,
            "grade": grade,
            "diagnosis": diagnosis,
            "url": url,
        },
        "path": fix_path,
        "destination": {
            "projected_score": projected,
            "projected_grade": projected_grade,
            "summary": f"From {overall}/10 ({grade}) → {projected}/10 ({projected_grade})",
        },
        "html": _render_html(audit, fix_path, overall, grade, projected, projected_grade, diagnosis, url),
    }
    
    return result


def _dim_label(key):
    labels = {
        "headline": "Headline Clarity",
        "cta": "Call-to-Action",
        "social_proof": "Social Proof",
        "speed": "Page Speed",
        "mobile": "Mobile Readiness",
        "seo_foundations": "SEO Foundations",
    }
    return labels.get(key, key.replace("_", " ").title())


def _classify_impact(score):
    if score <= 3:
        return "critical"
    elif score <= 5:
        return "high"
    elif score <= 7:
        return "medium"
    return "low"


def _classify_effort(dimension):
    """Estimate fix effort per dimension."""
    effort_map = {
        "headline": "low",
        "cta": "low",
        "social_proof": "medium",
        "speed": "medium",
        "mobile": "low",
        "seo_foundations": "low",
    }
    return effort_map.get(dimension, "medium")


def _render_html(audit, fix_path, overall, grade, projected, projected_grade, diagnosis, url):
    """Render the Fix Map as an inline HTML/CSS block for email embedding."""
    url_display = url or "your page"
    
    path_rows = ""
    for item in fix_path:
        bar_color = "#ef4444" if item["current_score"] <= 3 else "#f59e0b" if item["current_score"] <= 5 else "#3b82f6"
        effort_tag = "🟢 Low" if item["effort"] == "low" else "🟡 Medium" if item["effort"] == "medium" else "🔴 High"
        path_rows += f"""
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;">
            <span style="font-weight:600;">{item["impact_icon"]} {item["label"]}</span>
            <div style="color:#6b7280;font-size:12px;margin-top:4px;">{item["fix"][:120]}</div>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:14px;">
            <span style="font-weight:700;">{item['current_score']}</span><span style="color:#9ca3af;">/10</span>
            <div style="margin-top:4px;height:4px;background:#f3f4f6;border-radius:2px;width:60px;margin-left:auto;margin-right:auto;">
              <div style="height:4px;background:{bar_color};border-radius:2px;width:{item['current_score'] * 6}px;"></div>
            </div>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;color:#6b7280;">{effort_tag}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:14px;font-weight:600;color:#059669;">{item["target_score"]}/10</td>
        </tr>"""
    
    return f"""<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;">
  <div style="text-align:center;padding:24px 0 16px;">
    <div style="font-size:28px;font-weight:700;margin-bottom:4px;">{url_display}</div>
    <div style="font-size:15px;color:#6b7280;">{diagnosis}</div>
  </div>

  <div style="display:flex;gap:16px;justify-content:center;padding:16px 0;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;margin-bottom:16px;">
    <div style="text-align:center;flex:1;">
      <div style="font-size:32px;font-weight:700;color:{'#ef4444' if overall < 5 else '#f59e0b' if overall < 7 else '#059669'};">{overall}</div>
      <div style="font-size:12px;color:#9ca3af;">/10 Current</div>
    </div>
    <div style="display:flex;align-items:center;font-size:24px;color:#d1d5db;">→</div>
    <div style="text-align:center;flex:1;">
      <div style="font-size:32px;font-weight:700;color:#059669;">{projected}</div>
      <div style="font-size:12px;color:#9ca3af;">/10 After Fixes</div>
    </div>
  </div>

  <div style="font-size:13px;font-weight:600;color:#374151;padding:8px 0;">EXECUTION ROADMAP</div>
  <table style="width:100%;border-collapse:collapse;">
    <thead>
      <tr style="background:#f9fafb;">
        <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;">Step</th>
        <th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b7280;text-transform:uppercase;">Now</th>
        <th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b7280;text-transform:uppercase;">Effort</th>
        <th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b7280;text-transform:uppercase;">Fixed</th>
      </tr>
    </thead>
    <tbody>
      {path_rows}
    </tbody>
  </table>

  <div style="border-top:1px solid #e5e7eb;margin-top:16px;padding:16px 0;text-align:center;">
    <a href="https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02" style="display:inline-block;padding:12px 32px;background:#059669;color:#fff;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600;">Implement These Fixes — $97 →</a>
    <div style="font-size:12px;color:#9ca3af;margin-top:8px;">30-day money back if conversion doesn't improve</div>
  </div>

  <div style="text-align:center;font-size:11px;color:#9ca3af;padding-top:8px;">
    Nebula Components · Free audit → $97 fix → Delivered in 24h · No call required
  </div>
</div>"""


if __name__ == "__main__":
    import sys, json
    # Test with sample audit data
    sample = {
        "overall": 5.2,
        "overall_grade": "C",
        "dimensions": {
            "headline": {"score": 4, "issue": "Headline does not state the buyer outcome clearly", "fix": "Lead with the concrete buyer result and target audience in the first sentence."},
            "cta": {"score": 6, "issue": "CTA language is vague", "fix": "Use action + outcome copy like 'Run my free teardown'."},
            "social_proof": {"score": 3, "issue": "Trust proof is missing before conversion ask", "fix": "Add proof near the first CTA: testimonial, case study, or metric."},
            "speed": {"score": 8, "issue": "Page weight appears reasonable", "fix": "No fix needed."},
            "mobile": {"score": 5, "issue": "Mobile viewport may be missing", "fix": "Ensure responsive viewport and test on mobile width."},
        }
    }
    result = build_fix_map(sample, url="https://example.com")
    print(json.dumps({k: v for k, v in result.items() if k != "html"}, indent=2))
