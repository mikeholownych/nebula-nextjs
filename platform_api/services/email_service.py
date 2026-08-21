"""
AgentMail Email Service
Sends audit results and follow-up emails
"""

import asyncio
from typing import Optional, List
from pydantic import BaseModel

from platform_api.services.offer import offer_price_display, TIMING_CLAIM_EMAIL


class AuditEmailData(BaseModel):
    url: str
    score: float
    grade: str
    findings: List[dict]
    email: str
    name: Optional[str] = None
    custom_subject: Optional[str] = None
    custom_body: Optional[str] = None
    guided_implementation: Optional[dict] = None


# ── Revenue math helper ─────────────────────────────────────────────────────

def _revenue_math(score: float) -> str:
    """Convert a score into a plain-language cost-of-inaction sentence."""
    if score >= 8:
        return ""
    # Assume ~500 monthly visitors at ~$2.50 avg CPC as a conservative baseline
    monthly_visitors = 500
    current_cr = round(score / 10 * 0.04, 4)  # score maps to ~0-4% CR
    baseline_cr = 0.02  # 2% industry baseline
    if current_cr >= baseline_cr:
        return ""
    gap = baseline_cr - current_cr
    missed = round(monthly_visitors * gap)
    if missed <= 0:
        return ""
    return (
        f"At your current score, roughly {missed} people a month are leaving "
        f"without converting who would stay if this page were built right. "
        f"Every month it stays the way it is, that gap compounds."
    )


# ── Finding renderer ────────────────────────────────────────────────────────

def _render_finding_html(f: dict, index: int) -> str:
    label = f.get("label") or f.get("key", "Finding")
    issue = f.get("issue", "")
    fix = f.get("fix", "")
    score = f.get("score", 0)

    # Score to signal color
    if score < 5:
        signal_color = "#ef4444"
        signal_label = "Critical"
    elif score < 7:
        signal_color = "#f59e0b"
        signal_label = "Needs fix"
    else:
        signal_color = "#22c55e"
        signal_label = "Passing"

    return f"""
    <div style="border-left: 3px solid {signal_color}; padding: 1rem 1.25rem; margin: 1rem 0; background: #fafafa; border-radius: 0 6px 6px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong style="color: #1a1a1a; font-size: 0.95rem;">{label}</strong>
            <span style="font-size: 0.75rem; color: {signal_color}; font-weight: 600;">{signal_label}</span>
        </div>
        <p style="margin: 0 0 0.5rem 0; color: #333; font-size: 0.9rem; line-height: 1.5;">{issue}</p>
        {f'<p style="margin: 0; color: #666; font-size: 0.85rem; font-style: italic;">Fix: {fix}</p>' if fix else ''}
    </div>
    """


def _render_finding_text(f: dict) -> str:
    label = f.get("label") or f.get("key", "Finding")
    issue = f.get("issue", "")
    fix = f.get("fix", "")
    lines = [f"[{label}]", issue]
    if fix:
        lines.append(f"Fix: {fix}")
    return "\n".join(lines)


def _render_guided_implementation_text(gi: dict) -> str:
    """Render guided implementation as plain text."""
    if not gi or not gi.get("implementation_guide"):
        return ""
    
    guide = gi["implementation_guide"]
    lines = [
        "GUIDED IMPLEMENTATION FLOW",
        "=" * 40,
        f"Title: {guide.get('title', 'Guided Implementation')}",
        f"Description: {guide.get('description', '')}",
        "",
        "PRINCIPLES:",
    ]
    
    for principle in guide.get("principles", []):
        lines.append(f"• {principle}")
    
    lines.extend(["", "IMPLEMENTATION STEPS:"])
    
    for step in guide.get("steps", []):
        lines.append(f"{step.get('step_id', '?')}. {step.get('title', 'Unknown Step')}")
        lines.append(f"   Issue: {step.get('issue', '')}")
        lines.append(f"   Goal: {step.get('goal', '')}")
        lines.append(f"   Current Score: {step.get('current_score', 0)}/10 → Target: {step.get('target_score', 0)}/10")
        lines.append(f"   Impact: {step.get('impact', 0)} | Effort: {step.get('effort', 0)} | Quadrant: {step.get('quadrant', 'unknown')}")
        
        # Add implementation steps if available
        impl_steps = step.get("steps", [])
        if impl_steps:
            lines.append("   Action Steps:")
            for impl_step in impl_steps:
                lines.append(f"     {impl_step.get('order', '?')}. {impl_step.get('action', '')}")
                if impl_step.get('guidance'):
                    lines.append(f"       Guidance: {impl_step.get('guidance', '')}")
                if impl_step.get('validation'):
                    lines.append(f"       Validation: {impl_step.get('validation', '')}")
        lines.append("")
    
    # Add validation framework
    validation = guide.get("validation_framework", {})
    if validation:
        lines.extend(["", "VALIDATION FRAMEWORK:"])
        for principle in validation.get("principles", []):
            lines.append(f"• {principle}")
        
        methods = validation.get("methods", [])
        if methods:
            lines.append("")
            lines.append("Validation Methods:")
            for method in methods:
                lines.append(f"• {method.get('method', 'Unknown')}: {method.get('description', '')}")
    
    # Add progressive disclosure
    progressive = guide.get("progressive_disclosure", {})
    if progressive:
        lines.extend(["", "PROGRESSIVE DISCLOSURE:"])
        lines.append(f"Philosophy: {progressive.get('philosophy', '')}")
        for phase in progressive.get("phases", []):
            lines.append(f"Phase {phase.get('phase', '?')}: {phase.get('title', 'Unknown Phase')}")
            lines.append(f"  {phase.get('description', '')}")
            lines.append(f"  Time Commitment: {phase.get('time_commitment', 'Not specified')}")
            lines.append(f"  Expected Outcome: {phase.get('expected_outcome', 'Not specified')}")
            lines.append("")
    
    # Add troubleshooting
    troubleshooting = guide.get("troubleshooting", {})
    if troubleshooting:
        lines.extend(["", "TROUBLESHOOTING:"])
        common_issues = troubleshooting.get("common_issues", [])
        if common_issues:
            lines.append("Common Issues:")
            for issue in common_issues:
                lines.append(f"• {issue.get('issue', 'Unknown issue')}")
                if issue.get('causes'):
                    lines.append(f"  Causes: {', '.join(issue.get('causes', []))}")
                if issue.get('solutions'):
                    lines.append(f"  Solutions: {', '.join(issue.get('solutions', []))}")
        lines.append("")
        
        debugging_steps = troubleshooting.get("debugging_steps", [])
        if debugging_steps:
            lines.append("Debugging Steps:")
            for i, step in enumerate(debugging_steps, 1):
                lines.append(f"{i}. {step}")
    
    return "\n".join(lines)


