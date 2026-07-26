import type { Finding } from './auditResultSchema'

export const REPORT_NAVIGATION = [
  { id: 'overview', label: 'Overview' },
  { id: 'fix-first', label: 'Fix first' },
  { id: 'signals', label: 'Signals' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'remediation', label: 'Remediation' },
] as const

export type SignalGroupId =
  | 'message'
  | 'action'
  | 'proof'
  | 'mobile'
  | 'performance'
  | 'measurement'
  | 'discovery'

export interface SignalGroupDefinition {
  id: SignalGroupId
  label: string
  description: string
  keys: string[]
}

export const SIGNAL_GROUPS: SignalGroupDefinition[] = [
  {
    id: 'message',
    label: 'Message Match',
    description: 'Can a visitor understand the promise and connect it to the ad they clicked?',
    keys: ['headline'],
  },
  {
    id: 'action',
    label: 'Action & Friction',
    description: 'Is the next step obvious, visible, and proportionate to visitor intent?',
    keys: ['cta', 'above_fold'],
  },
  {
    id: 'proof',
    label: 'Trust & Proof',
    description: 'Does the page support its claims before asking for commitment?',
    keys: ['social_proof'],
  },
  {
    id: 'mobile',
    label: 'Mobile Experience',
    description: 'Does the page preserve hierarchy, readability, and tap access on small screens?',
    keys: ['mobile'],
  },
  {
    id: 'performance',
    label: 'Performance',
    description: 'Does the page become useful quickly enough to keep paid visitors from bouncing?',
    keys: ['load_speed'],
  },
  {
    id: 'measurement',
    label: 'Measurement',
    description: 'Can ad clicks be connected to outcomes without guessing?',
    keys: ['ad_signals'],
  },
  {
    id: 'discovery',
    label: 'Discovery & Compliance',
    description: 'Can search and AI systems interpret, cite, and safely surface the page?',
    keys: ['seo_foundations', 'ai_readiness', 'local_gbp'],
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
    const discovery = groups.find((group) => group.id === 'discovery')
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
