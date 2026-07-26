import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { getPostHogClient } from '@/app/lib/posthog-server'
import { pool } from '@/app/lib/db'
import { getActiveFixPack } from '@/app/lib/public-facts'

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

// The exact Fix Pack price, in cents. Several other live Stripe payment
// links exist at other price points (an "Audit Lite" offer, the $1,497
// retainer, etc.) that this codebase has no dedicated fulfillment for —
// gating on the precise amount, not just "any purchase with an email",
// stops those from silently receiving (or being charged for, then never
// receiving) the Fix Pack's prompt pack. See scripts/deliver_prompt_pack.py.
const FIX_PACK_AMOUNT_CENTS = getActiveFixPack()?.priceCents

// Fulfillment: the Fix Pack offer is the audit + a full AI prompt pack, not
// bespoke implementation — see scripts/deliver_prompt_pack.py for why and
// how. Runs in the background (not awaited) so the webhook response to
// Stripe isn't held up by a live re-scrape + email send; the script is
// idempotent (checks the customer ledger before sending) so a Stripe
// webhook retry can't cause a duplicate delivery.
async function deliverPromptPack(email: string): Promise<void> {
  try {
    await execFileAsync(
      '/home/mike/nebula/venv/bin/python3',
      ['/home/mike/nebula/scripts/deliver_prompt_pack.py', '--email', email],
      { timeout: 120_000 }
    )
  } catch (err) {
    console.error('Prompt pack fulfillment failed:', err)
  }
}

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

    if (event.livemode) {
      const amount = session.amount_total != null
        ? `$${(session.amount_total / 100).toFixed(2)}`
        : 'unknown amount'
      void sendSaleAlert(
        `💰 *SALE* — ${amount} — ${session.metadata?.offer_key ?? 'unknown offer'} — ${session.customer_email ?? 'no email'}\n` +
        `session: ${session.id}`
      )

      // Gated on the exact Fix Pack price, not metadata.offer_key: the live
      // checkout page (app/checkout/page.tsx) links straight to a
      // Stripe-hosted Payment Link, not through /api/checkout, so whether
      // that link's dashboard config actually sets offer_key can't be
      // verified from this repo — but the amount charged is always accurate
      // (it's what Stripe actually collected). Other live price points
      // (Audit Lite, the $1,497 retainer, etc.) have no fulfillment script
      // of their own; the sale alert above still fires for those so a human
      // sees it, but this avoids silently sending the $97 prompt pack for a
      // $7 purchase or silently failing to deliver anything for a $1,497 one.
      if (session.customer_email && session.amount_total === FIX_PACK_AMOUNT_CENTS) {
        void deliverPromptPack(session.customer_email)
      }
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