# ── Main email builder ──────────────────────────────────────────────────────

class EmailService:
    """AgentMail email sending service"""

    def __init__(self):
        self.inbox_id = "sedrick@nebulacomponents.com"

    async def send_audit_results(self, data: AuditEmailData) -> dict:
        """Send audit results email using the story framework."""

        top_findings = data.findings[:3]
        revenue_sentence = _revenue_math(data.score)

        # Score label
        if data.score >= 8:
            score_context = "Your page is in good shape."
        elif data.score >= 6.5:
            score_context = "Your page has real gaps - the kind that cost you quietly, every day."
        elif data.score >= 5:
            score_context = "Your page is working against you. Traffic is arriving. Most of it is leaving."
        else:
            score_context = "Your page is bleeding money. The ads are running. The page is not closing."

        # Findings HTML
        findings_html = "".join(
            _render_finding_html(f, i) for i, f in enumerate(top_findings)
        )

        # Findings plain text
        findings_text = "\n\n".join(_render_finding_text(f) for f in top_findings)

        # Guided implementation HTML and text
        guided_implementation_html = ""
        guided_implementation_text = ""
        if data.guided_implementation and data.guided_implementation.get("implementation_guide"):
            guide = data.guided_implementation["implementation_guide"]
            default_description = "Step-by-step instructions to fix your landing page's conversion leaks"
            guide_description = guide.get("description", default_description)
            guided_implementation_html = f"""
            <div style="border-top: 1px solid #eee; margin: 2rem 0; padding-top: 1.5rem;">
                <h2 style="font-size: 1rem; font-weight: 700; margin: 0 0 0.75rem 0; text-transform: uppercase; letter-spacing: 0.05em; color: #333;">
                    Guided Implementation Flow
                </h2>
                <p style="color: #333; font-size: 0.9rem; line-height: 1.7; margin: 0 0 1rem 0;">
                    {guide_description}
                </p>
                <div style="background: #f8f9fa; border-radius: 6px; padding: 1rem; margin: 1rem 0;">
                    <h3 style="font-size: 0.9rem; font-weight: 600; margin: 0 0 0.5rem 0; color: #333;">
                        How to Use This Guide
                    </h3>
                    <p style="color: #555; font-size: 0.8rem; line-height: 1.6; margin: 0 0 0.5rem 0;">
                        Start with the highest impact, lowest effort fixes (quick wins). Validate each step before moving to the next.
                    </p>
                </div>
            </div>
            """
            guided_implementation_text = _render_guided_implementation_text(data.guided_implementation)

        # CODE-8: offer copy derives from the canonical pricing authority.
        price = offer_price_display()
        timing = TIMING_CLAIM_EMAIL

        # Story bridge - Mike's story, applied to them
        story_bridge_html = f"""
        <div style="border-top: 1px solid #eee; margin: 2rem 0; padding-top: 1.5rem;">
            <p style="color: #333; font-size: 0.9rem; line-height: 1.7; margin: 0 0 1rem 0;">
                I built a tool that reads landing pages and tells founders exactly where their ad spend is disappearing.
            </p>
            <p style="color: #333; font-size: 0.9rem; line-height: 1.7; margin: 0 0 1rem 0;">
                My own landing page didn't convert.
            </p>
            <p style="color: #333; font-size: 0.9rem; line-height: 1.7; margin: 0 0 1rem 0;">
                I had the exact problem I was solving. That took me longer to say out loud than it should have.
            </p>
            <p style="color: #333; font-size: 0.9rem; line-height: 1.7; margin: 0;">
                The findings above are exactly what I found on mine. They are fixable. I fix them for {price}.
            </p>
        </div>
        """

        story_bridge_text = (
            "I built a tool that reads landing pages and tells founders exactly "
            "where their ad spend is disappearing.\n\n"
            "My own landing page didn't convert.\n\n"
            "I had the exact problem I was solving. That took me longer to say "
            "out loud than it should have.\n\n"
            "The findings above are exactly what I found on mine. They are fixable. "
            f"I fix them for {offer_price_display()}."
        )

        # CTA
        cta_html = f"""
        <div style="background: #1a1a1a; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; text-align: center;">
            <p style="color: #fff; font-size: 1rem; margin: 0 0 0.75rem 0; font-weight: 600;">
                {price} One-Leak Repair Sprint. {timing}. Reply YES and I'll send the link.
            </p>
            <p style="color: #999; font-size: 0.8rem; margin: 0;">
                Or open your audit: <a href="https://nebulacomponents.com/audit" style="color: #a78bfa;">nebulacomponents.com/audit</a>
            </p>
        </div>
        """

        html_body = f"""
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 580px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">

            <div style="padding: 2rem 0 1rem 0;">
                <p style="font-size: 0.8rem; color: #999; margin: 0 0 1.5rem 0; text-transform: uppercase; letter-spacing: 0.05em;">
                    Nebula - Landing Page Audit
                </p>
                <h1 style="font-size: 1.4rem; font-weight: 700; margin: 0 0 0.5rem 0; color: #1a1a1a;">
                    {data.url}
                </h1>
                <div style="font-size: 2.5rem; font-weight: 800; color: #1a1a1a; margin: 0.5rem 0;">
                    {data.score:.1f}<span style="font-size: 1rem; font-weight: 400; color: #666;">/10</span>
                    <span style="font-size: 1.2rem; color: #666; margin-left: 0.75rem;">Grade {data.grade}</span>
                </div>
                <p style="font-size: 1rem; color: #333; margin: 0.5rem 0 0 0;">{score_context}</p>
                {f'<p style="font-size: 0.9rem; color: #666; margin: 0.5rem 0 0 0;">{revenue_sentence}</p>' if revenue_sentence else ''}
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 1.5rem 0;">

            <h2 style="font-size: 1rem; font-weight: 700; margin: 0 0 0.75rem 0; text-transform: uppercase; letter-spacing: 0.05em; color: #333;">
                What your visitors are experiencing
            </h2>

            {findings_html}

            {guided_implementation_html}

            {story_bridge_html}

            {cta_html}

            <p style="color: #999; font-size: 0.8rem; margin: 2rem 0 0 0;">
                Nebula Components - Mike Holownych<br>
                <a href="https://nebulacomponents.com" style="color: #999;">nebulacomponents.com</a>
            </p>

        </body>
        </html>
        """

        text_body = f"""
{data.url}
Score: {data.score:.1f}/10 (Grade {data.grade})

{score_context}
{revenue_sentence}

What your visitors are experiencing:

{findings_text}

{guided_implementation_text}

---

{story_bridge_text}

{price} One-Leak Repair Sprint. {timing}. Reply YES and I'll send the link.
Or open your audit: https://nebulacomponents.com/audit

--
Mike Holownych
Nebula Components
        """.strip()

        # Register lead
        from agentmail_client import AgentMailClient
        from lead_store import LeadStore

        store = LeadStore()
        await asyncio.to_thread(
            store.upsert_lead,
            email=data.email,
            url=data.url,
            stage="discovered",
            source="audit_request",
            trigger_context="requested_platform_audit",
        )

        subject = (
            data.custom_subject
            or f"Your page scored {data.score:.1f}/10. Here's what's costing you every day it stays that way."
        )

        result = await asyncio.to_thread(
            AgentMailClient(inbox=self.inbox_id).send_audit,
            to=[data.email],
            subject=subject,
            text=text_body,
            html=html_body,
        )

        if not result.get("_error"):
            await asyncio.to_thread(
                store.upsert_lead,
                email=data.email,
                url=data.url,
                stage="audit_delivered",
                source="audit_request",
                audit_score=data.score,
                audit_grade=data.grade,
            )

        return {
            "status": "failed" if result.get("_error") else "sent",
            "message_id": result.get("message_id") or result.get("id"),
            "error": result.get("_reason") or result.get("_error"),
        }


# Singleton instance
email_service = EmailService()
