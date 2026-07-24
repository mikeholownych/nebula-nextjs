import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPostHogClient } from '@/app/lib/posthog-server'
import { pool } from '@/app/lib/db'

/**
 * Stripe webhook handler
 * POST /api/webhooks/stripe
 * 
 * Handles:
 * - checkout.session.completed: Mark purchase as complete
 */

// Constructed lazily inside the handler, not at module scope — a top-level
// `new Stripe(...)` throws at import time whenever STRIPE_SECRET_KEY is
// unset, which breaks Next.js's build-time page-data collection in any
// environment without production secrets (e.g. CI).
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
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = getStripeClient().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  console.log(`Received Stripe event: ${event.type}`)

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    console.log('Checkout completed:', {
      id: session.id,
      customer_email: session.customer_email,
      amount_total: session.amount_total,
      payment_status: session.payment_status,
    })

    try {
      // ON CONFLICT DO NOTHING makes this safe against Stripe's at-least-once
      // webhook delivery (retries would otherwise insert duplicate purchases).
      await pool.query(
        `INSERT INTO purchases
          (stripe_session_id, stripe_event_id, customer_email, offer_key, amount_total, currency, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (stripe_session_id) DO NOTHING`,
        [
          session.id,
          event.id,
          session.customer_email,
          session.metadata?.offer_key ?? null,
          session.amount_total,
          session.currency,
          session.payment_status,
        ]
      )
    } catch (err) {
      console.error('Failed to persist purchase — will let Stripe retry:', err)
      return NextResponse.json({ error: 'Failed to record purchase' }, { status: 500 })
    }

    if (session.customer_email) {
      try {
        const ph = getPostHogClient()
        ph.identify({ distinctId: session.customer_email, properties: {} })
        ph.capture({
          distinctId: session.customer_email,
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
        // Non-fatal
      }
    }
  }

  // Handle invoice.payment_succeeded (for subscriptions)
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    console.log('Invoice payment succeeded:', {
      id: invoice.id,
      customer_email: invoice.customer_email,
      amount_paid: invoice.amount_paid,
    })

    if (invoice.customer_email) {
      try {
        const ph = getPostHogClient()
        ph.capture({
          distinctId: invoice.customer_email,
          event: 'invoice_payment_succeeded',
          properties: {
            invoice_id: invoice.id,
            amount_paid: invoice.amount_paid,
            currency: invoice.currency,
          },
        })
        await ph.flush()
      } catch {
        // Non-fatal
      }
    }
  }

  return NextResponse.json({ received: true })
}
