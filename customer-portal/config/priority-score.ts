/**
 * Priority Score — canonical definition.
 *
 * This file is the single source of truth for what "Priority Score" means
 * across all buyer-facing surfaces.
 */

export const PRIORITY_SCORE_DEFINITION = {
  term: 'Priority Score',
  scale: '1–10',
  definition:
    'A rule-derived heuristic used to order findings for remediation. It incorporates journey position (how early in the visitor path the condition appears), severity (how completely the condition fails), and reproducibility (whether the condition is deterministically observable on every page load). It is not a prediction of conversion lift, revenue loss, or causal business impact.',
  factors: [
    {
      name: 'Journey position',
      description: 'How early in the visitor path the condition appears. Conditions encountered before the first CTA are weighted higher than those below the fold.',
    },
    {
      name: 'Severity',
      description: 'How completely the condition fails. A missing CTA scores higher than a suboptimal CTA label.',
    },
    {
      name: 'Reproducibility',
      description: 'Whether the condition is deterministically observable on every page load. Intermittent conditions (e.g. consent-gated scripts) score lower than conditions present in static HTML.',
    },
  ],
  notAMeasureOf: [
    'Conversion lift',
    'Revenue loss',
    'Business impact',
    'Traffic quality',
    'Offer-market fit',
  ],
} as const

export const PRIORITY_SCORE_SHORT =
  'Priority Score: a rule-derived ordering heuristic based on journey position, severity, and reproducibility. Not a prediction of conversion lift or revenue impact.'

export const PRIORITY_SCORE_TOOLTIP =
  'Ordering heuristic based on journey position, severity, and reproducibility. Not a revenue prediction.'
