export const REPAIR_SPRINT_OFFER = {
  key: 'fix-pack',
  name: 'One-Leak Repair Sprint',
  priceUsd: 97,
  summary: 'Run the free audit, then get a tailored repair sprint for one high-impact finding. You or your developer applies the supplied copy, code, or configuration change.',
  howItWorks: [
    'Run the free audit - paste your URL, get 9 signals scored in under 2 minutes',
    'Review the initial findings and unlock the full report by email',
    'Pay $97 for a kit tailored to one high-impact finding',
    'Apply the supplied copy, code, or configuration change yourself or with your developer',
  ],
  includes: [
    'A tailored implementation kit for one specific failing signal',
    'One high-impact finding selected from your audit results',
    'Exact copy, code, or configuration change - not generic advice',
    'Same-scope re-audit within 30 days to verify the fix held',
  ],
  excludes: [
    'Full redesigns or multiple pages',
    'Backend application logic or analytics migrations',
    'Paid third-party tools',
    'A promise of conversion lift',
  ],
  evidenceBoundary:
    'The re-audit verifies whether the selected page condition changed; the kit does not guarantee conversion lift.',
} as const

export const GROWTH_LAUNCH_OFFER = {
  key: 'growth-launch',
  name: 'Growth Launch Sprint',
  priceUsd: 297,
  summary: 'Full 7-signal implementation sprint for companies spending $1k+/mo on paid traffic. Tailored copy, Next.js/Tailwind code diffs, JSON-LD schemas, and 30-day re-audit across all failing conversion signals.',
  includes: [
    'Complete implementation kit covering all failing conversion signals',
    'Custom headline, CTA, proof layout, and schema code diffs',
    'AI Citation (GEO/AEO) extractability setup and llms.txt configuration',
    'Priority 24-hour turnaround + same-scope 30-day re-audit verification',
  ],
  evidenceBoundary:
    'Verifies observable page conditions across all 7 signals; does not guarantee third-party ad platform revenue outcomes.',
} as const

