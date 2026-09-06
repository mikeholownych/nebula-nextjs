/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'

const component = readFileSync(
  path.join(process.cwd(), 'components/ResultsFeedback.tsx'),
  'utf8',
)
const resultsPage = readFileSync(
  path.join(process.cwd(), 'app/audit/[id]/results/ResultsClient.tsx'),
  'utf8',
)
const registry = readFileSync(
  path.join(process.cwd(), 'config/analytics-registry.json'),
  'utf8',
)

describe('results feedback', () => {
  it('provides an accessible rating and optional comment form', () => {
    expect(component).toContain('How useful was this report?')
    expect(component).toContain('aria-label={`Rate this report ${star} out of 5`')
    expect(component).toContain('What did you find most valuable? Any suggestions?')
    expect(component).toContain('Send Feedback')
  })

  it('submits only bounded feedback metadata to analytics', () => {
    expect(component).toContain("trackClientFunnelEvent('audit_feedback_submitted'")
    expect(component).toContain('feedback_length: comment.trim().length')
    expect(component).toContain('rating')
    expect(component).not.toContain('feedback: comment')
    expect(component).not.toContain('feedback_text: comment')
  })

  it('mounts feedback on the audit results page and registers the event', () => {
    expect(resultsPage).toContain("import ResultsFeedback from '@/components/ResultsFeedback'")
    expect(resultsPage).toContain('<ResultsFeedback auditId={auditId} />')
    expect(registry).toContain('"name": "audit_feedback_submitted"')
  })
})
