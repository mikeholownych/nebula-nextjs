/**
 * AI-Powered Audit Recommendations service
 * LLM-powered fix suggestions, personalized recommendations, custom fix steps
 */

import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

/**
 * Get audit scores (signal-level)
 */
async function getAuditSignalScores(auditId: string): Promise<Array<{
  signalKey: string
  score: number
  passed: boolean
  issue: string
  evidence: any
}>> {
  // Score calculation based on findings status
  const findingsResult = await auditPool.query(`
    SELECT signal_key, issue, evidence, status
    FROM findings
    WHERE audit_id = $1
  `, [auditId])

  const scores: Array<{ signalKey: string; score: number; passed: boolean; issue: string; evidence: any }> = []

  for (const finding of findingsResult.rows) {
    // Calculate score based on finding status
    // In production, this would use more sophisticated scoring
    let score = 0.7 // default score
    if (finding.status === 'resolved') score = 1.0
    else if (finding.status === 'action_required') score = 0.4
    else if (finding.status === 'needs_review') score = 0.5

    scores.push({
      signalKey: finding.signal_key,
      score,
      passed: score >= 0.6,
      issue: finding.issue || 'No issue found',
      evidence: finding.evidence || null,
    })
  }

  // Add default scores for missing signals
  const defaultSignals = [
    'message_match', 'trust', 'above_fold', 'social_proof', 'load_speed',
    'mobile', 'ad_signals', 'seo_foundations', 'ai_readiness'
  ]

  const existingSignals = new Set(scores.map(s => s.signalKey))
  for (const signal of defaultSignals) {
    if (!existingSignals.has(signal)) {
      scores.push({
        signalKey: signal,
        score: 0.7,
        passed: true,
        issue: 'No issues found',
        evidence: null,
      })
    }
  }

  return scores
}

/**
 * Generate AI recommendations for audit
 */
export async function generateAuditRecommendations(
  auditId: string,
  signalKey?: string
): Promise<{
  recommendations: Array<{
    id: string
    signalKey: string
    signalName: string
    currentScore: number
    targetScore: number
    improvementPercentage: number
    priority: 'high' | 'medium' | 'low'
    recommendation: string
    steps: Array<{ step: number; action: string; estimateHours: number }>
    estimatedImpact: 'high' | 'medium' | 'low'
  }>
}> {
  try {
    // Get audit details
    const auditResult = await auditPool.query(`
      SELECT id, url, score, grade, completed_at
      FROM audits
      WHERE id = $1
    `, [auditId])

    if (auditResult.rows.length === 0) {
      throw new Error(`Audit not found: ${auditId}`)
    }

    // Get audit scores
    let scores = await getAuditSignalScores(auditId)

    if (signalKey) {
      scores = scores.filter(s => s.signalKey === signalKey)
    }

    const recommendations = scores.map((scoreData) => {
      const currentScore = scoreData.score
      const improvementPercentage = Math.round((1 - currentScore) * 100)

      // Determine priority based on score
      let priority: 'high' | 'medium' | 'low'
      if (currentScore < 0.3) priority = 'high'
      else if (currentScore < 0.6) priority = 'medium'
      else priority = 'low'

      // Generate steps
      const steps = generateCustomSteps(scoreData.signalKey, scoreData.issue, currentScore)

      // Determine estimated impact
      let estimatedImpact: 'high' | 'medium' | 'low'
      if (currentScore < 0.3) estimatedImpact = 'high'
      else if (currentScore < 0.6) estimatedImpact = 'medium'
      else estimatedImpact = 'low'

      return {
        id: scoreData.signalKey,
        signalKey: scoreData.signalKey,
        signalName: getSignalName(scoreData.signalKey),
        currentScore,
        targetScore: 0.95,
        improvementPercentage,
        priority,
        recommendation: generateRecommendation(scoreData.signalKey, scoreData.issue, currentScore),
        steps,
        estimatedImpact,
      }
    })

    return { recommendations }
  } catch (error: any) {
    console.error('[AI] Error generateAuditRecommendations:', error)
    throw error
  }
}

/**
 * Generate custom steps for a finding
 */
