import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { execFile } from 'child_process'
import { promisify } from 'util'
import type { PoolClient } from 'pg'
import { getPostHogClient, captureServerException } from '@/app/lib/posthog-server'
import { pool } from '@/app/lib/db'
import { isCanonicalFixPackReceipt } from '@/app/lib/public-facts'
import { planFromStripePrice } from '@/app/lib/subscription-plans'

const execFileAsync = promisify(execFile)

// Real-time Telegram alert on a real (non-test-mode) sale. Uses the same
// `hermes send` mechanism as the Python side (sre_responder.py,
// notify_production_health.py) — this repo has no Telegram bot token
// configured, `hermes send` is the only working delivery path.
// sre_responder.py also checks for new payments every 15 min as a backstop
// in case this call fails silently (network blip, hermes gateway down, etc).
async function sendSaleAlert(message: string): Promise<void> {
  try {
    await execFileAsync('hermes', ['send', '--to', 'telegram:5920497760', message], { timeout: 15_000 })
  } catch (err) {
    console.error('Sale alert failed to send:', err)
  }
}

// The exact One-Leak Self-Implementation Kit price, in cents. Other live Stripe prices
// still receive a sale alert, but only this amount creates a self-implementation-kit
// kickoff. The first customer loops are intentionally manual: the persisted
// purchase and fulfillment state are the source of truth. Canonical receipts
// trigger the bounded self-implementation-kit delivery automatically.

// The database processing claim prevents concurrent dispatch. The delivery
// script provides the second idempotency boundary, keyed by Stripe session ID,
// for recovery after a successful send but before the DB can record delivered.
async function deliverPromptPack(
  auditId: string,
  email: string,
  stripeSessionId: string,
): Promise<void> {
  await execFileAsync(
    '/home/mike/nebula/venv/bin/python3',
    [
      '/home/mike/nebula/scripts/deliver_prompt_pack.py',
      '--email',
      email,
      '--stripe-session-id',
      stripeSessionId,
      '--audit-id',
      auditId,
    ],
    { timeout: 120_000 },
  )
}

