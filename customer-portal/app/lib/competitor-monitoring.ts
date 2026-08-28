/**
 * Competitor price monitoring service
 * Tracks competitor SaaS pricing pages for rate changes
 */

import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

interface Competitor {
  id: string
  name: string
  url: string
  price: number
  interval: 'monthly' | 'yearly'
  status: 'active' | 'archived'
  last_checked_at: string | null
  created_at: string
}

interface PriceLog {
  competitor_id: string
  old_price: number
  new_price: number
  change_date: string
  percent_change: number
}

/**
 * Get all active competitors
 */
export async function getCompetitors(): Promise<Competitor[]> {
  try {
    const result = await auditPool.query(`
      SELECT * FROM competitor_pricing
      WHERE status = 'active'
      ORDER BY created_at DESC
    `)

    return result.rows as Competitor[]
  } catch (error) {
    console.error('[Competitor] Error getCompetitors:', error)
    throw error
  }
}

/**
 * Add new competitor to monitor
 */
export async function addCompetitor(
  name: string,
  url: string,
  currentPrice: number
): Promise<Competitor> {
  try {
    const result = await auditPool.query(`
      INSERT INTO competitor_pricing (name, url, price, interval, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, url, currentPrice, 'monthly', 'active'])

    return result.rows[0] as Competitor
  } catch (error) {
    console.error('[Competitor] Error addCompetitor:', error)
    throw error
  }
}

/**
 * Update competitor price and log change
 */
export async function updateCompetitorPrice(
  competitorId: string,
  newPrice: number
): Promise<{ competitor: Competitor; log: PriceLog; changed: boolean }> {
  try {
    // Get current price
    const currentResult = await auditPool.query(`
      SELECT id, price, interval FROM competitor_pricing WHERE id = $1
    `, [competitorId])

    if (currentResult.rows.length === 0) {
      throw new Error(`Competitor ${competitorId} not found`)
    }

    const currentPrice = parseFloat(currentResult.rows[0].price)
    const interval = currentResult.rows[0].interval as 'monthly' | 'yearly'

    if (currentPrice === newPrice) {
      // Update last checked timestamp only
      await auditPool.query(`
        UPDATE competitor_pricing 
        SET last_checked_at = NOW()
        WHERE id = $1
      `, [competitorId])

      return {
        competitor: { ...currentResult.rows[0], last_checked_at: new Date().toISOString() } as Competitor,
        log: { competitor_id: competitorId, old_price: newPrice, new_price: newPrice, change_date: new Date().toISOString(), percent_change: 0 },
        changed: false
      }
    }

    // Record price change
    const percentChange = ((newPrice - currentPrice) / currentPrice) * 100

    await auditPool.query(`
      INSERT INTO competitor_price_changes (competitor_id, old_price, new_price, percent_change)
      VALUES ($1, $2, $3, $4)
    `, [competitorId, currentPrice, newPrice, percentChange])

    // Update competitor price
    const result = await auditPool.query(`
      UPDATE competitor_pricing 
      SET price = $1, last_checked_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [newPrice, competitorId])

    return {
      competitor: result.rows[0] as Competitor,
      log: {
        competitor_id: competitorId,
        old_price: currentPrice,
        new_price: newPrice,
        change_date: new Date().toISOString(),
        percent_change: percentChange
      },
      changed: true
    }
  } catch (error) {
    console.error('[Competitor] Error updateCompetitorPrice:', error)
    throw error
  }
}

/**
 * Get competitor price history
 */
export async function getCompetitorHistory(competitorId: string, days: number = 30): Promise<PriceLog[]> {
  try {
    const result = await auditPool.query(`
      SELECT * FROM competitor_price_changes
      WHERE competitor_id = $1
      AND change_date > NOW() - INTERVAL '${days} days'
      ORDER BY change_date DESC
    `, [competitorId])

    return result.rows as PriceLog[]
  } catch (error) {
    console.error('[Competitor] Error getCompetitorHistory:', error)
    throw error
  }
}

/**
 * Get competitor metrics
 */
export async function getCompetitorMetrics(): Promise<{
  totalCompetitors: number
  activeCompetitors: number
  priceChangesLast30Days: number
  avgPriceChange: number
}> {
  try {
    const competitorsResult = await auditPool.query(`
      SELECT COUNT(*) as total, 
             COUNT(*) FILTER (WHERE status = 'active') as active
      FROM competitor_pricing
    `)

    const changesResult = await auditPool.query(`
      SELECT 
        COUNT(*) as changes,
        AVG(percent_change) as avg_change
      FROM competitor_price_changes
      WHERE change_date > NOW() - INTERVAL '30 days'
    `)

    return {
      totalCompetitors: parseInt(competitorsResult.rows[0].total),
      activeCompetitors: parseInt(competitorsResult.rows[0].active),
      priceChangesLast30Days: parseInt(changesResult.rows[0].changes),
      avgPriceChange: parseFloat(changesResult.rows[0].avg_change?.toFixed(2) || '0')
    }
  } catch (error) {
    console.error('[Competitor] Error getCompetitorMetrics:', error)
    throw error
  }
}
