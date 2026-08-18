/**
 * Canonical offer definitions for Nebula Components.
 *
 * These are the source of truth for offer names, pricing, and copy.
 * All buyer-facing surfaces import from here.
 *
 * TIME-CLAIM BASIS (verified 2026-08-18):
 * Nebula checks 9 signals in ~400ms against actual page HTML.
 * A human checking the same 9 signals manually (DevTools, viewport meta,
 * H1, CTA inspection, social proof scan, title/meta/canonical, TTFB,
 * JSON-LD) takes 15–25 minutes. A CRO agency discovery call takes 45 minutes
 * before they've looked at a single line of HTML.
 */

export const REPAIR_SPRINT_OFFER = {
  key: 'fix-pack',
  name: 'One-Leak Repair Sprint',
  priceUsd: 97,

  // THE CLOSED LOOP — what makes this different from a findings report
  closedLoop: 'Nebula finds the highest-impact leak on your page and delivers the exact fix — copy, code, or configuration — written for your specific URL. A 30-day re-audit then verifies the condition actually changed. You get a finding, the fix, and the proof it worked.',

  // TIME CLAIM — honest, specific, verifiable
  timeClaim: 'Nebula checks 9 conversion signals against your actual page HTML in under 30 seconds. The same checks done manually take 15–25 minutes in DevTools. A CRO agency discovery call takes 45 minutes before anyone looks at your page.',

  // SPECIFICITY CLAIM — what "exact" means
  specificityClaim: 'Not generic advice. Every fix is written for the specific values found on your page — your H1 text, your CTA label, your meta description, your JSON-LD structure. You receive the replacement, not a recommendation to improve it.',

  summary: 'Nebula finds the highest-impact conversion leak on your landing page, delivers the exact fix — copy, code, or configuration change — and re-audits in 30 days to confirm it held.',

  howItWorks: [
    'Paste your URL — Nebula checks 9 signals against your actual page HTML in under 30 seconds',
    'See your score and the initial findings — specific evidence from your page, not generic advice',
    'Pay $97 — receive the exact fix for your highest-impact finding within 48 hours',
    'Apply the fix — exact copy, code snippet, or configuration change written for your specific page',
    'Re-audit in 30 days — Nebula re-checks the same signal to confirm the condition changed',
  ],

  includes: [
    'One scoped repair for your highest-impact failing signal',
    'Exact replacement copy, code diff, or configuration — not "consider improving X"',
    '30-day same-scope re-audit to verify the fix held',
    'Evidence from your actual page, not a template finding',
  ],

  excludes: [
    'Full redesigns or multi-page work',
    'Backend logic or analytics platform migrations',
    'Paid third-party tools',
    'A guarantee of conversion lift — the re-audit measures whether the page condition changed, not revenue',
  ],

  evidenceBoundary:
    'The re-audit confirms whether the selected page condition changed. It does not guarantee conversion lift — no service can prove that without controlled traffic and a measurement window.',
} as const

export const GROWTH_LAUNCH_OFFER = {
  key: 'growth-launch',
  name: 'Growth Launch Sprint',
  priceUsd: 297,
  summary: 'Complete implementation across all failing signals for pages receiving paid traffic. Every failing check gets the exact fix — custom headline, CTA copy, proof layout, schema code diffs, and AI-citation structure. 30-day re-audit across all signals.',
  includes: [
    'Implementation kit covering every failing conversion signal on your page',
    'Custom headline, CTA, proof layout, and schema code diffs written for your URL',
    'AI Citation setup — JSON-LD, heading hierarchy, and llms.txt if applicable',
    'Priority 24-hour turnaround',
    '30-day same-scope re-audit across all signals',
  ],
  evidenceBoundary:
    'Verifies observable page conditions across all 9 signals. Does not guarantee ad platform revenue outcomes.',
} as const
