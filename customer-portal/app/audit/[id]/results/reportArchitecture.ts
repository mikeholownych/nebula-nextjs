import type { Finding } from './auditResultSchema'

export const REPORT_NAVIGATION = [
  { id: 'overview', label: 'Overview' },
  { id: 'fix-first', label: 'Fix first' },
  { id: 'signals', label: 'Signals' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'remediation', label: 'Remediation' },
] as const

export type SignalGroupId =
  | 'message_match'
  | 'trust'
  | 'mobile_cta'
  | 'load_time'
  | 'cta_clarity'
  | 'above_fold'
  | 'ad_signals'
  | 'seo_foundations'
  | 'ai_readiness'

export interface SignalGroupDefinition {
  id: SignalGroupId
  label: string
  description: string
  keys: string[]
}

export const SIGNAL_GROUPS: SignalGroupDefinition[] = [
  {
    id: 'message_match',
    label: 'Message Match',
    description: 'Does the page promise match the expectation created by the ad or referring source?',
    keys: ['headline', 'message_match'],
  },
  {
    id: 'trust',
    label: 'Trust Signals',
    description: 'Does the page support its claims before asking for commitment?',
    keys: ['social_proof', 'trust'],
  },
  {
    id: 'mobile_cta',
    label: 'Mobile CTA',
    description: 'Is the primary action visible and usable on a small viewport?',
    keys: ['mobile', 'mobile_cta'],
  },
  {
    id: 'load_time',
    label: 'Load Time',
    description: 'Does the page become useful quickly enough to keep paid visitors from bouncing?',
    keys: ['load_speed', 'load_time'],
  },
  {
    id: 'cta_clarity',
    label: 'CTA Clarity',
    description: 'Is the next step obvious and proportionate to visitor intent?',
    keys: ['cta', 'cta_clarity'],
  },
  {
    id: 'above_fold',
    label: 'Above-Fold Clarity',
    description: 'Can a visitor understand the offer and next action in the first viewport?',
    keys: ['above_fold'],
  },
  {
    id: 'ad_signals',
    label: 'Ad Signals',
    description: 'Can paid clicks be connected to outcomes without guessing?',
    keys: ['ad_signals'],
  },
  {
    id: 'seo_foundations',
    label: 'SEO Foundations',
    description: 'Can search systems retrieve and interpret the page foundations?',
    keys: ['seo_foundations'],
  },
  {
    id: 'ai_readiness',
    label: 'AI Readiness',
    description: 'Can answer engines identify, verify, and cite the page accurately?',
    keys: ['ai_readiness', 'local_gbp'],
  },
]

export interface GroupedSignal extends SignalGroupDefinition {
  findings: Finding[]
  status: 'clear' | 'critical' | 'warning' | 'advisory'
}

export function findingSeverity(finding: Finding): 'critical' | 'warning' | 'advisory' {
  if (finding.impact >= 8) return 'critical'
  if (finding.impact >= 5) return 'warning'
  return 'advisory'
}

export function buildPriorityQueue(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => b.impact - a.impact || a.effort - b.effort || a.label.localeCompare(b.label))
}

export function groupFindingsBySignal(findings: Finding[]): GroupedSignal[] {
  const assigned = new Set<string>()

  const groups = SIGNAL_GROUPS.map((group) => {
    const matches = findings.filter((finding) => group.keys.includes(finding.key))
    matches.forEach((finding) => assigned.add(finding.key))
    const severities = matches.map(findingSeverity)
    const status = severities.includes('critical')
      ? 'critical'
      : severities.includes('warning')
        ? 'warning'
        : severities.includes('advisory')
          ? 'advisory'
          : 'clear'

    return { ...group, findings: buildPriorityQueue(matches), status } satisfies GroupedSignal
  })

  const unassigned = findings.filter((finding) => !assigned.has(finding.key))
  if (unassigned.length) {
    const discovery = groups.find((group) => group.id === 'ai_readiness')
    if (discovery) {
      discovery.findings = buildPriorityQueue([...discovery.findings, ...unassigned])
      const severities = discovery.findings.map(findingSeverity)
      discovery.status = severities.includes('critical')
        ? 'critical'
        : severities.includes('warning')
          ? 'warning'
          : 'advisory'
    }
  }

  return groups
}

export function summarizeFindings(findings: Finding[]) {
  return findings.reduce(
    (summary, finding) => {
      summary[findingSeverity(finding)] += 1
      summary.total += 1
      return summary
    },
    { critical: 0, warning: 0, advisory: 0, total: 0 },
  )
}
