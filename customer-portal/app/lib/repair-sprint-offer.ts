export const REPAIR_SPRINT_OFFER = {
  key: 'fix-pack',
  name: 'One-Leak Repair Sprint',
  priceUsd: 97,
  checkoutUrl: 'https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h',
  summary: 'Run the free audit. See your findings immediately — no signup, no email required. Pay $97 to get targeted AI prompts that fix the highest-impact finding on your specific page.',
  howItWorks: [
    'Run the free audit — paste your URL, get 9 signals scored in under 2 minutes',
    'See your full findings immediately — no email required, no gate',
    'Pay $97 to get AI prompts written for your specific failing signals',
    'Prompts delivered instantly — implement with your developer, CMS, or directly',
  ],
  includes: [
    'AI implementation prompts targeted at your specific failing signals',
    'One high-impact finding selected from your audit results',
    'Exact copy, code, or configuration changes — not generic advice',
    'Same-scope re-audit within 30 days to verify the fix held',
  ],
  excludes: [
    'Full redesigns or multiple pages',
    'Backend application logic or analytics migrations',
    'Paid third-party tools',
    'A promise of conversion lift',
  ],
  evidenceBoundary:
    'The re-audit verifies whether the selected page condition changed; it does not by itself prove conversion lift.',
} as const
