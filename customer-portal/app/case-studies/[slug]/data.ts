/**
 * Case study data types and entries.
 * Each entry must have real evidence before going live — the placeholder
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
export const caseStudies: CaseStudy[] = [
  {
    slug: 'first-customer',
    company: '[Case study coming soon]',
    industry: '[Industry placeholder — will be real data]',
    url: 'https://example.com',
    challenge:
      '[Challenge description placeholder — this will describe the real business problem the customer faced: ad spend not converting, unclear value proposition, or weak social proof on the landing page.]',
    auditFindings: [
      {
        signal: '[Signal placeholder]',
        issue: '[Issue placeholder — e.g. "Value proposition is buried below the fold"]',
        evidence:
          '[Evidence placeholder — e.g. "H1 reads as a tagline, not a benefit statement; no outcome claim in the first 200px"]',
      },
      {
        signal: '[Signal placeholder]',
        issue: '[Issue placeholder — e.g. "Social proof is generic and unquantified"]',
        evidence:
          '[Evidence placeholder — e.g. "Testimonials say \"great product\" with no metrics, names, or company context"]',
      },
      {
        signal: '[Signal placeholder]',
        issue: '[Issue placeholder — e.g. "CTA friction is high"]',
        evidence:
          '[Evidence placeholder — e.g. "Primary CTA asks for credit card before demonstrating value"]',
      },
    ],
    repairs: [
      {
        signal: '[Signal placeholder]',
        fix: '[Fix description placeholder — e.g. "Rewrote H1 to lead with outcome: \"Launch pages that convert — in 24 hours\""]',
        promptUsed:
          '[Prompt placeholder — e.g. "Rewrite this headline to lead with the customer outcome, not the product feature. Current: [X]. Customer goal: [Y]."]',
      },
      {
        signal: '[Signal placeholder]',
        fix: '[Fix description placeholder — e.g. "Replaced generic testimonials with role + metric + company format"]',
        promptUsed:
          '[Prompt placeholder — e.g. "Format this testimonial to include: name, role, company, and one specific metric or before/after result."]',
      },
    ],
    results: {
      scoreBefore: 0,
      scoreAfter: 0,
      grade: '[Grade placeholder — e.g. "B+"]',
      outcome:
        '[Outcome placeholder — this will be a real, measured result once the case study is complete, e.g. "+34% landing page conversion rate in 30 days"]',
    },
    publishedAt: '[Publication date placeholder — YYYY-MM-DD]',
    testimonial:
      '[Testimonial placeholder — will include a real quote from the customer once permission is granted]',
  },
]

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((cs) => cs.slug === slug)
}
