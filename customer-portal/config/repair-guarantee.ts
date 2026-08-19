/**
 * Repair Guarantee — canonical wording.
 *
 * All surfaces that mention the guarantee MUST import from here
 * to prevent wording drift.
 */

export const REPAIR_GUARANTEE = {
  title: 'Repair Guarantee',
  statement:
    'If you implement the supplied repair exactly as specified and the targeted condition still fails the same Nebula check, we will revise the repair once at no additional charge. If we cannot produce a repair that satisfies the agreed check within the stated scope, we will refund the Repair Sprint.',
  exclusions: [
    'Customer implementation differs materially from the supplied instructions',
    'The page or framework changed between repair delivery and re-audit',
    'A third-party script prevents deterministic remediation of the targeted condition',
    'The targeted content is inaccessible or behind authentication',
    'The condition depends on a third-party system outside the stated scope',
    'Customer does not provide evidence that the repair was implemented as specified',
    'The requested remediation would create a security, legal, accessibility, or platform-policy risk',
  ],
  evidenceBoundary:
    'The guarantee covers whether the targeted condition moves from FAIL to PASS on the same Nebula check. It does not guarantee conversion lift, revenue improvement, or any business outcome.',
} as const

export const EARLY_STAGE_DISCLOSURE =
  'Nebula does not yet publish paid-client conversion outcomes. The Repair Sprint is sold on a bounded deliverable: one verified condition, one concrete remediation, and a same-scope re-audit.'
