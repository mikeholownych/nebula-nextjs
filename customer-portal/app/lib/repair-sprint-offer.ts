export const REPAIR_SPRINT_OFFER = {
  key: 'fix-pack',
  name: 'One-Leak Repair Sprint',
  priceUsd: 97,
  checkoutUrl: 'https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h',
  summary: 'One landing page. One high-confidence repair. Implemented and verified by Nebula.',
  includes: [
    'Baseline evidence for the selected page condition',
    'Written scope confirmation before implementation',
    'One buyer-approved page-level repair',
    'Production verification and same-scope re-audit',
    'One additional same-scope evidence check within 30 days',
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