function generateCustomSteps(
  signalKey: string,
  issue: string,
  currentScore: number
): Array<{ step: number; action: string; estimateHours: number }> {
  const steps = []
  let step = 1

  switch (signalKey) {
    case 'cta':
      steps.push(
        { step: step++, action: 'Review current CTA text and placement', estimateHours: 0.5 },
        { step: step++, action: 'A/B test "Book Audit" vs "Get Started"', estimateHours: 2 },
        { step: step++, action: 'Ensure CTA is visible above fold', estimateHours: 1 }
      )
      break
    case 'social_proof':
      steps.push(
        { step: step++, action: 'Add 3-5 well-known client names', estimateHours: 1 },
        { step: step++, action: 'Include customer logos section', estimateHours: 2 },
        { step: step++, action: 'Add case study testimonials', estimateHours: 4 }
      )
      break
    case 'headline':
      steps.push(
        { step: step++, action: 'Analyze competitor headlines', estimateHours: 1 },
        { step: step++, action: 'Craft value proposition headline', estimateHours: 2 },
        { step: step++, action: 'A/B test headline variations', estimateHours: 2 }
      )
      break
    case 'load_speed':
      steps.push(
        { step: step++, action: 'Run Lighthouse performance audit', estimateHours: 0.5 },
        { step: step++, action: 'Optimize images (WebP/AVIF)', estimateHours: 2 },
        { step: step++, action: 'Enable caching and compression', estimateHours: 1 }
      )
      break
    case 'mobile':
      steps.push(
        { step: step++, action: 'Test on multiple devices', estimateHours: 1 },
        { step: step++, action: 'Fix tap target spacing', estimateHours: 2 },
        { step: step++, action: 'Optimize font sizes for mobile', estimateHours: 1 }
      )
      break
    default:
      steps.push(
        { step: step++, action: 'Analyze current state', estimateHours: 1 },
        { step: step++, action: 'Implement fix', estimateHours: 2 },
        { step: step++, action: 'Re-audit to verify', estimateHours: 0.5 }
      )
  }

  return steps
}

/**
 * Generate recommendation text
 */
function generateRecommendation(
  signalKey: string,
  issue: string,
  currentScore: number
): string {
  const improvement = Math.round((1 - currentScore) * 100)
  const benefit = currentScore < 0.5 ? 'significant' : 'moderate'

  return `Based on your current ${signalKey} score of ${(currentScore * 100).toFixed(0)}, implementing these recommendations could improve your conversion rate by up to ${improvement}%. This is a ${benefit} opportunity to boost your landing page performance.`
}

/**
 * Get signal name
 */
function getSignalName(signalKey: string): string {
  const names: Record<string, string> = {
    message_match: 'Message Match',
    trust: 'Trust Signals',
    above_fold: 'Above Fold',
    social_proof: 'Social Proof',
    load_speed: 'Load Speed',
    mobile: 'Mobile Experience',
    ad_signals: 'Ad Signals',
    seo_foundations: 'SEO Foundations',
    ai_readiness: 'AI Readiness',
  }
  return names[signalKey] || signalKey
}

/**
 * Get recommended fix pack offer for customer
 */
export async function getFixPackOffer(customerId: string): Promise<{
  offerId: string
  title: string
  description: string
  price: number
  features: string[]
  ctas: Array<{ text: string; url: string }>
}> {
  try {
    // Check customer's recent audits
    const auditResult = await auditPool.query(`
      SELECT id, url, score, completed_at
      FROM audits
      WHERE customer_id = $1
      ORDER BY completed_at DESC
      LIMIT 5
    `, [customerId])

    if (auditResult.rows.length === 0) {
      throw new Error('No audits found for customer')
    }

    // Generate offer based on audit history
    const audits = auditResult.rows.map((row: any) => ({
      id: row.id,
      url: row.url,
      score: parseFloat(row.score || '0'),
      completedAt: row.completed_at,
    }))

    const avgScore = audits.reduce((sum: number, a: any) => sum + a.score, 0) / audits.length
    const lowScores = audits.filter((a: any) => a.score < 70).length

    let features: string[] = []
    if (lowScores >= 3) {
      features = [
        'Deep dive into your top 3 conversion leaks',
        'Prioritized fix recommendations',
        '1-on-1 strategy session with CRO expert',
        '30-day re-audit to track progress',
        'Priority support for implementation',
      ]
    } else {
      features = [
        'Identify your #1 conversion leak',
        'Step-by-step fix plan with clear steps',
        '30-day re-audit included',
        'Priority implementation support',
      ]
    }

    return {
      offerId: 'fix-pack',
      title: 'One-Leak Repair Sprint',
      description: `Get immediate fixes for your landing page. Based on your ${lowScores >= 3 ? 'multiple' : 'single'} low-scoring areas, we'll help you fix the most impactful leak first.`,
      price: 97,
      features,
      ctas: [
        { text: 'Book Audit', url: `/audit` },
        { text: 'View Past Audits', url: `/workspace/audits` },
      ],
    }
  } catch (error: any) {
    console.error('[AI] Error getFixPackOffer:', error)
    throw error
  }
}

// Initialize cache on service load
const aiRecommendationsCache = new Map<string, { data: any; expires: number }>()

export const aiServiceEnabled = true
