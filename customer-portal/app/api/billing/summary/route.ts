import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { pool } from '@/app/lib/db'
import { requireWorkspaceUser } from '@/app/lib/workspace-auth'

/**
 * Billing summary for the workspace.
 * GET /api/billing/summary
 *
 * The authenticated workspace identity is authoritative; query-string email
 * values are ignored. Reads live-mode purchases from the webhook's
 * `nebula_platform` DB (same store the
 * Stripe webhook writes to) and, when a Stripe customer exists for the email,
 * creates a customer-portal session so the user can see invoices, receipts,
 * and payment methods.
 */

const OFFER_NAMES: Record<string, string> = {
  'fix-pack': 'One-Leak Repair Sprint',
  'agency-partner': 'Agency Partner',
  retainer: 'Conversion Retainer',
}

const OFFER_AMOUNT_NAMES: Record<number, string> = {
  9700: 'One-Leak Repair Sprint',
  49700: 'Agency Partner',
  149700: 'Conversion Retainer',
}

function offerName(offerKey: string | null, amountCents: number | null): string {
  if (offerKey && OFFER_NAMES[offerKey]) return OFFER_NAMES[offerKey]
  if (amountCents != null && OFFER_AMOUNT_NAMES[amountCents]) return OFFER_AMOUNT_NAMES[amountCents]
  return 'Nebula purchase'
}

function fulfillmentLabel(status: string | null): { label: string; tone: 'green' | 'amber' | 'gray' | 'red' } {
  switch (status) {
    case 'delivered':
      return { label: 'Delivered', tone: 'green' }
    case 'processing':
    case 'pending':
      return { label: 'Processing', tone: 'amber' }
    case 'review':
      return { label: 'Review', tone: 'amber' }
    case 'failed':
      return { label: 'Needs attention', tone: 'red' }
    default:
      return { label: 'Pending', tone: 'gray' }
  }
}

function isPaid(paymentStatus: string | null): boolean {
  return paymentStatus === 'paid'
}

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceUser(request)
  if ('response' in auth) return auth.response
  const email = auth.user.email

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  let rows: Array<{
    stripe_session_id: string
    customer_email: string | null
    offer_key: string | null
    amount_total: number | null
    currency: string | null
    payment_status: string | null
    fulfillment_status: string | null
    created_at: string
  }> = []
  try {
    const result = await pool.query(
      `SELECT stripe_session_id, customer_email, offer_key, amount_total,
              currency, payment_status, fulfillment_status, created_at
       FROM purchases
       WHERE lower(customer_email) = $1
         AND livemode = TRUE
       ORDER BY created_at DESC`,
      [email],
    )
    rows = result.rows
  } catch (err) {
    console.error('[Billing] purchases query failed:', err)
    return NextResponse.json({ error: 'Billing lookup failed' }, { status: 500 })
  }

  const paidPurchases = rows.filter((r) => isPaid(r.payment_status))
  const hasFixPack = paidPurchases.some(
    (r) => r.offer_key === 'fix-pack' || r.amount_total === 9700,
  )
  const totalSpentCents = paidPurchases.reduce(
    (sum, r) => sum + (r.amount_total ?? 0),
    0,
  )

  let activePlan: string = 'free'
  let isAgency = false
  const normalizedEmail = email.trim().toLowerCase()

  // Founder / designated free agency account check
  if (normalizedEmail === 'mike.holownych@gmail.com') {
    activePlan = 'agency'
    isAgency = true
  } else {
    try {
      const subRes = await pool.query(
        `SELECT s.plan, s.status, o.is_agency
         FROM users u
         LEFT JOIN memberships m ON m.user_id = u.id
         LEFT JOIN organizations o ON o.id = m.organization_id
         LEFT JOIN subscriptions s ON s.organization_id = o.id AND s.status = 'active'
         WHERE lower(u.email) = $1
         LIMIT 1`,
        [normalizedEmail],
      )
      if (subRes.rows.length > 0) {
        const row = subRes.rows[0]
        if (row.is_agency || row.plan === 'agency') {
          activePlan = 'agency'
          isAgency = true
        } else if (row.plan) {
          activePlan = row.plan
        }
      }
    } catch (err) {
      console.warn('[Billing] subscription lookup error:', err)
    }
  }

  if (activePlan === 'free' && hasFixPack) {
    activePlan = 'fix-pack'
  }

  const purchases = rows.map((r) => ({
    stripeSessionId: r.stripe_session_id,
    offerKey: r.offer_key,
    name: offerName(r.offer_key, r.amount_total),
    amountCents: r.amount_total,
    currency: r.currency ?? 'usd',
    paymentStatus: r.payment_status,
    fulfillment: fulfillmentLabel(r.fulfillment_status),
    createdAt: r.created_at,
  }))

  // Stripe customer portal (invoices, receipts, payment methods). One-time
  // checkout payments are emailed a receipt by Stripe; the portal is the
  // self-serve copy. Only created when a Stripe customer exists for the email
  // - otherwise we stay silent rather than erroring.
  let billingPortalUrl: string | null = null
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (stripeSecretKey) {
    try {
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2026-06-24.dahlia',
      })
      const customers = await stripe.customers.list({ email, limit: 1 })
      const customer = customers.data[0]
      if (customer) {
        const session = await stripe.billingPortal.sessions.create({
          customer: customer.id,
          return_url: `${process.env.NEXT_PUBLIC_URL ?? 'https://nebulacomponents.com'}/workspace`,
        })
        billingPortalUrl = session.url
      }
    } catch (err) {
      // Portal is a nice-to-have; never fail the whole summary for it.
      console.error('[Billing] portal session failed:', err)
    }
  }

  return NextResponse.json({
    email,
    plan: activePlan,
    isAgency,
    hasFixPack: hasFixPack || isAgency,
    totalSpentCents,
    purchaseCount: purchases.length,
    purchases,
    billingPortalUrl,
    usage: {
      model: 'unlimited',
      note: isAgency
        ? 'Agency Partner Plan (Always Free): Unlimited audits, monitors, client workspaces, and white-label reporting.'
        : 'No audit credits or limits in MVP. Every audit you run is saved to this workspace.',
    },
  })
}
