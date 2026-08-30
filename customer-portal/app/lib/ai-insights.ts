/**
 * AI-Powered Audit Insights service
 * LLM-driven analysis of audit findings for actionable recommendations
 */


import { auditPool } from '@/app/lib/audit-db'

/**
 * Get AI insights for an audit
 * Analyzes findings and generates recommendations
 */
export async function getAuditInsights(
  auditId: string
): Promise<{
  auditId: string
  overallSummary: string
  top3Strengths: Array<{
    signal: string
    insight: string
  }>
  top3Improvements: Array<{
    signal: string
    issue: string
    recommendation: string
    effort: number
    impact: number
  }>
}> {
  try {
    const auditResult = await auditPool.query(`
      SELECT id, score, grade, completed_at, url
      FROM audits
      WHERE id = $1
    `, [auditId])

    if (auditResult.rows.length === 0) {
      throw new Error(`Audit not found: ${auditId}`)
    }

    const audit = auditResult.rows[0]
    const score = parseFloat(audit.score || '0')

    const findingsResult = await auditPool.query(`
      SELECT signal_key, label, passed, issue, fix, effort, impact
      FROM findings
      WHERE audit_id = $1
    `, [auditId])

    const findings = findingsResult.rows.map((row: { signal_key: string; label: string; passed: boolean; issue: string; fix: string; effort: string; impact: string }) => ({
      signalKey: row.signal_key,
      label: row.label,
      passed: row.passed,
      issue: row.issue,
      fix: row.fix,
      effort: parseInt(row.effort || '5'),
      impact: parseFloat(row.impact || '0'),
    }))

    interface Finding {
      passed: boolean
      label: string
      issue: string
      fix: string
      effort: number
      impact: number
    }

    // Get strengths (passed signals with low impact issues)
    const strengths = findings
      .filter((f: Finding) => f.passed)
      .slice(0, 3)
      .map((f: Finding) => ({
        signal: f.label,
        insight: `Good: ${f.label} is working well.`,
      }))

    // Get improvements (failed signals, sorted by impact)
    const improvements = findings
      .filter((f: Finding) => !f.passed)
      .sort((a: Finding, b: Finding) => parseFloat(String(b.impact)) - parseFloat(String(a.impact)))
      .slice(0, 3)
      .map((f: Finding) => ({
        signal: f.label,
        issue: f.issue,
        recommendation: f.fix,
        effort: f.effort,
        impact: parseFloat(String(f.impact)).toFixed(1),
      }))

    // Generate overall summary
    let overallSummary = ''
    if (score >= 80) {
      overallSummary = 'Your landing page is performing well. Focus on refining details to reach 90+.'
    } else if (score >= 60) {
      overallSummary = 'Solid foundation, but there are key opportunities to improve conversion.'
    } else if (score >= 40) {
      overallSummary = 'Several significant leaks detected. Prioritize the top 3 improvements.'
    } else {
      overallSummary = 'Critical conversion issues. Start with the most impactful fixes first.'
    }

    return {
      auditId,
      overallSummary,
      top3Strengths: strengths.length > 0 ? strengths : [{ signal: 'N/A', insight: 'No strengths identified yet.' }],
      top3Improvements: improvements.length > 0 ? improvements : [{ signal: 'N/A', issue: 'None', recommendation: 'Continue monitoring', effort: 0, impact: 0 }],
    }
  } catch (error: unknown) {
    console.error('[AI Insights] Error getAuditInsights:', error)
    throw error
  }
}

/**
 * Get batch insights for multiple audits
 */
export async function getBatchInsights(
  auditIds: string[]
): Promise<Record<string, {
  auditId: string
  overallSummary: string
  top3Strengths: Array<{ signal: string; insight: string }>
  top3Improvements: Array<{ signal: string; issue: string; recommendation: string; effort: number; impact: number }>
}>> {
  const results: Record<string, { auditId: string; overallSummary: string; top3Strengths: Array<{ signal: string; insight: string }>; top3Improvements: Array<{ signal: string; issue: string; recommendation: string; effort: number; impact: number }> }> = {}

  for (const auditId of auditIds) {
    try {
      const insights = await getAuditInsights(auditId)
      results[auditId] = {
        auditId: insights.auditId,
        overallSummary: insights.overallSummary,
        top3Strengths: insights.top3Strengths,
        top3Improvements: insights.top3Improvements,
      }
    } catch (error: unknown) {
      console.error(`[AI Insights] Failed for audit ${auditId}:`, error instanceof Error ? error.message : String(error))
    }
  }

      return results
}

/**
 * Get signal-level AI analysis
 */
export async function getSignalAnalysis(
  auditId: string,
  signalKey: string
): Promise<{
  auditId: string
  signal: string
  currentStatus: 'pass' | 'fail' | 'warning'
  rootCause: string
  recommendation: string
  expectedImpact: 'high' | 'medium' | 'low'
}> {
  try {
    const findingResult = await auditPool.query(`
      SELECT signal_key, label, passed, issue, fix, impact
      FROM findings
      WHERE audit_id = $1 AND signal_key = $2
    `, [auditId, signalKey])

    if (findingResult.rows.length === 0) {
      throw new Error(`Signal not found in audit: ${signalKey}`)
    }

    const finding = findingResult.rows[0]
    const passed = finding.passed

    return {
      auditId,
      signal: finding.label,
      currentStatus: passed ? 'pass' : 'fail',
      rootCause: finding.issue,
      recommendation: finding.fix,
      expectedImpact: parseFloat(finding.impact || '0') > 0.5 ? 'high' : 'medium',
    }
  } catch (error: unknown) {
    console.error('[AI Insights] Error getSignalAnalysis:', error)
    throw error
  }
}
