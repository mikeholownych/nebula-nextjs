export const BRAND_EVIDENCE_VERSION = '2026-08-06.v1'

/**
 * Governed evidence records used by brand and press surfaces.
 * These datasets have different scopes and must never be presented as one
 * measurement of the same population.
 */
export const ALL_AUDITS_BENCHMARK = {
  version: BRAND_EVIDENCE_VERSION,
  scope: 'All completed audits in the live audit dataset',
  denominator: 'Every audit with completed status',
  averageScore: 6.2,
  scoreScale: 10,
  grade: 'C',
  date: 'Current live dataset; refresh when the source aggregate changes',
  source: 'BRAND_STORY.md §14 and the audit engine aggregate record',
} as const

export const CROSS_INDUSTRY_PAID_TRAFFIC_STUDY = {
  version: BRAND_EVIDENCE_VERSION,
  scope: 'Cross-industry landing pages running paid traffic',
  denominator: '86 automated page audits',
  sampleSize: 86,
  averageScore: 62.7,
  scoreScale: 100,
  grade: 'C',
  date: 'July 2026',
  precision: 'One decimal place; 62.7/100',
  source: 'Nebula Components cross-industry audit study',
} as const