async function restoreFailedFulfillment(
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

function getStripeClient(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-06-24.dahlia',
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 },
    )
  }

  let event: Stripe.Event
  try {
    event = getStripeClient().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`Received Stripe event: ${event.type}`)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const customerEmail =
      session.customer_email ?? session.customer_details?.email ?? null
    const canonicalReceipt = isCanonicalFixPackReceipt({
      livemode: event.livemode,
      payment_status: session.payment_status,
      currency: session.currency,
      amount_total: session.amount_total,
      metadata: session.metadata,
    })
    const auditId = session.metadata?.audit_id
    const canFulfill = canonicalReceipt
      && customerEmail !== null
      && typeof auditId === 'string'
      && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(auditId)

    console.log('Checkout completed:', {
      id: session.id,
      customer_email: customerEmail,
      amount_total: session.amount_total,
      payment_status: session.payment_status,
    })

    if (!canFulfill) {
      let inserted = false
      try {
        const insertResult = await pool.query(
          `INSERT INTO purchases
            (stripe_session_id, stripe_event_id, customer_email, offer_key, amount_total, currency, payment_status, livemode, fulfillment_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'review')
           ON CONFLICT (stripe_session_id) DO NOTHING
           RETURNING stripe_session_id`,
          [
            session.id,
            event.id,
            customerEmail,
            session.metadata?.offer_key ?? null,
            session.amount_total,
            session.currency,
            session.payment_status,
            event.livemode,
          ],
        )
        inserted = insertResult.rowCount === 1
      } catch (err) {
        console.error('Failed to persist review purchase:', err)
        return NextResponse.json(
          { error: 'Failed to record purchase' },
          { status: 500 },
        )
      }

      if (inserted && event.livemode) {
        const amount = session.amount_total != null
          ? `$${(session.amount_total / 100).toFixed(2)}`
          : 'unknown amount'
        void sendSaleAlert(
          `⚠️ *CHECKOUT REVIEW* — ${amount} — ${session.metadata?.offer_key ?? 'unknown offer'} — ${customerEmail ?? 'no email'}\n` +
          `session: ${session.id}`,
        )
      }
      return NextResponse.json({ received: true, review: true })
    }

    let client: PoolClient | undefined
    let locked = false
    let alreadyDelivered = false
    try {
      client = await pool.connect()
      await client.query(
        'SELECT pg_advisory_lock(hashtextextended($1, 0))',
        [session.id],
      )
      locked = true

      await client.query(
        `INSERT INTO purchases
          (stripe_session_id, stripe_event_id, customer_email, offer_key, amount_total, currency, payment_status, livemode, fulfillment_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
         ON CONFLICT (stripe_session_id) DO NOTHING
         RETURNING stripe_session_id`,
        [
          session.id,
          event.id,
          customerEmail,
          session.metadata?.offer_key ?? null,
          session.amount_total,
          session.currency,
          session.payment_status,
          event.livemode,
        ]
      )

      // Stripe redelivers webhooks, and a crashed prior attempt can leave a
      // row stuck at 'pending'/'processing' under the same session ID (the
      // advisory lock above serializes concurrent retries of that stuck row
      // so only one recovers it). Only a row that already reached 'delivered'
      // means this exact session was fully handled before — that's the one
      // case a redelivery must not re-alert, re-run fulfillment, or
      // re-capture analytics for.
      const statusResult = await client.query(
        `SELECT fulfillment_status FROM purchases WHERE stripe_session_id = $1`,
        [session.id],
      )
      alreadyDelivered = statusResult.rows[0]?.fulfillment_status === 'delivered'
    } catch (err) {
      console.error('Failed to persist purchase — will let Stripe retry:', err)
      if (session.metadata?.analytics_consent === 'all') {
        captureServerException(err, { route: 'POST /api/webhooks/stripe', properties: { stripe_session_id: session.id } })
      }
      return NextResponse.json({ error: 'Failed to record purchase' }, { status: 500 })
    }

    if (alreadyDelivered) {
      if (locked) {
        try {
          await client.query(
            'SELECT pg_advisory_unlock(hashtextextended($1, 0))',
            [session.id],
          )
        } catch (unlockError) {
          console.error('Failed to release fulfillment advisory lock:', unlockError)
        }
      }
      client.release()
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Claim the receipt for fulfillment before any delivery side effect. The
    // delivery script is independently idempotent by Stripe session ID, so a
    // retry of a crash-sticky processing row is safe.
    try {
      const processingResult = await client.query(
        `UPDATE purchases
         SET fulfillment_status = 'processing'
         WHERE stripe_session_id = $1
           AND fulfillment_status IN ('pending', 'failed', 'processing')
         RETURNING stripe_session_id`,
        [session.id],
      )
      if (processingResult.rowCount !== 1) {
        throw new Error('Fulfillment could not be claimed for processing')
      }
    } catch (err) {
      console.error('Failed to claim fulfillment - will let Stripe retry:', err)
      return NextResponse.json({ error: 'Fulfillment claim failed' }, { status: 500 })
    }

    if (event.livemode) {
      const amount = session.amount_total != null
        ? `$${(session.amount_total / 100).toFixed(2)}`
        : 'unknown amount'
      const offerKey = session.metadata?.offer_key ?? 'unknown offer'
      const email = customerEmail
      const message = `💰 *SALE* — ${amount} — ${offerKey} — ${email}\nsession: ${session.id}`

      void sendSaleAlert(message)
    }

    try {
      await deliverPromptPack(auditId, customerEmail, session.id)
    } catch (err) {
      console.error('Self-implementation kit delivery failed:', err)
      if (session.metadata?.analytics_consent === 'all') {
        captureServerException(err, { route: 'POST /api/webhooks/stripe', properties: { stripe_session_id: session.id, phase: 'fulfillment' } })
      }
      if (client && locked) {
        await restoreFailedFulfillment(client, session.id)
      }
      return NextResponse.json(
        { error: 'Fulfillment failed' },
        { status: 500 },
      )
    }

    try {
      const deliveredResult = await client.query(
        `UPDATE purchases
         SET fulfillment_status = 'delivered'
         WHERE stripe_session_id = $1
           AND fulfillment_status = 'processing'
         RETURNING stripe_session_id`,
        [session.id],
      )
      if (deliveredResult.rowCount !== 1) {
        throw new Error('Fulfillment could not be marked delivered')
      }
    } catch (err) {
      console.error('Failed to process fulfillment - will let Stripe retry:', err)
      if (client && locked) {
        await restoreFailedFulfillment(client, session.id)
      }
      return NextResponse.json(
        { error: 'Fulfillment processing failed' },
        { status: 500 },
      )
    } finally {
      if (client) {
        if (locked) {
          try {
            await client.query(
              'SELECT pg_advisory_unlock(hashtextextended($1, 0))',
              [session.id],
            )
          } catch (unlockError) {
            console.error('Failed to release fulfillment advisory lock:', unlockError)
          }
        }
        client.release()
      }
    }

    const analyticsPersonId = session.metadata?.analytics_person_id
    if (
      session.metadata?.analytics_consent === 'all'
      && typeof analyticsPersonId === 'string'
      && /^person_[0-9a-f]{32}$/.test(analyticsPersonId)
    ) try {
      const ph = getPostHogClient()
      ph.capture({
        distinctId: analyticsPersonId,
        event: 'purchase_completed',
        properties: {
          stripe_session_id: session.id,
          offer_key: session.metadata?.offer_key ?? undefined,
          amount_total: session.amount_total,
          currency: session.currency,
          payment_status: session.payment_status,
        },
      })
      await ph.flush()
    } catch {
      // Fulfillment must not depend on analytics.
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    console.log('Invoice payment succeeded:', {
      id: invoice.id,
      customer_email: invoice.customer_email,
      amount_paid: invoice.amount_paid,
    })

    // Invoice events do not carry the browser consent contract. Keep them in
    // Stripe/billing records, but do not send them to analytics without a
    // consented pseudonymous identity.
  }

  // ── Subscription lifecycle (Pro / Growth / Agency memberships) ──
  if (
    event.type === 'customer.subscription.created'
    || event.type === 'customer.subscription.updated'
    || event.type === 'customer.subscription.deleted'
  ) {
    const sub = event.data.object as Stripe.Subscription
    const item = sub.items?.data?.[0]
    const priceId = item?.price?.id
    const resolved = priceId ? planFromStripePrice(priceId) : null

    // Ignore subscriptions that are not Nebula membership plans.
    if (resolved) {
      let email: string | null = null
      try {
        const customer = await getStripeClient().customers.retrieve(
          typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
        )
        if (!('deleted' in customer) || !customer.deleted) {
          email = (customer as Stripe.Customer).email ?? null
        }
      } catch (err) {
        console.error('Failed to resolve subscription customer email:', err)
      }

      if (!email) {
        // Without an email we cannot bind the subscription to a workspace.
        // Record nothing but acknowledge so Stripe does not retry forever;
        // the subscription remains authoritative in Stripe.
        console.error('Subscription event without resolvable email:', sub.id)
        return NextResponse.json({ received: true, unbound: true })
      }

      const status = event.type === 'customer.subscription.deleted'
        ? 'canceled'
        : sub.status
      const periodStart = item?.current_period_start ?? null
      const periodEnd = item?.current_period_end ?? null

      try {
        await pool.query(
          `INSERT INTO subscriptions
            (email, stripe_customer_id, stripe_subscription_id, plan, billing_interval,
             status, livemode, current_period_start, current_period_end, cancel_at_period_end, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8), to_timestamp($9), $10, NOW())
           ON CONFLICT (stripe_subscription_id) DO UPDATE SET
             plan = EXCLUDED.plan,
             billing_interval = EXCLUDED.billing_interval,
             status = EXCLUDED.status,
             current_period_start = EXCLUDED.current_period_start,
             current_period_end = EXCLUDED.current_period_end,
             cancel_at_period_end = EXCLUDED.cancel_at_period_end,
             updated_at = NOW()`,
          [
            email.toLowerCase(),
            typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
            sub.id,
            resolved.plan,
            resolved.interval,
            status,
            event.livemode,
            periodStart,
            periodEnd,
            sub.cancel_at_period_end ?? false,
          ],
        )
      } catch (err) {
        console.error('Failed to persist subscription — will let Stripe retry:', err)
        return NextResponse.json({ error: 'Failed to record subscription' }, { status: 500 })
      }

      if (event.livemode && event.type === 'customer.subscription.created') {
        const amount = item?.price?.unit_amount != null
          ? `$${(item.price.unit_amount / 100).toFixed(2)}/${resolved.interval === 'annual' ? 'yr' : 'mo'}`
          : 'unknown amount'
        void sendSaleAlert(
          `🔁 *NEW SUBSCRIPTION* — ${resolved.plan.toUpperCase()} — ${amount} — ${email}\nsubscription: ${sub.id}`,
        )
      }
      if (event.livemode && event.type === 'customer.subscription.deleted') {
        void sendSaleAlert(
          `🔻 *SUBSCRIPTION CANCELED* — ${resolved.plan.toUpperCase()} — ${email}\nsubscription: ${sub.id}`,
        )
      }
    }
  }

  return NextResponse.json({ received: true })
}
