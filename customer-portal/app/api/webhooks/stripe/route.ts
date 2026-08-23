import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import type { PoolClient } from 'pg'
import { getPostHogClient, captureServerException } from '@/app/lib/posthog-server'
import { pool } from '@/app/lib/db'
import { isCanonicalFixPackReceipt } from '@/app/lib/public-facts'
import { planFromStripePrice } from '@/app/lib/subscription-plans'
import { sendSubscriptionWelcome } from '@/app/lib/subscription-emails'
import { provisionOrgForEmail } from '@/app/lib/provision-org'
import { recordFunnelEvent } from '@/app/lib/funnel-ledger'
import { analytics as heycatch } from '@heycatch/sdk'
import {
  enqueueKitSend,
  metadataAuditUrl,
  notifyCrmPurchaseCompleted,
  provisionAgencyPartner,
  resolvePurchaseAuditUrl,
  restoreFailedFulfillment,
  sendSaleAlert,
} from './fulfillment'

heycatch.init({ projectKey: 'hck_pk_UDEJlnGqF84u4i2q08NwcTvTYGrXLns_' })

function getStripeClient(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-07-29.dahlia',
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
      // ── Agency Partner auto-provision ($497 widget purchase) ──────────
      const isAgencyPartner = session.metadata?.offer_key === 'agency_partner'
      if (isAgencyPartner && customerEmail && event.livemode) {
        try {
          await provisionAgencyPartner(session, customerEmail)
        } catch (err) {
          console.error('Agency partner auto-provision failed:', err)
          // Non-fatal - the purchase is still recorded below as "review" and
          // the sale alert fires; manual provisioning remains possible.
        }
      }

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
          `⚠️ *CHECKOUT REVIEW* - ${amount} - ${session.metadata?.offer_key ?? 'unknown offer'} - ${customerEmail ?? 'no email'}\n` +
          `session: ${session.id}`,
        )
      }
      if (inserted && customerEmail) {
        await notifyCrmPurchaseCompleted({
          email: customerEmail,
          amount_cents: session.amount_total ?? 0,
          product_type: session.metadata?.offer_key ?? 'review',
          stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
          audit_id: typeof auditId === 'string' ? auditId : '',
          audit_url: metadataAuditUrl(session),
        })
      }
      return NextResponse.json({ received: true, review: true })
    }

    let client: PoolClient | undefined
    let locked = false
    let persistedAuditUrl: string | null = null
    let shouldNotifyCrm = false
    let recordPurchaseAnalytics = false
    let alreadyDeliveredDuplicate = false
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
      // means this exact session was fully handled before - that's the one
      // case a redelivery must not re-alert, re-run fulfillment, or
      // re-capture analytics for.
      const statusResult = await client.query(
        `SELECT fulfillment_status, audit_url FROM purchases WHERE stripe_session_id = $1`,
        [session.id],
      )
      const priorStatus = statusResult.rows[0]?.fulfillment_status
      const alreadyDelivered = priorStatus === 'delivered'
      if (alreadyDelivered) {
        alreadyDeliveredDuplicate = true
        shouldNotifyCrm = Boolean(customerEmail)
        persistedAuditUrl = metadataAuditUrl(session)
          ?? (typeof statusResult.rows[0]?.audit_url === 'string'
            ? statusResult.rows[0].audit_url
            : null)
      } else {
      // Claim the receipt for fulfillment before any delivery side effect. The
      // delivery script is independently idempotent by Stripe session ID, so a
      // retry of a crash-sticky processing row is safe.
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

      const firstClaim = priorStatus !== 'processing'
      if (firstClaim && event.livemode) {
        const amount = session.amount_total != null
          ? `$${(session.amount_total / 100).toFixed(2)}`
          : 'unknown amount'
        const offerKey = session.metadata?.offer_key ?? 'unknown offer'
        const email = customerEmail
        const message = `💰 *SALE* - ${amount} - ${offerKey} - ${email}\nsession: ${session.id}`

        void sendSaleAlert(message)
      }

      try {
        persistedAuditUrl = await resolvePurchaseAuditUrl(session, auditId)
        await enqueueKitSend({
          auditId,
          email: customerEmail,
          stripeSessionId: session.id,
          auditUrl: persistedAuditUrl,
        })
        shouldNotifyCrm = firstClaim
        recordPurchaseAnalytics = firstClaim
      } catch (err) {
        console.error('repair sprint enqueue failed:', err)
        if (session.metadata?.analytics_consent === 'all') {
          captureServerException(err, { route: 'POST /api/webhooks/stripe', properties: { stripe_session_id: session.id, phase: 'fulfillment' } })
        }
        await restoreFailedFulfillment(client, session.id)
        return NextResponse.json(
          { error: 'Fulfillment failed' },
          { status: 500 },
        )
      }
      }
    } catch (err) {
      console.error('Failed to persist purchase - will let Stripe retry:', err)
      if (session.metadata?.analytics_consent === 'all') {
        captureServerException(err, { route: 'POST /api/webhooks/stripe', properties: { stripe_session_id: session.id } })
      }
      return NextResponse.json({ error: 'Failed to record purchase' }, { status: 500 })
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

    if (shouldNotifyCrm && customerEmail) {
      await notifyCrmPurchaseCompleted({
        email: customerEmail,
        amount_cents: session.amount_total ?? 0,
        product_type: session.metadata?.offer_key ?? 'fix_pack',
        stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
        audit_id: auditId,
        audit_url: persistedAuditUrl,
      })
    }

    if (alreadyDeliveredDuplicate) {
      return NextResponse.json({ received: true, duplicate: true })
    }
    if (!recordPurchaseAnalytics) {
      return NextResponse.json({ received: true, queued: true })
    }

    const transactionId = typeof session.payment_intent === 'string' ? session.payment_intent : session.id
    const isLive = Boolean(event.livemode)
    const journeyId = session.metadata?.journey_id || null
    try {
      await recordFunnelEvent({
        eventName: 'purchase_completed',
        stage: 'purchase',
        sourceSystem: 'stripe_webhook',
        journeyId,
        auditId: typeof auditId === 'string' ? auditId : null,
        checkoutSessionId: session.id,
        transactionId,
        dedupKey: `stripe_${session.id}_purchase`,
        environment: isLive ? 'production' : 'test',
        paymentMode: isLive ? 'live' : 'test',
        isSynthetic: !isLive,
        utmSource: session.metadata?.utm_source || null,
        utmMedium: session.metadata?.utm_medium || null,
        utmCampaign: session.metadata?.utm_campaign || null,
        properties: {
          journey_id: journeyId,
          stripe_session_id: session.id,
          transaction_id: transactionId,
          offer_key: session.metadata?.offer_key || 'fix_pack',
          amount_cents: session.amount_total ?? 0,
          currency: session.currency || 'usd',
          livemode: event.livemode,
          provider: 'stripe',
        },
      })
    } catch (ledgerErr) {
      console.error('Failed to record purchase in analytics ledger:', ledgerErr)
    }

    // GA4 Measurement Protocol Forwarding (Server-Side Commercial Truth)
    const gaSecret = process.env.GA4_API_SECRET || process.env.GA_API_SECRET
    const gaMeasurementId = process.env.GA4_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''
    if (gaSecret) {
      try {
        const clientId = session.metadata?.analytics_person_id || `client_${session.id.slice(-16)}`
        await fetch(
          `https://www.google-analytics.com/mp/collect?measurement_id=${gaMeasurementId}&api_secret=${gaSecret}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(10_000),
            body: JSON.stringify({
              client_id: clientId,
              events: [
                {
                  name: 'purchase',
                  params: {
                    transaction_id: transactionId,
                    value: (session.amount_total ?? 0) / 100,
                    currency: (session.currency || 'USD').toUpperCase(),
                    items: [
                      {
                        item_name: session.metadata?.offer_key || 'One-Leak Repair Sprint',
                        price: (session.amount_total ?? 0) / 100,
                        quantity: 1,
                      },
                    ],
                  },
                },
              ],
            }),
          }
        )
      } catch (gaErr) {
        console.error('Failed to project purchase to GA4:', gaErr)
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
          transaction_id: transactionId,
          offer_key: session.metadata?.offer_key ?? undefined,
          amount_total: session.amount_total,
          currency: session.currency,
          payment_status: session.payment_status,
        },
      })
      void ph.flush().catch(() => undefined)
    } catch {
      // Fulfillment must not depend on analytics.
    }

    if (customerEmail) {
      try {
        const userId = session.metadata?.analytics_person_id || customerEmail
        const offerKey = session.metadata?.offer_key ?? 'fix_pack'
        await heycatch.setIdentity(userId, {
          email: customerEmail,
          plan: offerKey,
        })
        await heycatch.trackEvent(
          'purchase_completed',
          {
            offer_key: offerKey,
            amount_cents: session.amount_total ?? 0,
            currency: session.currency || 'usd',
            transaction_id: transactionId,
          },
          { userId },
        )
      } catch {
        // Analytics failure must never block webhook response
      }
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

    // Unknown price: never guess a plan and never write a subscription row.
    // Acknowledge the delivery so Stripe does not retry forever, and page ops
    // through the durable outbox so the mapping gets fixed and the event can
    // be replayed safely.
    if (!resolved) {
      console.error('Subscription event with unrecognized price:', sub.id, priceId)
      try {
        const secret = (process.env.INTERNAL_API_SECRET || '').trim()
        if (secret) {
          await fetch(
            `${(process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '')}/api/outbox/enqueue`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
              signal: AbortSignal.timeout(10_000),
              body: JSON.stringify({
                channel: 'email',
                recipient: process.env.OPS_ALERT_EMAIL || 'mike.holownych@gmail.com',
                payload: {
                  subject: `[billing] unknown price ${sub.id} (${priceId ?? 'no price on subscription'})`,
                  body:
                    `<p>Stripe delivered <code>${event.type}</code> for subscription <code>${sub.id}</code> ` +
                    `(customer <code>${typeof sub.customer === 'string' ? sub.customer : sub.customer.id}</code>) ` +
                    `with price <code>${priceId ?? 'none'}</code>, which maps to no Nebula plan.</p>` +
                    `<p>No subscription row was written. Map the price in app/lib/subscription-plans.ts, then replay the event.</p>`,
                  from_email: 'audits@nebulacomponents.shop',
                  content_type: 'text/html',
                },
              }),
            },
          )
        }
      } catch (alertErr) {
        console.error('Failed to enqueue unknown-price alert:', alertErr)
      }
      return NextResponse.json({ received: true, unknown_price: true })
    }

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
      // Acknowledge so Stripe does not retry forever; the subscription
      // remains authoritative in Stripe. CODE-2: this is no longer silent -
      // a durable ops alert is enqueued so unbound subscriptions surface
      // for manual binding instead of vanishing.
      console.error('Subscription event without resolvable email:', sub.id)
      try {
        const secret = (process.env.INTERNAL_API_SECRET || '').trim()
        if (secret) {
          await fetch(
            `${(process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, '')}/api/outbox/enqueue`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
              signal: AbortSignal.timeout(10_000),
              body: JSON.stringify({
                channel: 'email',
                recipient: process.env.OPS_ALERT_EMAIL || 'mike.holownych@gmail.com',
                payload: {
                  subject: `UNBOUND subscription event ${sub.id} (${resolved.plan})`,
                  body:
                    `<p>Stripe delivered <code>${event.type}</code> for subscription <code>${sub.id}</code> ` +
                    `(customer <code>${typeof sub.customer === 'string' ? sub.customer : sub.customer.id}</code>) ` +
                    `but no resolvable email was present.</p>` +
                    `<p>Bind it manually in Stripe + subscriptions table.</p>`,
                  from_email: 'audits@nebulacomponents.shop',
                  content_type: 'text/html',
                },
              }),
            },
          )
        }
      } catch (alertErr) {
        console.error('Failed to enqueue unbound-subscription alert:', alertErr)
      }
      return NextResponse.json({ received: true, unbound: true })
    }

    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
    const isDeleted = event.type === 'customer.subscription.deleted'
    // Deletion keeps the row and flips status only: entitlements honor the
    // already-paid window via current_period_end instead of hard-cutting.
    const mappedStatus = isDeleted ? 'deleted' : sub.status
    // NULL periods on deletion make the upsert's COALESCE preserve the prior
    // paid-through window rather than overwriting or nulling it out.
    const toIsoTimestamp = (v: number | null | undefined) =>
      typeof v === 'number' ? new Date(v * 1000).toISOString() : null
    const periodStart = isDeleted ? null : toIsoTimestamp(item?.current_period_start)
    const periodEnd = isDeleted ? null : toIsoTimestamp(item?.current_period_end)

    // Provisioning runs its own transaction; a dedicated client keeps
    // BEGIN/COMMIT on one connection instead of racing the pool.
    let client: PoolClient | undefined
    try {
      client = await pool.connect()
      const provisioned = await provisionOrgForEmail(client, email)
      await client.query(
        `INSERT INTO subscriptions
           (organization_id, stripe_subscription_id, stripe_customer_id, status, plan,
            billing_interval, current_period_start, current_period_end,
            cancel_at_period_end, livemode)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (stripe_subscription_id) DO UPDATE SET
           status=EXCLUDED.status, plan=EXCLUDED.plan,
           billing_interval=EXCLUDED.billing_interval,
           current_period_start=COALESCE(EXCLUDED.current_period_start, subscriptions.current_period_start),
           current_period_end=COALESCE(EXCLUDED.current_period_end, subscriptions.current_period_end),
           cancel_at_period_end=EXCLUDED.cancel_at_period_end,
           updated_at=now()`,
        [
          provisioned.organizationId,
          sub.id,
          customerId,
          mappedStatus,
          resolved.plan,
          resolved.interval,
          periodStart,
          periodEnd,
          sub.cancel_at_period_end ?? false,
          event.livemode === true,
        ],
      )
    } catch (err) {
      console.error('Failed to persist subscription - will let Stripe retry:', err)
      return NextResponse.json({ error: 'Failed to record subscription' }, { status: 500 })
    } finally {
      client?.release()
    }

    if (event.livemode && event.type === 'customer.subscription.created') {
      const amount = item?.price?.unit_amount != null
        ? `$${(item.price.unit_amount / 100).toFixed(2)}/${resolved.interval === 'annual' ? 'yr' : 'mo'}`
        : 'unknown amount'
      void sendSaleAlert(
        `🔁 *NEW SUBSCRIPTION* - ${resolved.plan.toUpperCase()} - ${amount} - ${email}\nsubscription: ${sub.id}`,
      )
      // Welcome delivery is best-effort; provider failures are logged inside
      // the sender and must never fail an already-persisted webhook.
      await sendSubscriptionWelcome(email, resolved.plan)

      try {
        await heycatch.setIdentity(email, {
          email,
          plan: resolved.plan,
        })
        await heycatch.trackEvent(
          'subscription_started',
          { plan: resolved.plan, interval: resolved.interval },
          { userId: email },
        )
      } catch {
        // Analytics failure must not block webhook response
      }
    }
    if (event.livemode && event.type === 'customer.subscription.deleted') {
      void sendSaleAlert(
        `🔻 *SUBSCRIPTION CANCELED* - ${resolved.plan.toUpperCase()} - ${email}\nsubscription: ${sub.id}`,
      )

      try {
        await heycatch.setIdentity(email, {
          email,
          plan: 'canceled',
        })
        await heycatch.trackEvent(
          'subscription_canceled',
          { plan: resolved.plan },
          { userId: email },
        )
      } catch {
        // Analytics failure must not block webhook response
      }
    }
  }

  return NextResponse.json({ received: true })
}
