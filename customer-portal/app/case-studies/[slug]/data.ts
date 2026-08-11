/**
 * Case study data types and entries.
 * Each entry must have real evidence before going live - the placeholder
 * below makes this clear and prevents publishing empty data.
 */

export type AuditFinding = {
  signal: string
  issue: string
  evidence: string
}

export type Repair = {
  signal: string
  fix: string
  promptUsed: string
}

export type CaseStudyResults = {
  scoreBefore: number
  scoreAfter: number
  grade: string
  outcome: string
}

export type CaseStudy = {
  slug: string
  company: string
  industry: string
  url: string
  challenge: string
  auditFindings: AuditFinding[]
  repairs: Repair[]
  results: CaseStudyResults
  publishedAt: string
  testimonial?: string
}

/**
 * Case study entries.
 * Add real entries here once evidence and publication permission are complete.
 * See app/lib/public-facts.ts for the publication checklist.
 */
export const caseStudies: CaseStudy[] = []

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((cs) => cs.slug === slug)
}
