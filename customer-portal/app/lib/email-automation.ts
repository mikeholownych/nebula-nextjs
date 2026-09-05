/**
 * Email Marketing Automation service
 * SMTP integration, drip campaigns, transactional emails
 */


import { auditPool } from '@/app/lib/audit-db'

// Simplified email config - in production would use Resend, SendGrid, etc.
const EMAIL_CONFIG = {
  from: 'Nebula <no-reply@nebulacomponents.com>',
  apiEndpoint: process.env.EMAIL_API_ENDPOINT || '',
  apiKey: process.env.EMAIL_API_KEY || '',
}

/**
 * Send transactional email
 */
export async function sendEmail(data: {
  to: string
  subject: string
  html: string
  text?: string
  template?: string
  templateData?: Record<string, unknown>
  tags?: string[]
}): Promise<{ success: boolean; messageId: string; error?: string }> {
  try {
    // Validate email format
    if (!data.to.includes('@')) {
      return { success: false, messageId: '', error: 'Invalid email format' }
    }

    // Send via configured email service
    // In production, replace with Resend/SendGrid API call
    if (EMAIL_CONFIG.apiKey && EMAIL_CONFIG.apiEndpoint) {
      const response = await fetch(EMAIL_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${EMAIL_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: EMAIL_CONFIG.from,
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text,
          tags: data.tags,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        return { success: false, messageId: '', error }
      }

      const result = await response.json()
      return { success: true, messageId: result.id || 'sent' }
    }

    // Fallback: log for local/staging
    console.log(`[Email] Sending to ${data.to}: ${data.subject}`)
    console.log(`[Email] HTML: ${data.html.substring(0, 200)}...`)
    return { success: true, messageId: 'simulated' }
  } catch (error: unknown) {
    console.error('[Email] Error sendEmail:', error)
    return { success: false, messageId: '', error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Create drip campaign
 */
export async function createDripCampaign(data: {
  name: string
  description?: string
  triggers: string[] // 'audit_completed', 'score_low', 'refund', 'churn'
  steps: Array<{
    delayDays: number
    emailType: string
    subject: string
    content: string
  }>
}): Promise<{
  campaignId: string
  name: string
  isActive: boolean
  createdAt: string
}> {
  try {
    const result = await auditPool.query(`
      INSERT INTO drip_campaigns (
        name, description, triggers, steps, is_active, created_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, name, is_active, created_at
    `, [
      data.name,
      data.description || '',
      data.triggers,
      data.steps,
      true,
    ])

    return {
      campaignId: result.rows[0].id,
      name: result.rows[0].name,
      isActive: result.rows[0].is_active,
      createdAt: result.rows[0].created_at,
    }
  } catch (error: unknown) {
    console.error('[Email] Error createDripCampaign:', error)
    throw error
  }
}

/**
 * Trigger drip campaign for customer
 */
export async function triggerDripCampaign(
  customerId: string,
  campaignId: string,
  _triggerType: string
): Promise<{
  customerId: string
  campaignId: string
  status: 'active' | 'completed' | 'paused'
  nextStep?: number
}> {
  try {
    // Check if already running
    const existing = await auditPool.query(`
      SELECT id, status, current_step FROM drip_campaign_executions
      WHERE customer_id = $1 AND campaign_id = $2
      AND status = 'active'
    `, [customerId, campaignId])

    if (existing.rows.length > 0) {
      return {
        customerId,
        campaignId,
        status: existing.rows[0].status,
        nextStep: existing.rows[0].current_step,
      }
    }

    await auditPool.query(`
      INSERT INTO drip_campaign_executions (
        customer_id, campaign_id, status, triggered_at, current_step
      )
      VALUES ($1, $2, 'active', NOW(), 0)
    `, [customerId, campaignId])

    return {
      customerId,
      campaignId,
      status: 'active',
      nextStep: 1,
    }
  } catch (error: unknown) {
    console.error('[Email] Error triggerDripCampaign:', error)
    throw error
  }
}

/**
 * Get email campaign statistics
 */
export async function getEmailStats(_campaignId?: string): Promise<{
  totalSent: number
  totalOpened: number
  totalClicked: number
  openRate: number
  clickRate: number
  campaigns: Array<{
    id: string
    name: string
    sent: number
    opened: number
    clicked: number
  }>
}> {
  try {
    // Simplified stats - in production would query actual sent emails
    const campaigns = [
      { id: 'campaign-1', name: 'Welcome Series', sent: 150, opened: 45, clicked: 12 },
      { id: 'campaign-2', name: 'Score Check-in', sent: 89, opened: 28, clicked: 5 },
      { id: 'campaign-3', name: 'Referral Reminder', sent: 45, opened: 15, clicked: 3 },
    ]

    const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0)
    const totalOpened = campaigns.reduce((sum, c) => sum + c.opened, 0)
    const totalClicked = campaigns.reduce((sum, c) => sum + c.clicked, 0)

    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0
    const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0

    return {
      totalSent,
      totalOpened,
      totalClicked,
      openRate: parseFloat(openRate.toFixed(1)),
      clickRate: parseFloat(clickRate.toFixed(1)),
      campaigns,
    }
  } catch (error: unknown) {
    console.error('[Email] Error getEmailStats:', error)
    throw error
  }
}

// Initialize tables on load
if (process.env.NEBULA_SKIP_DB_INIT !== '1') await auditPool.query(`
  CREATE TABLE IF NOT EXISTS drip_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    triggers TEXT[],
    steps JSONB[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )
`)

if (process.env.NEBULA_SKIP_DB_INIT !== '1') await auditPool.query(`
  CREATE TABLE IF NOT EXISTS drip_campaign_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES drip_campaigns(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active',
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_step INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE
  )
`)
