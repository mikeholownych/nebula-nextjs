#!/usr/bin/env python3
"""
Guided Implementation Flow - creates step-by-step implementation guides for audit findings.

Takes audit findings (opportunity matrix or dimensions) and generates:
- Step-by-step implementation guides tailored to each fix type
- Visual aids and examples
- Validation checks during implementation
- Progressive disclosure of complexity
"""

import json
import re
from typing import Dict, List, Any, Optional
from datetime import datetime


def build_guided_implementation(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build guided implementation flow from audit data.
    
    Args:
        audit_data: Audit results from score_audit() containing dimensions and opp_matrix
        
    Returns:
        Dict containing guided implementation steps, visual aids, and validation checks
    """
    dimensions = audit_data.get("dimensions", {})
    opp_matrix = audit_data.get("opp_matrix", [])
    
    # Sort opportunity matrix by impact (highest first) for progressive disclosure
    sorted_findings = sorted(
        [f for f in opp_matrix if f["score"] < 7],  # Only include findings that need work
        key=lambda x: x["impact"], 
        reverse=True
    )
    
    # Generate guided steps for each finding
    guided_steps = []
    for finding in sorted_findings:
        key = finding["key"]
        step = _create_guided_step(key, finding, dimensions.get(key, {}))
        guided_steps.append(step)
    
    # Create overall implementation flow
    implementation_flow = {
        "implementation_guide": {
            "title": "Guided Implementation Flow",
            "description": "Step-by-step instructions to fix your landing page's conversion leaks",
            "principles": [
                "Start with the highest impact, lowest effort fixes (quick wins)",
                "Validate each step before moving to the next",
                "Implement one change at a time to isolate impact",
                "Re-audit after each implementation to measure improvement"
            ],
            "steps": guided_steps,
            "validation_framework": _create_validation_framework(),
            "progressive_disclosure": _create_progressive_disclosure_guide(sorted_findings),
            "visual_aids": _create_visual_aids(sorted_findings),
            "troubleshooting": _create_troubleshooting_guide()
        }
    }
    
    return implementation_flow


def _create_guided_step(key: str, finding: Dict[str, Any], dimension: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a guided implementation step for a specific finding.
    
    Args:
        key: Dimension key (e.g., "headline", "cta")
        finding: Finding from opportunity matrix
        dimension: Dimension data from audit
        
    Returns:
        Guided step dictionary
    """
    # Base step information
    step = {
        "step_id": f"step_{key}",
        "title": finding["label"],
        "finding_key": key,
        "current_score": finding.get("score", dimension.get("score", 0)),
        "target_score": min(10, finding.get("score", dimension.get("score", 0)) + 3),
        "impact": finding["impact"],
        "effort": finding["effort"],
        "quadrant": finding["quadrant"],
        "issue": finding["issue"],
        "goal": finding["fix"],
    }
    
    # Add dimension-specific implementation guidance
    step.update(_get_implementation_guidance(key, finding, dimension))
    
    return step


def _get_implementation_guidance(key: str, finding: Dict[str, Any], dimension: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get dimension-specific implementation guidance.
    
    Args:
        key: Dimension key
        finding: Finding data
        dimension: Dimension data
        
    Returns:
        Implementation guidance dictionary
    """
    guidance_map = {
        "headline": _get_headline_guidance,
        "cta": _get_cta_guidance,
        "social_proof": _get_social_proof_guidance,
        "load_speed": _get_load_speed_guidance,
        "mobile": _get_mobile_guidance,
        "above_fold": _get_above_fold_guidance,
        "ad_signals": _get_ad_signals_guidance,
        "seo_foundations": _get_seo_foundations_guidance,
        "ai_readiness": _get_ai_readiness_guidance,
        "ai_crawler_access": _get_ai_crawler_access_guidance,
    }
    
    guidance_func = guidance_map.get(key, _get_generic_guidance)
    return guidance_func(finding, dimension)


def _get_headline_guidance(finding: Dict[str, Any], dimension: Dict[str, Any]) -> Dict[str, Any]:
    """Headline-specific implementation guidance."""
    return {
        "implementation_type": "copy_change",
        "difficulty": "easy",
        "time_to_complete": "5-15 minutes",
        "steps": [
            {
                "order": 1,
                "action": "Analyze your current headline",
                "guidance": f"Your current headline: '{finding.get('current_headline', 'Not found')}'",
                "validation": "Can you clearly state what outcome visitors get?"
            },
            {
                "order": 2,
                "action": "Identify your target audience and their desired outcome",
                "guidance": "Who exactly is this page for? What specific result do they want?",
                "validation": "Can you name your audience and their specific goal in one sentence?"
            },
            {
                "order": 3,
                "action": "Write 5 headline options following the formula: [Audience] + [Outcome] + [Specific Mechanism]",
                "guidance": "Examples: 'Marketing Directors Who Get 3x More Qualified Leads', 'SaaS Founders Who Cut CAC by 40%'",
                "validation": "Each headline should be under 90 characters and make your audience think 'that's for me'"
            },
            {
                "order": 4,
                "action": "Select the best headline and implement it",
                "guidance": "Choose the headline that best matches your ad copy and audience targeting",
                "validation": "Headline implemented and visible on the page"
            },
            {
                "order": 5,
                "action": "Validate the change",
                "guidance": "Does the new headline clearly state the outcome and target audience?",
                "validation": "Visitor can understand what they get and if it's for them within 3 seconds"
            }
        ],
        "examples": [
            "Weak: 'Advanced Marketing Software'",
            "Better: 'Marketing Software That Increases ROI'",
            "Strong: 'Marketing Directors Who Get 3x More Qualified Leads Without Increasing Ad Spend'"
        ],
        "visual_aid": "HEADLINE_FORMULA: [Specific Audience] + [Desired Outcome] + [Specific Mechanism/Metric]",
        "common_mistakes": [
            "Being too vague ('Best-in-class solution')",
            "Focusing on features instead of outcomes",
            "Not specifying who the solution is for"
        ]
    }


def _get_cta_guidance(finding: Dict[str, Any], dimension: Dict[str, Any]) -> Dict[str, Any]:
    """CTA-specific implementation guidance."""
    return {
        "implementation_type": "copy_change",
        "difficulty": "easy",
        "time_to_complete": "5-10 minutes",
        "steps": [
            {
                "order": 1,
                "action": "Audit your current CTA(s)",
                "guidance": f"Current CTA text: '{finding.get('current_cta', 'Not found')}'",
                "validation": "Does your CTA use vague language like 'Submit', 'Click Here', or 'Learn More'?"
            },
            {
                "order": 2,
                "action": "Identify the action and outcome",
                "guidance": "What specific action do you want visitors to take? What outcome do they get?",
                "validation": "Can you state the action and outcome in 5 words or less?"
            },
            {
                "order": 3,
                "action": "Apply the CTA formula: [Action Verb] + [Outcome] + [Time/Effort Reduction]",
                "guidance": "Use verbs like Get, Start, Try, Run, Build, Book + outcome + time/effort benefit",
                "validation": "CTA follows the formula and is 2-5 words"
            },
            {
                "order": 4,
                "action": "Create 8 CTA variants across commitment levels",
                "guidance": "Low (info): 'See Your Score' | Medium (value): 'Get My Free Audit' | High (commitment): 'Buy the Fix Pack'",
                "validation": "You have 2-3 options for each commitment level"
            },
            {
                "order": 5,
                "action": "Implement and test your selected CTA",
                "guidance": "Start with medium-commitment variants for optimal balance",
                "validation": "CTA implemented and visible above the fold"
            }
        ],
        "examples": [
            "Weak: 'Submit'",
            "Better: 'Get Started'",
            "Strong: 'Run My Free Audit'", "Get My Instant Access'"
        ],
        "visual_aid": "CTA_FORMULA: [Action Verb] + [Specific Outcome] + [Time Benefit]",
        "common_mistakes": [
            "Using passive language",
            "Not specifying what happens after clicking",
            "Making CTAs too long or complex"
        ]
    }


def _get_social_proof_guidance(finding: Dict[str, Any], dimension: Dict[str, Any]) -> Dict[str, Any]:
    """Social proof-specific implementation guidance."""
    return {
        "implementation_type": "content_addition",
        "difficulty": "medium",
        "time_to_complete": "30-60 minutes",
        "steps": [
            {
                "order": 1,
                "action": "Audit current social proof elements",
                "guidance": f"Current social proof assessment: {finding.get('issue', 'No clear trust signals')}",
                "validation": "List all testimonials, reviews, case studies, logos, and metrics currently on page"
            },
            {
                "order": 2,
                "action": "Collect proof elements",
                "guidance": "Gather: customer quotes with names/titles, case studies with results, client logos, review counts, ratings",
                "validation": "Have at least 3 specific proof elements with concrete details"
            },
            {
                "order": 3,
                "action": "Place proof strategically",
                "guidance": "Add proof: 1) Near headline, 2) Above primary CTA, 3) In body copy supporting claims",
                "validation": "Proof elements visible in key visual hierarchy positions"
            },
            {
                "order": 4,
                "action": "Format for maximum credibility",
                "guidance": "Use: [Specific Result] + [Customer Name] + [Title/Company] + [Photo if available]",
                "validation": "Each proof element includes specific, verifiable details"
            },
            {
                "order": 5,
                "action": "Validate implementation",
                "guidance": "Does the social proof make visitors think 'This worked for someone like me'?",
                "validation": "Proof includes names, specific results, and feels authentic"
            }
        ],
        "examples": [
            "Weak: 'Trusted by thousands'",
            "Better: '5-star rating on G2'",
            "Strong: 'Increased conversion by 47% for Acme Corp (Marketing Director)'"
        ],
        "visual_aid": "SOCIAL_PROOF_FORMAT: [Specific Result] + [Named Customer] + [Title/Company]",
        "common_mistakes": [
            "Using anonymous or vague testimonials",
            "Not including specific results or metrics",
            "Hiding proof in footer or hard-to-find locations"
        ]
    }


def _get_load_speed_guidance(finding: Dict[str, Any], dimension: Dict[str, Any]) -> Dict[str, Any]:
    """Load speed-specific implementation guidance."""
    return {
        "implementation_type": "technical_optimization",
        "difficulty": "medium-hard",
        "time_to_complete": "2-4 hours",
        "steps": [
            {
                "order": 1,
                "action": "Measure current performance",
                "guidance": "Run Google PageSpeed Insights or GTmetrix to get baseline metrics",
                "validation": "Have LCP, FID, CLS scores and total page size"
            },
            {
                "order": 2,
                "action": "Optimize images",
                "guidance": "Compress all images, use modern formats (WebP/AVIF), implement lazy loading",
                "validation": "Image file sizes reduced by 60%+ without visible quality loss"
            },
            {
                "order": 3,
                "action": "Eliminate render-blocking resources",
                "guidance": "Inline critical CSS, defer non-critical JavaScript, eliminate unused CSS/JS",
                "validation": "Eliminate render-blocking resources in head of document"
            },
            {
                "order": 4,
                "action": "Leverage browser caching",
                "guidance": "Set appropriate cache headers for static assets (images, CSS, JS)",
                "validation": "Static assets have cache TTL of 1 month or more"
            },
            {
                "order": 5,
                "action": "Validate improvements",
                "guidance": "Re-run performance tests and compare to baseline",
                "validation": "LCP under 2.5s, PageSpeed score improved by 20+ points"
            }
        ],
        "examples": [
            "Before: 3.2s load time, 45 PageSpeed score",
            "After: 1.8s load time, 78 PageSpeed score"
        ],
        "visual_aid": "OPTIMIZATION_WORKFLOW: Measure → Optimize Images → Fix Render Blocking → Add Caching → Validate",
        "common_mistakes": [
            "Optimizing without measuring baseline",
            "Focusing on one aspect while ignoring others",
            "Breaking functionality while trying to improve speed"
        ]
    }


def _get_mobile_guidance(finding: Dict[str, Any], dimension: Dict[str, Any]) -> Dict[str, Any]:
    """Mobile-specific implementation guidance."""
    return {
        "implementation_type": "technical_fix",
        "difficulty": "easy",
        "time_to_complete": "10-20 minutes",
        "steps": [
            {
                "order": 1,
                "action": "Check for viewport meta tag",
                "guidance": "View page source and search for 'viewport'",
                "validation": "Find <meta name='viewport' content='width=device-width, initial-scale=1'>"
            },
            {
                "order": 2,
                "action": "Add viewport tag if missing",
                "guidance": "Add the viewport meta tag to the head of your HTML",
                "validation": "Viewport tag present and correctly formatted"
            },
            {
                "order": 3,
                "action": "Test mobile responsiveness",
                "guidance": "Use browser dev tools to test at mobile widths (320px, 375px, 425px)",
                "validation": "Content fits screen width, no horizontal scrolling, tap targets adequate size"
            },
            {
                "order": 4,
                "action": "Fix common mobile issues",
                "guidance": "Ensure font sizes readable, buttons tappable, forms easy to complete",
                "validation": "Base font size >=16px, buttons >=48x48px, form fields usable on touch"
            },
            {
                "order": 5,
                "action": "Validate mobile experience",
                "guidance": "Test on actual mobile device if possible",
                "validation": "Page loads quickly, all functions work, text readable without zoom"
            }
        ],
        "examples": [
            "Missing: No viewport tag",
            "Fixed: <meta name='viewport' content='width=device-width, initial-scale=1'>"
        ],
        "visual_aid": "MOBILE_CHECKLIST: Viewport Tag → Readable Text → Tappable Elements → No Horizontal Scroll",
        "common_mistakes": [
            "Having viewport but with incorrect parameters",
            "Ignoring touch target sizes",
            "Using hover-only interactions on mobile"
        ]
    }


def _get_above_fold_guidance(finding: Dict[str, Any], dimension: Dict[str, Any]) -> Dict[str, Any]:
    """Above-fold-specific implementation guidance."""
    return {
        "implementation_type": "layout_optimization",
        "difficulty": "medium",
        "time_to_complete": "30-60 minutes",
        "steps": [
            {
                "order": 1,
                "action": "Audit current above-fold content",
                "guidance": f"Current issue: {finding.get('issue', 'Missing key conversion elements')}",
                "validation": "Screenshot top 3000px of page and identify what's visible without scrolling"
            },
            {
                "order": 2,
                "action": "Identify missing elements",
                "guidance": "Determine which of these are missing: clear headline, CTA, offer/price, visual proof",
                "validation": "Can you list what conversion elements are missing above the fold?"
            },
            {
                "order": 3,
                "action": "Prioritize elements by impact",
                "guidance": "Add in order: 1) Headline with outcome, 2) Primary CTA, 3) Price/offer, 4) Trust signal",
                "validation": "Most important conversion elements present above fold"
            },
            {
                "order": 4,
                "action": "Create visual hierarchy",
                "guidance": "Make most important element visually dominant, use whitespace effectively",
                "validation": "Eye is drawn to headline first, then CTA, then supporting elements"
            },
            {
                "order": 5,
                "action": "Validate the above-fold experience",
                "guidance": "Can visitor understand what you offer, for whom, and what to do next in <5 seconds?",
                "validation": "Clear visual hierarchy with headline → CTA → supporting elements"
            }
        ],
        "examples": [
            "Weak: Logo + navigation only",
            "Better: Headline + CTA",
            "Strong: Outcome Headline + Primary CTA + Price Point + Trust Badge"
        ],
        "visual_aid": "ABOVE_FOLD_HIERARCHY: 1. Headline (Outcome) 2. CTA (Action) 3. Offer/Price 4. Trust Signal",
        "common_mistakes": [
            "Hiding CTA below the fold",
            "Making visitors hunt for basic information",
            "Having multiple competing visual elements"
        ]
    }


def _get_ad_signals_guidance(finding: Dict[str, Any], dimension: Dict[str, Any]) -> Dict[str, Any]:
    """Ad signals-specific implementation guidance."""
    return {
        "implementation_type": "technical_setup",
        "difficulty": "medium",
        "time_to_complete": "1-2 hours",
        "steps": [
            {
                "order": 1,
                "action": "Audit current tracking implementation",
                "guidance": f"Current status: {finding.get('issue', 'Tracking implementation needed')}",
                "validation": "List all current tracking pixels, scripts, and UTM parameters found"
            },
            {
                "order": 2,
                "action": "Implement core analytics",
                "guidance": "Install GA4 or equivalent analytics platform",
                "validation": "GA4 configuration tag present in page head"
            },
            {
                "order": 3,
                "action": "Add conversion tracking",
                "guidance": "Implement tracking for your primary conversion event (form submit, purchase, etc.)",
                "validation": "Conversion event fires correctly when action is completed"
            },
            {
                "order": 4,
                "action": "Implement UTM parameter handling",
                "guidance": "Ensure landing page preserves and uses UTM parameters for attribution",
                "validation": "UTM parameters from ads visible in analytics reports"
            },
            {
                "order": 5,
                "action": "Validate tracking implementation",
                "guidance": "Test tracking with real traffic and verify data appears in analytics",
                "validation": "Conversion events and traffic sources correctly attributed"
            }
        ],
        "examples": [
            "Missing: No analytics or tracking",
            "Partial: GA4 installed but no conversion tracking",
            "Complete: GA4 + conversion tracking + UTM preservation"
        ],
        "visual_aid": "TRACKING_STACK: Page View → Session Source → Conversion Event → Attribution",
        "common_mistakes": [
            "Tracking page views but not conversions",
            "Losing UTM parameters during redirects",
            "Not testing tracking implementation with real traffic"
        ]
    }


def _get_seo_foundations_guidance(finding: Dict[str, Any], dimension: Dict[str, Any]) -> Dict[str, Any]:
    """SEO foundations-specific implementation guidance."""
    return {
        "implementation_type": "technical_optimization",
        "difficulty": "easy",
        "time_to_complete": "15-30 minutes",
        "steps": [
            {
                "order": 1,
                "action": "Audit current SEO elements",
                "guidance": f"Current issue: {finding.get('issue', 'SEO foundations need work')}",
                "validation": "Check for title tag, meta description, H1 tag, and their content"
            },
            {
                "order": 2,
                "action": "Optimize title tag",
                "guidance": "Create unique, descriptive title under 60 characters with primary keyword",
                "validation": "Title tag present, 30-60 chars, includes primary keyword"
            },
            {
                "order": 3,
                "action": "Optimize meta description",
                "guidance": "Create compelling description 120-160 characters that encourages clicks",
                "validation": "Meta description present, 120-160 chars, includes call-to-action or benefit"
            },
            {
                "order": 4,
                "action": "Ensure proper H1 structure",
                "guidance": "Have exactly one H1 tag that matches title intent and includes primary keyword",
                "validation": "One H1 present, matches page topic, includes primary keyword from title"
            },
            {
                "order": 5,
                "action": "Validate SEO implementation",
                "guidance": "Check that all elements are present and properly optimized",
                "validation": "Title, meta description, and H1 present and follow best practices"
            }
        ],
        "examples": [
            "Weak: Missing title tag, generic meta description",
            "Better: Title tag present but too long/short",
            "Strong: Optimized title, meta description, and single H1"
        ],
        "visual_aid": "SEO_FOUNDATIONS: Title Tag (30-60ch) → Meta Description (120-160ch) → Single H1",
        "common_mistakes": [
            "Missing title or meta description tags",
            "Title tags too long (truncated in SERP) or too short (wasted opportunity)",
            "Multiple H1 tags or missing H1 entirely"
        ]
    }


def _get_ai_readiness_guidance(finding: Dict[str, Any], dimension: Dict[str, Any]) -> Dict[str, Any]:
    """AI readiness-specific implementation guidance."""
    return {
        "implementation_type": "technical_markup",
        "difficulty": "medium",
        "time_to_complete": "1-2 hours",
        "steps": [
            {
                "order": 1,
                "action": "Audit current AI readiness signals",
                "guidance": f"Current status: {finding.get('issue', 'AI citation readiness needs work')}",
                "validation": "Check for JSON-LD, OpenGraph tags, canonical URL, and factual content"
            },
            {
                "order": 2,
                "action": "Add JSON-LD Organization schema",
                "guidance": "Implement JSON-LD script with Organization type and key properties",
                "validation": "Valid JSON-LD Organization schema present in page head"
            },
            {
                "order": 3,
                "action": "Complete OpenGraph tags",
                "guidance": "Ensure all 5 essential OG tags are present: title, description, image, type, URL",
                "validation": "All 5 OpenGraph tags present with appropriate content"
            },
            {
                "order": 4,
                "action": "Set canonical URL",
                "guidance": "Add canonical tag pointing to the preferred version of this page",
                "validation": "Canonical tag present and points to correct URL"
            },
            {
                "order": 5,
                "action": "Add Twitter card tags",
                "guidance": "Implement Twitter card markup for enhanced social sharing",
                "validation": "Twitter card tag present with appropriate card type"
            },
            {
                "order": 6,
                "action": "Validate AI readiness",
                "guidance": "Test that AI engines can understand and cite your content correctly",
                "validation": "Structured data validates, meta tags present, content has factual elements"
            }
        ],
        "examples": [
            "Missing: No structured data or social tags",
            "Partial: Some OG tags present but incomplete",
            "Complete: Full JSON-LD, OG, Twitter cards, and canonical URL"
        ],
        "visual_aid": "AI_READINESS_STACK: JSON-LD → OpenGraph (5/5) → Twitter Card → Canonical URL",
        "common_mistakes": [
            "Implementing JSON-LD incorrectly (wrong type, missing properties)",
            "Having incomplete OpenGraph tags (missing image or type)",
            "Setting canonical URL to wrong page or leaving it out"
        ]
    }


def _get_ai_crawler_access_guidance(finding: Dict[str, Any], dimension: Dict[str, Any]) -> Dict[str, Any]:
    """AI crawler access-specific implementation guidance."""
    return {
        "implementation_type": "technical_config",
        "difficulty": "easy",
        "time_to_complete": "10-20 minutes",
        "steps": [
            {
                "order": 1,
                "action": "Audit current robots.txt",
                "guidance": "Check if robots.txt exists and what rules it contains",
                "validation": "Locate and review your robots.txt file at yourdomain.com/robots.txt"
            },
            {
                "order": 2,
                "action": "Allow AI retrieval crawlers",
                "guidance": "Add Allow rules for: OAI-SearchBot, ChatGPT-User, PerplexityBot, anthropic-ai, GoogleOther",
                "validation": "robots.txt explicitly allows AI crawlers used for citation"
            },
            {
                "order": 3,
                "action": "Keep training crawlers blocked (optional)",
                "guidance": "You may block GPTBot, ClaudeBot, Google-Extended for copyright reasons",
                "validation": "Blocking training crawlers does not block citation ability"
            },
            {
                "order": 4,
                "action": "Test crawler access",
                "guidance": "Use robots.txt testing tools to verify crawler permissions",
                "validation": "AI retrieval crawlers can access your content"
            },
            {
                "order": 5,
                "action": "Validate implementation",
                "guidance": "Confirm that answer engines can potentially cite your content",
                "validation": "No disallow rules blocking AI crawlers used for retrieval/citation"
            }
        ],
        "examples": [
            "Blocking: Disallow: / (blocks all crawlers)",
            "Better: No robots.txt (allows all by default but no explicit permission)",
            "Good: Allow: OAI-SearchBot, ChatGPT-User (explicit permission for citation crawlers)"
        ],
        "visual_aid": "CRAWLER_RULES: Allow [AI Crawlers] → Disallow [Training Crawlers Only If Desired]",
        "common_mistakes": [
            "Blocking crawlers needed for citation (OAI-SearchBot, ChatGPT-User)",
            "Having overly complex rules that are difficult to manage",
            "Not testing that the rules actually work as intended"
        ]
    }


def _get_generic_guidance(finding: Dict[str, Any], dimension: Dict[str, Any]) -> Dict[str, Any]:
    """Generic implementation guidance for unmapped dimensions."""
    return {
        "implementation_type": "general_improvement",
        "difficulty": "medium",
        "time_to_complete": "30-60 minutes",
        "steps": [
            {
                "order": 1,
                "action": "Understand the issue",
                "guidance": finding.get("issue", "Issue description not available"),
                "validation": "You can explain the problem in your own words"
            },
            {
                "order": 2,
                "action": "Plan the fix",
                "guidance": finding.get("fix", "Fix description not available"),
                "validation": "You have a clear plan for addressing the issue"
            },
            {
                "order": 3,
                "action": "Implement the solution",
                "guidance": "Follow the fix description to make the necessary changes",
                "validation": "Changes implemented according to plan"
            },
            {
                "order": 4,
                "action": "Validate the result",
                "guidance": "Check that the issue has been resolved",
                "validation": "Original issue is no longer present or significantly improved"
            }
        ],
        "examples": [
            "Issue: Specific problem description",
            "Fix: Specific solution description"
        ],
        "visual_aid": "IMPLEMENTATION_PROCESS: Understand → Plan → Implement → Validate",
        "common_mistakes": [
            "Implementing without fully understanding the problem",
            "Making changes that don't address the core issue",
            "Not validating that the fix actually worked"
        ]
    }


def _create_validation_framework() -> Dict[str, Any]:
    """Create validation framework for implementation."""
    return {
        "principles": [
            "Validate one change at a time",
            "Use both qualitative and quantitative measures",
            "Check both implementation correctness and impact",
            "Document what you did and what you observed"
        ],
        "methods": [
            {
                "method": "Visual Inspection",
                "description": "Manually check that changes are present and correct",
                "tools": ["Browser dev tools", "Page source view", "Screenshot comparison"],
                "when_to_use": "For copy changes, layout adjustments, visual elements"
            },
            {
                "method": "Functional Testing",
                "description": "Verify that interactive elements work correctly",
                "tools": ["Manual testing", "Form submissions", "Click tracking"],
                "when_to_use": "For CTAs, forms, navigation, interactive elements"
            },
            {
                "method": "Performance Testing",
                "description": "Measure technical performance metrics",
                "tools": ["Google PageSpeed", "GTmetrix", "WebPageTest", "Lighthouse"],
                "when_to_use": "For load speed, mobile optimization, technical improvements"
            },
            {
                "method": "Validation Testing",
                "description": "Verify that changes achieve intended purpose",
                "tools": ["User testing", "Heatmaps", "Conversion tracking", "A/B testing"],
                "when_to_use": "For all changes to confirm they improve user experience or conversion"
            }
        ],
        "checklist": [
            "✓ Change implemented as intended",
            "✓ No unintended side effects introduced",
            "✓ Change addresses the original issue",
            "✓ Validation method appropriate for change type",
            "✓ Results documented for future reference"
        ]
    }


def _create_progressive_disclosure_guide(findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Create progressive disclosure guide based on effort and impact."""
    # Categorize findings by effort level
    easy_finds = [f for f in findings if f.get("effort", 5) <= 3]
    medium_finds = [f for f in findings if 4 <= f.get("effort", 5) <= 5]
    hard_finds = [f for f in findings if f.get("effort", 5) >= 6]
    
    return {
        "philosophy": "Start with easiest, highest impact changes to build momentum and confidence",
        "phases": [
            {
                "phase": 1,
                "title": "Quick Wins (Start Here)",
                "description": "Easy to implement, high impact changes that build confidence",
                "findings": easy_finds,
                "time_commitment": "1-2 hours total",
                "expected_outcome": "Visible improvement in conversion elements"
            },
            {
                "phase": 2,
                "title": "Foundational Improvements",
                "description": "Medium effort changes that establish strong foundation",
                "findings": medium_finds,
                "time_commitment": "2-4 hours total",
                "expected_outcome": "Solid technical and conversion foundation"
            },
            {
                "phase": 3,
                "title": "Advanced Optimizations",
                "description": "Higher effort changes for maximum performance",
                "findings": hard_finds,
                "time_commitment": "4+ hours total",
                "expected_outcome": "Professional-grade implementation and performance"
            }
        ],
        "guidance": "Complete each phase before moving to the next. Re-audit after each phase to measure improvement."
    }


def _create_visual_aids(findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Create visual aids for implementation."""
    return {
        "impact_effort_matrix": {
            "title": "Impact vs. Effort Matrix",
            "description": "Focus on high impact, low effort changes first",
            "matrix": {
                "x_axis": "Effort (Low → High)",
                "y_axis": "Impact (Low → High)",
                "quadrants": {
                    "quick_win": "High Impact, Low Effort (DO FIRST)",
                    "major_project": "High Impact, High Effort (PLAN AND SCHEDULE)",
                    "fill_in": "Low Impact, Low Effort (DO WHEN EASY)",
                    "avoid": "Low Impact, High Effort (RECONSIDER)"
                }
            }
        },
        "implementation_funnel": {
            "title": "Implementation Funnel",
            "description": "Progressive disclosure of complexity",
            "stages": [
                "1. Copy Changes (Headline, CTA, Social Proof)",
                "2. Technical Foundations (Mobile, SEO Basics)",
                "3. Visual Layout (Above Fold, Hierarchy)",
                "4. Technical Setup (Tracking, AI Readiness)",
                "5. Performance Optimization (Load Speed, Advanced Tech)"
            ]
        },
        "validation_flowchart": {
            "title": "Validation Flowchart",
            "description": "How to validate each implementation step",
            "steps": [
                "Implement Change → Visual Inspection → Functional Test →",
                "If Applicable: Performance Test → Validation Test → Document Results"
            ]
        }
    }


def _create_troubleshooting_guide() -> Dict[str, Any]:
    """Create troubleshooting guide for common implementation issues."""
    return {
        "common_issues": [
            {
                "issue": "Changes not visible after implementation",
                "causes": ["CSS caching", "JS errors preventing rendering", "Incorrect selector"],
                "solutions": ["Clear browser cache", "Check console for errors", "Verify element selectors"]
            },
            {
                "issue": "Page broke after implementing change",
                "causes": ["Missing closing tags", "JS syntax errors", "CSS conflicts"],
                "solutions": ["Validate HTML", "Check JS syntax", "Use browser dev tools to isolate"]
            },
            {
                "issue": "Mobile layout issues after desktop changes",
                "causes": ["Fixed widths", "Not testing responsive breakpoints", "Overflow issues"],
                "solutions": ["Use relative units", "Test at 320px, 375px, 425px", "Check overflow properties"]
            },
            {
                "issue": "Tracking not working after implementation",
                "causes": ["Incorrect trigger events", "Tag firing conditions", "Data layer issues"],
                "solutions": ["Verify trigger conditions", "Test in debug mode", "Check data layer pushes"]
            }
        ],
        "debugging_steps": [
            "1. Revert change and confirm issue disappears",
            "2. Re-implement change more carefully",
            "3. Use incremental implementation (smaller changes)",
            "4. Validate after each small change",
            "5. Document what worked and what didn't"
        ],
        "when_to_get_help": [
            "Changes affect core functionality",
            "Technical implementation beyond your expertise",
            "Need to modify server configurations",
            "A/B testing or statistical analysis required"
        ]
    }


# Example usage and testing
if __name__ == "__main__":
    # Sample audit data for testing
    sample_audit = {
        "overall": 5.2,
        "overall_grade": "C",
        "dimensions": {
            "headline": {
                "score": 4,
                "issue": "Headline does not state the buyer outcome clearly",
                "fix": "Lead with the concrete buyer result and target audience in the first sentence."
            },
            "cta": {
                "score": 6,
                "issue": "CTA language is vague",
                "fix": "Use action + outcome copy like 'Run my free teardown'."
            },
            "social_proof": {
                "score": 3,
                "issue": "Trust proof is missing before conversion ask",
                "fix": "Add proof near the first CTA: testimonial, case study, or metric."
            }
        },
        "opp_matrix": [
            {
                "key": "headline",
                "label": "Headline",
                "score": 4,
                "impact": 3.0,
                "effort": 2,
                "quadrant": "quick_win",
                "issue": "Headline does not state the buyer outcome clearly",
                "fix": "Lead with the concrete buyer result and target audience in the first sentence."
            },
            {
                "key": "social_proof",
                "label": "Social Proof",
                "score": 3,
                "impact": 3.5,
                "effort": 3,
                "quadrant": "quick_win",
                "issue": "Trust proof is missing before conversion ask",
                "fix": "Add proof near the first CTA: testimonial, case study, or metric."
            },
            {
                "key": "cta",
                "label": "CTA",
                "score": 6,
                "impact": 2.0,
                "effort": 2,
                "quadrant": "quick_win",
                "issue": "CTA language is vague",
                "fix": "Use action + outcome copy like 'Run my free teardown'."
            }
        ]
    }
    
    # Generate guided implementation
    result = build_guided_implementation(sample_audit)
    print(json.dumps(result, indent=2))