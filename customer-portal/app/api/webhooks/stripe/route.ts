import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

/**
 * Stripe webhook handler
 * POST /api/webhooks/stripe
 * 
 * Handles:
 * - checkout.session.completed: Mark purchase as complete
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia',
})

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

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
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      WEBHOOK_SECRET
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

    // TODO: Write to PostgreSQL purchases table
    // For now, just log it
  }

  // Handle invoice.payment_succeeded (for subscriptions)
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    console.log('Invoice payment succeeded:', {
      id: invoice.id,
      customer_email: invoice.customer_email,
      amount_paid: invoice.amount_paid,
    })
  }

  return NextResponse.json({ received: true })
}
