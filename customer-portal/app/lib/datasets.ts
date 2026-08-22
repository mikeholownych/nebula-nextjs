export const DATASET_REGISTRY_VERSION = '2026-08-22.v1'

/**
 * Single public registry of Nebula's published landing-page datasets.
 *
 * Different cohort surfaces report different sample sizes by design. This
 * registry exists so humans, search engines, and LLM retrievers can reconcile
 * them: each record declares its scope, collection window, denominator, and
 * relationship to the others. Frozen editions must never silently change n;
 * the live aggregate must never be hardcoded.
 */
export interface DatasetRecord {
  id: string
  name: string
  kind: 'frozen-study' | 'live-aggregate'
  /** Fixed denominator for frozen records; null when served live. */
  sampleSize: number | null
  averageScore: number | null
  scoreScale: 10 | 100
  scope: string
  collectionWindow: string
  asOf: string
  sourcePath: string
  relationship: string
}

export const CROSS_INDUSTRY_JULY_2026_STUDY: DatasetRecord = {
  id: 'cross-industry-paid-traffic-july-2026',
  name: 'Cross-Industry Paid Traffic Study (July 2026)',
  kind: 'frozen-study',
  sampleSize: 86,
  averageScore: 62.7,
  scoreScale: 100,
  scope: 'Cross-industry landing pages running paid traffic, audited July 2026 under the methodology then in use.',
  collectionWindow: 'July 2026',
  asOf: '2026-07-31',
  sourcePath: '/press',
  relationship:
    'Versioned historical snapshot. Its collection window precedes the Q3 2026 report; the Leak Index covers a later rolling window. Not comparable page-for-page with either.',
}

export const STATE_Q3_2026_REPORT: DatasetRecord = {
  id: 'state-of-landing-page-performance-q3-2026',
  name: 'State of Landing Page Performance Q3 2026',
  kind: 'frozen-study',
  sampleSize: 131,
  averageScore: null,
  scoreScale: 100,
  scope: 'Aggregate findings from completed audits collected through August 2026; Above Fold and Ad Signals pending rendered verification.',
  collectionWindow: 'Through August 2026',
  asOf: '2026-08-31',
  sourcePath: '/research/landing-page-performance-q3-2026',
  relationship:
    'Published edition with a fixed denominator of 131. Extends the July 2026 study window. Live rates after this edition are reported only by the Leak Index.',
}

export const LIVE_LEAK_INDEX: DatasetRecord = {
  id: 'landing-page-leak-index-live',
  name: 'The Landing Page Leak Index (live)',
  kind: 'live-aggregate',
  sampleSize: null,
  averageScore: null,
  scoreScale: 100,
  scope: 'Rolling aggregate over recent completed audits from the current engine version; internal addresses excluded.',
  collectionWindow: 'Rolling; served from the stats endpoint',
  asOf: 'Served live',
  sourcePath: '/benchmarks',
  relationship:
    'The current-production view. Counts move as audits complete; cite the count shown at retrieval time rather than any fixed n.',
}

export const DATASET_REGISTRY: DatasetRecord[] = [
  CROSS_INDUSTRY_JULY_2026_STUDY,
  STATE_Q3_2026_REPORT,
  LIVE_LEAK_INDEX,
]
