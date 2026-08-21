import Stripe from 'stripe'
import { execFile } from 'child_process'
import { promisify } from 'util'
import type { PoolClient } from 'pg'

const execFileAsync = promisify(execFile)

// Real-time Telegram alert on a real (non-test-mode) sale. Uses the same
// `hermes send` mechanism as the Python side (sre_responder.py,
// notify_production_health.py) - this repo has no Telegram bot token
// configured, `hermes send` is the only working delivery path.
// sre_responder.py also checks for new payments every 15 min as a backstop
// in case this call fails silently (network blip, hermes gateway down, etc).
export async function sendSaleAlert(message: string): Promise<void> {
  try {
    await execFileAsync('hermes', ['send', '--to', 'telegram:5920497760', message], { timeout: 15_000 })
  } catch (err) {
    console.error('Sale alert failed to send:', err)
  }
}

// The exact One-Leak Repair Sprint price, in cents. Other live Stripe prices
// still receive a sale alert, but only this amount creates a self-implementation-kit
// kickoff. The first customer loops are intentionally manual: the persisted
// purchase and fulfillment state are the source of truth. Canonical receipts
// trigger the bounded self-implementation-kit delivery automatically.

// The database processing claim prevents concurrent dispatch. The delivery
// script provides the second idempotency boundary, keyed by Stripe session ID,
// for recovery after a successful send but before the DB can record delivered.
export async function enqueueKitSend(payload: {
  auditId: string
  email: string
  stripeSessionId: string
  auditUrl?: string | null
}): Promise<void> {
  const secret = (process.env.INTERNAL_API_SECRET || '').trim()
  if (!secret) {
    throw new Error('INTERNAL_API_SECRET not configured')
  }
  const platformApiUrl = (process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '')
  const response = await fetch(`${platformApiUrl}/api/outbox/enqueue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      channel: 'kit_send',
      recipient: payload.stripeSessionId,
      payload: {
        email: payload.email,
        stripe_session_id: payload.stripeSessionId,
        audit_id: payload.auditId,
        audit_url: payload.auditUrl ?? null,
      },
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`outbox enqueue failed: ${response.status} ${body}`)
  }
}

export async function restoreFailedFulfillment(
  client: PoolClient,
  stripeSessionId: string,
): Promise<void> {
  try {
    await client.query(
      `UPDATE purchases
       SET fulfillment_status = 'failed'
       WHERE stripe_session_id = $1
         AND fulfillment_status = 'processing'`,
      [stripeSessionId],
    )
  } catch (statusError) {
    console.error('Failed to restore retryable fulfillment state:', statusError)
  }
}

/**
 * Auto-provision a widget partner account on $497 agency checkout.
 *
 * The payment link collects `agency_domain` as a custom_field. We derive a
 * partner_id from the email, create the partner in nebula_audit via the
 * platform API, and send the embed snippet + onboarding via Telegram alert.
 */
export async function provisionAgencyPartner(
  session: Stripe.Checkout.Session,
  email: string,
): Promise<void> {
  // Extract the domain from Stripe's custom_fields response
  const customFields = (session as unknown as { custom_fields?: Array<{ key: string; text?: { value: string } }> }).custom_fields
  const domainField = customFields?.find(f => f.key === 'agency_domain')
  const rawDomain = domainField?.text?.value?.trim().toLowerCase() || ''

  // Normalize: strip protocol, path, trailing slash
  const domain = rawDomain
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/\/$/, '')

  if (!domain || !domain.includes('.')) {
    throw new Error(`Invalid agency_domain: "${rawDomain}"`)
  }

  // Derive partner_id from email prefix (before @), slugified
  const emailPrefix = email.split('@')[0]
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .slice(0, 32)
  const partnerId = `agency_${emailPrefix}_${Date.now().toString(36)}`

  const platformApiUrl = (process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001')
    .replace(/\/$/, '')

  const createResp = await fetch(`${platformApiUrl}/audit/partners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      partner_id: partnerId,
      name: email.split('@')[1]?.replace(/\.[^.]+$/, '') || email,
      email,
      domains: [domain],
      plan: 'agency',
      status: 'active',
    }),
    signal: AbortSignal.timeout(15_000),
  })

  if (!createResp.ok) {
    const errBody = await createResp.text().catch(() => '')
    throw new Error(`Platform API partner creation failed: ${createResp.status} ${errBody}`)
  }

  // Send onboarding Telegram alert with embed code
  const embedCode = `<div id="nebula-audit-widget" data-partner="${partnerId}" data-theme="dark"></div>\n<script src="https://nebulacomponents.com/widget/audit.js" async></script>`
  const alertMessage =
    `🤝 *AGENCY PARTNER PROVISIONED*\n` +
    `Email: ${email}\n` +
    `Partner ID: \`${partnerId}\`\n` +
    `Domain: ${domain}\n` +
    `Stripe session: ${session.id}\n\n` +
    `Embed code:\n\`\`\`\n${embedCode}\n\`\`\`\n\n` +
    `Next: send welcome email with embed instructions.`

  void sendSaleAlert(alertMessage)
}

function platformApiUrl(): string {
  return (process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '')
}

export function metadataAuditUrl(session: Stripe.Checkout.Session): string | null {
  const raw = session.metadata?.url?.trim()
  if (!raw) return null
  try {
    const parsed = new URL(raw)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return raw
  } catch {
    return null
  }
  return null
}

export async function resolvePurchaseAuditUrl(
  session: Stripe.Checkout.Session,
  auditId: string,
): Promise<string | null> {
  const fromMeta = metadataAuditUrl(session)
  if (fromMeta) return fromMeta
  try {
    const resp = await fetch(`${platformApiUrl()}/audit/${auditId}`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!resp.ok) return null
    const audit: unknown = await resp.json()
    if (
      audit
      && typeof audit === 'object'
      && 'url' in audit
      && typeof (audit as { url: unknown }).url === 'string'
    ) {
      return (audit as { url: string }).url
    }
  } catch (err) {
    console.error('audit_url lookup failed:', err)
  }
  return null
}

export async function notifyCrmPurchaseCompleted(payload: {
  email: string
  amount_cents: number
  product_type: string
  stripe_payment_intent_id?: string | null
  audit_id?: string
  audit_url?: string | null
}): Promise<void> {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) {
    console.error('CRM hook skipped: INTERNAL_API_SECRET not configured')
    return
  }
  try {
    const resp = await fetch(`${platformApiUrl()}/api/crm/purchase-completed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        email: payload.email,
        amount_cents: payload.amount_cents,
        product_type: payload.product_type,
        stripe_payment_intent_id: payload.stripe_payment_intent_id ?? '',
        audit_id: payload.audit_id ?? '',
        audit_url: payload.audit_url ?? '',
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!resp.ok) {
      const body = await resp.text().catch(() => '')
      console.error('CRM purchase hook failed:', resp.status, body)
    }
  } catch (err) {
    console.error('CRM purchase hook failed:', err)
  }
}
