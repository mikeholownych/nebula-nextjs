export const BRAND_EVIDENCE_VERSION = '2026-08-22.v2'

/**
 * Governed evidence records used by brand and press surfaces.
 * These datasets have different scopes and must never be presented as one
 * measurement of the same population.
 *
 * Cohort reconciliation across all published surfaces lives in
 * `app/lib/datasets.ts` (DATASET_REGISTRY). Do not add constants here that
 * claim to describe the current live dataset - link or fetch instead.
 */
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
