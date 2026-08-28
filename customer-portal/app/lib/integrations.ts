/**
 * Integration Marketplace service
 * Webhook triggers, Zapier compatibility, external tool integration
 */

import { NextResponse } from 'next/server'
import { auditPool } from '@/app/lib/audit-db'

// Integration providers
const PROVIDERS = {
  zapier: {
    name: 'Zapier',
    type: 'webhook',
    icon: 'zapier',
  },
  make: {
    name: 'Make.com',
    type: 'webhook',
    icon: 'make',
  },
  slack: {
    name: 'Slack',
    type: 'webhook',
    icon: 'slack',
  },
  hubspot: {
    name: 'HubSpot',
    type: 'api',
    icon: 'hubspot',
    apiKey: process.env.HUBSPOT_API_KEY,
  },
  salesforce: {
    name: 'Salesforce',
    type: 'api',
    icon: 'salesforce',
    apiKey: process.env.SALESFORCE_API_KEY,
  },
  airtable: {
    name: 'Airtable',
    type: 'api',
    icon: 'airtable',
    apiKey: process.env.AIRTABLE_API_KEY,
  },
}

/**
 * Create webhook integration
 */
export async function createWebhookIntegration(
  data: {
    name: string
    provider: keyof typeof PROVIDERS
    url: string
    events: string[]
    isActive: boolean
  }
): Promise<{
  integrationId: string
  name: string
  provider: string
  isActive: boolean
  lastTriggered?: string
}> {
  try {
    const result = await auditPool.query(`
      INSERT INTO integrations (
        name, provider, url, events, is_active, created_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, name, provider, is_active, last_triggered
    `, [
      data.name,
      data.provider,
      data.url,
      data.events,
      data.isActive,
    ])

    return {
      integrationId: result.rows[0].id,
      name: result.rows[0].name,
      provider: result.rows[0].provider,
      isActive: result.rows[0].is_active,
      lastTriggered: result.rows[0].last_triggered,
    }
  } catch (error: any) {
    console.error('[Integration] Error createWebhookIntegration:', error)
    throw error
  }
}

/**
 * Trigger webhook for event
 */
export async function triggerWebhook(
  provider: string,
  event: string,
  payload: Record<string, any>
): Promise<{ success: boolean; messageId: string; error?: string }> {
  try {
    // Find webhooks for this provider and event
    const webhooks = await auditPool.query(`
      SELECT url, events FROM integrations
      WHERE provider = $1 AND is_active = true
    `, [provider])

    for (const webhook of webhooks.rows) {
      // Check if this webhook is subscribed to the event
      if (webhook.events.includes(event)) {
        try {
          await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event,
              payload,
              timestamp: new Date().toISOString(),
              integrationId: webhook.integration_id,
            }),
          })
        } catch (error) {
          console.error(`[Integration] Webhook ${webhook.url} failed:`, error)
        }
      }
    }

    return { success: true, messageId: 'triggered' }
  } catch (error: any) {
    console.error('[Integration] Error triggerWebhook:', error)
    return { success: false, messageId: '', error: error.message }
  }
}

/**
 * Create Zapier-compatible webhook endpoint
 */
export async function createZapierWebhook(
  data: {
    zapierHookUrl: string
    events: string[]
  }
): Promise<{
  webhookId: string
  zapierHookUrl: string
  events: string[]
  isActive: boolean
}> {
  try {
    const result = await auditPool.query(`
      INSERT INTO zapier_integrations (
        zapier_hook_url, events, is_active, created_at
      )
      VALUES ($1, $2, $3, NOW())
      RETURNING id, zapier_hook_url, events, is_active
    `, [
      data.zapierHookUrl,
      data.events,
      true,
    ])

    return {
      webhookId: result.rows[0].id,
      zapierHookUrl: result.rows[0].zapier_hook_url,
      events: result.rows[0].events,
      isActive: result.rows[0].is_active,
    }
  } catch (error: any) {
    console.error('[Integration] Error createZapierWebhook:', error)
    throw error
  }
}

/**
 * Get all integrations
 */
export async function getIntegrations(provider?: string): Promise<{
  integrations: Array<{
    id: string
    name: string
    provider: string
    url?: string
    zapierHookUrl?: string
    events: string[]
    isActive: boolean
    createdAt: string
  }>
}> {
  try {
    let result: any

    if (provider) {
      result = await auditPool.query(`
        SELECT id, name, provider, url, events, is_active, created_at
        FROM integrations
        WHERE provider = $1
        ORDER BY created_at DESC
      `, [provider])
    } else {
      result = await auditPool.query(`
        SELECT id, name, provider, url, events, is_active, created_at
        FROM integrations
        ORDER BY created_at DESC
      `)
    }

    const integrations = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      provider: row.provider,
      url: row.url,
      events: row.events,
      isActive: row.is_active,
      createdAt: row.created_at,
    }))

    return { integrations }
  } catch (error: any) {
    console.error('[Integration] Error getIntegrations:', error)
    throw error
  }
}

/**
 * Test webhook connectivity
 */
export async function testWebhook(
  url: string,
  event: string = 'test'
): Promise<{ success: boolean; responseTime: number; error?: string }> {
  try {
    const startTime = Date.now()

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event,
        payload: { test: true, timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      }),
      timeout: 10000,
    })

    const responseTime = Date.now() - startTime

    return {
      success: response.ok,
      responseTime,
    }
  } catch (error: any) {
    console.error('[Integration] Error testWebhook:', error)
    return { success: false, responseTime: 0, error: error.message }
  }
}

// Initialize tables on load
await auditPool.query(`
  CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    url TEXT,
    events TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )
`)
await auditPool.query(`
  CREATE TABLE IF NOT EXISTS zapier_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zapier_hook_url TEXT NOT NULL,
    events TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )
`)
await auditPool.query(`
  CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
    zapier_integration_id UUID REFERENCES zapier_integrations(id) ON DELETE SET NULL,
    event VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    response_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )
`)
