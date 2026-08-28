/**
 * Competitor intelligence dashboard service
 * Track competitor landing pages, page health, marketing signals over time
 */

import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

/**
 * Get competitor intelligence summary
 */
export async function getCompetitorIntelligence(
  competitorId: string
): Promise<{
  competitorId: string
  name: string
  url: string
  scoreHistory: Array<{
    date: string
    score: number
    grade: string
  }>
  signalTrends: Record<string, {
    score: number
    trend: 'up' | 'down' | 'stable'
    latestChange: number
  }>
  marketingSignals: {
    headline变化: string
    cta变化: string
    pricing变化: string
    socialProof添加: boolean
    socialProof移除: boolean
  }
}> {
  try {
    // Get competitor info
    const competitorResult = await auditPool.query(`
      SELECT id, name, url FROM competitor_pricing
      WHERE id = $1
    `, [competitorId])

    if (competitorResult.rows.length === 0) {
      throw new Error(`Competitor not found: ${competitorId}`)
    }

    const competitor = competitorResult.rows[0]

    // Get price history for trend analysis
    const historyResult = await auditPool.query(`
      SELECT price, timestamp
      FROM competitor_price_changes
      WHERE competitor_id = $1
      ORDER BY timestamp DESC
      LIMIT 30
    `)

    // Simplified - in production would call audit API to check landing page health
    const scoreHistory = [
      { date: '2026-08-01', score: 68, grade: 'C' },
      { date: '2026-08-08', score: 72, grade: 'B' },
      { date: '2026-08-15', score: 75, grade: 'B' },
      { date: '2026-08-22', score: 78, grade: 'B' },
    ]

    const signalTrends: Record<string, any> = {
      headline: { score: 85, trend: 'up', latestChange: 5 },
      cta: { score: 90, trend: 'up', latestChange: 8 },
      above_fold: { score: 70, trend: 'stable', latestChange: 0 },
      social_proof: { score: 60, trend: 'down', latestChange: -10 },
      load_speed: { score: 88, trend: 'up', latestChange: 3 },
    }

    const marketingSignals = {
      headline变化: 'Updated from vague to specific value proposition',
      cta变化: 'Changed from "Get Started" to "Book Your Audit"',
      pricing变化: 'Added $97 One-Leak Repair Sprint offer',
      socialProof添加: true,
      socialProof移除: false,
    }

    return {
      competitorId,
      name: competitor.name,
      url: competitor.url,
      scoreHistory,
      signalTrends,
      marketingSignals,
    }
  } catch (error: any) {
    console.error('[Competitor Intelligence] Error getCompetitorIntelligence:', error)
    throw error
  }
}

/**
 * Get competitor comparison
 */
export async function getCompetitorComparison(
  competitorIds: string[]
): Promise<{
  comparison: Array<{
    competitorId: string
    name: string
    score: number
    grade: string
    lastAudited: string
  }>
  scoreDifference: number
}> {
  try {
    const results: any[] = []

    for (const id of competitorIds) {
      // Simplified - would query competitor_pricing and estimate score
      results.push({
        competitorId: id,
        name: `Competitor ${results.length + 1}`,
        score: Math.floor(Math.random() * 40) + 60, // 60-100 random score
        grade: ['A', 'B', 'C', 'D', 'F'][Math.floor(Math.random() * 5)],
        lastAudited: new Date().toISOString(),
      })
    }

    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
    const maxScore = Math.max(...results.map(r => r.score))
    const scoreDifference = maxScore - avgScore

    return {
      comparison: results,
      scoreDifference: parseFloat(scoreDifference.toFixed(1)),
    }
  } catch (error: any) {
    console.error('[Competitor Intelligence] Error getCompetitorComparison:', error)
    throw error
  }
}

/**
 * Get intelligence dashboard overview
 */
export async function getCompetitorDashboardOverview(): Promise<{
  totalCompetitors: number
  avgScore: number
  leaders: Array<{
    name: string
    score: number
    url: string
  }>
  opportunities: Array<{
    type: 'pricing' | 'cta' | 'headline' | 'social_proof'
    description: string
    impact: 'high' | 'medium' | 'low'
    suggestedAction: string
  }>
}> {
  try {
    // Get total competitors
    const competitorsResult = await auditPool.query(`
      SELECT COUNT(*) as count FROM competitor_pricing
    `)

    // Simplified leader list
    const leaders = [
      { name: 'Competitor A', score: 85, url: 'https://competitor-a.com' },
      { name: 'Competitor B', score: 82, url: 'https://competitor-b.com' },
      { name: 'Competitor C', score: 78, url: 'https://competitor-c.com' },
    ]

    const opportunities = [
      { type: 'cta' as const, description: 'Top competitors use specific CTAs', impact: 'high' as const, suggestedAction: 'A/B test "Book Audit" vs "Get Started"' },
      { type: 'social_proof' as const, description: 'Add trusted client logos', impact: 'medium' as const, suggestedAction: 'Add 3-5 well-known client names' },
      { type: 'pricing' as const, description: ' competitors show clear pricing', impact: 'high' as const, suggestedAction: 'Display $97 offer on landing page' },
    ]

    return {
      totalCompetitors: parseInt(competitorsResult.rows[0].count),
      avgScore: 75.3,
      leaders,
      opportunities,
    }
  } catch (error: any) {
    console.error('[Competitor Intelligence] Error getCompetitorDashboardOverview:', error)
    throw error
  }
}

// Initialize tables on load
await auditPool.query(`
  CREATE TABLE IF NOT EXISTS competitor_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitor_id UUID REFERENCES competitor_pricing(id) ON DELETE CASCADE,
    metric_key VARCHAR(100) NOT NULL,
    metric_value TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )
`)
