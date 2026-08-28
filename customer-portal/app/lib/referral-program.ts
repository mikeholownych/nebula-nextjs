/**
 * Referral Program & Viral Growth service
 * Track referrers, generate links, credit rewards, track revenue
 */

import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

/**
 * Generate unique referral code for a customer
 */
export async function generateReferralCode(customerId: string): Promise<{
  referralId: string
  referralCode: string
  createdAt: string
  referralLink: string
}> {
  try {
    // Generate random 6-character code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const result = await auditPool.query(`
      INSERT INTO referral_codes (customer_id, referral_code, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (customer_id) DO UPDATE SET referral_code = $2
      RETURNING id, referral_code, created_at
    `, [customerId, code])

    const referral = result.rows[0]

    return {
      referralId: referral.id,
      referralCode: referral.referral_code,
      createdAt: referral.created_at,
      referralLink: `https://nebulacomponents.com/referral/${code}`,
    }
  } catch (error: any) {
    console.error('[Referral] Error generateReferralCode:', error)
    throw error
  }
}

/**
 * Validate referral code and credit referrer
 */
export async function redeemReferralCode(
  referralCode: string,
  newCustomerId: string
): Promise<{
  referrerId: string
  referrerEmail: string
  creditAmount: number
  applied: boolean
  message: string
}> {
  try {
    const result = await auditPool.query(`
      SELECT rc.id, rc.customer_id, c.email, rc.redeemed_at
      FROM referral_codes rc
      JOIN customers c ON rc.customer_id = c.id
      WHERE UPPER(rc.referral_code) = $1
    `, [referralCode])

    if (result.rows.length === 0) {
      return {
        referrerId: '',
        referrerEmail: '',
        creditAmount: 0,
        applied: false,
        message: 'Invalid referral code',
      }
    }

    const referral = result.rows[0]

    // Check if already redeemed (one-time per customer)
    const existing = await auditPool.query(`
      SELECT COUNT(*) as count FROM referral_redemptions
      WHERE referral_code_id = $1 AND redeemed_by_customer_id = $2
    `, [referral.id, newCustomerId])

    if (parseInt(existing.rows[0].count) > 0) {
      return {
        referrerId: referral.customer_id,
        referrerEmail: referral.email,
        creditAmount: 0,
        applied: false,
        message: 'You have already used this referral code',
      }
    }

    // Validate referrer isn't the same as new customer
    if (referral.customer_id === newCustomerId) {
      return {
        referrerId: referral.customer_id,
        referrerEmail: referral.email,
        creditAmount: 0,
        applied: false,
        message: 'You cannot use your own referral code',
      }
    }

    // Record redemption and credit referrer
    await auditPool.query(`
      INSERT INTO referral_redemptions (referral_code_id, redeemed_by_customer_id, redeemed_at)
      VALUES ($1, $2, NOW())
    `, [referral.id, newCustomerId])

    // Add $50 credit to referrer's balance (stored in metadata)
    await auditPool.query(`
      UPDATE customers
      SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"referral_credit": 50}'
      WHERE id = $1
    `, [referral.customer_id])

    return {
      referrerId: referral.customer_id,
      referrerEmail: referral.email,
      creditAmount: 50,
      applied: true,
      message: 'Referral code applied! Your referrer has received a $50 credit.',
    }
  } catch (error: any) {
    console.error('[Referral] Error redeemReferralCode:', error)
    throw error
  }
}

/**
 * Get referral metrics for a customer
 */
export async function getReferralMetrics(customerId: string): Promise<{
  customerId: string
  referralCode: string
  referralsCount: number
  redeemedCount: number
  creditBalance: number
  totalRevenue: number
}> {
  try {
    const codeResult = await auditPool.query(`
      SELECT referral_code FROM referral_codes WHERE customer_id = $1
    `, [customerId])

    const redemptionResult = await auditPool.query(`
      SELECT COUNT(*) as count FROM referral_redemptions rr
      JOIN referral_codes rc ON rr.referral_code_id = rc.id
      WHERE rc.customer_id = $1
    `, [customerId])

    const revenueResult = await auditPool.query(`
      SELECT COALESCE(SUM(audits.score), 0) as revenue
      FROM referral_redemptions rr
      JOIN referral_codes rc ON rr.referral_code_id = rc.id
      JOIN audits a ON rr.redeemed_by_customer_id = a.customer_id
      WHERE rc.customer_id = $1
      AND a.paid_at IS NOT NULL
    `, [customerId])

    const metadataResult = await auditPool.query(`
      SELECT metadata FROM customers WHERE id = $1
    `, [customerId])

    const metadata = metadataResult.rows[0]?.metadata || {}
    const creditBalance = metadata.referral_credit || 0

    return {
      customerId,
      referralCode: codeResult.rows[0]?.referral_code || '',
      referralsCount: parseInt(redemptionResult.rows[0].count),
      redeemedCount: parseInt(redemptionResult.rows[0].count),
      creditBalance,
      totalRevenue: 0, // Simplified for now
    }
  } catch (error: any) {
    console.error('[Referral] Error getReferralMetrics:', error)
    throw error
  }
}

/**
 * Create referral code table (run once)
 */
export async function createReferralTables(): Promise<void> {
  await auditPool.query(`
    CREATE TABLE IF NOT EXISTS referral_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
      referral_code VARCHAR(10) UNIQUE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      redeemed_at TIMESTAMP WITH TIME ZONE,
      UNIQUE(customer_id)
    )
  `)

  await auditPool.query(`
    CREATE TABLE IF NOT EXISTS referral_redemptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      referral_code_id UUID REFERENCES referral_codes(id) ON DELETE CASCADE,
      redeemed_by_customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
      redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(referral_code_id, redeemed_by_customer_id)
    )
  `)
}
